import { NextRequest, NextResponse } from "next/server";

const ZO = process.env.ZO_API_BASE || "https://aion.zo.space";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${ZO}/api/selectlub/leads`, { headers: { Accept: "application/json" }, cache: "no-store" });
    return NextResponse.json(await res.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
