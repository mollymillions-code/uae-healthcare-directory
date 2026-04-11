export default function Loading() {
  return (
    <div
      className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-4 w-48 animate-pulse rounded bg-black/[0.06]" />
      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-black/[0.04]" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-black/[0.04]" />
    </div>
  );
}
