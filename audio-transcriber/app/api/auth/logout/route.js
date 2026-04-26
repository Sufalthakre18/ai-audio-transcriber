import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookie
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}