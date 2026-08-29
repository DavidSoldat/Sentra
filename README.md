# Sentra

Codebase intelligence for GitHub repos, built around two LLM workflows: retrieval-augmented Q&A over an indexed codebase, and a multi-agent pipeline that reviews pull requests from four independent specialist perspectives in parallel.

## RAG pipeline

**Ingestion.** A repo is fetched as a single tarball and extracted in-memory, filtered by extension and path prefix to skip binaries, lockfiles, and vendored directories. Each indexable file is chunked, embedded, and stored — with files processed in parallel via a dedicated executor pool, separate from the pool that handles concurrent *repos* indexing, so one doesn't starve the other.

**Chunking.** Fixed-size, character-based chunking (~400 tokens per chunk, ~50 tokens of overlap, approximated at 4 chars/token) with a sliding window. Each chunk's end is snapped forward to the next newline so it doesn't cut mid-line, and every chunk carries its file path and original start/end line numbers as metadata, which is what lets answers cite "file.java, lines 40–58" rather than just a filename.

**Embeddings.** Chunks are embedded locally with a MiniLM sentence-transformer model rather than an API-based embedding model — indexing a few hundred files means a few hundred embedding calls, and doing that locally removes both the per-call cost and the network latency from what's already the slowest part of onboarding a repo. Vectors are stored in pgvector.

**Retrieval.** Each question is embedded and matched against the repo's chunks with a cosine-similarity search, filtered by `repo_id`, returning the top 20 matches above a 0.3 similarity floor. If nothing clears that bar, the model is explicitly told the codebase doesn't contain anything relevant — it's instructed not to guess or ask the user to paste code it should already be able to search itself. Retrieved chunks are assembled into a system prompt with their file path and line range headers, and conversation history is capped at the last 5 Q&A pairs so a long-running chat's token cost doesn't grow unbounded.

## Multi-agent PR review

A pull request diff is reviewed by four independent agents — Security, Architecture, Performance, and Docs — sharing one base agent implementation but each with its own system prompt and focus. They're fanned out and run concurrently against the same diff and the same RAG-retrieved codebase context, each returning its own findings and a severity rating. If one agent fails, only that agent needs to be rerun — its status is tracked independently, so a transient failure doesn't force burning quota on the three that already succeeded.

Findings support their own follow-up chat, scoped per `(review, agent)` pair — you can ask the Security agent a question about its own findings without dragging the other three agents' context into it. That follow-up history is capped the same way RAG chat is, for the same reason.

## Model layer

Built on langchain4j's provider-agnostic `ChatModel`/`StreamingChatModel` interfaces, so the rest of the app — RAG, agents, follow-up chat — resolves a model once per call and never branches on which provider is actually serving it. Four models are wired up across two providers (OpenAI and Anthropic), grouped into an efficient band and a premium band; Free-tier users get the efficient band, Pro-tier users can select either, and a Pro model preference silently falls back to the efficient band if a subscription lapses rather than failing the request.

## Streaming

Both RAG chat and PR review responses stream token-by-token over Server-Sent Events. The frontend uses a hand-rolled `fetch` + `ReadableStream` SSE client instead of the native `EventSource` API for one specific reason: `EventSource` has no way to read a custom error body on connection failure, and quota-exceeded responses need their JSON body read to tell the user what limit they hit and when it resets.

## Also in here

- GitHub OAuth2 login
- Multi-tenant data scoping across repos, questions, and reviews
- Review history with PR-level dedup — resubmitting an already-reviewed PR returns the existing review instead of re-running all four agents
- Posting a completed review back to GitHub as a real PR comment
- Tier-based quota enforcement with atomic check-and-increment to avoid race conditions on usage counters
- Paddle billing: checkout, webhook-driven subscription lifecycle, customer portal, hand-rolled webhook signature verification

## Stack

**Backend** — Spring Boot, langchain4j, PostgreSQL + pgvector, local MiniLM embeddings, Apache Commons Compress
**Frontend** — Next.js, TypeScript, Zustand
**Infra** — Docker Compose, Flyway
