import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { NextResponse } from "next/server";

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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log("failed from API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
