"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type {
  BloodType,
  DonationType,
  RequestPriority,
} from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { BLOOD_TYPE_LABELS, DONATION_TYPE_LABELS, type RequestDto } from "@/lib/utils";

export interface EditRequestModalProps {
  open: boolean;
  request: RequestDto | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

const priorities: Array<{ value: RequestPriority; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
  { value: "EMERGENCY_SOS", label: "🚨 Emergency SOS" },
];

/** Modal to edit an existing doctor request (title, blood type, priority, notes). */
export function EditRequestModal({
  open,
  request,
  onClose,
  onSaved,
}: EditRequestModalProps) {
  const [title, setTitle] = useState(request?.title ?? "");
  const [description, setDescription] = useState(request?.description ?? "");
  const [bloodType, setBloodType] = useState<BloodType | "">(
    request?.bloodType ?? "",
  );
  const [type, setType] = useState<DonationType>(request?.type ?? "BLOOD");
  const [priority, setPriority] = useState<RequestPriority>(
    request?.priority ?? "NORMAL",
  );
  const [hospital, setHospital] = useState(request?.hospital ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          bloodType: bloodType || null,
          type,
          priority,
          hospital,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not update request");
      }
      onClose();
      await onSaved();
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
      title="Edit request"
      description="Update the details of this donation request."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Urgent need for O− blood"
          />
        </div>
        <div>
          <Label htmlFor="edit-desc">Description</Label>
          <Textarea
            id="edit-desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Patient needs 2 units of O negative blood…"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-blood">Blood type (optional)</Label>
            <Select
              id="edit-blood"
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
            <Label htmlFor="edit-type">Donation type</Label>
            <Select
              id="edit-type"
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
          <Label htmlFor="edit-priority">Priority</Label>
          <Select
            id="edit-priority"
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
          <Label htmlFor="edit-hospital">Hospital</Label>
          <Input
            id="edit-hospital"
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
          <Button type="submit" disabled={saving}>
            <Pencil className="size-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
