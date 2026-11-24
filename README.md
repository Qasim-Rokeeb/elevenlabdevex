# Text to speech

This repository is a small Next.js application that turns text into speech through an ElevenLabs text-to-speech request. It is an independent educational example for developers who want a practical reference for wiring a browser UI to a server-side ElevenLabs integration. A developer can run it locally, add ElevenLabs credentials, and generate playable audio from text.

## Preview

- Demo video: `TODO` — add your YouTube URL here (for example: `[Watch the demo](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)`).
- Live demo: [https://elevenlabdevex.vercel.app/](https://elevenlabdevex.vercel.app/)

## What you'll learn

- How to keep an ElevenLabs API key on the server in a Next.js Route Handler instead of exposing it in browser code.
- How to send text and playback settings from a client UI to an internal API endpoint.
- How to call the ElevenLabs Text to Speech HTTP endpoint with `fetch` and request `audio/mpeg`.
- How to convert returned audio bytes into a browser-playable `Blob` URL and manage playback state.
- How to surface basic configuration and provider errors back to the UI.

## Features and scope

**Implemented**

- Text input with an empty-state disabled Speak button.
- Speed control with three options: `0.75×`, `1×`, and `1.5×`.
- Server-side ElevenLabs request in `src/app/api/speak/route.ts`.
- Audio response returned as `audio/mpeg` and played in the browser with `Audio` and `URL.createObjectURL`.
- Speaking state with stop/playback cleanup, loading state, and inline error display.
- Light/dark theme toggle stored in `localStorage`.

**Not implemented / out of scope**

- Authentication, rate limiting, or abuse protection on `/api/speak`.
- Text length limits beyond what the provider accepts.
- Voice listing/selection from the ElevenLabs account (the UI shows a static “Default voice” label; the actual voice ID comes from environment configuration).
- Streaming audio playback, audio file download, or transcript history.
- Automated tests.

## Quickstart

### Prerequisites

- **Node.js 20+** recommended. This project uses Next.js `16.4.6` and TypeScript; no `engines` field is defined in `package.json`.
- **npm**. The repository includes `package-lock.json`.
- **ElevenLabs account and API key** with access to Text to Speech. You also need a voice ID that works with your account/tier for API use.

### 1. Clone and install

```bash
git clone https://github.com/Qasim-Rokeeb/elevenlabdevex.git
cd elevenlabdevex
npm install
```

### 2. Configure the integration

Create or update the project-root `.env` file. A safe template is already provided in `.env.example`.

```env
# ElevenLabs credentials
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

- `ELEVENLABS_API_KEY`: create or copy an API key from your ElevenLabs account. Keep it server-side only.
- `ELEVENLABS_VOICE_ID`: the ElevenLabs voice ID used by the server route. The current implementation passes this ID to `POST /v1/text-to-speech/{voice_id}`.

Official ElevenLabs references:

- [ElevenLabs API authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Create speech (Text to Speech)](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [Voices overview](https://elevenlabs.io/docs/api-reference/voices/search)

> Note: During verification, a free-tier API key could not list voices because it lacked `voices_read` permission, and a copied library voice returned `402 payment_required` with “Free users cannot use library voices via the API.” If you are on a free tier, use a premade/default voice ID that your account can access via API.

### 3. Run locally

```bash
npm run dev
```

Open the URL printed by Next.js (usually `http://localhost:3000`). If port `3000` is already in use, Next.js may start on a different port.

### 4. Confirm your first successful result

1. Start the app with `npm run dev`.
2. Enter a short sentence such as `Hello from Calm studio.` in the text area.
3. Leave speed at `1×` (or choose another speed).
4. Click **Speak**.
5. Expected result: the button changes to a loading/generating state, then the app plays generated audio in the browser and shows the speaking/stop state until playback ends or you click **Stop**.

If credentials are missing or invalid, the app shows an inline error message below the text area.

## Configuration

| Variable | Required? | Purpose | Safe example |
| --- | --- | --- | --- |
| `ELEVENLABS_API_KEY` | Yes | Server-side ElevenLabs API key used in the `xi-api-key` request header. | `your_elevenlabs_api_key_here` |
| `ELEVENLABS_VOICE_ID` | Yes | ElevenLabs voice ID inserted into the Text to Speech endpoint path. | `your_voice_id_here` |

**Configuration notes**

- Both variables are **secret/server-side configuration** in practice for this app; they are read only in `src/app/api/speak/route.ts` via `process.env`.
- There are no `NEXT_PUBLIC_*` environment variables in this repository.
- The app has no optional environment variables. Model and voice settings are hardcoded in code (see “How it works”).

## How it works

1. The user enters text and selects a speed in `src/app/page.tsx`.
2. The client sends `POST /api/speak` with JSON `{ text, speed }`.
3. `src/app/api/speak/route.ts` validates that `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are present and not placeholder values, and that `text` is non-empty.
4. The route calls ElevenLabs with `fetch`:

   ```ts
   // src/app/api/speak/route.ts
   const response = await fetch(
     `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
     {
       method: "POST",
       headers: {
         "xi-api-key": apiKey,
         "Content-Type": "application/json",
         Accept: "audio/mpeg",
       },
       body: JSON.stringify({
         text,
         model_id: "eleven_multilingual_v2",
         voice_settings: {
           stability: 0.5,
           similarity_boost: 0.75,
           style: 0,
           use_speaker_boost: true,
           speed,
         },
       }),
     }
   );
   ```

5. If ElevenLabs returns an error, the route attempts to read `detail.message`, `detail.status`, or `message` and returns it as JSON with the provider status code.
6. On success, the route returns raw audio bytes with `Content-Type: audio/mpeg`. The client converts the response to a `Blob`, creates an object URL, and plays it through the browser `Audio` API.

```text
User input + speed
  → POST /api/speak (Next.js Route Handler)
  → ElevenLabs POST /v1/text-to-speech/{voice_id}
  → audio/mpeg response
  → Blob/Object URL in browser
  → Audio playback / Stop
```

## Project structure

```text
.
├── .env.example                  # Safe environment variable template
├── package.json                  # Scripts and dependencies
├── package-lock.json             # npm lockfile
├── next.config.ts                # Next.js configuration
├── public/                       # Default static assets from scaffold
├── src/
│   └── app/
│       ├── api/
│       │   └── speak/
│       │       └── route.ts      # Server-side ElevenLabs Text to Speech request
│       ├── globals.css           # Global styles and theme tokens
│       ├── layout.tsx            # Root layout and metadata
│       ├── page.module.css       # UI styles for the main page
│       └── page.tsx              # Client UI, state, fetch call, audio playback
├── eslint.config.mjs             # ESLint configuration
└── tsconfig.json                 # TypeScript configuration
```

## Troubleshooting

| Symptom | Likely cause | How to check or resolve |
| --- | --- | --- |
| `ElevenLabs credentials are missing. Add your API key and voice ID to .env.` | `ELEVENLABS_API_KEY` or `ELEVENLABS_VOICE_ID` is missing or still uses a placeholder value. | Check `.env` in the project root, confirm exact variable names, restart `npm run dev`, and try again. |
| `Text is required.` | The request reached `/api/speak` with empty text. | Enter non-empty text in the UI. The client trims whitespace before sending. |
| `Free users cannot use library voices via the API...` or `402 payment_required` | The selected voice is not usable on your ElevenLabs plan/tier via API. | Use a premade/default voice ID that your account can access through the API. This was observed during verification with a copied library voice. |
| `missing_permissions` / `voices_read` when listing voices | The API key does not have permission to list voices. | Update the key permissions in ElevenLabs, or select a known premade voice ID from the ElevenLabs dashboard. This was observed during verification. |
| `Unable to generate speech.` or provider-specific error message | ElevenLabs rejected the request, or the route could not parse a detailed provider error. | Check the inline UI error, inspect the server terminal/logs, confirm API key, voice ID, and account access. |
| `Unable to play the generated audio.` | The browser could not play the returned audio blob. | Confirm the request succeeded, try another browser, and check browser console/media playback restrictions. |
| `npm run lint` fails with `react-hooks/set-state-in-effect` in `src/app/page.tsx` | Existing lint error in the theme initialization effect. | This is a current repository issue, not a README setup step. See “Limitations and security”. |

## Developer-experience notes

### Observed

- `npm run build` completed successfully in this workspace after installing dependencies.
- `npm run lint` currently fails with one `react-hooks/set-state-in-effect` error in `src/app/page.tsx`.
- During verification, calling `GET /v1/voices` with the provided key returned `missing_permissions` for `voices_read`.
- During verification, a copied library voice ID returned `402 payment_required` with the message “Free users cannot use library voices via the API.” A known premade voice ID returned `200` and playable `audio/mpeg`.

### Clarified by this example

- The ElevenLabs API key stays on the server because the browser calls the internal `/api/speak` Route Handler, not ElevenLabs directly.
- The integration uses the ElevenLabs HTTP Text to Speech endpoint via `fetch`; it does not use the `elevenlabs` JavaScript/TypeScript SDK.
- The request lifecycle is explicit: input validation, provider call, audio bytes response, browser playback.

### Proposed next improvement

- **Add voice discovery for eligible keys**: if the API key has `voices_read`, expose a server-side endpoint that lists premade/available voices and populates the voice selector. This is a proposal, not an implemented feature.
- **Add basic request safeguards**: add input length validation and simple rate limiting before exposing the endpoint publicly.

## Limitations and security

- **Demo scope**: this is a local educational example, not a hardened production service.
- **No authentication or rate limiting**: `/api/speak` is callable by anyone who can reach the app. Do not expose an unprotected public deployment without adding access controls and abuse protection.
- **No server-side text length limit**: the route checks only for non-empty text. Provider limits, quota, or costs may still apply.
- **Credential handling**: keep `ELEVENLABS_API_KEY` in `.env` or deployment secrets; never place it in client code or commit real values. `.env` is ignored by `.gitignore`.
- **Third-party data flow**: text submitted in the UI is sent to ElevenLabs for speech generation. Review ElevenLabs’ terms and privacy documentation before using sensitive data.
- **Voice configuration**: the voice is fixed by `ELEVENLABS_VOICE_ID`. The UI control labeled “Default voice” does not currently change the server voice.
- **Current quality issue**: `npm run lint` reports a `react-hooks/set-state-in-effect` error in `src/app/page.tsx`.
- **License**: no `LICENSE` file is present in this repository.

## Deployment

Deployment has **not been verified** for this repository.

If you deploy a Next.js app like this, configure `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` as server-side environment variables in your hosting platform. Before any public deployment, add authentication/rate limiting and review provider usage/cost controls, because the current `/api/speak` route has no abuse protection.

## Resources

- [ElevenLabs API authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [ElevenLabs Text to Speech API reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [ElevenLabs Voices API reference](https://elevenlabs.io/docs/api-reference/voices/search)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Challenge context

- **Day**: Day 1 of 17.
- **Company/tool**: ElevenLabs Text to Speech API.
- **Developer task**: Build a simple Next.js text-to-speech UI that sends text to a server-side ElevenLabs integration and plays generated audio.
- **Artifact**: This repository, including the UI, `/api/speak` Route Handler, and environment configuration template.
- **Status**: Local demo implemented; build passes; lint has one existing error; end-to-end provider test requires valid ElevenLabs credentials.

## Author

Qasim Rokeeb

- GitHub: [https://github.com/Qasim-Rokeeb](https://github.com/Qasim-Rokeeb)
- LinkedIn: [https://linkedin.com/in/qasim-rokeeb](https://linkedin.com/in/qasim-rokeeb)
- Portfolio: [https://qasimrokeebdevrel.vercel.app/](https://qasimrokeebdevrel.vercel.app/)
