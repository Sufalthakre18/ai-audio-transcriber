import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Get session token from cookie
  const token = request.cookies.get("admin_session")?.value;

  // If accessing dashboard without a valid token → redirect to login
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, SECRET);
    } catch {
      // Token invalid/expired → redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If already logged in and visiting /login → redirect to dashboard
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Bad token, let them through to login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};