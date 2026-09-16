# LexClear

LexClear is a lightweight GenAI legal document assistant for people who need to understand a legal document before acting on it. Upload a PDF, DOCX, or scan to receive a plain-language explanation, risk flags, a glossary, a grounded document Q&A experience, a comparison against a second version, and translated output.

## Deployment

**TODO:** Add the tested Vercel deployment URL here after deployment.

## Problem addressed

Legal documents are often dense, technical, and inaccessible. LexClear keeps the original document as the source of truth while making obligations, deadlines, risks, and unfamiliar terms easier to understand. It provides general legal information only, not legal advice.

## Setup

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and configure these server-only variables in local development and Vercel:

```sh
GEMINI_API_KEY=
GOOGLE_CLOUD_VISION_KEY=
GOOGLE_TRANSLATE_KEY=
```

Never expose keys through `VITE_` variables. The browser calls only `/api/*` endpoints.

## Architecture

```text
Vite SPA (plain TypeScript + native DOM)
  └─ /api Vercel serverless functions
       ├─ Gemini 2.5 Flash: simplify, compare, grounded Q&A
       ├─ Cloud Vision: scanned-document OCR
       └─ Cloud Translation: multilingual simplified output
```

Document text and service credentials are processed server-side. The SPA contains no API key and does not parse document content in the browser.

## Evaluation Focus

| Criterion    | Implementation                                                                                                                                                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code quality | Typed, framework-free view modules; isolated business logic in `src/lib`; shared Zod API schemas.                                                                                                                                                                      |
| Security     | Server-only unprefixed credentials, Zod request validation, size/type bounds, timeouts, basic rate limiting, and no client key exposure.                                                                                                                               |
| Efficiency   | Text limits, 10 MB file validation, deterministic local risk scoring, and dynamically imported comparison UI.                                                                                                                                                          |
| Testing      | Vitest covers parsing, Gemini prompts/fallbacks, risk scoring, translation fallback, shared API utilities, and view components (shell, upload, simplifiedView, compareView, chatPanel). Playwright includes two axe scans plus an upload → simplify → chat happy path. |

| Accessibility | Semantic controls, live status updates, keyboard-native details glossary, visible focus styles, labelled select/input controls, and axe coverage. |
| Google services | Gemini drives simplification, comparison, and grounded Q&A; Vision handles OCR fallback; Translation localizes output. |
| Lightweight-ness | Vanilla Vite/TypeScript with no UI framework. Current browser JS: **15.12 kB main / 5.45 kB gzip**; comparison is a separate **2.53 kB / 1.07 kB gzip** lazy chunk. |

## Service fallback matrix

| Service/feature                    | Graceful fallback                                                          |
| ---------------------------------- | -------------------------------------------------------------------------- |
| PDF/DOCX extraction and Vision OCR | Clear error: “Couldn't read this document — try a clearer scan.”           |
| Gemini simplification              | Heuristic sentence-level summary and visible caveat.                       |
| Gemini comparison                  | Unavailable summary with no invented differences.                          |
| Grounded Q&A                       | Clear assistant-unavailable message and legal-information disclaimer.      |
| Cloud Translation                  | Original English text stays visible with a translation-unavailable notice. |

## Verify before submission

```sh
npm run build
npm test
npx playwright test
```

Deploy to Vercel, configure the three server-side environment variables, and test upload/OCR, simplification, comparison, chat, and translation as an unauthenticated visitor.

## Screenshots

**TODO:** Add a real upload/processing screenshot after deployment.

**TODO:** Add a real simplified result with risk flags, glossary, translation, and chat screenshot after deployment.

## Production note

The current in-memory rate limiter is suitable for this MVP. For distributed production traffic, replace it with Vercel KV or Upstash.
