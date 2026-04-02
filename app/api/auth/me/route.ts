import { adminAuth } from "@/lib/firebase/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = (await cookies()).get("session")?.value;

    if (!session) throw new Error("No session found");

    const userSession = await adminAuth.verifySessionCookie(session, true);
    const db = getFirestore();
    const user = await db.collection("users").doc(userSession.uid).get();

    const data = {
      id: userSession.uid || "",
      email: userSession.email || "",
      name: user?.exists ? user.data()?.fullName : null,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching current user:", error);
    NextResponse.json({ success: false });
    return null;
  }
}
