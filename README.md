# Dozer — Phase 1

This workspace contains the Phase 1 scaffold for a mobile-first AI development environment.

What’s included:
- Next.js App Router scaffold
- Tailwind setup
- PWA manifest
- Supabase client stub
- Simple components: `ChatPanel`, `FileTree`, `Preview`
- Basic `evaluateTSX` runtime stub and `actionExecutor` stub

Next steps:
1. Run `npm install` in the project root.
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` for a real AI agent (without it, the app runs in mock mode).
3. Optionally set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. `npm run dev` to start the app. The **エージェント** tab shows connection status (green = AI connected).
