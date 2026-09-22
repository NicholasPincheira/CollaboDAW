# ADR-019 — IA desacoplada de los presets de latencia

## Estado

Accepted

## Decisión

La IA no se activa por defecto para resolver latencia local.

Los modos de IA son ortogonales a los presets de audio:

- `off` — baseline.
- `remote-plc` — experimento para ocultar pérdida de paquetes en recepción remota.
- `experimental` / `experimental-nam` — modelado de amplificador / DSP (nombre en dominio por concretar).

## Razón

La latencia local depende de una cadena causal física y de buffers del sistema. La predicción musical no elimina ese tiempo físico.

Neural PLC tiene un problema distinto: reconstrucción durante pérdida de paquetes.

NAM/WASM tiene un problema distinto: modelado tonal y coste de procesamiento.

## Consecuencia

Todos los benchmarks de latencia deben ejecutar primero IA `off`.

Cualquier IA nueva debe tener A/B contra baseline sin IA y métricas de:

- latencia añadida;
- CPU;
- artefactos;
- estabilidad;
- impacto subjetivo.

Los **experience presets** (Feel / Monitor SW / Capture) no encienden IA. Ver ADR-016 en [`../DECISIONS.md`](../DECISIONS.md).
