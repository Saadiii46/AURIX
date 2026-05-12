"use client";

import { API_BASE_URL } from "@/lib/constants";
import { auth } from "@/lib/firebase/firebaseClient";
import { authStore } from "@/lib/store/authStore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, ReactElement, useEffect } from "react";

const BAR_COUNT = 80;

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

interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  timestamp: number;
}

export default function MainScreen() {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const heights = useWaveform(speaking || recording);
  const router = useRouter();
  const { user, clearUser } = authStore();

  // New feature states
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [agentMode, setAgentMode] = useState<boolean>(false);
  const [lastUserText, setLastUserText] = useState<string>("");
  const [streamingAIText, setStreamingAIText] = useState<string>("");
  const [lastAIText, setLastAIText] = useState<string>("");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const streamingTextRef = useRef<string>("");

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
      // Reset streaming text
      streamingTextRef.current = "";
      setStreamingAIText("");

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
              if (eventType === "text" && data.text) {
                // Accumulate streaming text for live display
                streamingTextRef.current += data.text;
                setStreamingAIText(streamingTextRef.current);
              } else if (eventType === "audio" && data.audio && ttsEnabled) {
                // Only enqueue audio if TTS is enabled
                enqueueAudio(data.audio);
              } else if (eventType === "done") {
                // Stream complete — save final text
                setLastAIText(streamingTextRef.current);
                setStreamingAIText("");
              }
            } catch {
              // Ignore malformed JSON
            }
            eventType = "";
          }
        }
      }

      // Fallback: if done event wasn't received, save what we have
      if (streamingTextRef.current) {
        setLastAIText(streamingTextRef.current);
        setStreamingAIText("");
      }
    },
    [enqueueAudio, ttsEnabled],
  );

  const sendAgentMessage = useCallback(
    async (transcript: string) => {
      setStreamingAIText("");
      setLastAIText("");
      setAgentSteps([]);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/groq/chat/agent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: transcript }),
          },
        );

        if (!response.ok) {
          throw new Error(`Agent request failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Consume SSE stream from agent
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let finalText = "";
        let evt = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              evt = line.slice(7).trim();
            } else if (line.startsWith("data: ") && evt) {
              try {
                const d = JSON.parse(line.slice(6));
                if (evt === "step") {
                  setAgentSteps((prev) => [
                    ...prev,
                    { tool: d.tool, args: d.args, timestamp: Date.now() },
                  ]);
                } else if (evt === "text") {
                  finalText = d.text;
                  setLastAIText(d.text);
                } else if (evt === "error") {
                  setLastAIText(`Error: ${d.error}`);
                }
              } catch { /* ignore parse errors */ }
              evt = "";
            }
          }
        }

        // Speak the final response if TTS is enabled (TTS-only, no LLM re-processing)
        if (ttsEnabled && finalText) {
          const ttsResponse = await fetch(
            `${API_BASE_URL}/api/v1/groq/chat/tts-only`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: finalText }),
            },
          );
          if (ttsResponse.ok && ttsResponse.body) {
            const ttsReader = ttsResponse.body.getReader();
            const ttsDecoder = new TextDecoder();
            let ttsBuf = "";
            let ttsEvt = "";
            while (true) {
              const { done, value } = await ttsReader.read();
              if (done) break;
              ttsBuf += ttsDecoder.decode(value, { stream: true });
              const ttsLines = ttsBuf.split("\n");
              ttsBuf = ttsLines.pop() || "";
              for (const line of ttsLines) {
                if (line.startsWith("event: ")) ttsEvt = line.slice(7).trim();
                else if (line.startsWith("data: ") && ttsEvt) {
                  try {
                    const d = JSON.parse(line.slice(6));
                    if (ttsEvt === "audio" && d.audio) enqueueAudio(d.audio);
                  } catch { /* ignore */ }
                  ttsEvt = "";
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Agent error:", error);
        setLastAIText("Agent error occurred.");
      }
    },
    [ttsEnabled, enqueueAudio],
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

  // 5-second recording: press mic once → records 5 sec → auto-stops → processes
  const startRecordingAndProcess = useCallback(async () => {
    if (recording || processing || speaking) return;

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

      mediaRecorder.onstop = async () => {
        // Stop mic stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecording(false);
        setProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || "audio/webm",
          });

          const transcript = await transcribeAudio(audioBlob);
          if (!transcript || transcript.trim().length === 0) {
            setProcessing(false);
            return;
          }

          // Save user transcript for display
          setLastUserText(transcript);
          setLastAIText("");
          setStreamingAIText("");

          if (agentMode) {
            await sendAgentMessage(transcript);
          } else {
            await streamTTSResponse(transcript);
          }
        } catch (error) {
          console.error("Voice pipeline error:", error);
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorder.start(100);
      setRecording(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error("Failed to access microphone:", error);
    }
  }, [recording, processing, speaking, transcribeAudio, streamTTSResponse, sendAgentMessage, agentMode]);

  const handleMicClick = useCallback(() => {
    if (speaking || recording || processing) return;
    startRecordingAndProcess();
  }, [speaking, recording, processing, startRecordingAndProcess]);

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
    ? "AGENT SPEAKING"
    : recording
      ? "RECORDING (5s)..."
      : processing
        ? "PROCESSING..."
        : "TAP TO SPEAK";

  const isActive = speaking || recording || processing;
  const displayAIText = streamingAIText || lastAIText;
  const hasChat = lastUserText || displayAIText;

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

      {/* Header */}
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
            className="text-[#00e5ff] text-[11px] font-bold tracking-[0.22em] uppercase cursor-pointer"
          >
            AURIX ACTIVE
          </span>
          <span className="text-[#00e5ff] text-[11px] font-bold tracking-[0.22em] uppercase">
            Welcome {user?.name}
          </span>
        </div>

        {/* Control pills + User icon */}
        <div className="flex items-center gap-2">
          {/* TTS Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border transition-all duration-300 ${
              ttsEnabled
                ? "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff10] shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                : "border-[#1a4040] text-[#1f5555] bg-transparent"
            }`}
          >
            TTS {ttsEnabled ? "ON" : "OFF"}
          </button>

          {/* Agent Mode Toggle */}
          <button
            onClick={() => {
              setAgentMode(!agentMode);
              if (!agentMode) setAgentSteps([]);
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border transition-all duration-300 ${
              agentMode
                ? "border-[#ff9800] text-[#ff9800] bg-[#ff980010] shadow-[0_0_8px_rgba(255,152,0,0.2)]"
                : "border-[#1a4040] text-[#1f5555] bg-transparent"
            }`}
          >
            AGENT {agentMode ? "ON" : "OFF"}
          </button>

          <button className="w-[46px] h-[46px] rounded-full border border-[#1a4040] bg-[#0a1a1a] flex items-center justify-center cursor-pointer hover:bg-[#0f2626] transition-colors">
            <UserIcon />
          </button>
        </div>
      </div>

      {/* Waveform area */}
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

      {/* Chat Display Panel */}
      {hasChat && (
        <div className="relative z-10 mx-6 mb-3">
          <div className="bg-[#0a1a1a] border border-[#1a4040] rounded-xl px-5 py-4 max-h-[180px] overflow-y-auto">
            {/* User text */}
            {lastUserText && (
              <div className="mb-3">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1f5555]">
                  YOU
                </span>
                <p className="text-[#00e5ff] text-sm mt-1 leading-relaxed">
                  {lastUserText}
                </p>
              </div>
            )}

            {/* AI response */}
            {displayAIText && (
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1f5555]">
                  AI{streamingAIText ? " (streaming...)" : ""}
                </span>
                <p className="text-[#7fdbdb] text-sm mt-1 leading-relaxed">
                  {displayAIText}
                  {streamingAIText && (
                    <span className="inline-block w-[2px] h-[14px] bg-[#00e5ff] ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Steps Panel */}
      {agentMode && agentSteps.length > 0 && (
        <div className="relative z-10 mx-6 mb-3">
          <div className="bg-[#0a1a1a] border border-[#3d2800] rounded-xl px-5 py-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#ff9800]">
              AGENT ACTIONS
            </span>
            <div className="mt-2 space-y-2">
              {agentSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-[#1a1200] rounded-lg px-3 py-2"
                >
                  <span className="text-[11px] font-bold text-[#ff9800] min-w-[18px]">
                    {index + 1}.
                  </span>
                  <div>
                    <div className="text-[#ffb74d] text-xs font-semibold">
                      {step.tool.replace(/_/g, " ")}
                    </div>
                    <div className="text-[#7f6830] text-[11px] mt-0.5">
                      {(step.args as Record<string, string>)?.path ||
                        (step.args as Record<string, string>)?.command ||
                        JSON.stringify(step.args).slice(0, 60)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mic button + status */}
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
