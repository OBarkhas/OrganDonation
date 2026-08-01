"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplets, MapPin, Phone, Search, UserRound } from "lucide-react";
import type { BloodType, DonationType } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { LoaderBlock } from "@/components/ui/spinner";
import { DonorProfileModal } from "@/components/doctor/DonorProfileModal";
import { EmergencyModal } from "@/components/doctor/EmergencyModal";
import { Toast } from "@/components/ui/toast";
import { bloodTypeLabel, donationTypeLabel, formatDate } from "@/lib/utils";

interface DonorResult {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  bloodType: BloodType | null;
  city: string | null;
  isAvailable: boolean;
  lastDonatedAt: string | null;
  donationTypes: DonationType[];
}

export function DonorSearch() {
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [donors, setDonors] = useState<DonorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDonor, setSelectedDonor] = useState<DonorResult | null>(null);
  const [directTarget, setDirectTarget] = useState<DonorResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (bloodType) params.set("bloodType", bloodType);
      if (city.trim()) params.set("city", city.trim());
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/donors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to search donors");
      setDonors(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [bloodType, city, q]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const params = new URLSearchParams();
        if (bloodType) params.set("bloodType", bloodType);
        if (city.trim()) params.set("city", city.trim());
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/donors?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to search donors");
        const data = await res.json();
        if (!cancelled) setDonors(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [bloodType, city, q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5 text-red-600" />
          Find Donors
        </CardTitle>
        <CardDescription>
          Search registered donors by blood type and location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <Label htmlFor="donor-blood">Blood type</Label>
            <Select
              id="donor-blood"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value as BloodType | "")}
            >
              <option value="">All types</option>
              <option value="A_POSITIVE">A+</option>
              <option value="A_NEGATIVE">A−</option>
              <option value="B_POSITIVE">B+</option>
              <option value="B_NEGATIVE">B−</option>
              <option value="AB_POSITIVE">AB+</option>
              <option value="AB_NEGATIVE">AB−</option>
              <option value="O_POSITIVE">O+</option>
              <option value="O_NEGATIVE">O−</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="donor-city">City</Label>
            <Input
              id="donor-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ulaanbaatar"
            />
          </div>
          <div>
            <Label htmlFor="donor-q">Name / email</Label>
            <Input
              id="donor-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search donor…"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </form>

        {loading ? (
          <LoaderBlock />
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : donors.length === 0 ? (
          <div className="py-10 text-center">
            <Droplets className="mx-auto mb-3 size-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700">No donors found</p>
            <p className="mt-1 text-sm text-zinc-500">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((donor) => (
              <li
                key={donor.id}
                className="group cursor-pointer rounded-xl border border-zinc-200/80 bg-white p-4 transition hover:border-red-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDonor(donor)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDonor(donor);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600">
                      {donor.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {donor.fullName}
                      </p>
                      <p className="text-xs text-zinc-500">{donor.email}</p>
                    </div>
                  </div>
                  {donor.bloodType ? (
                    <Badge tone="red" className="text-sm">
                      {bloodTypeLabel(donor.bloodType)}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {donor.city && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="size-3.5" />
                      {donor.city}
                    </span>
                  )}
                  {donor.phone && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Phone className="size-3.5" />
                      {donor.phone}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {donor.donationTypes.length > 0 ? (
                    donor.donationTypes.map((t) => (
                      <Badge key={t} tone="zinc">
                        {donationTypeLabel(t)}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="zinc">Blood</Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="text-xs text-zinc-400">
                    Last donated:{" "}
                    {donor.lastDonatedAt
                      ? formatDate(donor.lastDonatedAt)
                      : "Never"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDonor(donor);
                    }}
                  >
                    <UserRound className="size-3.5" />
                    View profile
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <DonorProfileModal
        open={!!selectedDonor}
        donorId={selectedDonor?.id ?? null}
        onClose={() => setSelectedDonor(null)}
        onRequestDirect={(donorId) => {
          const donor = donors.find((d) => d.id === donorId);
          setSelectedDonor(null);
          if (donor) {
            setDirectTarget(donor);
            setRequestModalOpen(true);
          }
        }}
      />

      <EmergencyModal
        open={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setDirectTarget(null);
        }}
        onCreated={() => {
          setRequestModalOpen(false);
          setDirectTarget(null);
          setToast(
            `Direct request sent to ${directTarget?.fullName ?? "donor"}`,
          );
        }}
        targetUserId={directTarget?.id ?? null}
        targetName={directTarget?.fullName ?? null}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Card>
  );
}
