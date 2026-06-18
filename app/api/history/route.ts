import { NextRequest, NextResponse } from "next/server";

const ZO_BASE = process.env.ZO_API_BASE || "https://aion.zo.space";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const jid = new URL(req.url).searchParams.get("jid");
    if (!jid) return NextResponse.json({ error: "jid required" }, { status: 400 });
    const res = await fetch(`${ZO_BASE}/api/selectlub/history?jid=${encodeURIComponent(jid)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
