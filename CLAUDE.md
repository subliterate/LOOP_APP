# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gemini Deep Research Loop** is a full-stack TypeScript application that automates research using Google's Gemini API. It combines a Node.js backend (Express server) with a React frontend (Vite), plus a CLI tool for command-line research execution.

**Core Architecture:**
- **Backend (`server/index.js`)**: Express server that proxies requests to Gemini API with web search capabilities
- **Frontend (`App.tsx`, `components/`)**: React UI for interactive research loops
- **CLI (`cli.ts`)**: Command-line interface for research automation
- **Services (`services/`)**: Shared research logic between frontend/CLI and backend

## Build and Development Commands

### Common Tasks

```bash
# Development
npm run dev          # Start frontend dev server (port 3000, proxies /api to backend)
npm run server       # Start backend Express server (port 4000)
npm run build        # Production build for frontend
npm run build:cli    # Compile CLI TypeScript → JavaScript

# Testing (see TESTING.md for comprehensive guide)
npm run test         # Watch mode for all tests
npm run test:unit    # Unit tests only
npm run test:smoke   # Quick validation (15 bash checks)
npm run test:all     # Complete test suite
npm run test:coverage # Coverage report

# Deployment
npm run pkg          # Build standalone binaries (Linux/Windows)
```

### Before Committing

```bash
npm run test:unit && npm run test:smoke
```

### Full Pre-Release Validation

```bash
npm run test:all && npm run build:cli && npm run pkg
```

## Architecture and Key Concepts

### Service Layer Architecture

The research functionality is split across platform-agnostic and platform-specific services:

- **`services/geminiServiceCore.ts`**: Core business logic (platform-agnostic interface)
  - `createGeminiService()`: Factory function returning API-agnostic service
  - `DeepResearchResponse`: Type definition for API responses
  - `handleResponse()`: Response parsing logic

- **`services/geminiService.ts`**: Browser/frontend implementation
  - Uses `fetch()` to call backend `/api` endpoints
  - Works in Vite dev server with proxy to backend

- **`services/geminiService.node.ts`**: Node.js/CLI implementation
  - Direct HTTP requests using Node's built-in http module
  - Used by CLI for research execution

- **`server/index.js`**: Backend API server
  - `/api/research`: Accepts `{subject: string}` → returns `{summary, sources}`
  - `/api/next-inquiry`: Accepts `{summary: string}` → returns `{nextSubject}`
  - `/api/health`: Health check endpoint
  - Directly calls Gemini API with `googleSearch` tool enabled

### Data Flow

1. **Frontend/CLI** → calls `performDeepResearch(subject)` from service layer
2. **Service layer** → makes HTTP POST to `/api/research` on backend
3. **Backend** → calls Gemini API with web search enabled
4. **Response** → `{summary: string, sources: Source[]}`
5. **Frontend/CLI** → displays results or triggers next inquiry via `findNextInquiry(summary)`

### Core Types

Located in `types.ts`:
- `Source`: Web source with `{web: {uri: string, title: string}}`
- `ResearchStep`: Complete research result with id, subject, summary, sources, nextSubject

## Testing Strategy

**Test Pyramid:**
```
        /\
       /E2E\        ← Slow (requires API key)
      /------\
     /  Intg  \     ← Mock server integration
    /----------\
   /   Unit     \   ← Fast, isolated
  /--------------\
 /     Smoke      \ ← Fastest, critical paths
/------------------\
```

### Test Locations
- **Unit tests**: `services/__tests__/geminiService.test.ts`
- **CLI tests**: `__tests__/cli*.test.ts`
- **Mock server**: `__tests__/utils/mockServer.ts`
- **Smoke tests**: `scripts/smoke-test.sh`

### Vitest Configuration
- Located in `vitest.config.ts`
- Test timeout: 30 seconds (for integration tests)
- Coverage includes: `services/**/*.ts`, `cli.ts`
- Environment: Node.js

## CLI Build Pipeline

The CLI is compiled through a multi-step process:

1. **Compilation** (`tsconfig.cli.json`):
   - TypeScript → CommonJS (for Node.js)
   - Includes: `cli.ts`, `services/geminiServiceCore.ts`, `services/geminiService.node.ts`
   - Output: `cli-dist/`

2. **CLI Entry** (`cli.cjs`):
   - Runtime loader that requires the compiled CLI
   - Supports `pkg` binary packaging

3. **Binary Packaging** (optional):
   - `npm run pkg` creates standalone executables using `pkg` library
   - Targets: Linux/Windows node18

**Important**: CLI cannot use browser APIs; it uses Node.js `http` module and `services/geminiService.node.ts`.

## Environment Configuration

### Development (.env)
```
GEMINI_API_KEY=your_api_key
PORT=4000                          # Backend port
VITE_API_BASE_URL=http://localhost:4000  # Optional frontend API override
```

### Frontend-Backend Communication
- Dev: Vite proxy (`vite.config.ts`) routes `/api` → `http://localhost:4000`
- Production: Configure reverse proxy or set `VITE_API_BASE_URL` at build time

### Code Path Resolution
- Both `tsconfig.json` and `vite.config.ts` define `@` alias → project root
- Allows imports like `import { types } from '@/types'`

## Important Implementation Details

### Prompt Engineering
The backend uses two key prompts:
1. **Research Prompt** (`/api/research`): Comprehensive subject analysis with Google Search
2. **Next Inquiry Prompt** (`/api/next-inquiry`): Strategic planning for research continuation

Both enforce **plain text output** (no Markdown) for consistent parsing.

### Error Handling Strategy
- Backend: Catches Gemini errors, returns `{error: string}` with 502 status
- Frontend: Displays errors in red alert box, persists through UI
- CLI: Logs errors with step number context, exits gracefully

### Source Attribution
Grounding chunks from Gemini are parsed into `Source[]` objects. Each source includes the web URI and title for citation.

## Project Structure Reference

```
├── services/                    # Shared research logic
│   ├── geminiServiceCore.ts    # Platform-agnostic core
│   ├── geminiService.ts        # Browser implementation
│   ├── geminiService.node.ts   # Node.js CLI implementation
│   └── __tests__/
│
├── server/
│   └── index.js                # Express backend (research API)
│
├── components/                 # React components (frontend only)
│   ├── InputForm.tsx
│   ├── LoadingIndicator.tsx
│   └── ResultsDisplay.tsx
│
├── __tests__/                  # Test suites
│   ├── cli.test.ts            # Unit tests
│   ├── cli.integration.test.ts # Integration tests
│   ├── cli.e2e.test.ts        # E2E tests
│   └── utils/mockServer.ts    # Mock Express server
│
├── cli-dist/                  # Compiled CLI (generated)
├── dist/                      # Frontend build output (generated)
├── release/                   # Binary builds (generated)
│
├── App.tsx                    # React app entry
├── App.css                    # Styling (Tailwind)
├── types.ts                   # Shared TypeScript types
├── cli.ts                     # CLI entry point (compiled to CommonJS)
└── cli.cjs                    # CLI runtime loader
```

## Common Workflows

### Adding a New Service Feature
1. Add interface/type to `types.ts`
2. Implement in `services/geminiServiceCore.ts`
3. Add platform implementations in `geminiService.ts` and `geminiService.node.ts`
4. Test with unit tests in `services/__tests__/`
5. If CLI-exposed, add integration tests in `__tests__/cli.integration.test.ts`

### Running Single Test File
```bash
npm test -- cli.test.ts
npm test -- geminiService.test.ts
```

### Debugging CLI Issues
```bash
npm run build:cli
node cli-dist/cli.js "my prompt" --loops 2
```

### Local Full-Stack Testing
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev

# Terminal 3: CLI
npm run build:cli
node cli-dist/cli.js "test query" --loops 1
```

## Deployment Notes

### Frontend Deployment
- Build: `npm run build` → outputs `dist/`
- Static hosting compatible (HTML/CSS/JS)
- Must configure `VITE_API_BASE_URL` if backend is on different origin

### Backend Deployment
- `server/index.js` or equivalent serverless handler
- Requires `GEMINI_API_KEY` environment variable
- Listens on `PORT` (default 4000)

### CLI Binary Deployment
- `npm run pkg` creates `/release/loop-app` (Linux/Windows)
- Self-contained, includes all dependencies
- Requires `GEMINI_API_KEY` at runtime

## Version and Dependency Information

- **Node.js**: 18+ required
- **TypeScript**: ~5.8.2
- **React**: ^19.1.1
- **Express**: ^5.1.0
- **Vite**: ^6.2.0
- **Vitest**: ^4.0.3
- **Google GenAI SDK**: ^1.21.0

## Cursor Rules and Style

The project follows standard TypeScript conventions:
- ESNext module system (files use `import`/`export`)
- ES2022 target compilation
- CommonJS for CLI build (via tsconfig.cli.json)
- React with Tailwind CSS for frontend styling
- Plain node HTTP for CLI (no fetch needed)

See `TESTING.md` for comprehensive testing documentation and examples.
