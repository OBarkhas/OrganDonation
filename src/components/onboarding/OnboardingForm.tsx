"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, ShieldCheck } from "lucide-react";
import type { BloodType } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { BLOOD_TYPE_LABELS, type UserDto } from "@/lib/utils";

/**
 * Profile completion / editing form. Pre-fills the user's existing details so
 * they only need to complete the missing fields. Saves to the DB via
 * PATCH /api/user and unlocks donation/request actions once complete.
 */
export function OnboardingForm({ user }: { user: UserDto }) {
  const router = useRouter();
  const isEditing = user.hasCompletedProfile;

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bloodType, setBloodType] = useState<BloodType | "">(
    user.bloodType ?? "",
  );
  const [city, setCity] = useState(user.city ?? "");
  const [isAvailable, setIsAvailable] = useState(user.isAvailable);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          bloodType: bloodType || null,
          city: city.trim(),
          isAvailable,
          isProfileComplete: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not save profile");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30">
          <HeartPulse className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          {isEditing ? "Edit your profile" : "Complete your profile"}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          {isEditing
            ? "Update your details below."
            : "Fill in the details below to unlock donation and request actions."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(e);
        }}
        className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-900/[0.03]"
      >
        <div>
          <Label htmlFor="onboarding-name">Full Name</Label>
          <Input
            id="onboarding-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="First Last"
          />
        </div>

        <div>
          <Label htmlFor="onboarding-phone">Phone Number</Label>
          <Input
            id="onboarding-phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+976 9000 0000"
          />
        </div>

        <div>
          <Label htmlFor="onboarding-blood">Blood Type</Label>
          <Select
            id="onboarding-blood"
            required
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value as BloodType | "")}
          >
            <option value="" disabled>
              Select…
            </option>
            {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="onboarding-city">City / Location</Label>
          <Input
            id="onboarding-city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Ulaanbaatar"
          />
        </div>

        {user.role === "DONOR" && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-red-600" />
              <span>
                <span className="block text-sm font-medium text-zinc-800">
                  Available for donation
                </span>
                <span className="block text-xs text-zinc-500">
                  Doctors can find you in searches
                </span>
              </span>
            </span>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="size-5 accent-red-600"
            />
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleSkip}
              disabled={saving}
            >
              Skip for now
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
