# Project Format

## Design goal

A MiniDAW project must be portable and serializable independently from Supabase.

Do not store raw PCM audio directly in Postgres.

## Conceptual package

```text
my-song.minidaw/
├── project.json
├── audio/
│   ├── take-001.wav
│   └── take-002.wav
├── waveforms/
└── metadata/
```

The final extension/container can evolve. The important rule is that the logical project format is independent of the database provider.

## Example project document

```json
{
  "version": 1,
  "id": "project-id",
  "name": "Friday Jam",
  "sampleRate": 48000,
  "timeSignature": {
    "numerator": 4,
    "denominator": 4
  },
  "tempoMap": [
    {
      "startBeat": 0,
      "bpm": 120
    },
    {
      "startBeat": 64,
      "bpm": 140
    }
  ],
  "tracks": [],
  "markers": [],
  "assets": []
}
```

## Track model

A track should be able to represent:

- local input;
- remote participant track;
- imported asset;
- recorded take;
- future virtual instrument.

Source type should be metadata; the UI should not duplicate the entire track model for each source.

## Persistence

Supabase Postgres stores:

- user/project metadata;
- track metadata;
- clip metadata;
- participant/session metadata;
- presets;
- asset references;
- versions.

Supabase Storage stores:

- WAV/audio assets;
- waveform caches;
- project packages when necessary.

## Versions

Use explicit project schema versions:

```text
v1
v2
v3
```

Migration functions should be deterministic and testable.
