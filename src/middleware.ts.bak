import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cinebook_jwt_super_secret_production_key_32_bytes_min_xyz789"
);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedPath = path.startsWith("/account") || path.startsWith("/admin");
  const isAdminPath = path.startsWith("/admin");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("cinebook_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (isAdminPath && payload.role !== "admin") {
      // Non-admins redirected to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
