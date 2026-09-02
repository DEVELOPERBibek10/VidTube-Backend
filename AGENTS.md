## Guardrails

- New dependency? Flag name + reason first, don't add silently.
- Deviating from an existing pattern above (new response shape, skipping asyncHandler/validation/verifyJWT)? Flag it, don't just do it.
- No destructive ops (drop collection, force-push, delete files outside task scope) without explicit confirmation.
- Never hardcode secrets/tokens/credentials — use existing env config only.
- Minimal diffs: touch only what the task requires, no drive-by refactors.

## Commands

- `npm run dev` — watch mode (tsx watch src/index.ts)
- `npm run build` — clean dist/, compile TS
- `npm start` — run compiled dist/index.js
- `touch` — create empty file
- No test or lint scripts configured yet (npm test / npm run lint undefined)

## High-level architecture

- `src/index.ts`: starts server only after MongoDB (connectDB) AND Redis (connectRedis) connect.
- `src/app.ts`: CORS, body limits, cookies, static files, versioned routers, then global error middleware last.
- Flow: routes (`src/routes/*`, chains verifyJWT/validation/upload) → controllers (`src/controllers/*`, req/res only) → services (`src/services/*`, business logic: auth, caching, searching, likes, comment, user, video, Watch history, etc.) → models (`src/models/*`, Mongo schemas/indexes).
- MongoDB/Mongoose = source of truth. Redis caches aggregates (`video:search:*`, `user:profile:*`) + paginated search state for user search (`search:<username>:<hash>`) and (`search:<title>:<hash>`) for video search. Cloudinary = media storage; Multer writes temp files to `public/temp` pre-upload.
- Search: Atlas `$search` for autocomplete; `$vectorSearch` on `title_embedding` for semantic retrieval for video search (embeddings via `src/utils/vectorEmbedding.ts`).

## Conventions

- Higher preferece for conventional function syntax over arrow functions (e.g., `function foo() {}` vs `const foo = () => {}`) for better stack traces.
- File structure: `src/{config,constants,db,routes,controllers,services,models,middleware,utils,types,validator}`.
- ESM: local imports use `.js` specifiers (NodeNext).
- Async handlers wrapped in `asyncHandler` (`src/utils/asyncHandler.ts`), no inline try/catch.
- Responses: success → `ApiResponse`; failure → throw `ApiError`. Global error middleware (`src/middleware/error.middleware.ts`) + transformers (`src/utils/errorTransformers.ts`) normalize Zod/Multer/MongoDB/parse errors.
- Types: `src/types/Error/*` (ApiError, GlobalError), `Model/*`, `Services/*` (return/param types), `request.ts` (AuthTypedRequest, TypedRequestBody/Query/Params).
- Zod schemas: `{ body?, params?, query? }`; `validation(schema)` middleware (`src/middleware/validation.middleware.ts`) parses + overwrites req.body/params/query before controllers run.
- Auth: `verifyJWT` on protected routes; JWT from `accessToken` cookie or `Authorization: Bearer`; user on `req.user` (typed `AuthTypedRequest`).
- Cookies: `httpOnly`, `secure`, `sameSite: "none"` (`src/constants/cookieOption.ts`).
- Routes: `/api/v1/user`, `/api/v1/video`, `/api/v1/health`.
