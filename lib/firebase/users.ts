import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebaseClient";
import { API_BASE_URL } from "../constants";
import { useUserStore } from "../store/useUserStore";

interface SignUpUserProps {
  fullName: string;
  email: string;
  password: string;
}

interface SignInUserProps {
  email: string;
  password: string;
}

export const signUpUser = async ({
  fullName,
  email,
  password,
}: SignUpUserProps) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;
    await sendEmailVerification(user);
    const idToken = await user.getIdToken();

    await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, idToken }),
    });

    return { success: true };
  } catch (error) {
    console.log("failed: ", error);
    let message = "Something went wrong";

    switch ((error as { code: string }).code) {
      case "auth/email-already-in-use":
        message = "The email you entered is already exist try loggin in";
        break;
    }

    return {
      success: false,
      error: message,
      code: (error as { code: string }).code,
    };
  }
};

export const signInUser = async ({ email, password }: SignInUserProps) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;
    const idToken = await user.getIdToken();

    const res = await fetch(`${API_BASE_URL}/api/session/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!res.ok || res.status === 403) {
      const errorText = await res.text();
      console.error("HTML ERROR:", errorText);
      return { success: false, error: data.error };
    }

    return { success: true, email: user.email, fullName: user.displayName };
  } catch (error) {
    console.log("Error", error);
    let message = "Something went wrong";

    switch ((error as { code: string }).code) {
      case "auth/invalid-credential":
        message = "Invalid email or password";
        break;
    }

    return {
      success: false,
      error: message,
      code: (error as { code: string }).code,
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const userData = await res.json();
    return userData;
  } catch (error) {
    console.error("Error fetching current user from Electron:", error);
    return null;
  }
};
