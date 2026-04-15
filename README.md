# AURIX - AI-Powered Voice Assistant

A desktop voice assistant built with Electron, Next.js, and FastAPI — featuring real-time speech-to-text, text-to-speech, AI chat, agent mode with VS Code integration, and a RAG pipeline for semantic document search.

## Tech Stack

### Frontend
- **Electron** — Desktop app shell (frameless, Discord-style UI)
- **Next.js + React** — UI framework
- **TypeScript** — Type-safe frontend code

### Backend
- **FastAPI** — Python async API server
- **Deepgram** — Speech-to-Text (Nova-2) & Text-to-Speech (Aura voices)
- **Groq** — LLM chat (LLaMA 3.3 70B)
- **OpenRouter** — Agent mode (Nemotron 3 Nano) with tool calling
- **Cohere** — Text embeddings (embed-english-v3.0)
- **Qdrant** — Vector database for semantic search
- **Firebase Admin** — Authentication & Firestore

### VS Code Extension
- WebSocket bridge between Electron app and VS Code
- Agent mode executes coding tasks directly in your editor

## Project Structure

```
AURIX/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI app, CORS, health endpoint
│       ├── core/
│       │   ├── config.py            # Environment variables
│       │   └── firebase_admin.py    # Firebase initialization
│       ├── api/
│       │   ├── router.py            # Central route registry
│       │   └── routes/
│       │       ├── auth/            # sign_up, verify_user, user_session
│       │       ├── groq/            # chat, agent, history, system-prompt
│       │       ├── deepgram/        # transcribe, tts, voices
│       │       └── rag/             # search, upload, collection info
│       ├── services/
│       │   ├── groq_service.py      # Chat + Agent mode (OpenRouter)
│       │   ├── deepgram_service.py  # STT & TTS
│       │   ├── embedding_service.py # Cohere embeddings
│       │   ├── vector_service.py    # Qdrant operations
│       │   └── retrieval_service.py # RAG pipeline
│       └── models/
│           └── schemas.py           # Pydantic request/response models
├── frontend/
│   └── electron/
│       ├── main.ts                  # Electron main process + IPC handlers
│       ├── preload.ts               # Context bridge APIs for renderer
│       ├── agent-tools.ts           # Agent tool definitions
│       └── vscode-bridge.ts         # WebSocket bridge to VS Code
├── aurix-vscode-extension/          # VS Code extension source
├── package.json
└── package-lock.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root — API info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/groq/chat` | Send chat message |
| `POST` | `/api/v1/groq/chat/agent` | Start agent task with tools |
| `POST` | `/api/v1/groq/chat/agent/tool-results` | Submit tool execution results |
| `GET` | `/api/v1/groq/chat/history` | Get conversation history |
| `DELETE` | `/api/v1/groq/chat/history` | Clear conversation history |
| `PUT` | `/api/v1/groq/chat/system-prompt` | Set system prompt |
| `GET` | `/api/v1/groq/models` | List available models |
| `POST` | `/api/v1/deepgram/transcribe` | Transcribe audio file (STT) |
| `POST` | `/api/v1/deepgram/tts` | Text-to-speech |
| `GET` | `/api/v1/deepgram/voices` | List available TTS voices |
| `POST` | `/api/v1/rag/search` | Semantic document search |
| `POST` | `/api/v1/rag/upload` | Upload document to RAG pipeline |
| `GET` | `/api/v1/rag/collection/info` | Vector collection stats |
| `POST` | `/api/v1/auth/sign-up` | User registration |
| `POST` | `/api/v1/auth/verify-user` | Verify user token |
| `POST` | `/api/v1/auth/user-session` | Create user session |

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- API keys: Deepgram, Groq, OpenRouter, Cohere, Qdrant, Firebase

### Environment Variables

Create `backend/.env`:

```env
# Deepgram
DEEPGRAM_API_KEY=your_key

# Groq
GROQ_API_KEY=your_key

# OpenRouter (Agent mode)
OPENROUTER_API_KEY=your_key

# Cohere (Embeddings)
COHERE_API_KEY=your_key

# Qdrant (Vector DB)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_key
QDRANT_COLLECTION=aurix_docs

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY=your_key
TOKEN_URI=https://oauth2.googleapis.com/token
PRIVATE_KEY_ID=your_key_id
CLIENT_ID=your_client_id
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
npm install
npm run dev
```

## Features

- **Voice Chat** — Record audio, transcribe with Deepgram, get AI response from Groq, hear it back via TTS
- **Agent Mode** — AI agent that can execute coding tasks in VS Code via tool calling
- **RAG Pipeline** — Upload documents, generate embeddings with Cohere, search semantically via Qdrant
- **Authentication** — Firebase-based user sign-up, verification, and session management
- **System Tray** — App minimizes to tray, always accessible
