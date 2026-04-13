"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const API_BASE = "https://api.almostcrackd.ai";

export function TestRunner({ flavorIds }: { flavorIds: string[] }) {
  const [flavorId, setFlavorId] = useState(flavorIds[0] ?? "");
  const [imageId, setImageId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">("idle");
  const [captions, setCaptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status === "done" && resultsRef.current) {
      setFlash(true);
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const t = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [status, captions]);

  const runTest = async () => {
    if (!imageId.trim()) {
      setError("Enter an image ID");
      return;
    }
    setStatus("loading");
    setError("");
    setCaptions([]);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError("Not logged in");
      setStatus("err");
      return;
    }

    try {
      const body: Record<string, string> = { imageId: imageId.trim() };
      if (flavorId) body.humor_flavor_id = flavorId;

      const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [data];
      const texts = list.map((c: { caption?: string; content?: string; text?: string }) =>
        String(c.caption ?? c.content ?? c.text ?? JSON.stringify(c))
      );
      setCaptions(texts);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStatus("err");
    }
  };

  const imageIdValid = imageId.trim().length > 0;

  return (
    <div className="mt-6 space-y-4">
      {/* Inputs */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Humor flavor
          </label>
          <select
            value={flavorId}
            onChange={(e) => setFlavorId(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">— None —</option>
            {flavorIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Image ID
          </label>
          <input
            type="text"
            value={imageId}
            onChange={(e) => setImageId(e.target.value)}
            placeholder="Paste an image UUID"
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          {!imageIdValid && status === "idle" && (
            <p className="mt-1 text-xs text-slate-400">Paste a valid image UUID before generating.</p>
          )}
        </div>
        <button
          type="button"
          onClick={runTest}
          disabled={status === "loading" || !imageIdValid}
          className="rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Generating…" : "Generate captions"}
        </button>
      </div>

      {/* Loading state with timer and progress */}
      {status === "loading" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Generating captions…
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {elapsed}s elapsed — this can take 15–30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/30">
          <p className="font-medium text-red-700 dark:text-red-300">Something went wrong</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results with flash highlight */}
      {captions.length > 0 && (
        <div
          ref={resultsRef}
          className={`rounded-xl border p-4 transition-all duration-700 ${
            flash
              ? "border-green-400 bg-green-50 shadow-lg shadow-green-200/50 dark:border-green-600 dark:bg-green-900/30 dark:shadow-green-900/30"
              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Captions produced
            </h2>
            {status === "done" && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-800 dark:text-green-300">
                Done — {captions.length} caption{captions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-slate-800 dark:text-slate-200">
            {captions.map((cap, i) => (
              <li key={i}>{cap}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
