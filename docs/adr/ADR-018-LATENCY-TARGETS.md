# ADR-018 — Targets de latencia

## Estado

Accepted

## Decisión

CollaboDAW no define una sola métrica de latencia.

### Local software monitor

Objetivo preferido: **<15 ms**.

Zona experimental: 15–20 ms.

>20–30 ms: marcar como potencialmente problemático para instrumento directo.

>30 ms: fuera del objetivo del modo instrumento en tiempo real.

### Remote one-way

Objetivo principal: **<=30 ms**.

Stretch target: 20–25 ms.

30–40 ms: degradado/experimental.

40–50 ms: alto.

>50 ms: fuera del objetivo de jam instrumental síncrono.

## Justificación

Las cifras son targets de ingeniería apoyados por referencias de NMP y documentación de herramientas como JackTrip y SonoBus. No deben presentarse como leyes universales.

Ver [`../specs/LATENCY-TARGETS.md`](../specs/LATENCY-TARGETS.md) y [`../research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`](../research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md).

## Consecuencia

Los benchmarks y dashboards deben desglosar:

- base latency;
- output latency;
- local path estimate;
- RTT;
- jitter;
- packet loss;
- remote one-way estimate;
- clock offset/drift.

Nunca mostrar un único `latencyMs` sin contexto.
