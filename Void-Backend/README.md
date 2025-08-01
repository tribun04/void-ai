Void AI Customer Support Bot — Backend Documentation
Void AI Customer Support Bot powers a next-generation, multi-channel support infrastructure designed to provide intelligent, real-time assistance across web, social, and voice platforms. It seamlessly integrates AI-driven automation with live agent interaction, creating a unified, high-performance customer engagement solution.

📚 Table of Contents
System Architecture

Core Capabilities

Directory Structure

System Requirements

Installation & Configuration

Environment Configuration

Application Execution

REST API Specification

Socket.IO Events

Utilities & Scripts

License

Authored By

🏗️ System Architecture
The backend is engineered for modularity, scalability, and performance. Its architecture is composed of several decoupled yet highly integrated layers:

Core API (Express.js): Handles all RESTful HTTP requests including user authentication, configuration, and integration management.

Real-Time Layer (Socket.IO): Enables persistent, bi-directional communication between the agent dashboard, user widgets, and bot services.

WhatsApp Integration (Isolated Process): Operates as a dedicated Node.js child process, using whatsapp-web.js, with socket-based communication for real-time responsiveness.

VOIP Subsystem (WebSocket Server): Interfaces with providers like Twilio and Vonage. Converts real-time audio to text using OpenAI Whisper and replies using OpenAI TTS.

Data Store (JSON/Flat Files): Provides simple, file-based persistence (easily upgradable to MongoDB or PostgreSQL in production environments).

✨ Core Capabilities
Omnichannel Support: Unified handling of chats from web widgets, WhatsApp, Facebook Messenger, and VOIP calls.

AI-Powered Conversations: Uses OpenAI GPT-4 and GPT-4o for contextual, multi-lingual interactions (currently supports English, Albanian, and Serbian).

Live Agent Queueing: Intelligent routing and escalation to live agents with session handoff via a real-time dashboard.

Voice Interaction: Real-time voice transcription and TTS using OpenAI models; supports WhatsApp voice notes and VOIP calls.

Role-Based Authentication: Secure access for Superadmins, Admins, and Agents via JWT and bcrypt-protected credentials.

Operational Analytics: Tracks chat volume, popular intents, user behavior, and recent activities.

Integration Management: Toggle and configure external services (Facebook, WhatsApp, VOIP) from a dedicated backend.

Comprehensive Transcripts: Logs every conversation and enables PDF transcript generation on demand.

🗂 Directory Structure

backend/
│
├── controllers/             # Business logic for each route
├── routes/                  # Express route definitions
├── data/                    # JSON "database" for users, sessions, etc.
├── void_bot/                # Bot logic: WhatsApp and VOIP
│   ├── voidBot.js
│   ├── voiceBot.js
│   └── voiceHandler.js
├── utils/                   # OpenAI & integration utilities
├── middleware/              # Auth & access control
├── chat_logs/               # Conversation transcripts
├── temp_transcripts/        # Temporary PDF files
├── uploads/                 # File and voice uploads
├── logs/                    # System logs
├── .env                     # Environment config (to be created)
├── server.js                # Main application entry point
├── socket.js                # Socket.IO server setup
├── manageUsers.js           # Admin user management script
└── package.json             # Project metadata
💻 System Requirements
Node.js v18+

npm (Node Package Manager)

⚙️ Installation & Configuration

npm install
cp .env.example .env

Edit the .env file to provide your API keys and environment variables.

Initialize user accounts:

node manageUsers.js
🔐 Environment Configuration
Create a .env file with the following entries:

Variable	Description	Example
PORT	Application server port	5000
JWT_SECRET	Secret for JWT signing	your-long-secret-string
OPENAI_API_KEY	API key for OpenAI services	sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
FACEBOOK_VERIFY_TOKEN	Verification token for Facebook Webhooks	custom-verification-token
VAPI_API_KEY	Optional voice API key	xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

🚀 Application Execution
bash
Copy
Edit
node
The backend will launch on http://localhost:<PORT>.

🔌 REST API Specification
All endpoints are prefixed with /api.

Authentication

POST /auth/login — User login

POST /auth/register — Agent registration

GET /auth/me — Get logged-in user info

Superadmin

GET/POST/DELETE /superadmin/users

POST /superadmin/train-ai — Update knowledge base

GET /superadmin/chat-volume — Analytics

And more...

WhatsApp Management

POST /superadmin/whatsapp/start|stop

GET /superadmin/whatsapp/status

Facebook Integration

POST /facebook/activate|deactivate

POST /facebook/webhook — Incoming messages

VOIP Integration

POST /voip/incoming-* — Incoming calls (Twilio, SignalWire, etc.)

GET/POST /voip-config/:providerKey

General

GET /agents/online

GET /chat-history

PUT /settings/profile|password|workspace

🔄 Socket.IO Events
Client → Server

get-ai-reply

agent-request, agent-reply, end-chat

request-whatsapp-transcript, etc.

Server → Client

agent-request, chat-assigned, user-message

whatsapp-qr, whatsapp-status

send-file-to-user, etc.

🔧 Utilities & Scripts
manageUsers.js — Create or update user credentials

hashPassword.js — Hash plaintext passwords

createAdmin.js — (Legacy) Admin account creation

🧠 Authored By
Void AI Customer Support Bot was envisioned, architected, and meticulously engineered by
Eron Bruti — a forward-thinking developer with a relentless passion for building intelligent, modular systems that bridge AI and human interaction at scale.

