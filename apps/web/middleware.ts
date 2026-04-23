import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = nextUrl.pathname === "/login";
  const isPublicAuthPage =
    nextUrl.pathname === "/forgot-password" ||
    nextUrl.pathname === "/reset-password";

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isPublicAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/forgot-password", "/reset-password"],
};