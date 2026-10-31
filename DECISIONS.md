# Architecture & Design Decisions: Minimal LLM Gateway

This document outlines the architectural decisions, trade-offs, concurrency handling strategies, and deliberate boundaries adopted during the development of the Minimal LLM Gateway.

---

## 1. What Was Built

A lightweight, production-grade reverse proxy sitting between external clients and upstream LLM providers (Google Gemini):
1. **Virtual API Key Management**: Generation of 192-bit cryptographic keys (`gw_live_*`), SHA-256 one-way hashing, and secure status lifecycle (`active` / `revoked`).
2. **Atomic Budget Enforcement**: Request-level budgeting preventing race conditions under high concurrency using single-operation MongoDB `$expr` updates.
3. **OpenAI-Compatible Chat Completion Proxy**: `POST /v1/chat/completions` receiving standard OpenAI payloads, mapping them to Google Gemini's native API, and returning structured OpenAI-compliant responses.
4. **Usage & Spend Telemetry**: Awaited persistence of token counts and estimated spend in INR using documented official pricing.
5. **Provider Resilience Engine**: Configured 30-second timeouts, bounded exponential backoff retries for transient 5xx/429 errors, and zero retries for 4xx errors.
6. **Security & Administration**: In-memory rate limiting, timing-safe admin authentication, zero stack-trace leaks, stripped server headers, and strict 1MB payload limits.

---

## 2. Request Lifecycle & Pipeline Architecture

```
Client
  │ (Bearer gw_live_*)
  ▼
[Security Headers & Rate Limiter] (src/middleware/rateLimiter.js)
  │ (Checks sliding-window limit)
  ▼
[Request Validation] (src/middleware/validateGatewayRequest.js)
  │ (Checks model, messages array, roles, lengths without external libraries)
  ▼
[Virtual Key Authentication] (src/middleware/authenticateVirtualKey.js)
  │ (Computes SHA-256 hash, verifies active status in MongoDB)
  ▼
[Atomic Budget Reservation] (src/services/budget.service.js)
  │ (findOneAndUpdate with $expr: { $lt: ["$requestsUsed", "$requestLimit"] })
  │ ── If limit reached ──▶ Return HTTP 429 Too Many Requests
  ▼
[LLM Provider Integration] (src/services/llm/gemini.provider.js)
  │ (Dispatches to Gemini API with timeout & retry)
  │ ── If 5xx / timeout ──▶ Revert quota ($inc: -1) & Log failure
  ▼
[Cost & Usage Tracking] (src/services/usage.service.js)
  │ (Awaits Usage.create() in MongoDB before returning response)
  ▼
Client Response (OpenAI-compatible 200 OK)
```

---

## 3. Important Architecture Decisions & Trade-offs

### A. Why Budget Enforcement Happens at the Gateway Layer
Enforcing budgets at the gateway layer rather than asynchronously or downstream offers three critical advantages:
1. **Pre-Emptive Cost Control**: Upstream LLM providers bill per token or per request. If an untrusted client exceeds their budget, forwarding the request causes real financial liability before the request can be billed. Gateway-level rejection stops compute consumption before reaching the provider.
2. **Provider Agnosticism**: Downstream providers have differing or non-existent client-level budgeting APIs. Enforcing quota at the gateway creates a unified governance model across all models and providers.
3. **Sub-millisecond Latency on Rejection**: When a client exhausts their budget, the gateway rejects the request in single-digit milliseconds, saving network roundtrips to the LLM provider.

### B. How Concurrent Requests Are Handled (Atomic MongoDB Updates)
- **The Problem**: A naive read-then-write approach (`const key = await Key.findById(); if (key.used < limit) await Key.updateOne(...)`) suffers from severe race conditions under simultaneous traffic. Ten concurrent requests can read `used = 99` (under a limit of 100) and all proceed, causing `used = 109`.
- **The Solution**: We enforce budgeting via a single atomic `findOneAndUpdate` using MongoDB's `$expr`:
  ```javascript
  const updatedKey = await VirtualKey.findOneAndUpdate(
    {
      _id: keyId,
      status: "active",
      $expr: { $lt: ["$requestsUsed", "$requestLimit"] }
    },
    { $inc: { requestsUsed: 1 } },
    { returnDocument: "after" }
  );
  ```
  MongoDB locks the document at the storage engine layer during write execution. Exactly $N$ requests can succeed; the $(N+1)^{\text{th}}$ request receives `null` and is immediately rejected with HTTP 429.

### C. Provider Failure & Quota Refund Policy
- **Transient Failures (5xx / Timeout)**: If the client had available budget, but the upstream LLM provider fails due to a network timeout, 500, 503, or 504 error, the gateway decrements `requestsUsed` by 1 using `refundRequestQuota`. The client is not penalized for infrastructure downtime.
- **Client Rejections (4xx)**: If a request reaches Gemini and is rejected with a 400 (e.g., content safety filter violation), the request quota **is consumed**. The gateway performed validation, but provider safety filters rejected the prompt; this counts against the client's usage.

### D. Documented Limitation: Timed-Out Provider Calls
**Limitation**: If a request exceeds the 30-second gateway timeout, the gateway aborts the client connection, returns HTTP 504 Gateway Timeout, and refunds the quota. However, the upstream LLM provider (Google Gemini) may have already received the payload and completed text generation on its servers.
- *Trade-off*: We intentionally prioritize **client fairness** over provider cost absorption. Under network partitions or upstream latency spikes, the client receives no answer; billing them for an unanswered prompt would damage trust.

---

## 4. Fallback Policy & Honesty on Multi-Provider Fallback

Direct provider integration (`src/services/llm/gemini.provider.js`) is implemented for Google Gemini without unnecessary wrapper abstractions. In accordance with the project guidelines:
- **No Fake Fallback**: We did NOT create a dummy secondary provider that pretends to fall back to Anthropic or OpenAI using fake responses.
- **Provider Status**: Only Google Gemini is wired with a live adapter. If Gemini fails after bounded retries, the error is returned transparently as a 502/504 with structured telemetry.

---

## 5. What Was Deliberately Not Built

1. **Streaming (Server-Sent Events / Chunked Transfer)**:
   - *Rationale*: Token usage metadata is provided by Gemini only at the conclusion of generation (`usageMetadata`). Streaming chunk-by-chunk would require either client-side token estimations or delaying the final budget settlement. Non-streaming ensures exact token counts are recorded in the awaited database write before returning the response.
2. **External Validation Libraries (Zod, Joi, Yup)**:
   - *Rationale*: Adhered strictly to the requirement. Handcrafted validation middleware ensures zero dependency overhead, fast execution, and readable error responses.
3. **Complex Frontend GUI**:
   - *Rationale*: Kept backend-pure as requested. All operations are accessible via REST API.
4. **Docker Containerization**:
   - *Rationale*: Kept deployment lightweight for Render using direct Node.js runtime per guidelines.

---

## 6. Least Certain Decision

**Decision**: Choosing between refunding quota on provider timeouts versus absorbing the quota.
- *Reasoning*: Because LLM provider calls are not idempotent and have no two-phase commit protocol, network timeouts leave the state ambiguous. Refunding could theoretically allow a malicious client to craft prompts that take >30 seconds to run free of charge. However, given standard conversational turn limits and typical latency under 5 seconds, client fairness is the superior engineering default.

---

## 7. Limitations & Future Improvements

1. **Distributed Rate Limiting**: The current sliding-window rate limiter is in-memory. In a multi-instance autoscaled cluster, an external store like Redis would be required to synchronize IP rate limits across instances.
2. **Token-Based Budgeting**: The current model enforces request-count limits (e.g., 100 requests). Future iterations could implement token-count or USD/INR spend-based limits where tokens are deducted after completion.
3. **Model Routing Fallbacks**: Once secondary provider API keys (e.g., OpenAI or Anthropic) are provisioned, the modular dispatcher can implement automatic failover when Gemini returns a 503 Service Unavailable.
