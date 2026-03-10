import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ status: "ok", runtime: process.env.SHIPFLOW_RUNTIME ?? "cloud" })
}
