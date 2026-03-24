# LInked

LInked is a production-structured social media platform foundation built with:

- Next.js App Router frontend in plain JavaScript
- Express backend in plain JavaScript
- MongoDB + Mongoose
- Redis
- Cloudinary direct-upload architecture
- Tailwind CSS, TanStack Query, Zustand, Axios, React Hook Form

## Monorepo structure

```text
frontend/   Next.js application
backend/    Express API modular monolith
```

## Quick start

1. Copy `.env.example` to `.env`.
2. Start infrastructure:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Run the backend and frontend:

```bash
npm run dev
```

5. Seed development data:

```bash
npm run seed
```

## Core architecture notes

- Backend uses a clean modular monolith split by domain modules and layers.
- Media uploads are signed by the backend and uploaded directly from the frontend to Cloudinary.
- Access tokens are short-lived; refresh tokens are stored in an HTTP-only cookie and persisted server-side.
- Redis is used for caching, counters, and rate limiting.
- Soft delete and moderation states are built into content collections.

## Environment

Use `.env.example` as the source of truth for both apps. Backend and frontend each include their own `.env.example` with scoped variables.

