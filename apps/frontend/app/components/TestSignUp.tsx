import { useState } from "react";

interface EyeIconProps {
  open: boolean;
}

const EyeIcon = ({ open }: EyeIconProps) =>
  open ? (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const ArrowIcon = () => (
  <svg
    className="w-[18px] h-[18px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface SignUpProps {
  onSignIn: () => void; // A function that takes no arguments and returns nothing
}

export default function SignUp({ onSignIn }: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");

  const cyan = "#00e5ff";

  const inputClasses = (
    field: "name" | "email" | "password",
    value: string,
  ) => `
    w-full bg-[#0d1a1a] rounded-md px-4 py-[14px] text-[11px] font-semibold tracking-[0.12em] uppercase outline-none transition-all duration-200
    placeholder:text-[#2a5555] placeholder:tracking-[0.12em] placeholder:text-[11px]
    ${focused === field ? `border-[${cyan}] ring-1 ring-[#00e5ff22] text-[#aacece]` : "border-[#1a3a3a] text-[#2a5555]"}
    ${value && focused !== field ? "text-[#aacece]" : ""}
    border
  `;

  return (
    <div className="min-h-screen bg-[#050d0d] flex items-center justify-center font-['Rajdhani'] relative overflow-hidden">
      {/* Decorative corner lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[38px] left-[30px] w-[90px] h-[0.5] bg-[#00e5ff] opacity-80 h-[2px]" />
        <div className="absolute top-[60px] right-[60px] w-[2px] h-[80px] bg-[#00e5ff] opacity-50" />
        <div className="absolute bottom-[80px] left-[50px] w-[2px] h-[90px] bg-[#00e5ff] opacity-40" />
        <div className="absolute bottom-[38px] right-[30px] w-[110px] h-[2px] bg-[#00e5ff] opacity-50" />
      </div>

      {/* Card */}
      <div className="bg-[#0a1515] border border-[#1a3535] rounded-[10px] w-full max-w-[430px] px-11 pt-11 pb-9 relative shadow-[0_0_60px_rgba(0,229,255,0.04),0_24px_60px_rgba(0,0,0,0.6)]">
        {/* Card corner accents */}
        <div className="absolute -top-[1px] -left-[1px] w-[30px] h-[30px] border-t-2 border-l-2 border-[#00e5ff] rounded-tl-[10px]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-[30px] h-[30px] border-b-2 border-r-2 border-[#00e5ff] rounded-br-[10px]" />

        {/* Title */}
        <div className="text-center mb-9">
          <h1 className="m-0 text-[30px] font-bold tracking-[0.15em] uppercase">
            <span className="text-white">SIGN </span>
            <span className="text-[#00e5ff]">UP</span>
          </h1>
          <div className="w-10 h-[3px] bg-[#00e5ff] mx-auto mt-[10px] rounded-sm" />
        </div>

        {/* Name Input */}
        <div className="mb-[18px]">
          <label className="block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">
            NAME
          </label>
          <input
            type="text"
            placeholder="ENTER FULL NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused("")}
            className={inputClasses("name", name)}
          />
        </div>

        {/* Email Input */}
        <div className="mb-[18px]">
          <label className="block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">
            EMAIL
          </label>
          <input
            type="email"
            placeholder="ENTER EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
            className={inputClasses("email", email)}
          />
        </div>

        {/* Password Input */}
        <div className="mb-7">
          <label className="block text-[#00e5ff] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="ENTER PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused("")}
              className={`${inputClasses("password", password)} pr-11`}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#2a6060] flex items-center p-0"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {/* Sign Up Button */}
        <button className="w-full bg-[#00e5ff] text-[#050d0d] border-none rounded-md py-4 text-[13px] font-bold tracking-[0.2em] uppercase cursor-pointer flex items-center justify-center gap-[10px] mb-5 transition-all duration-200 hover:brightness-110 hover:-translate-y-[1px]">
          SIGN UP <ArrowIcon />
        </button>

        {/* Sign In Link */}
        <p className="text-center text-[#3a6060] text-[10px] font-semibold tracking-[0.12em] uppercase m-0 mb-5">
          ALREADY HAVE AN ACCOUNT?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSignIn && onSignIn();
            }}
            className="text-[#00e5ff] no-underline hover:underline"
          >
            SIGN IN
          </a>
        </p>

        {/* Bottom divider */}
        <div className="h-[1px] bg-[#1a3535]" />
      </div>

      {/* Note: Ensure 'Rajdhani' font is loaded in your globals.css or tailwind.config.js */}
    </div>
  );
}
