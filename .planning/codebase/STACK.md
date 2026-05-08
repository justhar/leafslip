# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- TypeScript 5 - Next.js frontend and backend APIs

**Secondary:**
- Python 3.x - Used for the FastAPI machine learning model inference server (`model/server.py`)

## Runtime

**Environment:**
- Node.js (Version unknown, standard Next.js environment)
- Python 3.x

**Package Manager:**
- npm
- Lockfile: Not explicitly provided, but package.json suggests standard Node environment.

## Frameworks

**Core:**
- Next.js 16.1.1 - App router application
- React 19 - UI rendering
- FastAPI - Machine learning Python API

**Build/Dev:**
- tailwindcss v4 - Styling (along with Tailwind CSS PostCSS plugin)
- drizzle-kit - Database migration and generation tool

## Key Dependencies

**Critical:**
- `drizzle-orm` - Type-safe SQL ORM for DB interactions
- `next-auth` (v5 beta) - Authentication

**UI/Presentation:**
- `@headlessui/react` - Headless accessible components
- `lucide-react` - Icons
- `recharts` - Charting
- `react-markdown` & `remark-gfm` - Markdown rendering

**Machine Learning (Python):**
- `joblib` - Model loading
- `numpy` - Feature vector operations

## Configuration

**Environment:**
- Configured via `.env` (managed with `dotenv`)

**Build:**
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `drizzle.config.ts`

## Platform Requirements

**Development:**
- Node.js environment
- Python environment for running the ML model locally

---

*Stack analysis: 2026-05-08*
