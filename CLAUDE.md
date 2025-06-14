# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

text-to-svg is a TypeScript library that converts text to SVG paths without native dependencies. It uses opentype.js to parse font files and generate SVG markup. The project supports both Node.js and browser environments.

## Build System & Development Commands

- **Build**: `npm run build` - Uses Vite to create dual ESM/CJS builds and TypeScript declarations
- **Test**: `npm test` (runs all tests), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage)
- **Clean**: `npm run clean` - Removes build artifacts
- **Development**: `npm run dev` - Builds in watch mode
- **Lint**: `npm run lint` - Currently a placeholder, no actual linting configured

The build process creates both ES modules (`build/index.mjs`) and CommonJS (`build/index.js`) outputs with TypeScript declarations.

## Core Architecture

### Main Class: TextToSVG (src/index.ts)
The primary class handles font loading and text-to-SVG conversion with these key methods:
- `loadSync(file?)` - Synchronous font loading (Node.js only)
- `load(url)` - Asynchronous font loading (browser/Node.js)
- `getD(text, options)` - Returns SVG path data
- `getPath(text, options)` - Returns SVG `<path>` element
- `getSVG(text, options)` - Returns complete SVG markup
- `getMetrics(text, options)` - Returns text dimensions and positioning

**Options support**: All methods accept comprehensive options including `fontSize`, `anchor`, `x/y` positioning, `kerning`, `letterSpacing`, `tracking`, `attributes`, `envelope` transforms, `lineHeight`, and `textAlign` for multiline text.

### Envelope Transform (src/envelope-transform.ts)
New feature for advanced text transformations:
- **Arc transformations**: Bend text along circular arcs with configurable angle and radius
- **Perspective transformations**: Apply 3D perspective effects to text
- **Trapezoid transformations**: Create trapezoidal text effects for depth illusion
- Integration with main TextToSVG class via `envelope` option parameter

### Font Handling
- Default font: SourceHanSerifJP-Light.otf (Japanese serif font)
- Font files stored in `/fonts` directory
- Uses opentype.js for font parsing and glyph path generation

### Build Configuration
- **Vite**: Primary build tool (vite.config.ts) with library mode
- **TypeScript**: Strict mode enabled, outputs ES2020 with ESNext modules
- **External deps**: opentype.js, fs, path are externalized in builds

### CLI Tool (bin/text-to-svg)
Command-line interface supporting options for position (-x, -y), font size (-s), font file (-f), color (-c), kerning (-k), anchor (-a), and debug mode (-d).

## Testing

Uses Vitest with:
- Test files: `test/*.test.ts` (main: `index.test.ts`, envelope: `envelope-transform.test.ts`, multiline: `multiline.test.ts`)
- Test environment: Node.js
- Browser testing: `test/browser.html` for manual browser validation
- Font creation utilities: `test/create-test-font.js`
- Single test: `npm test -- <test-file-pattern>` (e.g., `npm test -- envelope`)

## Key Dependencies

- **opentype.js**: Core font parsing and glyph extraction
- **svg-pathdata**: SVG path manipulation for envelope transforms
- **svgpath**: Additional SVG path utilities
- **commander**: CLI argument parsing
- **typescript**: Type checking and compilation
- **vite**: Build system and bundling (replaced Gulp/Babel)
- **vitest**: Testing framework