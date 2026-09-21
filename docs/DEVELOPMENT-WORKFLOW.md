# AI-assisted Development Workflow

## Goal

Make Cursor behave like an engineering agent working inside a known architecture, not like a code generator inventing a new architecture on every prompt.

## Required loop

```text
Task
 ↓
Read AGENTS.md
 ↓
Read relevant docs
 ↓
Read relevant skills
 ↓
Inspect repository
 ↓
Identify boundary
 ↓
Write implementation plan
 ↓
Implement smallest vertical slice
 ↓
Typecheck
 ↓
Lint
 ↓
Tests
 ↓
Build
 ↓
Performance check if relevant
 ↓
Update docs/ADRs
 ↓
Report result
```

## Feature prompt template

Ask Cursor to include:

- objective;
- affected modules;
- architectural boundary;
- implementation;
- tests;
- runtime limitations;
- next smallest step.

## Anti-patterns

Do not allow:

- giant one-shot DAW rewrites;
- React components owning `AudioContext` and WebRTC simultaneously;
- global singleton soup;
- UI timers as the musical clock;
- hidden device assumptions;
- direct Supabase imports throughout business logic;
- vendor-specific types in domain interfaces;
- unmeasured performance optimizations.

## Review gates

Every milestone should answer:

1. Does it respect the architecture?
2. Can the implementation be replaced?
3. Are unsupported capabilities detected?
4. Is the audio path observable?
5. Is the change tested?
6. Does the next milestone remain easy?

## Continuous improvement

When a limitation is discovered, update one of:

- `docs/DECISIONS.md`
- relevant skill
- relevant architecture document
- roadmap

Do not only patch the current code. Capture the lesson so the next Cursor session inherits it.
