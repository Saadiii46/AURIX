import { adminAuth } from "@/lib/firebase/firebaseAdmin";
import { NextResponse } from "next/server";

const EXPIRES_IN = 5 * 60 * 60 * 24 * 1000;

export async function POST(req: Request) {
  try {
    const idToken = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing id token" }, { status: 400 });
    }

    const decodedUser = await adminAuth.verifyIdToken(idToken);

    if (!decodedUser.email_verified) {
      return NextResponse.json(
        { error: "Please verify your email" },
        { status: 403 },
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN,
    });

    const response = NextResponse.json({ status: "success" });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: EXPIRES_IN / 1000,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  // Logout → clear cookie
  const response = NextResponse.json({ status: "logged out" });
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
