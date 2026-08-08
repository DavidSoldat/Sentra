# Sentra

Codebase intelligence for GitHub repos. Point it at a repo and ask questions about the code. Choose a pull request URL and four specialist AI agents review it in parallel.

## What it does

**RAG-based codebase Q&A.** Index a GitHub repo, then ask it questions in plain English — "what does this project do," "where's the entry point," "how is auth wired up." The backend chunks the repo, embeds it with pgvector, and retrieves relevant context per question rather than dumping the whole repo into a prompt.

**Multi-agent PR review.** Select existing or closed pull request URL and four specialist agents — Security, Architecture, Performance, and Docs — review the diff independently and in parallel. Each comes back with its own findings and recommended solutions.

## How it's built

**Backend — Spring Boot**
- GitHub OAuth2 login, backend-owned token storage (AES/GCM encrypted), JWT session cookies
- Multi-tenant data scoping — every repo, question, and review is scoped to its owning user
- RAG pipeline: repo ingestion → chunking → embeddings (pgvector) → retrieval → Claude
- Multi-agent PR review: four agents fanned out via `CompletableFuture`, run concurrently against the same diff
- Real-time repo indexing status over Server-Sent Events (progress ticks + terminal status), no polling
- Tier-based quota enforcement (Free / Pro), atomic check-and-increment to avoid race conditions on usage counters
- Paddle billing: checkout, webhook-driven subscription lifecycle (including scheduled cancellations), customer portal, hand-rolled webhook signature verification

**Frontend — Next.js / TypeScript**
- Zustand for state
- Mobile-responsive sidebar with a slide-over drawer below `md`
- Server-Sent Events client for live indexing progress instead of a fixed polling interval

**Infra**
- PostgreSQL with pgvector for embeddings
- Docker Compose 
- Flyway migrations
