# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entrypoints, route groups, API routes, and metadata routes (`feed.xml`, `sitemap.xml`, OG images).
- `features/`: Domain logic split by feature (`post`, `search`, `todo`, `editor`) with `server/` and `components/` separation.
- `components/`: Shared UI and layout components (`components/ui`, `components/layout`).
- `lib/`: Shared infrastructure and utilities (`supabase`, `shared`, `server`, `seo`, `mdx`, `types`).
- `docs/`: Operational guides (security, observability, API errors, project tree).
- `public/`: Static assets.

## Build, Test, and Development Commands
- `npm run dev`: Start local development server.
- `npm run build`: Production build (webpack mode; default for stability in this repo).
- `npm run build:turbo`: Turbopack build (experimental/troubleshooting).
- `npm run start`: Run the production build locally.
- `npx tsc --noEmit`: Type-check the project.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`, `.tsx`), React function components.
- Indentation: 2 spaces; keep imports grouped and sorted logically.
- File naming:
  - Route handlers: `route.ts`
  - Pages/layout: `page.tsx`, `layout.tsx`
  - Feature server modules: `features/<domain>/server/*.ts`
- Prefer small, composable server functions in `features/*/server` over large route files.

## Testing Guidelines
- No formal automated test suite is configured yet.
- Minimum quality gate before PR:
  - `npx tsc --noEmit`
  - `npm run build`
- For behavior changes, include manual verification steps in PR description (e.g., login, search, todo CRUD).

## Commit & Pull Request Guidelines
- Use Conventional-style commits when possible (seen in history):  
  - `feat: ...`, `fix: ...`, `refactor: ...`
- Keep commits focused by feature or layer.
- PRs should include:
  - Clear summary and scope
  - Changed paths (e.g., `app/api/*`, `features/*/server`)
  - Verification evidence (commands run, screenshots for UI changes)
  - Linked issue/task if available

## Security & Configuration Tips
- Never commit secrets; use `.env.local` for local config.
- Keep `NEXT_PUBLIC_*` values client-safe only.
- Preserve request tracing and API envelope conventions (`x-request-id`, `{ ok, data|error }`) when adding routes.
- Keep `docs/project-tree.md` updated whenever repository structure or major module ownership changes.
