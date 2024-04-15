import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, redirectToHome, redirectToLogin } from "next-firebase-auth-edge";
import serviceAccount from "./mailbuddy_priv_key.json";

const PUBLIC_PATHS = ["/register", "/login", "/forgot/password"];

const redirectToRoute = (pathname: string, request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

/**
 * Middleware to handle email verification and other auth operations
 * @param request
 */
export async function middleware(request: NextRequest) {

  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    cookieName: "AuthToken",
    cookieSignatureKeys: [process.env.PEPPER],
    cookieSerializeOptions: {
      path: "/",
      httpOnly: true,
      secure: true, // Set this to true on HTTPS environments
      sameSite: "lax" as const,
      maxAge: 12 * 60 * 60 * 24 // twelve days
    },
    serviceAccount: {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key
    },
    handleValidToken: async ({ token, decodedToken }, headers) => {
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        return redirectToHome(request);
      }

      if(!request.nextUrl.pathname.startsWith("/confirm") && !request.nextUrl.pathname.startsWith("/action")){
        if(!decodedToken.email_verified){
          return redirectToRoute("/confirm", request);
        }
      }
    },
    handleInvalidToken: async (reason) => {
      console.info("Missing or malformed credentials", { reason });

      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS
      });
    }
  });
}

export const config = {
  matcher: ["/api/login", "/api/logout", "/", "/((?!_next|favicon.ico|api|.*\\.).*)"]
};