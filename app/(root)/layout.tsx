"use client";

import { useUserStore } from "@/lib/store/useUserStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  const { fetchUser, user, isLoading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <html lang="en">
        <body className="bg-[#0f0f0f] flex items-center justify-center h-screen">
          <div className="animate-pulse text-white font-medium">
            Initializing Aurix...
          </div>
        </body>
      </html>
    );
  }

  const isAuth = pathname === "/sign-in" || pathname === "sign-up";

  if (!user && !isAuth) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div>
      <main>{children}</main>
    </div>
  );
};

export default layout;
