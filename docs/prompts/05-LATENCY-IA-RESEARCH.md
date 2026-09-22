# Prompt GPT — Investigación latencia + IA opcional (CollaboDAW)

> **Estado:** superseded for architecture decisions by [`docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`](../research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md) (2026-09-21). Keep for optional extra GPT passes only.
> Copia el bloque entre `---` y pégalo en GPT (modo investigación / Deep Research si está disponible).

---

Actúa como investigador senior en **Networked Music Performance (NMP)**, **Web Audio**, **WebRTC** y **audio DSP en navegador**.

## Producto

**MiniDAW / CollaboDAW** — DAW colaborativo experimental en navegador (React/Vite, Cloudflare Pages, Supabase para control/presencia, WebRTC/LiveKit para media cuando exista).

**Caso de uso real:** dos guitarristas lejanos quieren tocar armonías en vivo (como cuando se juntan físicamente) y grabar takes con herramientas de DAW. Objetivo futuro: FX, posible integración open source tipo NAM (Neural Amp Modeler), no ToneX cerrado.

**Arquitectura desacoplada (no negociable):**

- `AudioEngine`, `AudioDeviceManager`, `RealtimeMediaProvider`, `SessionClock`, `SessionTransport`, `ProjectRepository`
- WebSocket/Supabase Realtime = **control** (presencia, transport, tempo map)
- WebRTC = **media** (audio entre personas)
- Click generado **localmente** en cada cliente

## Contexto medido hoy (Chromium desktop + Behringer UMC22)

- `baseLatency` ~10 ms, `outputLatency` ~65–70 ms → **~75–80 ms** en “monitor path” software (base+output, no instrumento→oído completo)
- Presencia Supabase OK; RTT/jitter de control plane medible
- Sync offset / drift de **media** aún no (WebRTC pendiente)
- Mejor feeling observado: **Direct Monitor hardware** + software monitor muteado
- A veces la salida cae en Realtek en lugar de la interfaz → sube latencia

## Hipótesis del producto (a validar, no asumir)

1. **Preview/monitor liviano + grabación HQ** en paths separados (dry tap antes de FX de monitor).
2. **Bundles de opciones** que mejoran latencia pueden combinarse; hay que medir si juntas ayudan o empeoran la sensación al tocar.
3. **IA opcional y separada** (default off) para A/B honesto — no forzar IA en el preset base.

### Matriz de presets propuesta (para evaluar en investigación)

| Preset | Objetivo | Monitor SW | latencyHint | Sample rate | Direct Monitor HW |
| --- | --- | --- | --- | --- | --- |
| **Feel** | Máximo feeling local | off | live | 48 kHz | preferido |
| **Monitor SW** | Oír por browser/FX | on | live | 48 kHz | opcional |
| **Capture** | Grabación estable | off | record | 48 kHz | preferido para play-along |

### Modos IA propuestos (ortogonales al preset, default **off**)

| Modo | Qué sería | Estado esperado hoy |
| --- | --- | --- |
| **off** | Baseline sin assist | único modo “activo” real |
| **remote-plc** | PLC neural en receptor remoto ante packet loss | stub / investigación |
| **experimental** | NAM u otros experimentos (no predicción de notas futuras) | stub / investigación |

**Importante:** la investigación debe decir si tiene sentido activar IA en algún preset, o si siempre debe quedar opt-in aparte.

## Metodología exigida

- **Fuentes primarias:** papers, MDN, IETF RFCs, repos oficiales, docs Chromium, documentación Jamulus/SonoBus/JackTrip/LiveKit.
- Para **cada claim:** URL + qué demuestra + límite / contraejemplo.
- Sé escéptico con marketing y demos sin números.
- Distingue: monitoreo **local**, transporte **remoto**, grabación **offline**, y reloj **musical compartido**.

## Preguntas obligatorias

### A. Cuello de botella local (prioridad #1)

1. ¿Se puede lograr **<20–30 ms mouth-to-ear** solo con software monitor en **Windows + Chromium**? ¿Qué dicen MDN/Chromium sobre `latencyHint`, `baseLatency`, `outputLatency`, `setSinkId`?
2. ¿Cuánto aporta **Direct Monitor** vs software monitor? ¿Cuándo software monitor es inevitable (FX en headphones)?
3. ¿Qué hace el **Windows audio stack** (WASAPI shared vs exclusive) respecto al browser? ¿Hay APIs web para forzar exclusive mode?
4. ¿Bluetooth, Realtek vs interfaz dedicada, buffer del driver — orden de impacto?

### B. Preview liviano + grabación HQ

5. Patrones DAW probados: dry record tap, wet monitor, low-latency preview codec vs lossless capture.
6. ¿Es viable **doble path** en Web Audio (tap seco + bus de monitor procesado) sin duplicar latencia perceptible?
7. ¿Qué calidad/bitrate usar en preview vs master sin confundir al músico?

### C. Colaboración remota (prioridad #2, después de feel local)

8. Estado del arte **NMP en browser:** JackTrip-WebRTC (PCM DataChannel), Opus en RTCPeerConnection, LiveKit SFU. Latencias reportadas LAN vs Internet.
9. Comparar con **nativo:** Jamulus, SonoBus — umbrales de usabilidad (~30–50 ms one-way citados en docs).
10. ¿WebSocket como transporte de audio en vivo? (respuesta esperada: no para instrumentos; justificar).

### D. IA — qué ayuda y qué no

11. ¿Puede la IA “rellenar frames” como **predicción en videojuegos** para tocar **sin latencia local**? Explica causalidad del audio instrumental.
12. Distingue con precisión:
    - **(a) Packet Loss Concealment (PLC)** neural (INTERSPEECH/ICASSP challenges, PLCNet, LPCNet PLC)
    - **(b) Predicción anticipada** de performance musical
    - **(c) Modelado de amp** (NAM/WASM) — latencia de procesamiento vs beneficio tonal
13. Para cada tipo: **dónde** en la cadena encaja, latencia añadida, riesgo de artefactos, evidencia de papers.
14. ¿Tiene sentido **remote-plc** solo en el receptor remoto? ¿Cuándo empeora más de lo que arregla?
15. ¿NAM en AudioWorklet es viable como FX opcional sin romper el budget de latencia local?

### E. Matriz de experimentos A/B (debe proponer protocolo)

16. Diseña experimentos **medibles** para CollaboDAW con métricas:
    - base latency, output latency, path ms
    - RTT, jitter, packet loss (control y media)
    - clock offset, drift (cuando exista WebRTC)
    - evaluación subjetiva (escala 1–5 “¿puedo tocar en tiempo?”)
17. Protocolo A/B sugerido:
    - Presets Feel / Monitor SW / Capture × IA off / remote-plc / experimental
    - Orden contrabalanceado, misma interfaz, misma pieza musical corta
    - Condiciones: Direct Monitor on/off, salida interfaz vs Realtek
18. ¿Qué combinaciones **no** merecen implementarse aunque suenen bien en teoría?

### F. Roadmap recomendado (4–6 slices)

19. Orden óptimo alineado a: **local feel medido → dry record → WebRTC audio → SessionClock → FX/NAM → PLC remoto opcional**.
20. Para cada slice: criterio de “done”, métricas, riesgos, dependencias.

## Anti-patrones a evaluar explícitamente

- WebSocket como media de instrumentos
- Un solo número de “latencia total” sin desglose
- IA predictiva de notas para monitoreo local
- Forzar IA assist en el preset por defecto
- Grabar PCM crudo en Postgres (Supabase free tier)
- Bluetooth para jam en vivo

## Formato de salida

1. **Resumen ejecutivo** (≤15 líneas) — incluye veredicto sobre si la IA resuelve o no el cuello local
2. **Tabla** “existe / parcial / no existe / experimental” para cada técnica
3. **Diagrama ASCII** de arquitectura recomendada MVP vs escala
4. **Matriz preset × IA** — qué probar primero y qué descartar
5. **Plan de experimentos** paso a paso (reproducible en CollaboDAW)
6. **Roadmap 4–6 slices** con criterios medibles
7. **Bibliografía** con links verificables
8. **Riesgos abiertos** — qué sigue sin respuesta clara

Responde en **español**. Prioriza evidencia sobre entusiasmo.

---

## Cómo usar la respuesta de GPT

1. Pégala en el chat del proyecto o guárdala en `docs/research/` (fecha en el nombre).
2. Cruza claims con `docs/learn/` y `docs/infrastructure/`.
3. Solo entonces decide el siguiente slice de código (probablemente dry record + WebRTC, no IA predictiva).
4. Actualiza `docs/DECISIONS.md` si cambia alguna ADR.
