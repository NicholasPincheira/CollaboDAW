# MiniDAW / CollaboDAW — Investigación final de latencia, monitoreo y colaboración

**Fecha:** 2026-09-21  
**Estado:** cerrado para decisiones de arquitectura del MVP, abierto para mediciones empíricas del producto.

## 1. Resumen ejecutivo

1. CollaboDAW debe tratar la latencia como varios fenómenos distintos: camino local de monitoreo, transporte remoto, reproducción remota, jitter, reloj y drift.
2. No debe existir un único número llamado `latencia total` como métrica principal.
3. `latencyHint: "interactive"` es una solicitud al navegador, no una garantía de buffer ni de latencia.
4. `baseLatency` y `outputLatency` deben medirse en runtime cuando estén disponibles; `outputLatency` depende de plataforma y hardware.
5. Para instrumento local, la arquitectura debe permitir `Direct Monitor` con software monitor apagado para preservar el feeling cuando el hardware lo permita.
6. Objetivo de ingeniería local: preferido <15 ms para el software input-to-monitor; 15–20 ms sigue siendo experimentalmente utilizable; por encima de 20–30 ms debe marcarse como potencialmente problemático para instrumento.
7. Objetivo de colaboración: <=30 ms one-way remoto como objetivo principal experimental; 20–25 ms como stretch target.
8. ~25 ms one-way es una referencia usada por sistemas orientados a interpretación musical; SonoBus trata ~25 ms como suficientemente pequeño y ~40 ms como límite superior práctico. Estas cifras son referencias de ingeniería y percepción, no leyes universales.
9. WebSocket/WebSocket-like realtime debe mantenerse para control/presencia/estado, no como transporte primario de audio instrumental.
10. WebRTC es el transporte de media; LiveKit queda detrás de `RealtimeMediaProvider` para escalar de P2P a SFU sin cambiar el dominio.
11. El click debe generarse localmente en cada cliente usando el reloj musical compartido; no debe enviarse como audio por la red.
12. Cada participante debe tener una mezcla de monitoreo independiente y controlable.
13. `Monitor`, `Transmit`, `Record Arm`, `Mute` y `Receive/Subscribe` son estados diferentes y no deben colapsarse en un booleano.
14. IA no debe intentarse como solución para eliminar la latencia física/local del monitoreo.
15. Neural PLC sí puede ser un experimento de receptor remoto ante pérdida de paquetes, pero debe medirse frente a un baseline sin PLC.
16. NAM/WASM es un problema de DSP/tono y performance, no una solución de sincronización.

## 2. Qué significa cada latencia

### 2.1 Local monitoring path

Cadena conceptual:

`Instrumento -> ADC/interfaz -> captura browser -> Web Audio/FX -> output subsystem -> DAC -> oído`

El producto debe intentar medir lo que el navegador permite observar y, cuando no pueda medir un tramo, marcarlo como estimación.

### 2.2 Remote one-way audio

Cadena conceptual:

`Instrumento A -> ADC -> capture -> encode -> red -> jitter buffer -> decode -> playback -> DAC -> oído B`

No debe confundirse con RTT.

### 2.3 Network RTT

RTT responde: "¿cuánto tarda un ida y vuelta de paquetes?". No equivale a audio one-way.

### 2.4 Jitter

Es la variabilidad temporal de entrega. Un sistema puede tener RTT medio bajo y aun así necesitar buffering importante si el jitter es alto.

### 2.5 Clock offset y drift

Dos PCs pueden mantener un offset inicial bajo pero divergir gradualmente por diferencias de reloj. El SessionClock debe medir y corregir.

## 3. Targets del producto

### 3.1 Local software monitoring

| Banda | Significado en CollaboDAW |
|---|---|
| <10 ms | excelente, objetivo técnico ambicioso |
| 10–15 ms | objetivo preferido |
| 15–20 ms | experimentalmente utilizable |
| 20–30 ms | zona problemática para interpretación directa; evaluar caso por caso |
| >30 ms | no objetivo del modo de instrumento en tiempo real |

Estas bandas son targets internos de ingeniería, no una afirmación de percepción universal.

### 3.2 Remote one-way audio

| Banda | Uso en producto |
|---|---|
| <=20 ms | stretch target; excelente si se consigue de forma estable |
| 20–25 ms | muy buena zona experimental |
| 25–30 ms | objetivo principal |
| 30–40 ms | usable en algunos contextos; medir experiencia subjetiva |
| 40–50 ms | zona comprometida para tocar de forma síncrona |
| >50 ms | fuera del objetivo de jam instrumental síncrono |

JackTrip documenta como referencia ~25–30 ms o menos one-way para interacción musical remota, mientras que SonoBus indica que ~25 ms es "small enough" y ~40 ms es aproximadamente el límite superior práctico. Ver fuentes abajo.

## 4. Web Audio y mediciones

### `latencyHint`

Debe utilizarse para solicitar un perfil interactivo, pero el producto debe leer la latencia efectiva.

```ts
const audioContext = new AudioContext({
  latencyHint: "interactive",
  sampleRate: 48000,
});
```

Nunca mostrar `latencyHint` como si fuera la latencia lograda.

### `baseLatency`

Representa la latencia de procesamiento del `AudioContext` hacia el subsistema de audio del host.

### `outputLatency`

Representa una estimación de la latencia desde que el navegador entrega el buffer al subsistema de salida hasta que el primer sample es procesado por el dispositivo de salida.

Ambas deben ser registradas y versionadas con el benchmark.

### `setSinkId`

Debe detectarse mediante capability detection. La aplicación no debe asumir que todos los navegadores permiten seleccionar una salida arbitraria.

### Device enumeration

`enumerateDevices()` debe formar parte del Audio Lab. La visibilidad de dispositivos puede depender de HTTPS, permisos y políticas del navegador.

### Channel count

`getSettings()` y `channelCount` deben utilizarse para inspeccionar la configuración real del `MediaStreamTrack`; el producto no debe asumir que una interfaz de 2 entradas será siempre expuesta como dos tracks independientes.

## 5. Direct Monitor vs software monitor

### Direct Monitor

Ventaja: evita el camino de software del host para el monitoring de la entrada.

Uso recomendado:

- guitarra/vocal para performance;
- cuando la interfaz ofrece direct monitoring;
- cuando el usuario no necesita escuchar efectos del browser en tiempo real.

Limitación:

- los FX de software no se oyen en el camino directo;
- el monitor del hardware y el monitor del browser deben poder activarse por separado.

### Software Monitor

Uso necesario cuando el usuario quiere escuchar:

- distortion del browser;
- reverb;
- amp modeling;
- EQ/compressor;
- procesamiento experimental.

Debe quedar preparado para baja latencia, pero sujeto a las capacidades reales del sistema.

## 6. Arquitectura de doble path

El diseño recomendado es:

`Input -> Dry Record Tap`

`Input -> Monitor FX -> Monitor Bus`

El tap seco no debe pasar por el FX de monitor si el objetivo es conservar una captura limpia.

La duplicación del grafo lógico no implica duplicar la latencia del mismo modo que dos procesamientos secuenciales; el coste real depende de los nodos y del scheduling. Debe medirse con benchmarks, no suponerse.

## 7. Audio remoto

WebRTC es el media plane.

```text
Control Plane
  WebSocket / realtime
  - presence
  - transport
  - tempoMap
  - sync anchors
  - participant state

Media Plane
  WebRTC / LiveKit
  - local published audio
  - remote subscribed audio
```

El codec y el tamaño de frame deben considerarse parte del presupuesto de latencia. Opus soporta frames de 2.5, 5, 10, 20, 40 y 60 ms; frames más largos reducen overhead pero aumentan latencia y sensibilidad a pérdida de paquetes.

## 8. Mezcla por participante

Cada usuario construye su propio monitor mix.

Ejemplo:

```text
Nicholas
  Guitar    Monitor ON   Transmit ON   Record ON
  Mic       Monitor OFF  Transmit OFF  Record ON

Friend
  Guitar    Receive ON    Monitor ON
```

Resultado: Nicholas puede grabar su micrófono sin escucharlo, escuchar su propia guitarra y escuchar al amigo; Friend puede tener una mezcla distinta.

## 9. Monitor vs receive/subscribe

`Mute` no equivale a `Unsubscribe`.

### Mute

El track llega al cliente pero no participa de su mezcla audible.

### Unsubscribe

El cliente deja de recibir media para ese track. Esto puede ahorrar ancho de banda y procesamiento.

LiveKit soporta subscriptions selectivas y permite controlar qué tracks recibe el participante.

## 10. IA

### Predicción de notas / performance

No es un mecanismo general para eliminar la latencia causal del monitoring local. La señal física del instrumento todavía debe capturarse y convertirse en audio.

### Neural PLC

Tiene un lugar potencial en el receptor remoto:

`network loss -> PLC -> playback`

Debe permanecer fuera del baseline y de los presets principales hasta medir si reduce artefactos más de lo que introduce.

### NAM / neural amp modeling

Debe tratarse como un FX DSP opcional.

Su pregunta correcta es:

`¿cuál es el coste CPU/DSP y la latencia añadida por modelo?`

no:

`¿puede eliminar la latencia de red?`

Existen ports WebAssembly de NAM con integración WebAudio/AudioWorklet; el MVP no debe acoplarse a uno de ellos.

## 11. Anti-patrones

- WebSocket como media de instrumentos.
- Un único número de latencia sin desglose.
- Predicción de notas para esconder el monitor local.
- IA obligatoria en el preset por defecto.
- Mezcla global única compartida por todos los participantes.
- `Mute === unsubscribe`.
- `Record === monitor`.
- Click remoto transmitido como audio.
- Grabar audio PCM grande directamente en Postgres.
- Bluetooth como camino recomendado para jam instrumental.

## 12. Sources

1. MDN — `AudioContext.baseLatency`  
   https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/baseLatency
   - Demuestra qué representa `baseLatency` y que `latencyHint` puede ser ignorado por el navegador.
   - Límite: no representa todo el camino instrumento-oído.

2. MDN — `AudioContext.outputLatency`  
   https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency
   - Demuestra qué representa `outputLatency` y que varía según plataforma/hardware.
   - Límite: es una estimación del output path, no del end-to-end total.

3. MDN — `MediaDevices.enumerateDevices()`  
   https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
   - Demuestra enumeración de entradas/salidas y condicionamientos por permisos/HTTPS.

4. MDN — `MediaStreamTrack.getSettings()`  
   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings
   - Demuestra cómo inspeccionar la configuración real del track.

5. MDN — `channelCount`  
   https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/channelCount
   - Demuestra que el conteo de canales es una propiedad de la configuración del track y que tiene compatibilidad no uniforme.

6. IETF RFC 6716 — Opus  
   https://www.rfc-editor.org/info/rfc6716/
   - Demuestra frame durations y tradeoffs de latencia/overhead/loss.

7. JackTrip — latency guidance  
   https://support.jacktrip.com/introduction
   https://www.jacktrip.com/latency
   - Usa ~25–30 ms one-way como referencia para interacción musical remota y explica fuentes de latencia.
   - Límite: guía de un producto, no ley perceptual universal.

8. SonoBus — About Latency  
   https://sonobus.net/sonobus_userguide.html
   - Señala ~25 ms one-way como "good enough" y ~40 ms como límite superior práctico; desglosa hardware, jitter buffering y red.
   - Límite: documentación de producto; sirve como referencia práctica, no como umbral clínico/universal.

9. LiveKit — track subscription  
   https://docs.livekit.io/transport/media/subscribe/
   - Demuestra selective subscription y control fino de tracks remotos.

10. LiveKit — track management  
    https://docs.livekit.io/intro/basics/rooms-participants-tracks/tracks/
    - Demuestra modelo de Track/TrackPublication y diferencia subscribe/mute.

11. NAM WASM  
    https://github.com/tone-3000/neural-amp-modeler-wasm
    https://github.com/andremichelle/neural-amp-modeler-wasm
    - Demuestra viabilidad de ejecutar NAM mediante WebAssembly en navegador y opciones orientadas a AudioWorklet.
    - Límite: no implica una latencia determinada para todos los modelos/hardware.
