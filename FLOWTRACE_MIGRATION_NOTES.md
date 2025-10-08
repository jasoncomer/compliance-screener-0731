# FlowTrace Migration Notes

This file documents progress, decisions, and pending tasks while porting the *FlowTrace* feature from the **jason-flowtrace** (Next.js) codebase into this **App** (Vite + React) project.

---

## Summary
* Migration started: <!-- YYYY-MM-DD -->
* Source repo: `jc_flowtrace_0812/jason-flowtrace/flowtrace`
* Target location: `App/src/features/flowtrace`

## Completed
- ✅ Initial parity audit between old and new codebases.
- ✅ TODO list created (see `.cursor-todos.json`) tracking each migration step.

## In-Progress
- 🔄 Port plan creation (task **create-port-plan**).

## Next High-Priority Tasks
1. **UI primitives**
   - Copy missing Shad-cn components (`avatar`, `badge`, `dialog`, `dropdown-menu`, etc.) from source to `src/components/ui/`.
2. **EntityPanel & dependencies**
   - Bring over `entity-panel.tsx`, strip Next-specific code, fix imports.
3. **Dialogs & workspace helpers**
   - `connection-edit-dialog.tsx`, `node-expansion-dialog.tsx`, `workspace-manager.tsx`.

## Decisions & Notes
- Path alias `@/*` already mapped to `src/*` in `tsconfig.json`; adjust imported paths accordingly.
- Replace all `next/image` and `next/link` with standard `<img>` and React-Router `<Link>` (or plain `<a>` for now).
- All ported components should include `"use client"` at top to ensure they behave as client components under Vite.
- API calls will use existing `flowtraceService` in `src/services` rather than Next.js API routes.

## Gotchas / Open Questions
- Do we need full GitHub Gist workspace saving, or is localStorage sufficient?
- Old code references `/api/sot` endpoints that were Next API routes; decide where those live in the new stack.

## Crash Recovery Tips
If the dev server or IDE crashes, check:
1. This **FLOWTRACE_MIGRATION_NOTES.md** file for latest completed steps.
2. TODO list in `.cursor-todos.json` for granular task status.
3. Git `stash list` for any unsaved WIP changes.

---

> Keep this file updated after each significant change so work can resume smoothly after interruptions.