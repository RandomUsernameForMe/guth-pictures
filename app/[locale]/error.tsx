"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Něco se pokazilo</h1>
      <p className="text-sm text-zinc-400 max-w-sm text-center">
        Omlouváme se, nastala neočekávaná chyba. Zkuste stránku načíst znovu.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
      >
        Zkusit znovu
      </button>
    </main>
  );
}
