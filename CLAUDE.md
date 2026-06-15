# Speed-to-Lead Builder Agent

## What this is
A web app that ingests a home-services company's raw business context and
auto-generates a customized email speed-to-lead system for them. Built as a
GenAIPI challenge submission, using a roofing company as the demo client.

## Architecture
- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.
- The agent's brain is the OpenAI API (a current capable model, e.g. GPT-4.1 or
  4o-class), called from server-side routes. Use OpenAI structured outputs so the
  JSON it returns matches the Zod schemas.
- Data contract lives in `lib/schemas.ts` (Zod): ClientProfile, Lead, GeneratedSystem.

## Pipeline (build in this order)
1. Ingestion: raw client data (data/roofing-client.md) -> ClientProfile.
2. Generation: ClientProfile -> GeneratedSystem, as 3 chained steps
   (qualification strategy, then email flow, then routing logic).
3. Simulation + critic loop: run test leads through the system, grade it,
   propose improvements, human approves.
4. Harness UI: show context, generated flow, eval results, approvals.

## Rules
- Each agent stage is its OWN short API route, streamed to the UI.
  Never one long-running call (Vercel free tier caps function duration ~60s).
- Validate every LLM JSON response against the Zod schemas before using it.
- Build and verify each stage in the terminal before building any UI for it.
- API keys live in env vars only, never committed.
