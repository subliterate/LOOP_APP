# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx` coordinates the research loop workflow, state, and page layout.  
- Reusable React components live in `components/` (`InputForm`, `LoadingIndicator`, `ResultsDisplay`, `ResearchStepCard`, `DownloadButtons`, `icons`). Keep UI variations here to support composition.  
- Backend logic lives in `server/index.js`; it proxies all Gemini requests and keeps the API key on the server.  
- Client-side fetch helpers sit in `services/geminiService.ts`; treat this module as the single integration point for HTTP calls.  
- Shared TypeScript contracts are defined in `types.ts`; extend these interfaces before adding ad-hoc fields elsewhere.  
- `index.tsx` bootstraps the React 19 root, while `vite.config.ts` exposes the `@/` path alias and proxies `/api` to the backend during development.

## Build, Test, and Development Commands
- `npm install`: install runtime and build dependencies (requires Node 18+).  
- `npm run server`: start the Express API proxy on `http://localhost:4000`.  
- `npm run dev`: start the Vite dev server on `http://localhost:3000` with hot reload (proxies `/api`).  
- `npm run build`: generate an optimized production bundle in `dist/`.  
- `npm run preview`: serve the built bundle locally for smoke testing.  
- `npm run test`: execute the Vitest suite covering `services/geminiService`.  
- `npm run test:coverage`: produce text + HTML coverage reports (stored in `coverage/`).  
- Create a root `.env` with `GEMINI_API_KEY=<token>` (and optional `PORT`) for the backend; never commit secrets. Use `VITE_API_BASE_URL` if the frontend must call a remote API origin.

## Coding Style & Naming Conventions
- TypeScript + React function components with hooks are standard; avoid class components.  
- Follow existing two-space indentation, trailing commas where possible, and organize imports as std lib → third-party → local (`@/` alias or relative).  
- Components and TypeScript types use `PascalCase`; helper functions, hooks, and locals use `camelCase`; constants are `UPPER_SNAKE_CASE`.  
- Leverage utility-first class strings (Tailwind-style) for styling and keep SVG icons in `components/icons.tsx`.  
- Centralize API key checks and error handling in service modules rather than in UI layers.

## Testing Guidelines
- The project ships without automated tests; when adding coverage, prefer Vitest with React Testing Library and colocate specs under `components/__tests__/` or alongside files as `*.test.tsx`.  
- Mock Gemini responses via dependency inversion around `performDeepResearch`/`findNextInquiry`.  
- Aim for smoke coverage of the research loop (input validation, loading state, download buttons) before merging significant UI or service changes.

## Commit & Pull Request Guidelines
- Write commits in the imperative mood (`feat: add loop progress indicator`) and scope them narrowly enough for easy rollback.  
- For pull requests, include: purpose summary, testing notes (`npm run server`, `npm run dev`, manual scenarios), screenshots for UI impact, and any follow-up tasks.  
- Link to tracking issues when available and call out API or environment changes so reviewers can update their `.env` / deployment secrets.
