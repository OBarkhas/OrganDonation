import type {
  BloodType,
  DonationStatus,
  DonationType,
  RequestPriority,
  RequestStatus,
  User,
} from "@/generated/prisma/client";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A−",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B−",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB−",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O−",
};

export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  BLOOD: "Blood",
  PLASMA: "Plasma",
  ORGAN: "Organ",
  TISSUE: "Tissue",
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  NORMAL: "Normal",
  URGENT: "Urgent",
  EMERGENCY_SOS: "Emergency SOS",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Pending",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function bloodTypeLabel(type?: BloodType | null): string {
  return type ? BLOOD_TYPE_LABELS[type] : "Unknown";
}

export const DONATION_COOLDOWN_DAYS = 30;

export const BLOOD_TYPE_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  O_NEGATIVE: [
    "O_NEGATIVE",
    "O_POSITIVE",
    "A_NEGATIVE",
    "A_POSITIVE",
    "B_NEGATIVE",
    "B_POSITIVE",
    "AB_NEGATIVE",
    "AB_POSITIVE",
  ],
  O_POSITIVE: ["O_POSITIVE", "A_POSITIVE", "B_POSITIVE", "AB_POSITIVE"],
  A_NEGATIVE: ["A_NEGATIVE", "A_POSITIVE", "AB_NEGATIVE", "AB_POSITIVE"],
  A_POSITIVE: ["A_POSITIVE", "AB_POSITIVE"],
  B_NEGATIVE: ["B_NEGATIVE", "B_POSITIVE", "AB_NEGATIVE", "AB_POSITIVE"],
  B_POSITIVE: ["B_POSITIVE", "AB_POSITIVE"],
  AB_NEGATIVE: ["AB_NEGATIVE", "AB_POSITIVE"],
  AB_POSITIVE: ["AB_POSITIVE"],
};

export function canDonateBlood(
  donorType?: BloodType | null,
  recipientType?: BloodType | null,
): boolean {
  if (!recipientType) return true;
  if (!donorType) return false;
  return BLOOD_TYPE_COMPATIBILITY[donorType].includes(recipientType);
}

export function donationTypeLabel(type: DonationType): string {
  return DONATION_TYPE_LABELS[type] ?? type;
}

export function priorityLabel(priority: RequestPriority): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function donationStatusLabel(status: DonationStatus): string {
  return DONATION_STATUS_LABELS[status] ?? status;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface UserDto {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: User["role"];
  bloodType: BloodType | null;
  city: string | null;
  isAvailable: boolean;
  isProfileComplete: boolean;
  hasCompletedProfile: boolean;
  lastDonatedAt: string | null;
  donationTypes: DonationType[];
  hospitalName: string | null;
  isDoctorVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export function hasCompletedProfile(user: {
  phone?: string | null;
  bloodType?: BloodType | null;
  city?: string | null;
}): boolean {
  return Boolean(user.phone && user.bloodType && user.city);
}

export function toUserDto(user: User): UserDto {
  return {
    ...user,
    phone: user.phone ?? null,
    bloodType: user.bloodType ?? null,
    city: user.city ?? null,
    isProfileComplete: user.isProfileComplete,
    hasCompletedProfile: hasCompletedProfile(user),
    lastDonatedAt: user.lastDonatedAt ? user.lastDonatedAt.toISOString() : null,
    donationTypes: user.donationTypes,
    hospitalName: user.hospitalName ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export interface RequestDto {
  id: string;
  doctorId: string;
  targetUserId: string | null;
  bloodType: BloodType | null;
  type: DonationType;
  priority: RequestPriority;
  status: RequestStatus;
  title: string;
  description: string;
  hospital: string;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    fullName: string;
    hospitalName: string | null;
    city: string | null;
  };
  targetUser?: {
    id: string;
    fullName: string;
    bloodType: BloodType | null;
  } | null;
}

export interface DonationDto {
  id: string;
  requestId: string | null;
  donorId: string;
  type: DonationType;
  status: DonationStatus;
  appointmentNote: string | null;
  rejectionReason: string | null;
  rating: number | null;
  feedback: string | null;
  notes: string | null;
  donatedAt: string;
  updatedAt: string;
  request?: {
    id: string;
    title: string;
    hospital: string;
  } | null;
}

export interface ApplicationDto {
  id: string;
  requestId: string | null;
  donorId: string;
  type: DonationType;
  status: DonationStatus;
  appointmentNote: string | null;
  rejectionReason: string | null;
  notes: string | null;
  donatedAt: string;
  updatedAt: string;
  donor: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    bloodType: BloodType | null;
    city: string | null;
  };
  request: {
    id: string;
    title: string;
    hospital: string;
    type: DonationType;
    bloodType: BloodType | null;
    priority: RequestPriority;
  } | null;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface BadgeDto {
  id: string;
  key: string;
  name: string;
  description: string;
  iconUrl: string;
}

export interface LeaderboardEntryDto {
  id: string;
  fullName: string;
  email: string;
  bloodType: BloodType | null;
  city: string | null;
  donationCount: number;
  badges: BadgeDto[];
}

export interface DonorProfileDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  bloodType: BloodType | null;
  city: string | null;
  isAvailable: boolean;
  lastDonatedAt: string | null;
  donationTypes: DonationType[];
  donationCount: number;
  badges: BadgeDto[];
}

export interface ProfileDto {
  role: User["role"];
  fullName: string;
  email: string;

  bloodType?: BloodType | null;
  city?: string | null;
  phone?: string | null;
  isAvailable?: boolean;
  donationTypes?: DonationType[];
  donationCount?: number;
  badgeStatus?: {
    key: string;
    name: string;
    description: string;
    iconUrl: string;
    threshold: number;
    earned: boolean;
    awardedAt: string | null;
  }[];

  hospitalName?: string | null;
  isDoctorVerified?: boolean;
  requestCount?: number;
  matchCount?: number;
}
