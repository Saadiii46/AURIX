"use client";

import { API_BASE_URL } from "@/lib/constants";
import { auth } from "@/lib/firebase/firebaseClient";
import { authStore } from "@/lib/store/authStore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, ReactElement } from "react";

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
  const [recording, setRecording] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const heights = useWaveform(speaking || recording);
  const router = useRouter();
  const { user, clearUser } = authStore();

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio playback queue
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    const base64Audio = audioQueueRef.current.shift()!;

    const byteChars = atob(base64Audio);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "audio/mp3" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      playNextInQueue();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      playNextInQueue();
    };

    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      playNextInQueue();
    });
  }, []);

  const enqueueAudio = useCallback(
    (base64Audio: string) => {
      audioQueueRef.current.push(base64Audio);
      if (!isPlayingRef.current) {
        setSpeaking(true);
        playNextInQueue();
      }
    },
    [playNextInQueue],
  );

  const streamTTSResponse = useCallback(
    async (transcript: string) => {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/groq/chat/stream-tts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "audio" && data.audio) {
                enqueueAudio(data.audio);
              } else if (eventType === "done") {
                // Stream complete
              }
            } catch {
              // Ignore malformed JSON
            }
            eventType = "";
          }
        }
      }
    },
    [enqueueAudio],
  );

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch(
        `${API_BASE_URL}/api/v1/deepgram/transcribe`,
        { method: "POST", body: formData },
      );

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      return data.transcript as string;
    },
    [],
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Failed to access microphone:", error);
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    // Wait for the recorder to finish
    const audioBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    // Stop the mic stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    setProcessing(true);

    try {
      const transcript = await transcribeAudio(audioBlob);
      if (!transcript || transcript.trim().length === 0) {
        setProcessing(false);
        return;
      }
      await streamTTSResponse(transcript);
    } catch (error) {
      console.error("Voice pipeline error:", error);
    } finally {
      setProcessing(false);
    }
  }, [transcribeAudio, streamTTSResponse]);

  const handleMicClick = useCallback(() => {
    if (speaking) return; // Don't interrupt playback
    if (recording) {
      stopRecordingAndProcess();
    } else if (!processing) {
      startRecording();
    }
  }, [speaking, recording, processing, startRecording, stopRecordingAndProcess]);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      await fetch(`${API_BASE_URL}/api/session/`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("User signed out");
      clearUser();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  const getBarStyles = (i: number, h: number): React.CSSProperties => {
    const dist = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
    const alpha = Math.max(0.12, 1 - dist * 0.85);

    const active = speaking || recording;
    let boxShadow = "none";
    if (active) {
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

  const buttonLabel = speaking
    ? "● AGENT SPEAKING"
    : recording
      ? "● LISTENING..."
      : processing
        ? "● PROCESSING..."
        : "TAP TO ACTIVATE";

  const isActive = speaking || recording || processing;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#030d0d] overflow-hidden font-sans">
      {/* Background glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none transition-all duration-1000 ${
          isActive
            ? "bg-[radial-gradient(ellipse,_rgba(0,229,255,0.08)_0%,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse,_rgba(0,229,255,0.025)_0%,_transparent_70%)]"
        }`}
      />

      <div className="relative z-10 flex items-center justify-between px-[30px] py-[22px]">
        <div className="flex items-center gap-[9px]">
          <div
            className={`w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] ${
              isActive
                ? "animate-pulse"
                : "opacity-80 shadow-[0_0_5px_#00e5ff88]"
            }`}
          />
          <span
            onClick={handleLogout}
            className="text-[#00e5ff] text-[11px] font-bold tracking-[0.22em] uppercase"
          >
            AURIX ACTIVE
          </span>
          <span className="text-[#00e5ff] text-[11px] font-bold tracking-[0.22em] uppercase">
            Welcome {user?.name}
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
                speaking || recording
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
            speaking={speaking || recording}
            offset={0}
            opacity={0.28}
            amplitude={30}
          />
          <SineWave
            speaking={speaking || recording}
            offset={Math.PI}
            opacity={0.14}
            amplitude={20}
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-[14px] pb-[52px]">
        <button
          onClick={handleMicClick}
          className={`relative w-[74px] h-[74px] rounded-full bg-transparent border-2 border-[#00e5ff] flex items-center justify-center cursor-pointer transition-all duration-400 ${
            isActive
              ? "shadow-[0_0_28px_rgba(0,229,255,0.55),_0_0_60px_rgba(0,229,255,0.18)]"
              : "shadow-[0_0_14px_rgba(0,229,255,0.18)]"
          }`}
        >
          {isActive && (
            <>
              <div className="absolute inset-[-14px] rounded-full border border-[rgba(0,229,255,0.3)] animate-[ripple_1.6s_ease-out_infinite]" />
              <div className="absolute inset-[-28px] rounded-full border border-[rgba(0,229,255,0.15)] animate-[ripple_1.6s_ease-out_0.5s_infinite]" />
            </>
          )}
          <MicIcon />
        </button>
        <span
          className={`text-[10px] font-bold tracking-[0.22em] uppercase transition-colors duration-400 ${
            isActive ? "text-[#00e5ff]" : "text-[#1f5555]"
          }`}
        >
          {buttonLabel}
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
