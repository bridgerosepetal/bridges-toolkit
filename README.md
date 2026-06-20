# Bridge's Toolkit

<img width="413" height="427" alt="bridges-toolkit-logo 1" src="https://github.com/user-attachments/assets/61fad6b7-c4c8-4974-ad8a-601e66e0cdf4" />


Bridges Toolkit is a Figma Desktop development plugin for reviewing typography and extracting text from selected frames.

## Features

- **Text Audit**: inspect selected text layers, compare typography-related CSS properties, filter textlets, and review similar text variants.
- **Frame Text**: extract copy from selected frames and nested frames, preview it in the plugin, and copy the result as JSON.

## Requirements

- Node.js 22 or newer
- Figma Desktop
- pnpm 10 or newer

## Setup

Install dependencies:

```bash
pnpm install
```

Build the plugin:

```bash
pnpm build
```

The build creates `manifest.json` and bundled plugin files in `build/`.

## Use With Figma

This plugin is intended for Figma Desktop development use only.

1. Run `pnpm build`.
2. Open Figma Desktop.
3. Import this repository's `manifest.json` as a development plugin.
4. In the canvas, right-click and choose **Plugins -> Development -> Bridges Toolkit -> Run**.

## Development

- `pnpm build`: type-check and build the plugin into `build/`
- `pnpm watch`: rebuild on changes while developing
- `pnpm check`: run the Create Figma Plugin type check
- `pnpm tailwind:build`: regenerate Tailwind output CSS
- `pnpm tailwind:watch`: regenerate Tailwind output CSS on changes

The plugin source lives under `src/`:

- `src/app/`: plugin entrypoints, UI shell, page registry, and Figma main-thread wiring
- `src/pages/`: page-level UI and controllers
- `src/features/`: feature logic for text audit and selection/frame inspection
- `src/shared/`: shared UI components, config, helpers, and API glue

## Publishing Notes

Generated files are intentionally not committed:

- `build/`
- `manifest.json`
- `node_modules/`

Before sharing a release, run `pnpm build` from a clean checkout and use the generated `manifest.json` in Figma Desktop.

## License

MIT (c) 2026 Nikolay Kulikov
