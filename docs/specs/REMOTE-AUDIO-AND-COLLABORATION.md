# Remote Audio & Collaboration — Especificación

## Media plane

Usar WebRTC para audio entre participantes.

LiveKit debe estar detrás de:

```ts
interface RealtimeMediaProvider {
  connect(sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  publishTrack(track: MediaStreamTrack, metadata: TrackMetadata): Promise<void>;
  subscribeTrack(trackId: string): Promise<MediaStreamTrack>;
  unsubscribeTrack(trackId: string): Promise<void>;
  getStats(): Promise<RealtimeStats>;
}
```

## Control plane

WebSocket / Supabase Realtime / DataChannel puede transportar:

- presence;
- participant state;
- transport state;
- tempo map;
- sync anchors;
- resync commands;
- non-media collaboration events.

No transportar audio instrumental como JSON/frames de WebSocket.

## Remote track model

Local y remoto deben converger en el mismo dominio:

```text
Track
  ├── sourceType: local-input
  ├── sourceType: remote-participant
  ├── sourceType: recording
  └── sourceType: imported-audio
```

La UI no debe tener un componente completamente diferente sólo porque una pista sea remota.

## Subscribe vs Mute

`unsubscribe` reduce recepción de media.

`mute` cambia el estado de mezcla local.

Nunca usar `muted` como sustituto de `subscribed`.

## Latency statistics

Registrar:

```ts
interface RealtimeStats {
  rttMs?: number;
  jitterMs?: number;
  packetsLost?: number;
  packetsReceived?: number;
  bitrateBps?: number;
  timestamp: number;
}
```

## SessionClock

El servidor o un componente de referencia define anchors de sesión:

```ts
interface ClockAnchor {
  sessionTimeMs: number;
  beat: number;
  tempo: number;
  revision: number;
}
```

Los clientes convierten ese tiempo a su reloj local.

## Click

El click no viaja por WebRTC.

Cada cliente genera su propio click a partir de:

- tempo;
- time signature;
- beat position;
- SessionClock;
- tempoMap.

Esto evita convertir la red en parte del circuito del sonido del click.

## Resync

`RESYNC` debe:

1. obtener nuevo anchor;
2. estimar offset;
3. recalcular posición musical;
4. corregir scheduling futuro;
5. preservar audio ya grabado.

## Participant session UX

La sesión debe mostrar al menos:

```text
● Nicholas        ~12 ms local
  Guitar TX ON
  Mic RX OFF

● Friend           ~28 ms remote est.
  Guitar RX ON
```

Los números deben marcarse como `est.` cuando sean una estimación.
