import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse("This provider listing has been removed.\n", {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}

export const HEAD = GET;
