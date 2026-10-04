import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/*
  Server-side page protection.

  /freelancer/*  -> only a logged-in freelancer
  /client/*      -> only a logged-in client
  /admin/*       -> only a logged-in administrator
  /login, /register -> logged-in users go straight to their dashboard

  The role is read from the signed HTTP-only JWT cookie, never from
  localStorage. (API routes do their own checks as well.)
*/
async function getRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("auth_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "freelancer" ||
      payload.role === "client" ||
      payload.role === "admin"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request);

  const dashboard = !role
    ? "/login"
    : role === "admin"
      ? "/admin/freelancers"
      : `/${role}/dashboard`;

  if (pathname === "/login" || pathname === "/register") {
    return role
      ? NextResponse.redirect(new URL(dashboard, request.url))
      : NextResponse.next();
  }

  const requiredRole = pathname.startsWith("/freelancer")
    ? "freelancer"
    : pathname.startsWith("/client")
      ? "client"
      : pathname.startsWith("/admin")
        ? "admin"
        : null;

  if (requiredRole && role !== requiredRole) {
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/freelancer/:path*",
    "/client/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
