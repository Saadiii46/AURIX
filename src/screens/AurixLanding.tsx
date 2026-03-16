import { useState } from "react";
import TitleBar from "../components/TitleBar";

const GearIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#00cccc"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#00cccc"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

export default function AurixLanding() {
  const [signInHover, setSignInHover] = useState(false);
  const [signUpHover, setSignUpHover] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

        /* Reset for Electron — no scrollbars, no text cursor, no selection */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          scrollbar-width: none;
          -webkit-user-select: none;
          user-select: none;
          cursor: default !important;
        }
        *::-webkit-scrollbar { display: none; }

        /* Allow text cursor and selection only in inputs */
        input, textarea {
          -webkit-user-select: text;
          user-select: text;
          cursor: text !important;
        }

        /* Allow pointer cursor on buttons and links */
        button, a, [role="button"] {
          cursor: pointer !important;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #030f0f;
        }

        @keyframes core-pulse {
          0%, 100% { box-shadow: 0 0 40px 12px rgba(0,210,210,0.35), 0 0 80px 20px rgba(0,180,180,0.15); }
          50%       { box-shadow: 0 0 55px 18px rgba(0,220,220,0.5), 0 0 100px 30px rgba(0,190,190,0.25); }
        }
        .core-glow { animation: core-pulse 3s ease-in-out infinite; }

        @keyframes gear-orbit {
          from { transform: rotate(315deg) translateX(128px) rotate(-315deg); }
          to   { transform: rotate(675deg) translateX(128px) rotate(-675deg); }
        }
        .gear-badge {
          position: absolute;
          top: calc(50% - 14px);
          left: calc(50% - 14px);
          width: 28px;
          height: 28px;
          animation: gear-orbit 9s linear infinite;
        }

        @keyframes db-orbit {
          from { transform: rotate(225deg) translateX(96px) rotate(-225deg); }
          to   { transform: rotate(-135deg) translateX(96px) rotate(135deg); }
        }
        .db-badge {
          position: absolute;
          top: calc(50% - 14px);
          left: calc(50% - 14px);
          width: 28px;
          height: 28px;
          animation: db-orbit 7s linear infinite;
        }

        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .ring-spin { animation: ring-spin 20s linear infinite; }
      `}</style>

      {/* Native-style custom titlebar */}
      <TitleBar />

      {/* Main content — padded below titlebar */}
      <div
        style={{
          paddingTop: 32,
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at center, #0a2e2e 0%, #061a1a 50%, #030f0f 100%)",
        }}
      >
        {/* Status Bar icons — top right */}
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00d4d4"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00d4d4"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Logo + Rings */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 48,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 256,
              height: 256,
              marginBottom: 40,
            }}
          >
            {/* Outer ring */}
            <div
              style={{
                position: "absolute",
                width: 256,
                height: 256,
                borderRadius: "50%",
                border: "1px solid rgba(0,200,200,0.18)",
              }}
            />

            {/* Middle ring — spinning dashed */}
            <div
              className="ring-spin"
              style={{
                position: "absolute",
                width: 192,
                height: 192,
                borderRadius: "50%",
                border: "1px dashed rgba(0,200,200,0.22)",
              }}
            />

            {/* Inner decorative ring */}
            <div
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "1px solid rgba(0,200,200,0.15)",
              }}
            />

            {/* Glowing core */}
            <div
              className="core-glow"
              style={{
                position: "absolute",
                width: 112,
                height: 112,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #00e5e5 0%, #009999 40%, #005555 70%, transparent 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 0 20px 6px rgba(0,230,230,0.8)",
                }}
              />
            </div>

            {/* Gear badge */}
            <div className="gear-badge">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#061a1a",
                  border: "1px solid rgba(0,200,200,0.5)",
                  boxShadow: "0 0 8px rgba(0,200,200,0.35)",
                }}
              >
                <GearIcon />
              </div>
            </div>

            {/* Database badge */}
            <div className="db-badge">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#061a1a",
                  border: "1px solid rgba(0,200,200,0.5)",
                  boxShadow: "0 0 8px rgba(0,200,200,0.35)",
                }}
              >
                <DatabaseIcon />
              </div>
            </div>
          </div>

          {/* Brand name */}
          <h1
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "3rem",
              fontWeight: 900,
              letterSpacing: 14,
              textTransform: "uppercase",
              margin: 0,
              color: "#00e0e0",
              textShadow: "0 0 20px rgba(0,220,220,0.5)",
            }}
          >
            AURIX
          </h1>

          {/* Divider */}
          <div
            style={{
              marginTop: 16,
              height: 2,
              width: 112,
              background:
                "linear-gradient(90deg, transparent, #00cccc, transparent)",
              boxShadow: "0 0 8px rgba(0,200,200,0.4)",
            }}
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: 320,
          }}
        >
          <button
            onMouseEnter={() => setSignInHover(true)}
            onMouseLeave={() => setSignInHover(false)}
            style={{
              fontFamily: "'Orbitron', monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              height: 56,
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "#00cccc",
              color: "#051515",
              border: "2px solid #00cccc",
              boxShadow: signInHover ? "0 0 20px rgba(0,200,200,0.45)" : "none",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            SIGN IN
          </button>

          <button
            onMouseEnter={() => setSignUpHover(true)}
            onMouseLeave={() => setSignUpHover(false)}
            style={{
              fontFamily: "'Orbitron', monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              height: 56,
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: signUpHover ? "rgba(0,204,204,0.08)" : "transparent",
              color: "#00cccc",
              border: "2px solid #00cccc",
              transition: "background 0.2s ease",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            SIGN UP
          </button>
        </div>
      </div>
    </>
  );
}
