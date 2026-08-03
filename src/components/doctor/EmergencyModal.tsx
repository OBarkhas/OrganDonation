"use client";

import { useState } from "react";
import { Siren } from "lucide-react";
import type {
  BloodType,
  DonationType,
  RequestPriority,
} from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { BLOOD_TYPE_LABELS, DONATION_TYPE_LABELS } from "@/lib/utils";

export interface EmergencyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  defaultHospital?: string | null;

  targetUserId?: string | null;
  targetName?: string | null;
}

const priorities: Array<{ value: RequestPriority; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
  { value: "EMERGENCY_SOS", label: "🚨 Emergency SOS" },
];

export function EmergencyModal({
  open,
  onClose,
  onCreated,
  defaultHospital,
  targetUserId,
  targetName,
}: EmergencyModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [type, setType] = useState<DonationType>("BLOOD");
  const [priority, setPriority] = useState<RequestPriority>("NORMAL");
  const [hospital, setHospital] = useState(defaultHospital ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setBloodType("");
    setType("BLOOD");
    setPriority("NORMAL");
    setHospital(defaultHospital ?? "");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          bloodType: bloodType || null,
          type,
          priority,
          hospital,
          targetUserId: targetUserId ?? null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not create request");
      }
      reset();
      onClose();
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        targetUserId && targetName
          ? `Direct request for ${targetName}`
          : "Create donation request"
      }
      description={
        targetUserId
          ? "This private request will only appear to this donor."
          : "Post a request that matching donors will see."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="req-title">Title</Label>
          <Input
            id="req-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Urgent need for O− blood"
          />
        </div>
        <div>
          <Label htmlFor="req-desc">Description</Label>
          <Textarea
            id="req-desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Patient needs 2 units of O negative blood for surgery tomorrow…"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="req-blood">Blood type (optional)</Label>
            <Select
              id="req-blood"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value as BloodType | "")}
            >
              <option value="">Any</option>
              {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="req-type">Donation type</Label>
            <Select
              id="req-type"
              value={type}
              onChange={(e) => setType(e.target.value as DonationType)}
            >
              {Object.entries(DONATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="req-priority">Priority</Label>
          <Select
            id="req-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as RequestPriority)}
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="req-hospital">Hospital</Label>
          <Input
            id="req-hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="General Hospital"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-red-600 hover:bg-red-700"
          >
            <Siren className="size-4" />
            {saving ? "Posting…" : "Post request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
