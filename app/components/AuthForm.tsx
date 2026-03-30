"use client";

import { ArrowRightIcon, AtIcon, LockIcon } from "@/app/components/icons";
import { useState } from "react";

type FormType = "sign-up" | "sign-in";

export default function SignIn({ type }: { type: FormType }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1f1f] font-['Rajdhani']">
      {/* Background Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, transparent 70%)`,
        }}
      />

      {/* Main Card */}
      <div className="relative w-full max-w-[430px] rounded-xl border border-[#1a4040] bg-[#0d2626] px-12 pb-10 pt-12 shadow-[0_0_40px_rgba(0,229,255,0.05),0_20px_60px_rgba(0,0,0,0.4)]">
        {/* Title Section */}
        <div className="mb-9 text-center">
          <h1 className="m-0 text-[28px] font-bold uppercase tracking-[0.25em] text-white">
            SIGN IN
          </h1>
          <div className="mx-auto mt-[10px] h-[3px] w-10 rounded-sm bg-[#00e5ff]" />
        </div>

        {/* Email Field */}
        <div className="mb-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00e5ff]">
            EMAIL_ADDRESS
          </label>
          <div
            className={`flex items-center rounded-md border bg-[#0a1f1f] px-4 transition-all duration-200 ${
              emailFocused
                ? "border-[#00e5ff] shadow-[0_0_0_1px_rgba(0,229,255,0.13)]"
                : "border-[#1a4040]"
            }`}
          >
            <span
              className={`mr-3 flex transition-colors ${emailFocused ? "text-[#00e5ff]" : "text-[#2a6060]"}`}
            >
              <AtIcon />
            </span>
            <input
              type="email"
              placeholder="user@neural.link"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className="flex-1 border-none bg-transparent py-3.5 text-sm tracking-wide text-[#aacece] outline-none placeholder:text-[#2a6060]"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-7">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00e5ff]">
            ENCRYPTED_PASSWORD
          </label>
          <div
            className={`flex items-center rounded-md border bg-[#0a1f1f] px-4 transition-all duration-200 ${
              passFocused
                ? "border-[#00e5ff] shadow-[0_0_0_1px_rgba(0,229,255,0.13)]"
                : "border-[#1a4040]"
            }`}
          >
            <span
              className={`mr-3 flex transition-colors ${passFocused ? "text-[#00e5ff]" : "text-[#2a6060]"}`}
            >
              <LockIcon />
            </span>
            <input
              type="password"
              placeholder="············"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              className="flex-1 border-none bg-transparent py-3.5 text-sm tracking-[0.1em] text-[#aacece] outline-none placeholder:text-[#2a6060]"
            />
          </div>
        </div>

        {/* Sign In Button */}
        <button className="flex w-full items-center justify-center gap-2.5 rounded-md bg-[#00e5ff] p-4 text-[13px] font-bold uppercase tracking-[0.2em] text-[#0a1f1f] transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
          SIGN IN
          <ArrowRightIcon />
        </button>

        {/* Divider */}
        <div className="my-7 h-[1px] bg-[#1a4040]" />

        {/* Sign Up Link */}
        <p className="m-0 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a7a7a]">
          DON'T HAVE AN ACCOUNT?{" "}
          <a href="#" className="text-[#00e5ff] no-underline hover:underline">
            SIGN UP
          </a>
        </p>
      </div>

      {/* Decorative Bottom Indicator */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-[1px] w-[60px] bg-[#1a4040]" />
        <div className="h-1.5 w-1.5 rounded-full border border-[#2a6060] bg-transparent" />
        <div className="h-[1px] w-[60px] bg-[#1a4040]" />
      </div>
    </div>
  );
}
