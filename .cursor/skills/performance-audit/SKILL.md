---
name: performance-audit
description: Audit MiniDAW performance, audio-thread safety, UI rendering, memory allocation, and latency-sensitive paths before optimization.
---

# Performance Audit Skill

## Principle

Measure first. Optimize second.

## Check

- main-thread blocking;
- React rerender frequency;
- AudioWorklet allocations;
- memory churn;
- timeline DOM size;
- meter rendering strategy;
- network packet frequency;
- serialization overhead;
- audio glitches/underruns when available.

## AudioWorklet rules

Avoid:

- object creation in `process()`;
- JSON serialization;
- console logging every block;
- expensive loops that can run on another thread.

## UI rules

Do not put audio sample arrays in React state.

Use Canvas or a specialized rendering layer for dense waveforms and playheads.

## Optimization escalation

Only introduce, in order:

1. better scheduling;
2. Worker offload;
3. SharedArrayBuffer where isolation/security permits;
4. WebAssembly;
5. more specialized/native strategies.

Document every escalation with before/after measurements.
