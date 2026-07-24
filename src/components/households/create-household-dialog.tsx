"use client";

import { useState } from "react";
import { useCreateHousehold } from "@/lib/query/hooks";
import type { CreateHouseholdInput } from "@/lib/services/household-service";
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

type PropertyType = NonNullable<CreateHouseholdInput["property_type"]>;
type Ownership = NonNullable<CreateHouseholdInput["ownership_status"]>;

const PROPERTY_TYPES: [PropertyType, string][] = [
  ["house", "House"],
  ["apartment", "Apartment"],
  ["townhouse", "Townhouse"],
  ["other", "Other"],
];
const OWNERSHIP: [Ownership, string][] = [
  ["owner", "Owner"],
  ["renter", "Renter"],
  ["landlord", "Landlord"],
  ["other", "Other"],
];

export function CreateHouseholdDialog({ triggerLabel = "Create household" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateHousehold();

  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [ownership, setOwnership] = useState<Ownership | "">("");

  function reset() {
    setName("");
    setAddressLine1("");
    setCity("");
    setCounty("");
    setPostalCode("");
    setPropertyType("");
    setOwnership("");
    create.reset();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateHouseholdInput = {
      name: name.trim(),
      address_line_1: addressLine1 || undefined,
      city: city || undefined,
      county: county || undefined,
      postal_code: postalCode || undefined,
      property_type: propertyType || undefined,
      ownership_status: ownership || undefined,
    };
    create.mutate(input, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a household</DialogTitle>
          <DialogDescription>Add your home so Sparl can track its bills.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hh-name">Name</Label>
            <Input
              id="hh-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Home"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hh-addr">Address</Label>
            <Input
              id="hh-addr"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="1 Main Street"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hh-city">City / town</Label>
              <Input id="hh-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hh-postal">Eircode / postcode</Label>
              <Input
                id="hh-postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hh-ptype">Property type</Label>
              <Select
                id="hh-ptype"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
              >
                <option value="">Select…</option>
                {PROPERTY_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hh-own">Ownership</Label>
              <Select
                id="hh-own"
                value={ownership}
                onChange={(e) => setOwnership(e.target.value as Ownership | "")}
              >
                <option value="">Select…</option>
                {OWNERSHIP.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {create.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {create.error instanceof Error ? create.error.message : "Couldn't create the household."}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Creating…" : "Create household"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
