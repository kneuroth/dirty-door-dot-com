import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { doors } from "@repo/db/schema";
import { doorInsertSchema, doorBoundsSchema } from "@repo/db/zod";
import { findDoorsInBounds } from "@repo/db/queries";

export const runtime = "nodejs";

const MAX_BOUNDS_SPAN = 2; // degrees — ~220 km of latitude

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = doorBoundsSchema.safeParse(
    Object.fromEntries(searchParams),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bounds" },
      { status: 400 },
    );
  }

  const { swLat, neLat } = parsed.data;

  if (neLat - swLat < 0 || neLat - swLat > MAX_BOUNDS_SPAN) {
    return NextResponse.json(
      { error: "Bounding box too large or inverted" },
      { status: 400 },
    );
  }

  const results = await findDoorsInBounds(parsed.data);
  return NextResponse.json(results);
}

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
