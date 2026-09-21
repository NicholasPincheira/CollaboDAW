import { useState, type FormEvent } from "react";
import { unlockStudio } from "../infrastructure/session/studio-access.ts";

export function StudioUnlockGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (unlockStudio(code)) {
      setError(null);
      onUnlocked();
      return;
    }
    setError("Wrong studio key.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-studio-fog">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-studio-line bg-studio-panel/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <p className="text-xs tracking-[0.28em] text-studio-amber uppercase">MiniDAW</p>
        <h1 className="mt-2 text-2xl font-semibold">Studio access</h1>
        <p className="mt-2 text-sm text-studio-mist">
          Enter the studio key to open the sessions dashboard. Keys are listed in{" "}
          <code className="text-studio-accent">docs/ACCESS.md</code>.
        </p>
        <label className="mt-5 block text-xs tracking-[0.14em] text-studio-dim uppercase">
          Studio key
          <input
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Studio key"
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-studio-amber" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-studio-fog px-5 py-3 text-sm font-semibold text-studio-bg"
        >
          Unlock dashboard
        </button>
      </form>
    </div>
  );
}
