# 06 — Interfaces y dispositivos en el browser

## En una frase

El browser ve **dispositivos lógicos**, no jacks físicos. Un perfil de hardware es una **pista**, no la verdad absoluta.

## Flujo CollaboDAW

```text
enumerateDevices()
    → permiso getUserMedia()
    → refresh devices
    → elegir input/output
    → getSettings() del track
    → perfil conocido (UMC22, Scarlett…) o genérico
    → ChannelMapper + overrides manuales
```

## Targets iniciales

| Interfaz | Notas |
| --- | --- |
| Behringer UMC22 | Direct Monitor / MIX knob |
| Focusrite Scarlett Solo 3rd/4th | Direct Monitor |
| Focusrite iTrack Solo | Perfil + validación runtime |

## Trampas comunes

| Síntoma | Causa probable |
| --- | --- |
| Path ms alto con interfaz conectada | Salida en **Realtek**, no en interfaz |
| Solo un canal con señal | Canal expuesto ≠ jack físico |
| Latencia “random” | Bluetooth, WiFi, driver genérico |

## Prueba: Learn Input

1. Audio Lab → Learn Input en un jack.
2. Tocá solo ese jack.
3. La app elige el canal con más energía **expuesto por el browser**.
4. Guardá override si no coincide con la etiqueta física.

## setSinkId

Chromium puede enviar salida del AudioContext a un dispositivo específico.

- Primary output = interfaz → suele bajar sorpresas de mezcla Windows
- Dual sink = primary + `<audio>` secundario (no sample-locked)

## Constraints conservadores

```ts
{
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: { ideal: 2 },
  sampleRate: { ideal: 48000 },
}
```

El browser puede ignorar constraints — siempre leer `track.getSettings()`.

## Referencias

- `docs/DEVICE-COMPATIBILITY.md`
- `.cursor/skills/device-compatibility/SKILL.md`
