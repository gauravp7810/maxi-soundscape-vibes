# Music Player App

A stylish music player web app built with React, TypeScript, Vite, and Tailwind CSS + shadcn/ui components.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Routing**: React Router DOM v6
- **State/Data**: TanStack React Query
- **Forms**: React Hook Form + Zod

## Project Structure

```
src/
  App.tsx          - Root app with routing and providers
  main.tsx         - Entry point
  pages/           - Page components (Index, NotFound)
  components/      - Reusable UI components
  hooks/           - Custom React hooks
  lib/             - Utility functions
  index.css        - Global styles
```

## Development

Run the app locally:
```
npm run dev
```

Runs on port 5000 (configured for Replit's webview).

## Building

```
npm run build
```

Output goes to `dist/`.

## Notes

- Migrated from Lovable to Replit. The `lovable-tagger` dev plugin has been removed from `vite.config.ts` since it is Lovable-specific.
- Vite server is configured to bind to `0.0.0.0:5000` and allow all hosts for Replit's proxy/iframe setup.
