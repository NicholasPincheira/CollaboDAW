# Latency Targets — CollaboDAW

## Objetivo

Definir un lenguaje común para producto, telemetría y UX.

## No existe una sola latencia

Todas las métricas deben conservar su nombre técnico:

- `baseLatencyMs`
- `outputLatencyMs`
- `localMonitorPathMs` (cuando podamos estimarlo)
- `networkRttMs`
- `networkJitterMs`
- `packetLossPercent`
- `remoteOneWayEstimateMs` (estimado, no medido directamente salvo benchmark especializado)
- `clockOffsetMs`
- `clockDriftPpm` o equivalente

## Semáforo de producto

### Local software monitor

```text
< 10 ms     EXCELLENT
10–15 ms    TARGET
15–20 ms    ACCEPTABLE / EXPERIMENTAL
20–30 ms    HIGH
> 30 ms     OUTSIDE TARGET
```

### Remote one-way

```text
<= 20 ms    STRETCH
20–25 ms    VERY GOOD
25–30 ms    TARGET
30–40 ms    DEGRADED / TEST
40–50 ms    HIGH
> 50 ms     OUTSIDE TARGET
```

Los umbrales son objetivos internos y deben contrastarse con la evaluación subjetiva.

## Regla UX

Nunca mostrar:

`Latency: 31 ms`

si el valor es RTT, baseLatency o una estimación parcial.

Mostrar, por ejemplo:

```text
LOCAL MONITOR
~12 ms

NETWORK RTT
24 ms

REMOTE AUDIO
~31 ms est.
```

El texto `est.` debe aparecer cuando no tengamos una medición end-to-end directa.

## Benchmark mínimo

Cada benchmark debe almacenar:

- navegador y versión;
- OS y versión;
- interfaz y generación;
- driver;
- sample rate;
- output device;
- `baseLatency`;
- `outputLatency`;
- configuración de buffer disponible;
- si Direct Monitor está activo;
- si software monitor está activo;
- efectos activos;
- RTT/jitter/loss si existe conexión remota;
- resultado subjetivo 1–5.
