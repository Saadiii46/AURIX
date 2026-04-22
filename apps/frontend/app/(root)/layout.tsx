"use client";

import { API_BASE_URL } from "@/lib/constants";
import { authStore } from "@/lib/store/authStore";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser } = authStore();

  const router = useRouter();

  useEffect(() => {
    if (user) return;

    const checkSession = async () => {
      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/sign-in");
      }

      const data = await res.json();
      setUser(data);
    };

    checkSession();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <main>{children}</main>
    </div>
  );
};

export default Layout;
