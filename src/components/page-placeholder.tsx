import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Temporary section scaffold until each feature phase builds it out. */
export function PagePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            {description ?? "This section is under construction."}
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
