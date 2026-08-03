import { db } from "@/lib/db";

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  iconUrl: string;
  threshold: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_donation",
    name: "First Donation",
    description: "Complete your first donation",
    iconUrl: "🩸",
    threshold: 1,
  },
  {
    key: "three_x_donor",
    name: "3x Donor",
    description: "Complete 3 donations",
    iconUrl: "💪",
    threshold: 3,
  },
  {
    key: "life_saver",
    name: "Life Saver",
    description: "Complete 5 donations",
    iconUrl: "🦸",
    threshold: 5,
  },
  {
    key: "ten_x_donor",
    name: "10x Donor",
    description: "Complete 10 donations",
    iconUrl: "🏆",
    threshold: 10,
  },
  {
    key: "legend",
    name: "Legend",
    description: "Complete 25 donations",
    iconUrl: "👑",
    threshold: 25,
  },
];

export async function ensureBadges(): Promise<void> {
  for (const def of BADGE_DEFINITIONS) {
    await db.badge.upsert({
      where: { key: def.key },
      update: {
        name: def.name,
        description: def.description,
        iconUrl: def.iconUrl,
      },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        iconUrl: def.iconUrl,
      },
    });
  }
}

export async function awardBadgesForDonor(donorId: string): Promise<string[]> {
  await ensureBadges();

  const completed = await db.donationRecord.count({
    where: { donorId, status: "COMPLETED" },
  });

  const earned = await db.userBadge.findMany({
    where: { userId: donorId },
    select: { badge: { select: { key: true } } },
  });
  const earnedKeys = new Set(earned.map((e) => e.badge.key));

  const awarded: string[] = [];
  for (const def of BADGE_DEFINITIONS) {
    if (completed >= def.threshold && !earnedKeys.has(def.key)) {
      const badge = await db.badge.findUnique({ where: { key: def.key } });
      if (badge) {
        await db.userBadge.create({
          data: { userId: donorId, badgeId: badge.id },
        });
        awarded.push(def.key);
      }
    }
  }
  return awarded;
}

export interface BadgeStatusDto {
  key: string;
  name: string;
  description: string;
  iconUrl: string;
  threshold: number;
  earned: boolean;
  awardedAt: string | null;
}

export async function getBadgeStatusForDonor(
  donorId: string,
): Promise<BadgeStatusDto[]> {
  await ensureBadges();

  const [badges, userBadges] = await Promise.all([
    db.badge.findMany(),
    db.userBadge.findMany({
      where: { userId: donorId },
      select: { badge: { select: { key: true } }, awardedAt: true },
    }),
  ]);

  const earnedMap = new Map(
    userBadges.map((ub) => [ub.badge.key, ub.awardedAt]),
  );

  return BADGE_DEFINITIONS.map((def) => {
    const badge = badges.find((b) => b.key === def.key);
    const awardedAt = earnedMap.get(def.key) ?? null;
    return {
      key: def.key,
      name: badge?.name ?? def.name,
      description: badge?.description ?? def.description,
      iconUrl: badge?.iconUrl ?? def.iconUrl,
      threshold: def.threshold,
      earned: Boolean(awardedAt),
      awardedAt: awardedAt ? awardedAt.toISOString() : null,
    };
  });
}
