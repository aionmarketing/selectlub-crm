import { NextResponse } from "next/server";

const ZO_API =
  process.env.ZO_CRM_URL || "https://aion.zo.space/api/selectlub-crm";
const CRM_TOKEN = process.env.CRM_TOKEN || "";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (CRM_TOKEN) headers["x-crm-token"] = CRM_TOKEN;

    const res = await fetch(ZO_API, {
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream ${res.status}: ${text.slice(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
