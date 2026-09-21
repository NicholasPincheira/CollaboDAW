# Technical Sources Consulted

The architecture in this package was checked against current official/vendor documentation on 2026-09-21.

## Browser audio/device APIs

- MDN — MediaDevices.enumerateDevices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
- MDN — AudioWorklet: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- MDN — AudioContext / baseLatency: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- MDN — AudioContext.setSinkId: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/setSinkId
- MDN — HTMLMediaElement.setSinkId: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
- MDN — MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

## Audio framework

- Tone.js GitHub: https://github.com/Tonejs/Tone.js/

## Realtime

- LiveKit JavaScript SDK v2 documentation: https://docs.livekit.io/reference/client-sdk-js/

## Persistence / Realtime state

- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Broadcast: https://supabase.com/docs/guides/realtime/broadcast

## Deployment

- Cloudflare Pages + React: https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/

## Hardware

- Focusrite iTrack Solo user guide: https://fael-downloads-prod.focusrite.com/customer/dev/s3fs-public/focusrite/downloads/8183/itrack-solo-user-guide-03.pdf
- Focusrite iTrack Solo Windows driver support: https://support.focusrite.com/hc/en-gb/articles/13070702714130-Focusrite-Windows-Driver-Release-Notes
- Focusrite driver download information: https://support.focusrite.com/hc/en-gb/articles/211881185-Download-Focusrite-interface-drivers
- Focusrite Scarlett Solo 3rd Gen product/specs: https://focusrite.com/products/scarlett-solo-3rd-gen
- Focusrite Scarlett Solo 3rd Gen specifications: https://userguides.focusrite.com/hc/en-gb/articles/23031457381138-Solo-3rd-Gen-specifications
- Focusrite Scarlett Solo 4th Gen specifications: https://userguides.focusrite.com/hc/es/articles/17505454908562-Especificaciones-de-Solo-4th-Gen
- Behringer UMC22 product page: https://www.behringer.com/en/products/0805-AAJ

## Important source interpretation note

Hardware profiles are intentionally treated as defaults rather than absolute browser channel guarantees. The actual browser stream and `MediaStreamTrack.getSettings()` result remain authoritative.
