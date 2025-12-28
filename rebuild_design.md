# Rebuild Design: GitHub Pages Deployment & Security Refactor

## Objective
To deploy the "Gemini Deep Research Loop" application to GitHub Pages while ensuring the security of the Gemini API Key. The current architecture relies on environment variables injected at build time, which would expose the key in a public deployment. The new architecture will adopt a "Bring Your Own Key" (BYOK) model.

## key Changes

### 1. Security & Architecture
-   **Current**: API Key read from `process.env.GEMINI_API_KEY`.
-   **New**: API Key input by the user via the UI. The key will be held in the application state (and optionally `localStorage` for convenience) and passed dynamically to the service layer.

### 2. Service Layer Refactoring (`services/geminiService.ts`)
-   **Remove**: Global initialization of `GoogleGenAI` client.
-   **Update**: `performDeepResearch` and `findNextInquiry` will accept `apiKey` as an argument.
-   **Logic**: Instantiate `GoogleGenAI` inside the function scope or via a helper using the provided key.

### 3. UI/UX Updates
-   **New Component**: `ApiKeyInput` (or integrated into `InputForm`).
    -   A field to enter the Gemini API Key.
    -   Password type input to mask characters.
    -   "Save" or "Use" button.
-   **`App.tsx`**:
    -   Lift state: `apiKey` state variable.
    -   Conditional rendering: Show API Key input if no key is set. Show Research Form if key is present.
    -   Pass `apiKey` to `handleStartResearch` and subsequently to the service functions.

### 4. Build & Deployment Configuration
-   **`vite.config.ts`**:
    -   Update `base` property. We will use `base: './'` to support relative paths, ensuring the app works on any subdirectory (like `/LOOP_APP/` or `/repo-name/`).
-   **`package.json`**:
    -   Add `gh-pages` as a `devDependency`.
    -   Add `predeploy` (build) and `deploy` (gh-pages) scripts.

## Implementation Steps
1.  **Refactor Service**: Update `geminiService.ts` to remove hardcoded env vars.
2.  **Create UI**: Implement the API Key input mechanism in `App.tsx`.
3.  **Config**: Update `vite.config.ts` for relative base paths.
4.  **Dependencies**: Install `gh-pages`.
5.  **Verify**: Run local dev server to test the BYOK flow.
6.  **Deploy**: Execute deployment scripts.
