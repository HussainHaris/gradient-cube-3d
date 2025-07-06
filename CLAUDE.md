# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Three.js application featuring an interactive 3D cube with customizable gradient colors and rotation controls. Built with Vite, React 19, TypeScript, and React Three Fiber.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture

The application follows a simple React component structure:

- **Entry Point**: `src/main.tsx` - Mounts the React app
- **Main Component**: `src/App.tsx` - Contains the 3D scene and UI controls
  - Uses React Three Fiber (`@react-three/fiber`) for 3D rendering
  - Custom GLSL shaders for gradient material
  - Interactive controls for rotation and color customization

### Key Dependencies

- **three** & **@react-three/fiber**: 3D graphics library and React renderer
- **@react-three/drei**: Helper components for React Three Fiber
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

### Shader Implementation

The cube uses custom vertex and fragment shaders to create a gradient effect:
- Gradient is calculated based on normalized position
- Three colors (A, B, C) are blended to create the visual effect
- Shader code is embedded in `src/App.tsx`

## TypeScript Configuration

Two separate TypeScript configurations:
- `tsconfig.app.json`: For application code
- `tsconfig.node.json`: For build tools and config files

## Linting

ESLint is configured with:
- TypeScript support
- React hooks rules
- React refresh plugin for HMR

No automatic formatting tool is configured.