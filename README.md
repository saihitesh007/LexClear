# LexClear

A lightweight legal-document assistant for plain-language review, risk flags, OCR, translation, grounded questions, and version comparison.

## Run locally

1. Copy `.env.example` to `.env` and set server-only `GEMINI_API_KEY` and `GOOGLE_CLOUD_API_KEY`.
2. Run `npm install` then `npm run dev`.

## Evaluation focus

- Lightweight: Vite vanilla TypeScript, native DOM events, Tailwind, no framework runtime.
- Google services: Gemini 2.5 Flash powers structured simplification, risk review, Q&A and comparison; Vision OCR reads image documents; Translation localizes the simplified output.
- Security: no VITE secrets; Zod validates every route; rate limiting, request timeouts, input bounds and escaped rendered content.
- Reliability: every provider route returns a fallback rather than a crash.
- Testing: `npm test` runs Vitest lib tests; `npx playwright test` runs two axe accessibility scans.

## Before submission

Run `npm run build`, `npm test`, and `npx playwright test`. Deploy to Vercel, configure the two server-side environment variables, test as an unauthenticated visitor, then add the real deployment URL and screenshots here.

The in-memory rate limiter is intentionally MVP-level; use Vercel KV or Upstash for durable distributed production limits.
