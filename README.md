# Minimal LLM Gateway

A robust, production-ready HTTP backend gateway sitting between API clients and upstream LLM providers (Google Gemini). Built with Node.js, Express, MongoDB, and Mongoose.

---

## 1. Project Overview

The Minimal LLM Gateway provides:
- **Virtual API Key Governance**: Issues CSPRNG virtual API keys (`gw_live_*`), storing only SHA-256 hashes in MongoDB.
- **Atomic Concurrency & Budget Enforcement**: Request-level budgeting via atomic MongoDB `$expr` updates that prevent race conditions and over-allocation under concurrent traffic.
- **Provider Reverse Proxy**: Translates OpenAI-compatible `POST /v1/chat/completions` requests to Gemini API's native format and returns non-streaming OpenAI-compliant responses.
- **Usage & Telemetry Logging**: Awaited persistence of actual prompt and completion tokens, request durations, and documented INR cost estimates before delivering client responses.
- **Provider Resilience**: Configured timeouts (30s), bounded retries with exponential backoff for transient 5xx/429 errors, and zero retries for non-transient 4xx errors.
- **Security & Hygiene**: Timing-safe admin authentication, in-memory rate limiting, zero stack-trace leaks, stripped server headers, and strict 1MB payload limits without external validation libraries.

---

## 2. Architecture & Request Lifecycle

```
                      ┌────────────────────────────────────────┐
                      │              Client App                │
                      └──────────────────┬─────────────────────┘
                                         │
                    POST /v1/chat/completions (Bearer gw_live_*)
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LLM GATEWAY SERVICE                                  │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐  │
│  │ Request Validation    │──▶│ Virtual Key Auth         │──▶│ Atomic Budget Check   │  │
│  │ (Custom Express MW)   │   │ (SHA-256 Lookup)         │   │ (MongoDB findAndMod)  │  │
│  └───────────────────────┘   └──────────────────────────┘   └───────────┬───────────┘  │
│                                                                         │              │
│                                                          Quota OK (200) │ Exceeded     │
│                                                                         ▼ (429)        │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌───────────┴───────────┐  │
│  │ Usage & Spend Logger  │◀──│ Provider Adapter         │◀──│ Route to LLM Engine   │  │
│  │ (Awaited Mongo Write) │   │ (Timeout + Retry + Map)  │   │ (gemini.provider.js)  │  │
│  └───────────────────────┘   └─────────────┬────────────┘   └───────────────────────┘  │
└────────────────────────────────────────────┼───────────────────────────────────────────┘
                                             │
                      POST https://generativelanguage.googleapis.com/...
                                             ▼
                      ┌────────────────────────────────────────┐
                      │          Google Gemini API             │
                      └────────────────────────────────────────┘
```

### Request Lifecycle Steps:
1. **Validation**: Express middleware verifies JSON body structure, message formats, and roles without external libraries.
2. **Authentication**: Computes SHA-256 hash of `Bearer gw_live_*` and verifies active status in MongoDB.
3. **Atomic Quota Reservation**: Uses MongoDB `findOneAndUpdate` with `$expr: { $lt: ["$requestsUsed", "$requestLimit"] }` to increment `requestsUsed` by 1. Returns HTTP 429 if limit is reached.
4. **Provider Forwarding**: Translates messages to Gemini format and dispatches via native `fetch` with `AbortSignal.timeout(30000)` and 2 backoff retries on transient errors.
5. **Usage Logging**: Captures actual token counts, calculates INR cost from documented rates, and awaits `Usage.create(...)` in MongoDB.
6. **Delivery**: Returns the OpenAI-compatible response. If an upstream transient error (5xx/timeout) occurs, the reserved quota is refunded.

---

## 3. Technology Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose
- **LLM Provider**: Google Gemini API (`v1beta` endpoint via native `fetch`)
- **Security & Cryptography**: Native Node.js `crypto` module (`randomBytes`, `createHash`, `timingSafeEqual`)
- **Configuration**: `dotenv`

*Strictly zero unapproved schema libraries (No Zod, Joi, Yup, or external rate limiters).*

---

## 4. Installation & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- MongoDB instance running locally or a MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd RentOk

# Install all dependencies (both backend and frontend)
npm run install:all
```

Or install separately:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend Environment Variables
Copy `.env.example` to `.env` inside the `backend/` directory:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual credentials:
```ini
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection String
MONGODB_URL=mongodb://localhost:27017/rentok-llm-gateway

# Admin Secret Key (used to authorize /admin/* endpoints)
ADMIN_SECRET=replace_with_a_secure_admin_secret_minimum_8_chars

# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Run Locally

#### Option A: From Project Root
```bash
# Start backend on http://localhost:3000
npm run backend

# In a second terminal, start frontend on http://localhost:5173
npm run frontend
```

#### Option B: Inside Respective Directories
```bash
# Backend
cd backend
npm start        # or npm run dev for watch mode

# Frontend
cd frontend
npm run dev
```

---

## 5. API Reference & curl Examples

### A. Health Check
```bash
curl -i http://localhost:3000/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "rentok-llm-gateway",
  "uptimeSeconds": 45,
  "timestamp": "2026-10-31T13:15:00.000Z"
}
```

---

### B. Admin Key Management

#### 1. Create a Virtual API Key
```bash
curl -i -X POST http://localhost:3000/admin/keys \
  -H "x-admin-secret: replace_with_a_secure_admin_secret_minimum_8_chars" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul",
    "requestLimit": 100
  }'
```
**Response (201 Created):**
```json
{
  "message": "Virtual API key created successfully. Save this raw key; it cannot be retrieved again.",
  "apiKey": "gw_live_2aac9e6f748914250a8610906198692561bc756ca936c267",
  "key": {
    "_id": "6ae5e6643117b30e911ccb6f",
    "name": "Rahul",
    "keyPrefix": "gw_live_2aac9e6f",
    "status": "active",
    "requestLimit": 100,
    "requestsUsed": 0,
    "createdAt": "2026-10-31T13:00:20.040Z",
    "updatedAt": "2026-10-31T13:00:20.040Z"
  }
}
```

#### 2. List All Virtual Keys (Masked Hashes)
```bash
curl -i http://localhost:3000/admin/keys \
  -H "x-admin-secret: replace_with_a_secure_admin_secret_minimum_8_chars"
```
**Response (200 OK):**
```json
{
  "count": 1,
  "keys": [
    {
      "_id": "6ae5e6643117b30e911ccb6f",
      "name": "Rahul",
      "keyPrefix": "gw_live_2aac9e6f",
      "status": "active",
      "requestLimit": 100,
      "requestsUsed": 1,
      "createdAt": "2026-10-31T13:00:20.040Z",
      "updatedAt": "2026-10-31T13:06:19.378Z"
    }
  ]
}
```

#### 3. Deactivate a Virtual Key
```bash
curl -i -X PATCH http://localhost:3000/admin/keys/6ae5e6643117b30e911ccb6f/deactivate \
  -H "x-admin-secret: replace_with_a_secure_admin_secret_minimum_8_chars"
```
**Response (200 OK):**
```json
{
  "message": "Virtual API key deactivated successfully",
  "key": {
    "_id": "6ae5e6643117b30e911ccb6f",
    "name": "Rahul",
    "keyPrefix": "gw_live_2aac9e6f",
    "status": "revoked",
    "requestLimit": 100,
    "requestsUsed": 1
  }
}
```

---

### C. LLM Proxy (`POST /v1/chat/completions`)

#### 1. Successful Chat Completion
```bash
curl -i -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer gw_live_2aac9e6f748914250a8610906198692561bc756ca936c267" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {
        "role": "user",
        "content": "Explain Node.js in simple words"
      }
    ]
  }'
```
**Response (200 OK):**
```json
{
  "id": "chatcmpl-a8b271d1-6789-4bc2-b349-13840291048a",
  "object": "chat.completion",
  "created": 1793452400,
  "model": "gemini-2.5-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Node.js is a runtime that lets you run JavaScript on your computer or server outside of a web browser."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 24,
    "total_tokens": 38
  }
}
```

#### 2. Budget Exceeded Error
When `requestsUsed >= requestLimit`:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8

{
  "error": {
    "message": "Budget exceeded. Request limit of 100 has been reached (100/100 requests used).",
    "type": "budget_exceeded_error",
    "status": 429
  }
}
```

---

### D. Usage and Spend Analytics

#### 1. System-Wide Usage Summary
```bash
curl -i http://localhost:3000/admin/usage \
  -H "x-admin-secret: replace_with_a_secure_admin_secret_minimum_8_chars"
```
**Response (200 OK):**
```json
{
  "summary": {
    "totalRequests": 25,
    "successfulRequests": 23,
    "failedRequests": 2,
    "totalInputTokens": 4520,
    "totalOutputTokens": 8900,
    "totalTokens": 13420,
    "estimatedTotalSpendInr": 0.250523
  },
  "recentRequestsCount": 25,
  "recentRequests": [ ... ]
}
```

#### 2. Per-Key Usage Summary
```bash
curl -i http://localhost:3000/admin/usage/6ae5e6643117b30e911ccb6f \
  -H "x-admin-secret: replace_with_a_secure_admin_secret_minimum_8_chars"
```
**Response (200 OK):**
```json
{
  "key": {
    "_id": "6ae5e6643117b30e911ccb6f",
    "name": "Rahul",
    "keyPrefix": "gw_live_2aac9e6f",
    "status": "active",
    "requestLimit": 100,
    "requestsUsed": 1
  },
  "summary": {
    "totalRequests": 1,
    "successfulRequests": 1,
    "failedRequests": 0,
    "totalInputTokens": 14,
    "totalOutputTokens": 24,
    "totalTokens": 38,
    "estimatedTotalSpendInr": 0.000688
  },
  "recentRequestsCount": 1,
  "recentRequests": [ ... ]
}
```

---

## 6. Token Pricing & Cost Calculation Methodology

Token pricing is sourced from official published Google Cloud / Google AI Studio rates (January 2025):
- **Exchange Rate Assumption**: Fixed reference benchmark of `1 USD = 83.50 INR`.
- **Supported Models**:
  - `gemini-1.5-flash`: $0.075 / 1M input, $0.30 / 1M output (prompts <= 128k).
  - `gemini-2.0-flash`: $0.075 / 1M input, $0.30 / 1M output.
  - `gemini-2.5-flash`: $0.075 / 1M input, $0.30 / 1M output.
  - `gemini-1.5-pro`: $1.25 / 1M input, $5.00 / 1M output.
- **Unconfigured Models**: Return `null` ("Cost Unavailable") rather than reporting fabricated figures.

---

## 7. Render Deployment Instructions

1. **Create Web Service on Render**:
   - Connect your GitHub repository.
   - Environment: `Node`.
   - Build Command: `npm install`.
   - Start Command: `npm start`.
2. **Configure Environment Variables in Render Dashboard**:
   - `PORT`: `3000` (or Render default)
   - `NODE_ENV`: `production`
   - `MONGODB_URL`: `<Your MongoDB Atlas connection URI>`
   - `ADMIN_SECRET`: `<Strong random admin secret>`
   - `GEMINI_API_KEY`: `<Your official Gemini API Key>`
3. **Health Check Path**:
   - Set health check path to `/health`.

---

## 8. Frontend Admin Dashboard

A minimalist, high-density React.js Admin Dashboard inspired by Linear and Vercel design aesthetics is located in the `frontend/` directory.

### Tech Stack
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom Linear/Vercel monochrome dark/light palette
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Token distribution stacked bar chart, Latency area chart)
- **HTTP Client**: Axios with centralized error normalization and volatile memory secret injection

### Security Design
- **Zero Persistent Storage**: In compliance with strict security requirements, the `ADMIN_SECRET` is kept exclusively in React component memory (`AdminContext`) during the active browser session. It is never persisted to `localStorage`, `sessionStorage`, cookies, or client environment files.
- **Zero CORS Configuration Required**: The Vite development server is configured with a backend proxy in `vite.config.js`, routing `/admin/*`, `/v1/*`, and `/health` requests to `http://localhost:3000` from the same origin.

### Dashboard Pages & Features
1. **Overview Dashboard (`/`)**: Real-time system health pulse, KPI cards (Active Keys, Total Requests, Total Token Consumption, Total INR Spend), 7-day token volume chart, infrastructure status card, and chronological gateway activity feed.
2. **API Keys Management (`/keys`)**: Searchable list of virtual keys, quota progress bars (`requestsUsed / requestLimit`), one-time raw key generation modal with secure clipboard copy, and key deactivation modal.
3. **Usage & Spend Analytics (`/usage`)**: Key-level dropdown filtering, KPI summaries, input vs output token consumption stacked bar chart, latency distribution area chart, and tabular request audit log.
4. **Interactive API Playground (`/playground`)**: Test gateway completions with any active virtual key (`gw_live_*`), model selector, keyboard shortcut (`⌘+Enter`), response renderer, and real-time token/latency telemetry breakdown.
5. **Settings & Gateway Access (`/settings`)**: In-memory admin secret management, session status indicators, and live backend connection diagnostics.

### Running the Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Or build for production
npm run build
```
Once started, open `http://localhost:5173` in your browser. Enter your `ADMIN_SECRET` in **Settings** to activate full administrative capabilities.

