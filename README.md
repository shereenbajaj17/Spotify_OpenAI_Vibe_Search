# Spotify Vibe Search AI

A full-stack, production-grade web application that mimics the UX and feel of Spotify, focused on classical music streaming with an AI-powered "Vibe Search" feature.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Zustand 
- **Backend**: Next.js API Routes, NextAuth.js (Credentials/OAuth ready)
- **Database**: PostgreSQL with `pgvector` extension, Prisma ORM
- **AI**: OpenAI `text-embedding-3-small` and `gpt-4o-mini`

## Core Features
- **Vibe Search**: Enter a natural language phrase (e.g. "Rainy evening, calm but nostalgic") to find matching classical tracks using vector similarity search.
- **Persistent Player**: Audio seamlessly plays and persists while navigating the application, powered by Zustand.
- **Library System**: Create playlists, like songs, and view dynamically generated recommendations.
- **Authentication**: Built-in authentication powered by NextAuth.

## Setup Instructions

### 1. Prerequisites
- Node.js (v20+ recommended)
- `pnpm` Package Manager (`npm install -g pnpm` or `corepack enable pnpm`)
- A PostgreSQL database with the **`pgvector`** extension installed and enabled. (E.g., Supabase, Render, local Docker).
- An OpenAI API Key

### 2. Environment Variables
Copy `.env.example` to `.env` (or create a `.env` file) and include the following:

```env
# PostgreSQL database URL (must have pgvector enabled)
DATABASE_URL="postgresql://user:password@localhost:5432/spotify_ai_vibe?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_random_string_here" # Generate via `openssl rand -base64 32`

# OpenAI API Key for Vibe Search Embeddings
OPENAI_API_KEY="sk-..."
```

### 3. Installation & Database Setup
Install the dependencies using `pnpm`:
```bash
pnpm install
```

Push the database schema to your PostgreSQL instance (this will also create the `vector` extension if your database user has sufficient privileges):
```bash
npx prisma db push
```

### 4. Seed the Database
Seed the database with the initial classical tracks and their OpenAI embeddings. **Ensure your `OPENAI_API_KEY` is set in your `.env` before running this!**
```bash
pnpm prisma seed
```

### 5. Start the Development Server
```bash
pnpm dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to start exploring the app.

## Architecture & Code Structure
- `/app`: Next.js App Router pages and API endpoints (`/api/search`, `/api/auth`, etc.)
- `/components/layout`: Spotify-style UI shells (`Sidebar.tsx`, `BottomPlayer.tsx`)
- `/store`: Global state management (`usePlayerStore.ts`)
- `/prisma`: Database schema and seeding scripts.
- `/lib`: Global singletons (Prisma client, NextAuth configs).
