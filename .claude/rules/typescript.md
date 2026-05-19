# TypeScript conventions

## General

- Strict mode is on — no `any`, no `@ts-ignore` without a comment explaining why
- Prefer `type` over `interface` for object shapes; use `interface` only when declaration merging is needed
- No explicit return type annotations on functions unless the inferred type is wrong or the function is exported from a module boundary
- Use `satisfies` operator instead of casting when you want to validate a value against a type without widening it

## Imports

- Path alias `@/` maps to the project root — always use it for cross-directory imports, never use `../../../`
- Import order: external packages first, then `@/lib/...`, then `@/types`, then relative `./`
- Named imports only — no default imports from our own modules (default imports are fine for third-party packages that require them)
- Import Prisma types from `@/app/generated/prisma/client`, never from `@prisma/client`

## Null and undefined

- Prefer `undefined` over `null` in our own code; use `null` only where Prisma or external APIs require it
- Use optional chaining `?.` and nullish coalescing `??` rather than explicit null checks
- For Prisma nullable JSON fields being explicitly cleared, use `Prisma.JsonNull`

## Async

- All async functions should use `async/await` — no raw `.then()/.catch()` chains
- Never `await` inside a loop — use `Promise.all()` or `Promise.allSettled()` for concurrent operations
- API route handlers that talk to the DB or external services should always be `async`

## Error handling

- API routes: return `Response.json({ error: string }, { status: N })` — no thrown errors crossing route boundaries
- Library functions: throw typed errors or return discriminated unions `{ success: true, data } | { success: false, error }`
- Never swallow errors with empty catch blocks

## React / Next.js

- Server Components by default — add `"use client"` only when the component needs browser APIs, event handlers, or hooks
- No `useEffect` for data fetching — use Server Components or SWR
- Props types defined inline or as a `type` in the same file — no separate `*Props.ts` files

## Naming

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- Variables and functions: `camelCase`
- Types and interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE` only for true module-level constants, not local variables
- Prisma model instances: match the model name in camelCase (`lead`, `scrapeJob`, `demoSite`)

## Scripts

- CLI scripts in `scripts/` must be run with `tsx`, never `ts-node`
- Scripts that need env vars must import `dotenv/config` as the first line
- Top-level `await` is not supported in `tsx` CommonJS mode — wrap in an `async function main()` and call it

## API routes

- Params are `Promise<{...}>` — always `await params` before destructuring
- Use `Response.json()` for responses (not `NextResponse.json()`)
- Import `NextRequest` from `next/server` when you need `request.nextUrl` or cookies
