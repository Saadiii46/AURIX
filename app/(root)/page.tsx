import { useState, useEffect, useRef, ReactElement } from "react";

const BAR_COUNT = 80;

/**
 * FIXED: Added 'active: boolean' type
 */
function useWaveform(active: boolean): number[] {
  const [heights, setHeights] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(2),
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setHeights(Array(BAR_COUNT).fill(2));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = (ts: number) => {
      setHeights(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const center = BAR_COUNT / 2;
          const dist = Math.abs(i - center);
          const envelope = Math.max(0, 1 - dist / (BAR_COUNT * 0.38));
          const wave =
            Math.sin(ts * 0.003 + i * 0.18) * 0.4 +
            Math.sin(ts * 0.005 + i * 0.3) * 0.3 +
            Math.sin(ts * 0.002 + i * 0.08) * 0.3;
          const noise = (Math.random() - 0.5) * 0.15;
          const raw = (wave + noise + 1) / 2;
          const maxH = envelope * 180 + 4;
          return Math.max(3, raw * maxH);
        }),
      );
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return heights;
}

/**
 * FIXED: Added Interface for Props
 */
interface SineWaveProps {
  speaking: boolean;
  offset: number;
  opacity: number;
  amplitude: number;
}

function SineWave({
  speaking,
  offset,
  opacity,
  amplitude,
}: SineWaveProps): ReactElement {
  const [phase, setPhase] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!speaking) {
      setPhase(0);
      return;
    }
    const animate = (ts: number) => {
      setPhase(ts * 0.002);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speaking]);

  const points = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * 1200;
    const y =
      100 +
      Math.sin((i / 120) * Math.PI * 6 + phase + offset) *
        (speaking ? amplitude : 2);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <path
      d={points}
      fill="none"
      stroke="#00e5ff"
      strokeWidth="1.2"
      className="transition-opacity duration-500"
      style={{ opacity: speaking ? opacity : opacity * 0.3 }}
    />
  );
}

const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#00e5ff"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MicIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#00e5ff"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

export default function MainScreen() {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const heights = useWaveform(speaking);

  /**
   * FIXED: Explicit return type for styling helper
   */
  const getBarStyles = (i: number, h: number): React.CSSProperties => {
    const dist = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
    const alpha = Math.max(0.12, 1 - dist * 0.85);

    let boxShadow = "none";
    if (speaking) {
      const intensity = Math.max(0, 1 - dist * 0.9);
      const heightFactor = Math.min(1, h / 120);
      boxShadow = `0 0 ${8 * intensity * heightFactor}px rgba(0,229,255,${0.7 * intensity * heightFactor})`;
    }

    return {
      height: `${h}px`,
      backgroundColor: `rgba(0, 229, 255, ${alpha})`,
      boxShadow,
    };
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#030d0d] overflow-hidden font-sans">
      {/* Background glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none transition-all duration-1000 ${
          speaking
            ? "bg-[radial-gradient(ellipse,_rgba(0,229,255,0.08)_0%,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse,_rgba(0,229,255,0.025)_0%,_transparent_70%)]"
        }`}
      />

      <div className="relative z-10 flex items-center justify-between px-[30px] py-[22px]">
        <div className="flex items-center gap-[9px]">
          <div
            className={`w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] ${
              speaking
                ? "animate-pulse"
                : "opacity-80 shadow-[0_0_5px_#00e5ff88]"
            }`}
          />
          <span className="text-[#00e5ff] text-[11px] font-bold tracking-[0.22em] uppercase">
            AURIX ACTIVE
          </span>
        </div>
        <button className="w-[46px] h-[46px] rounded-full border border-[#1a4040] bg-[#0a1a1a] flex items-center justify-center cursor-pointer hover:bg-[#0f2626] transition-colors">
          <UserIcon />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        {[-80, -40, 0, 40, 80].map((offset: number) => (
          <div
            key={offset}
            className="absolute left-0 right-0 h-px transition-colors duration-500"
            style={{
              top: `calc(50% + ${offset}px)`,
              backgroundColor: `rgba(0,229,255,${offset === 0 ? 0.07 : 0.025})`,
            }}
          />
        ))}

        <div className="flex items-center gap-[2.5px] w-full px-4 h-[260px]">
          {heights.map((h: number, i: number) => (
            <div
              key={i}
              className={`flex-1 rounded-[1px] min-h-[3px] ${
                speaking
                  ? "transition-[height] duration-[50ms] ease-out"
                  : "transition-[height] duration-500 ease-out"
              }`}
              style={getBarStyles(i, h)}
            />
          ))}
        </div>

        <svg
          className="absolute left-0 w-full h-[220px] top-1/2 -translate-y-1/2 pointer-events-none"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <SineWave
            speaking={speaking}
            offset={0}
            opacity={0.28}
            amplitude={30}
          />
          <SineWave
            speaking={speaking}
            offset={Math.PI}
            opacity={0.14}
            amplitude={20}
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-[14px] pb-[52px]">
        <button
          onClick={() => setSpeaking((s) => !s)}
          className={`relative w-[74px] h-[74px] rounded-full bg-transparent border-2 border-[#00e5ff] flex items-center justify-center cursor-pointer transition-all duration-400 ${
            speaking
              ? "shadow-[0_0_28px_rgba(0,229,255,0.55),_0_0_60px_rgba(0,229,255,0.18)]"
              : "shadow-[0_0_14px_rgba(0,229,255,0.18)]"
          }`}
        >
          {speaking && (
            <>
              <div className="absolute inset-[-14px] rounded-full border border-[rgba(0,229,255,0.3)] animate-[ripple_1.6s_ease-out_infinite]" />
              <div className="absolute inset-[-28px] rounded-full border border-[rgba(0,229,255,0.15)] animate-[ripple_1.6s_ease-out_0.5s_infinite]" />
            </>
          )}
          <MicIcon />
        </button>
        <span
          className={`text-[10px] font-bold tracking-[0.22em] uppercase transition-colors duration-400 ${
            speaking ? "text-[#00e5ff]" : "text-[#1f5555]"
          }`}
        >
          {speaking ? "● AGENT SPEAKING" : "TAP TO ACTIVATE"}
        </span>
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
