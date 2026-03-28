import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/home", "/settings", "/messages", "/profile"];

export function proxy(request: NextRequest) {  // middleware → proxy
  const token = request.cookies.get("token")?.value;
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/settings/:path*", "/messages/:path*", "/profile/:path*"],
};