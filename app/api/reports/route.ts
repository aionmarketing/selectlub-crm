import { NextResponse } from "next/server";

const ZO_BASE = process.env.ZO_API_BASE || "https://aion.zo.space";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${ZO_BASE}/api/selectlub/reports`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
