<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vi0XzZRfzsVru7yoaTb7fpKYfFV3I1dq

## Run Locally

**Prerequisites:** Node.js 18+, Gemini API key

1. Install dependencies:  
   `npm install`
2. Create a `.env` file in the project root:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   PORT=4000
   ```
3. Start the backend (serves Gemini requests on port 4000):  
   `npm run server`
4. In a separate terminal, launch the Vite dev server (proxies `/api` to the backend):  
   `npm run dev`

When deploying, host the backend API behind `/api` and set `VITE_API_BASE_URL` for the frontend if the services run on different origins.

## Develop & Test

- Run the Vitest suite (HTTP client mocks, regression guard):  
  `npm run test`
- Collect coverage across the service layer:  
  `npm run test:coverage`

## Production Deployment

1. Deploy `server/index.js` (or an equivalent serverless handler) behind HTTPS and provide `GEMINI_API_KEY` as an environment secret; adjust `PORT` only if your host requires it.  
2. Build the frontend with `npm run build` and serve the `dist/` output from your platform of choice.  
3. If the frontend and backend live on different hosts, expose the backend under `/api` via a reverse proxy or set `VITE_API_BASE_URL=https://your-api.example.com` before running `npm run build`.  
4. Keep rate limits and monitoring on the backend—Gemini failures are forwarded to the UI, so surface logs/alerts server-side for quicker diagnosing.
