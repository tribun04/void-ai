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





<!-- Step 2  After Eron  -->







📘 Unified System Documentation: Void AI Multitenant Customer Support Platform
1. Overview

The Void AI Multitenant Customer Support Platform is a SaaS system that provides AI-powered omnichannel customer support, allowing businesses (tenants) to integrate their support across multiple platforms (Web, WhatsApp, Facebook, Instagram, Telegram, and VOIP).

SuperAdmin manages global platform settings, tenant billing, API tokens, and activation.

Tenants (companies) can onboard, receive invoices, activate accounts, configure integrations, and manage their support staff.

End-users interact with the AI bot or live agents via their preferred communication channel.

The system is modular, scalable, and role-based with tenant isolation to ensure security and data separation.

2. Architecture
2.1 Tech Stack

Backend: Node.js + Express

Database: PostgreSQL (multitenant schema)

Auth: JWT (role + tenant-based) + bcrypt password hashing

Realtime: WebSockets (Socket.IO)

AI Engine: Local LLM or external APIs (OpenAI / Ollama / custom models)

OCR + NLP: Tesseract.js, custom AI models for text extraction/analysis

Integrations:

WhatsApp Business API

Facebook Messenger API

Instagram Messaging API

Telegram Bot API

SIP/VOIP via WebRTC + SIP.js

Billing/Invoices: Auto-generated PDFs (reportlab), activation codes

2.2 High-Level Diagram
Users → Channels (Web, WhatsApp, FB, IG, Telegram, VOIP)
       → AI Router (LLM Engine / Bot Logic)
       → Tenant-specific Processing Layer
       → Database (Tenant-Isolated)
       → Admin Dashboards

3. Roles & Permissions
3.1 SuperAdmin

Create/manage tenants (companies)

Control API tokens & webhooks

Generate & send invoices (with activation codes)

Suspend/reactivate tenants

Access analytics across all tenants

3.2 Company Admin (Tenant Owner)

Manage company info, team members

Configure integrations (WhatsApp, FB, Telegram, VOIP)

Set AI preferences (model selection, knowledge base upload)

View all conversations, transcripts, and analytics

3.3 Agent (Tenant User)

Access assigned chats

Take over from AI when escalation is requested

View conversation history per user

Manage personal settings

3.4 End User (Customer)

Interact with bot/agents through multiple channels

Request escalation to a human agent

Receive ticket status updates

4. Multitenancy Model
4.1 Database Design

Users Table (role, tenant_id, JWT claims)

Companies Table (tenant_id, name, industry, settings)

Conversations Table (tenant_id, user_id, messages, transcripts)

Billing Table (invoices, activation codes, token usage)

Integrations Table (tenant_id, WhatsApp/Facebook/VOIP configs)

4.2 Tenant Isolation

All queries are scoped by tenant_id.

JWT payload includes tenant_id and role.

SuperAdmin bypasses tenant scoping for global control.

5. Communication Flow
5.1 AI Conversation Flow

User sends message → via channel API (WhatsApp, FB, etc.)

Gateway receives message → Normalized into internal format

AI Engine processes → Generates response (AI bot)

Escalation triggers → Transfer to live agent via WebSocket session

Transcript logged → Stored under tenant’s database schema

5.2 Escalation Example

Customer: "I need to speak to a real agent"

AI detects escalation intent

System assigns available agent

WebSocket session created between customer and agent

Conversation transcript saved

6. Integrations
6.1 WhatsApp

WhatsApp Business API (cloud or on-premise)

Webhook receives messages → Routes to tenant’s AI bot

Replies sent via API




Author Suela Zeneli Lorik Dullovi Tribun Bajra ****
