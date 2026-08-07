# Cardcraft

Cardcraft V10 business-card studio with a Gemini-powered design copilot, deployed as one Cloudflare Worker.

## Runtime

- `/` — Cardcraft V10 app
- `/api/ai/status` — AI status (`demo` without a key, `live` with `GEMINI_API_KEY`)
- `/api/ai/design` — Gemini design generation endpoint
- `/health` — Worker health check

## Cloudflare

Deploy from the repository root with `npx wrangler deploy`.

Required runtime secret for live AI:

- `GEMINI_API_KEY`

Do not commit the actual API key to this repository.
