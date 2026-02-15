<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Fofq-4X2zl0UdBf6o-vc8Bpj-7UnVZeA

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloud Run

This project is a static Vite app and Cloud Run expects the container to listen on `0.0.0.0:$PORT` (usually `8080`).

- `npm start` is configured to run `vite preview --host 0.0.0.0 --port $PORT`.
- `npm run gcp-build` is configured so Google buildpacks build the app before startup.

If deployment logs show errors like `STARTUP TCP probe failed` and `container ... on port 8080`, verify:

1. The service actually starts with `npm start`.
2. The revision receives traffic only after startup passes.
3. If you see `gcsfuse` / `UNAUTHENTICATED` in logs, grant the Cloud Run runtime service account bucket access (for example, `Storage Object Viewer`) to any mounted bucket used by your deployment pipeline.
