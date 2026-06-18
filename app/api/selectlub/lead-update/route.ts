import { NextRequest, NextResponse } from "next/server";

const ZO = process.env.ZO_API_BASE || "https://aion.zo.space";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${ZO}/api/selectlub/lead-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
