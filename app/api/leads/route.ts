import { NextRequest, NextResponse } from "next/server";

const ZO_BASE = process.env.ZO_API_BASE || "https://aion.zo.space";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qs = searchParams.toString();
    const url = `${ZO_BASE}/api/selectlub/leads${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jid = searchParams.get("jid");
    if (!jid) return NextResponse.json({ error: "jid required" }, { status: 400 });
    const body = await req.json();
    const url = `${ZO_BASE}/api/selectlub/lead-update?jid=${encodeURIComponent(jid)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
