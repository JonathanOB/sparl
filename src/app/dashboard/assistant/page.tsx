"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How much can I save?",
  "Which service is my biggest cost?",
  "When does my next contract renew?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: conversationId.current, message }),
      });

      const convId = res.headers.get("x-conversation-id");
      if (convId) conversationId.current = convId;

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(body?.error?.message ?? "Something went wrong.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      setMessages((m) => m.slice(0, -1)); // drop the empty assistant placeholder
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
        <p className="text-muted-foreground">Ask Sparl about your bills and savings.</p>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {m.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-2 flex gap-2 border-t border-border pt-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your bills or savings…"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
