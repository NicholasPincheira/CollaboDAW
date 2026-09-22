# Cursor Prompt 04 — Controlled Feature Iteration

Implement the following feature:

[DESCRIBE ONE FEATURE HERE]

Before touching code:

1. Read AGENTS.md.
2. Read the relevant architecture docs and skills.
3. Inspect the existing modules that own the feature.
4. Identify the correct boundary and dependencies.
5. Write a short implementation plan.

Implementation rules:

- Change the smallest number of modules possible.
- Preserve working behavior.
- Do not refactor unrelated code.
- Do not introduce a new dependency unless justified.
- Do not let React own low-level audio/realtime state.
- Keep infrastructure behind adapters.
- Feature-detect unsupported Web APIs.
- Add tests for deterministic logic.

After implementation:

- typecheck;
- lint;
- tests;
- build;
- performance check when the change touches audio/realtime/UI hot paths.

Then update relevant documentation and explain:

- files changed;
- architectural boundary used;
- tests run;
- runtime limitations;
- next smallest step.
