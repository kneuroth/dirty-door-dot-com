import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { doors } from "@repo/db/schema";
import { doorInsertSchema } from "@repo/db/zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = doorInsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await db.insert(doors).values(parsed.data).returning();

  return NextResponse.json(created, { status: 201 });
}
