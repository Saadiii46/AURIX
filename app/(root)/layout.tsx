"use client";

import { useUserStore } from "@/lib/store/useUserStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { fetchUser, user, isLoading } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  // 1. Initial Fetch and Mount Check
  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, [fetchUser]);

  // 2. Safe Redirect Logic (Fixes the Router error)
  useEffect(() => {
    if (mounted && !isLoading && !user && !isAuthPage) {
      router.push("/sign-in");
    }
  }, [mounted, isLoading, user, isAuthPage, router]);

  // 3. Prevent Hydration Mismatch
  // We return a consistent structure that matches the server's initial render
  if (!mounted || (isLoading && !isAuthPage)) {
    return (
      <div className="bg-[#0f0f0f] flex items-center justify-center h-screen">
        <div className="animate-pulse text-white font-medium">
          Initializing Aurix...
        </div>
      </div>
    );
  }

  // 4. Final Render
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <main>{children}</main>
    </div>
  );
};

export default Layout;
