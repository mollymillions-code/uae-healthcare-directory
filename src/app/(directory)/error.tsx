"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-black/40 mb-6">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="btn-accent px-6 py-2 rounded-lg">Try again</button>
    </div>
  );
}
