# Audio Monitor Mix — Especificación funcional y de dominio

## Principio

Cada participante tiene un monitor mix privado.

Un cambio de mezcla de Nicholas no debe modificar automáticamente lo que escucha Friend.

## Estados independientes por track

Cada `Track` debe poder modelar al menos:

```ts
interface TrackRoutingState {
  monitorEnabled: boolean;
  transmitEnabled: boolean;
  recordArmed: boolean;
  muted: boolean;
  subscribed: boolean;
  volumeDb: number;
  pan: number;
}
```

`subscribed` aplica especialmente a tracks remotos.

## Definiciones

### Monitor

Determina si el track participa de la mezcla local audible del usuario.

### Transmit

Determina si el audio local de la pista se publica a la sesión remota.

### Record Arm

Determina si el track se captura en la grabación local/proyecto.

### Mute

Silencia el track dentro de la mezcla local sin implicar dejar de recibirlo.

### Subscribe / Receive

Determina si un track remoto es entregado al cliente. En proveedores como LiveKit se puede desactivar la suscripción selectivamente.

## Combinaciones válidas

### Grabando sin escuchar

```text
Record = ON
Monitor = OFF
```

### Enviando sin escuchar

```text
Transmit = ON
Monitor = OFF
```

### Escuchando sin grabar

```text
Monitor = ON
Record = OFF
```

### Escuchando remoto pero sin consumir media

```text
Subscribe = OFF
```

### Escuchando todo

```text
Monitor local tracks = ON
Monitor remote tracks = ON
Click = ON
```

## Signal flow recomendado

```text
                    ┌────── Dry Record Tap
Input ──────────────┤
                    │
                    └────── Monitor FX ──> Track Bus ──> Local Mix

Local Mix + Remote Mix + Click ──> Master ──> Output
```

## Direct Monitor

Direct Monitor debe considerarse un camino físico externo al motor de monitor software.

El DAW web debe tener un control conceptual:

```text
Software Monitor: ON/OFF
Hardware Direct Monitor: detected / user-managed
```

La app no debe asumir que puede activar/desactivar el Direct Monitor del hardware a través de la Web Audio API.

## Per-user mix

Modelo:

```text
Session
  ├── Track A (Nicholas Guitar)
  ├── Track B (Nicholas Mic)
  └── Track C (Friend Guitar)

ParticipantViewState[Nicholas]
  ├── A.monitor = true
  ├── B.monitor = false
  └── C.monitor = true

ParticipantViewState[Friend]
  ├── A.monitor = true
  ├── B.monitor = false
  └── C.monitor = true
```

Los `ParticipantViewState` no deben escribirse como si fueran propiedad global de la pista.

## UX recomendada

Cada channel strip debe mostrar:

```text
[M] Mute
[S] Solo
[R] Record
[MON] Monitor
[TX] Transmit
[RX] Receive/Subscribe (remote)
```

No esconder `MON` y `TX` dentro del mismo control.

## All Monitor

`ALL MONITOR` es un shortcut de UX y no un estado adicional del dominio.

Implementación conceptual:

```ts
setAllLocalMonitoring(true);
setAllRemoteMonitoring(true);
setClickMonitoring(true);
```

No crear una única propiedad `monitorEverything` dentro de cada track.
