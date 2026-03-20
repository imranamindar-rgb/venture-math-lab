import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "venture-math-lab",
    status: "healthy",
  });
}
