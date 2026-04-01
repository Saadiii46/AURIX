import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allows Electron to talk to it
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const { fullName, email, idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodUser = await adminAuth.verifyIdToken(idToken);

    await adminDb
      .collection("users")
      .doc(decodUser.uid)
      .set(
        {
          id: decodUser.uid,
          email: email,
          fullName: fullName || decodUser.name || null,
          username: fullName.toLowerCase() || decodUser.toLowerCase() || null,
          role: "user",
          createdAt: new Date(),
        },
        { merge: true },
      );

    await adminAuth.updateUser(decodUser.uid, {
      displayName: fullName,
    });

    const response = NextResponse.json({ success: true });

    response.headers.set("Access-Control-Allow-Origin", "*");

    return response;
  } catch (error) {
    console.error("CRASH IN ROUTE:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
