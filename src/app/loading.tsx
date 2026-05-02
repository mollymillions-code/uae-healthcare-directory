export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-surface-cream px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-white">
            Z
          </span>
        </div>
        <span className="font-sans text-z-body-sm font-semibold text-ink">Loading</span>
      </div>
    </div>
  );
}
