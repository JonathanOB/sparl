"use client";

import { CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

/** Living documentation for the Sparl design system (D6 §17). */
export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Sparl Design System</h1>
        <p className="text-muted-foreground">Tokens + core components.</p>
      </header>

      <Section title="Figures & palette">
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Estimated saving</p>
            <p className="text-figure text-4xl text-success">€312/yr</p>
          </div>
          <div className="flex gap-2">
            <Swatch className="bg-primary" label="trust" />
            <Swatch className="bg-success" label="success" />
            <Swatch className="bg-warning" label="warning" />
            <Swatch className="bg-destructive" label="destructive" />
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="success">Success</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Electricity — Electric Ireland</CardTitle>
            <CardDescription>Renews 12 Mar 2027</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-figure text-2xl">€1,240/yr</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">View recommendation</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Alerts">
        <div className="space-y-3">
          <Alert variant="info">
            <Info />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>We found a cheaper plan for your broadband.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Saving applied</AlertTitle>
            <AlertDescription>You could save €312 a year by switching.</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Broadband</TableCell>
              <TableCell>eir</TableCell>
              <TableCell className="text-figure">€60/mo</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Electricity</TableCell>
              <TableCell>Electric Ireland</TableCell>
              <TableCell className="text-figure">€103/mo</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm switch</DialogTitle>
              <DialogDescription>Switch your broadband to save €312/yr?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="success">Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Loading & error states">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <LoadingState message="Finding your savings…" />
          </Card>
          <Card>
            <ErrorState message="We couldn't load recommendations." onRetry={() => {}} />
          </Card>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`size-10 rounded-md ${className}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
