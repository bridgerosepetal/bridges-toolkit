# Pages Guide

This project now uses a page registry pattern so page ids/names/listing are not
duplicated across random files.

## Page Folder Shape (UI)

Each page should live in a kebab-case folder:

- `Page.tsx`
- `PageController.ts`
- `page.config.ts`
- optional `page.css`

Example:

- `src/pages/my-page/ui/Page.tsx`
- `src/pages/my-page/ui/PageController.ts`
- `src/pages/my-page/ui/page.config.ts`

## Single Source Of Truth Per Page

`page.config.ts` is the page identity source:

- `id`
- `name`
- `isListed`

Those values are reused to build:

- `PageId` (`page-id.ts`)
- tab metadata (`page-meta.ts`)
- UI registry wiring
- plugin bridge registry wiring

## Required Exports (Convention)

### `Page.tsx`

- export the page component
- keep it presentational (props in, JSX out)
- may export `PAGE_NAME`, but it should read from `PAGE_CONFIG.name`

### `PageController.ts`

- page-local UI state + actions + UI bridge calls
- export a standard alias: `createPageController`
- you can keep a more specific function name too (optional)

### `src/app/plugin/pages/<page>/PageBridge.ts`

- plugin-side Figma integration for that page
- export a standard alias: `createPageBridge`
- even empty pages should have a bridge (`createEmptyPageBridge()`)

## What To Update When Adding A Page

You do not need to hardcode ids in `run-screen.ts` or `RunScreenView.tsx` anymore.

You still need to register the page module in the registries:

1. `src/app/pages/page-config-registry.ts`
- add your `PAGE_CONFIG`

2. `src/app/pages/page-ui-registry.tsx`
- add a runtime factory for the page
- this is where page component + controller are connected

3. `src/app/plugin/pages/page-bridge-registry.ts`
- add `{ id: PAGE_CONFIG.id, createPageBridge }`

4. `src/app/UiEntry.ts` (only if page has CSS)
- import your page CSS

## Why This Is Better

- ids/names/listing live in one place per page
- registries use standard export names (`createPageController`, `createPageBridge`)
- shell (`RunScreenView`) is page-agnostic
- `run-screen.ts` no longer hardcodes a page switch/controller map

## When You Need UI <-> Plugin Messages

If a page needs data from the Figma main thread:

1. Update `src/shared/contracts/messages.ts`
- add request/response message types
- update `isUiToMainMessage(...)`

2. Update `src/app/ui/ui-bridge.ts`
- add a request helper
- update incoming message guard (`isMainToUiMessage`)

3. Implement plugin page bridge logic
- read Figma state
- post typed message back to UI

4. Handle the message in that page controller
- update page state
- call `render()`

## Styling

If your page has page-specific CSS:

1. Create `page.css` in the page folder
2. Import it in `src/app/UiEntry.ts`

## Recommended Split

- `Page.tsx`: UI rendering only
- `PageController.ts`: UI state/actions
- `PageBridge.ts`: Figma/plugin-side behavior
- `page.config.ts`: identity (`id`, `name`, `isListed`)
- `features/*/model/*`: pure extraction/transform logic
