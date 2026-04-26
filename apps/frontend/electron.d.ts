// Extend the Window interface so TypeScript knows about window.electronAPI
// exposed by preload.ts via contextBridge

export {};

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      // Deepgram STT
      transcribeAudio: (
        audioBuffer: ArrayBuffer,
      ) => Promise<{ transcript: string; confidence: number }>;
      // Groq LLM + TTS streaming
      streamChatTTS: (
        message: string,
        onText: (text: string) => void,
        onAudio: (base64Audio: string) => void,
        onDone: () => void,
        onError: (error: string) => void,
      ) => Promise<void>;
    };
  }
}
