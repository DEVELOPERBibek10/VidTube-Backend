## Guardrails

- New dependency? Flag name + reason first, don't add silently.
- Deviating from an existing pattern above (new response shape, skipping asyncHandler/validation/verifyJWT)? Flag it, don't just do it.
- No destructive ops (drop collection, force-push, delete files outside task scope) without explicit confirmation.
- Never hardcode secrets/tokens/credentials — use existing env config only.
- Minimal diffs: touch only what the task requires, no drive-by refactors.

## Commands

- `npm run dev` — watch mode (tsx watch src/index.ts)
- `npm run clean` — remove compiled `dist/`
- `npm run build` — clean dist/, compile TS
- `npm start` — run compiled dist/index.js
- `npm run lint` — check the linting of the codebase
- `npm run lint:fix` — auto-fix (partial, doesn't cover semantic rules)
- `npm run format` — apply Prettier formatting
- `touch` — create empty file
- No test scripts configured yet (npm test undefined).

## High-level architecture

- `src/index.ts`: starts the server only after MongoDB and both cache and queue Redis clients connect.
- `src/app.ts`: CORS, body limits, cookies, static files, versioned routers, then global error middleware last.
- Flow: routes (`src/routes/*`, chains verifyJWT/validation/upload) → controllers (`src/controllers/*`, req/res only) → services (`src/services/*`, business logic: auth, search, likes, comments, users, videos, playlists, subscriptions, watch history) → models (`src/models/*`, Mongo schemas/indexes).
- MongoDB/Mongoose = source of truth. Redis caches video details (`video:<videoId>`) and paginated video-search IDs (`search:<userId>:<hash>`, 10-minute TTL). Cloudinary = media storage; Multer writes temp files to `public/temp` pre-upload.
- BullMQ uses the queue Redis client for video cleanup, user-interaction cleanup, retries, and a DLQ; the cleanup worker batches related-document removal before deleting the video.
- Search: Atlas `$search` for user/title autocomplete and user search; `$vectorSearch` on `title_embedding` for semantic video retrieval (embeddings via `src/utils/vectorEmbedding.ts`).

## Conventions

- Higher preferece for conventional function syntax over arrow functions (e.g., `function foo() {}` vs `const foo = () => {}`) for better stack traces.
- File structure: `src/{configs,constants,db,routes,controllers,services,models,middlewares,utils,types,validators,queues,workers}`.
- ESM: local imports use `.js` specifiers (NodeNext).
- Async middleware/controllers wrapped in `asyncHandler` (`src/utils/asyncHandler.ts`) — no try/catch inside, and none needed in awaited calls beneath it either (except cleanup, error-enrichment, or an intentional fallback); un-awaited calls and cron/queue code aren't covered and need explicit handling.
- Responses: success → `ApiResponse`; failure → throw `ApiError`. Global error middleware (`src/middlewares/error.middleware.ts`) + transformers (`src/utils/errorTransformers.ts`) normalize Zod/Multer/MongoDB/parse errors.
- Types: `src/types/Error/*` (ApiError, GlobalError), `Model/*`, `Services/*` (return/param types), `request.ts` (AuthTypedRequest, TypedRequestBody/Query/Params).
- Zod schemas: `{ body?, params?, query? }`; `validation(schema)` middleware (`src/middlewares/validation.middleware.ts`) parses + overwrites req.body/params/query before controllers run.
- Auth: `verifyJWT` on protected routes; JWT from `accessToken` cookie or `Authorization: Bearer`; user on `req.user` (typed `AuthTypedRequest`).
- Cookies: `httpOnly`, `secure`, `sameSite: "none"` (`src/constants/cookieOption.ts`).
- Routes: `/api/v1/user`, `/api/v1/video`, `/api/v1/health`.
