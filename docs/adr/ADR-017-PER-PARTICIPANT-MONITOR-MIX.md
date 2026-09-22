# ADR-017 — Mezcla de monitoreo independiente por participante

## Estado

Accepted

## Contexto

Una sesión colaborativa debe permitir que cada músico escuche combinaciones diferentes de sus propias pistas y de las pistas remotas.

Ejemplo: Nicholas quiere grabar voz sin monitorizarla, escuchar su guitarra y escuchar la guitarra de Friend. Friend puede elegir una mezcla distinta.

## Decisión

La mezcla de monitoreo pertenece al estado de vista/sesión del participante, no a la definición global de la pista.

Cada track mantiene propiedades de publicación/recording y cada participante mantiene su routing de monitorización.

Separar:

- monitor;
- transmit;
- record arm;
- mute;
- subscribe/receive;
- gain/pan.

## Consecuencias

### Positivas

- Mezcla individual por músico.
- Grabación independiente del monitor.
- Posibilidad de recibir pero mutear.
- Posibilidad de dejar de recibir para ahorrar recursos.
- Escalabilidad a más participantes.

### Costes

- Más estado.
- Más pruebas de combinación.
- Mayor complejidad en la UI del mixer.

## Regla

Nunca colapsar estos estados en un único booleano `enabled`.

**Mute ≠ Unsubscribe.** Ver [`../specs/AUDIO-MONITOR-MIX.md`](../specs/AUDIO-MONITOR-MIX.md).
