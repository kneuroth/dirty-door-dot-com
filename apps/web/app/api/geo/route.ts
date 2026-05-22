import { NextResponse } from "next/server";

/**
 * Coarse, permission-free geolocation from Vercel's edge headers. Used by the
 * map to drop the user into their region on first paint without ever
 * triggering the browser's location prompt. Returns null fields on local dev
 * or any env that doesn't set the x-vercel-ip-* headers — callers should fall
 * back to a default view in that case.
 */
export async function GET(req: Request) {
  const rawLat = req.headers.get("x-vercel-ip-latitude");
  const rawLng = req.headers.get("x-vercel-ip-longitude");

  if (!rawLat || !rawLng) {
    return NextResponse.json({ lat: null, lng: null });
  }

  const lat = parseFloat(rawLat);
  const lng = parseFloat(rawLng);
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ lat: null, lng: null });
  }

  return NextResponse.json({ lat, lng });
}
