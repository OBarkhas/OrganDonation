import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const body = JSON.stringify(payload);
  const whSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!whSecret) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new Response("Server configuration error", { status: 500 });
  }

  const wh = new Webhook(whSecret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying Clerk webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const data = evt.data as {
          id: string;
          email_addresses?: Array<{ email_address?: string }>;
          first_name?: string;
          last_name?: string;
        };

        const email = data.email_addresses?.[0]?.email_address ?? "";
        const fullName =
          `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
          "New User";

        console.log(
          `[webhook] ${eventType}: clerkUserId=${data.id}, email=${email}`,
        );

        await db.user.upsert({
          where: { clerkUserId: data.id },
          create: {
            clerkUserId: data.id,
            email,
            fullName,
            role: "DONOR",
          },
          update: {
            email,
            fullName,
          },
        });
        break;
      }

      case "user.deleted": {
        const data = evt.data as { id?: string };
        if (data.id) {
          console.log(`[webhook] user.deleted: clerkUserId=${data.id}`);
          await db.user.deleteMany({ where: { clerkUserId: data.id } });
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${eventType}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(`[webhook] Error handling ${eventType}:`, err);
    return new Response("Internal server error", { status: 500 });
  }
}
