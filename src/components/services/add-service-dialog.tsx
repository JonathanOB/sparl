"use client";

import { useState } from "react";
import { useCategories, useCreateService, useProviders } from "@/lib/query/hooks";
import type { CreateServiceInput } from "@/lib/services/service-management";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Status = NonNullable<CreateServiceInput["status"]>;

export function AddServiceDialog() {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const { data: providers } = useProviders();
  const create = useCreateService();

  const [categoryId, setCategoryId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [monthly, setMonthly] = useState("");
  const [renewal, setRenewal] = useState("");
  const [status, setStatus] = useState<Status>("active");

  function reset() {
    setCategoryId("");
    setProviderId("");
    setMonthly("");
    setRenewal("");
    setStatus("active");
    create.reset();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        category_id: categoryId || undefined,
        provider_id: providerId || undefined,
        monthly_cost: monthly ? Number(monthly) : undefined,
        renewal_date: renewal || undefined,
        status,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      }
    );
  }

  const filteredProviders = categoryId
    ? providers?.filter((p) => p.category_id === categoryId)
    : providers;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Add a service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a service</DialogTitle>
          <DialogDescription>Track a bill or subscription to find savings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setProviderId("");
              }}
            >
              <option value="">Select a category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider (optional)</Label>
            <Select id="provider" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="">Not sure / not listed</option>
              {filteredProviders?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly cost (€)</Label>
              <Input
                id="monthly"
                type="number"
                min="0"
                step="0.01"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                placeholder="60.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal">Renewal date</Label>
              <Input
                id="renewal"
                type="date"
                value={renewal}
                onChange={(e) => setRenewal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>

          {create.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {create.error instanceof Error ? create.error.message : "Couldn't add the service."}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
