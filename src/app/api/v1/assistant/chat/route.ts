/**
 * POST /api/v1/assistant/chat — grounded, streaming assistant reply (D4 §16, §2.4).
 * Body: { conversationId?, message }. Streams plain text; the conversation id is
 * returned in the `x-conversation-id` header. Persists both turns. Scoped to the
 * user's own data; per-tier rate limit on free.
 */
import { z } from "zod";
import { authed } from "@/lib/api/authed";
import { parseJson } from "@/lib/api/validation";
import { serverEnv } from "@/lib/env";
import { anthropic } from "@/lib/ai/client";
import {
  addMessage,
  buildDataContext,
  checkAssistantQuota,
  ensureConversation,
  getConversationMessages,
} from "@/lib/services/assistant-service";

export const dynamic = "force-dynamic";

const chatSchema = z
  .object({
    conversationId: z.uuid().optional(),
    message: z.string().min(1).max(2000),
  })
  .strict();

const systemPrompt = (dataContext: string) =>
  `You are Sparl's assistant. Sparl helps households track bills and find savings.
Answer using ONLY the user's data below. Be concise, friendly, and specific with € amounts.
If asked about anything outside this data (other users, general web questions), politely say you
can only help with their Sparl account. Never invent services, providers, or savings.

--- USER DATA ---
${dataContext}
--- END USER DATA ---`;

export const POST = authed(async ({ ctx, req }) => {
  const { conversationId, message } = await parseJson(req, chatSchema);

  await checkAssistantQuota(ctx);
  const convId = await ensureConversation(ctx, conversationId);
  await addMessage(convId, "user", message);

  const dataContext = await buildDataContext();
  const history = await getConversationMessages(convId);
  const system = systemPrompt(dataContext);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const claudeStream = anthropic().messages.stream({
          model: serverEnv().CLAUDE_MODEL_STRONG,
          max_tokens: 1024,
          system,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        });
        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\nSorry — I hit a problem answering that."));
      } finally {
        if (full) await addMessage(convId, "assistant", full);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-conversation-id": convId,
    },
  });
});
