"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { ArrowRightIcon, AtIcon, EyeIcon, LockIcon } from "./Icons";
import Link from "next/link";
import { useState } from "react";
import { signInUser, signUpUser } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";

// ------ Declaring the type of form (eg: sign-up or sign-in) ------ //

type FormType = "sign-in" | "sign-up";

const authFormSchema = (formType: FormType) => {
  return z.object({
    fullName:
      formType == "sign-up"
        ? z.string().min(1, "Name is required").max(50)
        : z.string().optional(),
    email: z.string().email("Invalid email address.").min(5).max(32),
    password: z.string().min(8, "Password too short.").max(100),
  });
};

export const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const formSchema = authFormSchema(type); // Setting the type of form

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const user =
        type === "sign-up"
          ? await signUpUser({
              fullName: data.fullName || "",
              email: data.email,
              password: data.password,
            })
          : await signInUser({
              email: data.email,
              password: data.password,
            });

      if (!user.success) {
        console.log("failed:", user.error);
        return;
      }

      router.push("/");
    } catch (error) {
      console.log("Failed to sign in or create account", error);
    }
  }

  return (
    <div
      className={
        type == "sign-in"
          ? `relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1f1f] font-['Rajdhani']`
          : `min-h-screen bg-[#050d0d] flex items-center justify-center font-['Rajdhani'] relative overflow-hidden`
      }
    >
      {/** DECORATIVE CORNERS */}

      {type == "sign-up" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[38px] left-[30px] w-[90px] h-[0.5] bg-[#00e5ff] opacity-80 h-[2px]" />
          <div className="absolute top-[60px] right-[60px] w-[2px] h-[80px] bg-[#00e5ff] opacity-50" />
          <div className="absolute bottom-[80px] left-[50px] w-[2px] h-[90px] bg-[#00e5ff] opacity-40" />
          <div className="absolute bottom-[38px] right-[30px] w-[110px] h-[2px] bg-[#00e5ff] opacity-50" />
        </div>
      )}

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, transparent 70%)`,
        }}
      />

      <div
        className={
          type == "sign-in"
            ? `relative w-full max-w-[430px] rounded-xl border border-[#1a4040] bg-[#0d2626] px-12 pb-10 pt-12 shadow-[0_0_40px_rgba(0,229,255,0.05)]`
            : `bg-[#0a1515] border border-[#1a3535] rounded-[10px] w-full max-w-[430px] px-11 pt-11 pb-9 relative shadow-[0_0_60px_rgba(0,229,255,0.04),0_24px_60px_rgba(0,0,0,0.6)]`
        }
      >
        {/** CARD CORNER ACCENTS */}

        <div>
          {type == "sign-up" && (
            <div>
              <div className="absolute -top-[1px] -left-[1px] w-[30px] h-[30px] border-t-2 border-l-2 border-[#00e5ff] rounded-tl-[10px]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-[30px] h-[30px] border-b-2 border-r-2 border-[#00e5ff] rounded-br-[10px]" />
            </div>
          )}
        </div>

        {type == "sign-in" ? (
          <div className="mb-9 text-center">
            <h1 className="m-0 text-[28px] font-bold uppercase tracking-[0.25em] text-white">
              SIGN IN
            </h1>
            <div className="mx-auto mt-[10px] h-[3px] w-10 rounded-sm bg-[#00e5ff]" />
          </div>
        ) : (
          <div className="text-center mb-9">
            <h1 className="m-0 text-[30px] font-bold tracking-[0.15em] uppercase">
              <span className="text-white">SIGN </span>
              <span className="text-[#00e5ff]">UP</span>
            </h1>
            <div className="w-10 h-[3px] bg-[#00e5ff] mx-auto mt-[10px] rounded-sm" />
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-6">
            {/** NAME FIELD */}

            {type == "sign-up" && (
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <label
                      className={
                        type == "sign-up"
                          ? `block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2`
                          : `mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00e5ff]`
                      }
                    >
                      Name
                    </label>
                    <div
                      className={`flex items-center rounded-md border bg-[#0a1f1f] px-4 transition-all duration-200 ${fieldState.invalid ? "border-destructive" : "border-[#1a4040]"}`}
                    >
                      <span className="mr-3 flex text-[#00e5ff] opacity-70">
                        <AtIcon />
                      </span>
                      <input
                        {...field} // This connects the input to the form logic
                        type="text"
                        placeholder="Enter your name"
                        className="flex-1 border-none bg-transparent py-3.5 text-sm tracking-wide text-[#aacece] outline-none placeholder:text-[#2a6060]"
                      />
                    </div>
                    <FieldError className="mt-1 text-[10px] uppercase text-destructive">
                      {fieldState.error?.message}
                    </FieldError>
                  </Field>
                )}
              />
            )}

            {/* EMAIL FIELD */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label
                    className={
                      type == "sign-in"
                        ? `mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00e5ff]`
                        : `block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2`
                    }
                  >
                    Email Address
                  </label>
                  <div
                    className={`flex items-center rounded-md border bg-[#0a1f1f] px-4 transition-all duration-200 ${fieldState.invalid ? "border-destructive" : "border-[#1a4040]"}`}
                  >
                    <span className="mr-3 flex text-[#00e5ff] opacity-70">
                      <AtIcon />
                    </span>
                    <input
                      {...field} // This connects the input to the form logic
                      type="email"
                      placeholder="user@gmail.com"
                      className="flex-1 border-none bg-transparent py-3.5 text-sm tracking-wide text-[#aacece] outline-none placeholder:text-[#2a6060]"
                    />
                  </div>
                  <FieldError className="mt-1 text-[10px] uppercase text-destructive">
                    {fieldState.error?.message}
                  </FieldError>
                </Field>
              )}
            />

            {/* PASSWORD FIELD */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label
                    className={
                      type == "sign-in"
                        ? `mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#00e5ff]`
                        : `block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2`
                    }
                  >
                    Password
                  </label>
                  <div
                    className={`flex items-center rounded-md border bg-[#0a1f1f] px-4 transition-all duration-200 ${fieldState.invalid ? "border-destructive" : "border-[#1a4040]"}`}
                  >
                    <span className="mr-3 flex text-[#00e5ff] opacity-70">
                      <LockIcon />
                    </span>
                    <div className="relative">
                      <input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="············"
                        className="flex-1 border-none bg-transparent py-3.5 text-sm tracking-[0.1em] text-[#aacece] outline-none placeholder:text-[#2a6060]"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex flex-end absolute right-[14px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#2a6060] flex items-center p-0"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>
                  <FieldError className="mt-1 text-[10px] uppercase text-destructive">
                    {fieldState.error?.message}
                  </FieldError>
                </Field>
              )}
            />

            <button
              type="submit"
              className={
                type == "sign-in"
                  ? `flex w-full items-center justify-center gap-2.5 rounded-md bg-[#00e5ff] p-4 text-[13px] font-bold uppercase tracking-[0.2em] text-[#0a1f1f] transition-all hover:-translate-y-0.5 hover:brightness-110`
                  : `w-full bg-[#00e5ff] text-[#050d0d] border-none rounded-md py-4 text-[13px] font-bold tracking-[0.2em] uppercase cursor-pointer flex items-center justify-center gap-[10px] mb-5 transition-all duration-200 hover:brightness-110 hover:-translate-y-[1px]`
              }
            >
              {type == "sign-in" ? "SIGN IN" : "SIGN UP"} <ArrowRightIcon />
            </button>
          </FieldGroup>
        </form>

        <div className="my-7 h-[1px] bg-[#1a4040]" />
        <p
          className={
            type == "sign-in"
              ? `m-0 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a7a7a]`
              : `text-center text-[#3a6060] text-[10px] font-semibold tracking-[0.12em] uppercase m-0 mb-5`
          }
        >
          {type == "sign-in"
            ? "DON'T HAVE AN ACCOUNT?"
            : "ALREADY HAVE AN ACCOUNT?"}{" "}
          <Link
            href={type == "sign-in" ? "/sign-up" : "/sign-in"}
            className="text-[#00e5ff] no-underline hover:underline"
          >
            {type == "sign-in" ? "SIGN UP" : "SIGN IN"}
          </Link>
        </p>
      </div>
    </div>
  );
};
