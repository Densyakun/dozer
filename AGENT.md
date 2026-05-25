# AGENT.md

# Project Overview

This project is an AI-native mobile development environment.

It is NOT:
- a VSCode clone
- a desktop IDE replacement
- a traditional filesystem-centric editor

It IS:
- a mobile-first AI development runtime
- a browser-first workspace system
- a realtime collaborative AI environment
- a lightweight cloud-native development OS

The primary user device is a smartphone.

The architecture MUST prioritize:
- low memory usage
- browser-first execution
- realtime synchronization
- resumable sessions
- stateless infrastructure
- lightweight runtime layers

---

# Core Philosophy

## Browser-first Architecture

This project is designed to run primarily inside the browser.

The browser is treated as:
- the main UI runtime
- the primary editing environment
- the preview environment
- the local cache layer

Server-side compute should only be used when necessary.

---

# Vercel Deployment Assumptions

This application is intended to be deployed on Vercel.

Because of this:

- server filesystem persistence MUST NOT be assumed
- long-running server processes MUST NOT be assumed
- local server storage MUST NOT be assumed
- server-side git repositories MUST NOT be assumed
- background processes MUST NOT depend on Vercel Functions

Vercel should mainly handle:
- frontend hosting
- lightweight APIs
- auth callbacks
- websocket/realtime coordination
- edge routing

Persistent runtime state belongs elsewhere.

---

# Storage Architecture

## Source of Truth

### GitHub
GitHub is the official source of truth for:
- commits
- branches
- history
- pull requests
- releases

Git is NOT used for realtime synchronization.

---

### Supabase
Supabase is used for:
- realtime collaboration
- workspace metadata
- editor state
- AI task state
- active sessions
- lightweight source synchronization

Supabase is NOT a replacement for:
- git object storage
- build artifact storage
- node_modules storage

---

### IndexedDB
IndexedDB is the browser-local cache layer.

IndexedDB should store:
- workspace cache
- recently opened files
- draft changes
- transpilation cache
- TSX compilation cache
- lightweight git cache
- temporary build cache

IndexedDB is NOT a source of truth.

IndexedDB data must be treated as disposable cache.

---

# WebContainer Philosophy

WebContainer is treated as:
- a temporary runtime
- a sandbox
- a preview execution environment

WebContainer is NOT:
- permanent storage
- a persistent Linux environment
- a long-running backend

The WebContainer filesystem may be recreated at any time.

---

# File Loading Strategy

Do NOT load entire repositories into WebContainer.

Implement lazy loading:
- load only necessary files
- mount only active workspace files
- fetch additional files on demand

Avoid:
- mounting full repositories
- loading node_modules into memory unnecessarily
- syncing all files at startup

---

# Workspace Model

The application uses a workspace abstraction.

Do NOT implement:
- desktop-like drive systems
- OS-style filesystem assumptions
- global root directories

Instead implement:
- projects
- workspaces
- active runtime sessions
- virtual filesystem layers

---

# Runtime Layering

## Browser Runtime
Responsibilities:
- editor
- UI rendering
- tsx-safe-eval execution
- lightweight previews
- local cache
- realtime sync

---

## Remote Runtime
Responsibilities:
- heavy builds
- testing
- Playwright
- Android emulators
- large dependency installs
- AI compute jobs

Remote runtimes may include:
- RunPod
- Modal
- Vast.ai
- external containers

Remote runtimes should be ephemeral whenever possible.

---

# tsx-safe-eval Philosophy

tsx-safe-eval is a core runtime component.

It is NOT merely a sandbox.

It is responsible for:
- dynamic UI generation
- instant previews
- runtime component evaluation
- AI-generated UI execution

Prefer:
- dynamic TSX execution
- runtime-generated UI
- lightweight rendering

Avoid:
- unnecessary bundling
- excessive rebuild pipelines

---

# AI Agent Philosophy

The AI agent is the primary developer.

Users mainly:
- review
- approve
- inspect UI
- manage tasks

The AI agent performs:
- file edits
- code generation
- workspace modifications
- task execution
- preview updates

---

# AI Safety Rules

The AI must NEVER:
- execute arbitrary unsafe commands automatically
- expose secrets to the browser
- store OAuth tokens insecurely
- trust browser cache as permanent state

---

# Git Integration Rules

GitHub authentication should use OAuth.

Prefer:
- NextAuth.js
- GitHub OAuth App
- GitHub App

Avoid:
- manual PAT entry
- storing tokens in localStorage
- exposing privileged git tokens to the client

---

# Realtime Synchronization Rules

Realtime synchronization is handled through Supabase Realtime.

Realtime sync should include:
- active file changes
- cursor positions
- tabs
- AI task state
- preview state

Realtime sync should NOT include:
- git history
- node_modules
- build outputs

---

# Mobile-first Rules

All UI must prioritize smartphone usability.

Requirements:
- touch-friendly controls
- large tap targets
- bottom navigation
- minimal multi-pane layouts
- responsive workspace panels

Avoid:
- hover-dependent UI
- desktop-only keyboard workflows
- complex drag interactions

---

# Performance Rules

Always optimize for:
- low memory usage
- low CPU usage
- low network usage
- resumable sessions

Avoid:
- loading entire repositories
- large in-memory file trees
- unnecessary websocket traffic
- excessive rerenders

---

# Architecture Priorities

Priority order:

1. Mobile usability
2. Realtime collaboration
3. AI task orchestration
4. Browser-first execution
5. Incremental loading
6. Lightweight runtime
7. Offline resilience
8. Fast preview rendering

---

# Preferred Stack

Frontend:
- Next.js
- TypeScript
- React
- Tailwind CSS
- PWA

Realtime:
- Supabase

Runtime:
- WebContainer
- tsx-safe-eval

Persistence:
- GitHub

Browser Cache:
- IndexedDB

Heavy Compute:
- RunPod
- Modal
- external containers

---

# Design Goal

The goal is NOT to recreate a desktop IDE.

The goal is to create:
- an AI-native workspace runtime
- a browser-native development OS
- a mobile-first AI programming environment