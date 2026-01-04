import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
    // 1. Check if Authentication is explicitly enabled
    const enableAuth = process.env.ENABLE_AUTH === "true";

    if (!enableAuth) {
        return NextResponse.next();
    }

    // 2. Check for Basic Auth header
    const basicAuth = req.headers.get("authorization");

    if (basicAuth) {
        const authValue = basicAuth.split(" ")[1];
        const [user, pwd] = atob(authValue).split(":");

        const validUser = process.env.AUTH_USER;
        const validPass = process.env.AUTH_PASSWORD;

        if (user === validUser && pwd === validPass) {
            return NextResponse.next();
        }
    }

    // 3. Prompt for credentials if missing or invalid
    return new NextResponse("Authentication required", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (if you have other auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
