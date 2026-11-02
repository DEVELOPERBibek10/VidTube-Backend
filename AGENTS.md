## Guardrails

- New dependency? Flag name + reason first, don't add silently.
- Deviating from an existing pattern above (new response shape, skipping asyncHandler/validation/verifyJWT)? Flag it, don't just do it.
- No destructive ops (drop collection, force-push, delete files outside task scope) without explicit confirmation.
- Never hardcode secrets/tokens/credentials — use existing env config only.
- Minimal diffs: touch only what the task requires, no drive-by refactors.

## Commands

- `npm run dev` — watch mode (tsx watch src/index.ts)
- `npm run dev:worker` — watch mode for the background worker (tsx watch src/worker.ts)
- `npm run clean` — remove compiled `dist/`
- `npm run build` — clean dist/, compile TS
- `npm start` — run compiled dist/index.js
- `npm run start:worker` — run the compiled background worker
- `npm run lint` — check the linting of the codebase
- `npm run lint:fix` — auto-fix (partial, doesn't cover semantic rules)
- `npm run format` — apply Prettier formatting
- No test scripts configured yet (`npm test` is undefined).

## High-level architecture

- `src/index.ts`: starts the API server only after MongoDB and both cache and queue Redis clients connect; handles graceful shutdown for HTTP, MongoDB, Redis, and the cleanup queue.
- `src/worker.ts`: starts the background worker only after MongoDB and the queue Redis client connect; recovers pending video deletions and schedules stale deletions on startup.
- `src/app.ts`: CORS, JSON/urlencoded body limits, static files, cookies, versioned routers, then global error middleware last.
- Cookies: access and refresh tokens are `httpOnly`, `secure`, and `sameSite: "none"` with separate expiration times (`src/constants/cookieOption.ts`).
- Flow: routes (`src/routes/*`, chains verifyJWT/validation/upload) → controllers (`src/controllers/*`, req/res only) → services (`src/services/*`, business logic: auth, search, likes, comments, users, videos, playlists, subscriptions, watch history) → models (`src/models/*`, Mongo schemas/indexes).
- MongoDB/Mongoose = source of truth. Redis caches video details (`video:<videoId>`, 6-hour TTL) and paginated video-search IDs (`search:<userId>:<hash>`, 10-minute TTL). Cloudinary = media storage; Multer writes temp files to `public/temp` before upload.
- Routes: `/api/v1/user`, `/api/v1/video`, `/api/v1/like`, `/api/v1/comment`, `/api/v1/watch-history`, and `/api/v1/health`.
- BullMQ (queue Redis client) — 2 queues in `src/queues/*.queue.ts`: video cleanup and user interaction cleanup. Only the video cleanup queue currently has a worker (`src/workers/cleanUp.worker.ts`); the interaction cleanup queue has no worker yet.
- Video deletion runs asynchronously through BullMQ: the worker marks deletion status, removes Cloudinary media and dependent documents in batches, then deletes the video; failed jobs can mark the video as failed.
- Search: Atlas `$search` for user/title autocomplete and user search; `$vectorSearch` on `title_embedding` for semantic video retrieval (embeddings via `src/utils/vectorEmbedding.ts`).

## Conventions

- Higher preferece for conventional function syntax over arrow functions (e.g., `function foo() {}` vs `const foo = () => {}`) for better stack traces.
- File structure: `src/{configs,constants,db,routes,controllers,services,models,middlewares,utils,types,validators,queues,workers}`.
- ESM: local imports use `.js` specifiers (NodeNext).
- Async middleware/controllers wrapped in `asyncHandler` (`src/utils/asyncHandler.ts`) — no try/catch inside, and none needed in awaited calls beneath it either (except cleanup, error-enrichment, or an intentional fallback); un-awaited calls and cron/queue code aren't covered and need explicit handling.
- Responses: success → `ApiResponse`; failure → throw `ApiError`. Global error middleware (`src/middlewares/error.middleware.ts`) + transformers (`src/utils/errorTransformers.ts`) normalize Zod/Multer/MongoDB/parse errors.
- Types: `src/types/Error/*` (ApiError, GlobalError), `Model/*`, `Services/*` (return/param types), `request.ts` (AuthTypedRequest, TypedRequestBody/Query/Params).
- Zod schemas: `{ body?, params?, query?, file? }`; `validation(schema)`
  (`src/middlewares/validation.middleware.ts`) supplies empty objects for missing body, params, and query sections and assigns parsed sections back to the request.
- Auth: `verifyJWT` on protected routes; JWT from `accessToken` cookie or `Authorization: Bearer`; user on `req.user` (typed `AuthTypedRequest`).
- Workers batch-remove dependent docs before destructive deletes.
