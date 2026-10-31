# AI Development Log: Minimal LLM Gateway

This log documents the collaboration, tooling, critical review, and architectural refinements made during the development of the Minimal LLM Gateway.

---

## 1. AI Tools & Models Used

- **Primary Assistant**: Google Antigravity (Advanced Agentic AI Assistant)
- **Model**: Gemini 3.8 Flash (High) / Gemini 2.5 Pro
- **Environment**: macOS, Node.js v24.14.0, MongoDB v8.0.0 (Local Engine)

---

## 2. How AI Helped During Development

- **Scaffolding & Architecture**: Accelerating the phased breakdown from foundational database models up to resilient proxy routing.
- **Concurrency & Atomic Query Construction**: Formulating the atomic `$expr` aggregation update for MongoDB `findOneAndUpdate`, guaranteeing race-condition resilience under high concurrent loads.
- **OpenAI-to-Gemini Payload Translation**: Mapping OpenAI's `messages: [{ role, content }]` structure to Google Gemini's `contents: [{ role, parts }]` and `systemInstruction` format without external libraries.
- **Cryptographic Key Sanitation**: Constructing CSPRNG generation with Node.js native `crypto.randomBytes(24)` and timing-safe header verification (`crypto.timingSafeEqual`).

---

## 3. Incorrect AI Suggestion & How It Was Caught

- **The Suggestion**: During Phase 3, an initial implementation draft proposed using Mongoose's legacy option `{ new: true }` in `findOneAndUpdate()`.
- **How It Was Caught**: During live execution of the virtual key deactivation endpoint (`PATCH /admin/keys/:id/deactivate`), the Node.js v24 console emitted a formal deprecation warning:
  `[MONGOOSE] Warning: mongoose: the 'new' option for findOneAndUpdate() and findOneAndReplace() is deprecated. Use returnDocument: 'after' instead.`
- **Correction Applied**: The code was immediately refactored to use `{ returnDocument: "after" }`, ensuring complete compatibility with modern Mongoose versions and eliminating runtime warnings.

---

## 4. AI Suggestion That Was Rejected

- **The Suggestion**: An initial architectural proposal suggested using an asynchronous "fire-and-forget" background write for `Usage.create(...)` in order to optimize client latency by several milliseconds.
- **Why It Was Rejected**: This was intentionally rejected in favor of synchronous `await Usage.create(...)`. In a gateway handling billable AI compute, returning HTTP 200 before persisting the telemetry introduces data-loss vulnerability under server crashes or restarts. Reliability and strict consistency were prioritized over microsecond latency savings.

---

## 5. How Generated Code Was Reviewed

1. **Zero External Validation Library Enforcement**: Every file was audited to ensure no imports of Zod, Joi, Yup, or external rate limiters were introduced. Validation was written entirely in clean, readable Express middleware using native JavaScript checks (`typeof`, `Array.isArray`, `Number.isInteger`).
2. **Secret Leak Prevention**: A global codebase audit (`grep -rn "console\." src/`) was executed to confirm that raw virtual keys (`gw_live_*`), Gemini API credentials, and client authorization headers are never printed to console streams or returned in client error responses.
3. **Automated Stress Testing**: Concurrency was tested by firing 25 simultaneous promises against a budget of 5. The atomic update successfully halted over-allocation, ensuring exactly 5 requests succeeded and 20 were rejected with HTTP 429.

---

## 6. Personal Reflections & Learnings (For Developer Completion)

*Instructions: Complete the sections below with your personal reflections and takeaways from building this assignment.*

### What Was Learned During Development
<!-- Add your personal reflections on what you learned regarding reverse proxies, atomic database updates, or LLM token telemetry here. -->
- 
- 

### Key Takeaways on LLM Gateway Architecture
<!-- Add your observations regarding cost control, provider latency, or API key lifecycle management here. -->
- 
- 
