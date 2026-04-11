export default function ReportLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 animate-pulse">
      <div className="border-b-2 border-[#1c1c1c]" />
      <div className="h-3 w-40 bg-black/10 mt-8 mb-4 rounded" />
      <div className="h-12 w-3/4 bg-black/10 mb-3 rounded" />
      <div className="h-12 w-2/3 bg-black/10 mb-6 rounded" />
      <div className="h-5 w-1/2 bg-black/10 mb-8 rounded" />

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.05] rounded-r-xl px-6 py-5 max-w-3xl mb-8">
        <div className="h-3 w-24 bg-[#006828]/30 rounded mb-3" />
        <div className="h-5 w-5/6 bg-black/10 rounded mb-2" />
        <div className="h-5 w-3/5 bg-black/10 rounded" />
      </div>

      <div className="flex gap-3 mb-10">
        <div className="h-11 w-44 bg-[#006828]/20 rounded-full" />
        <div className="h-11 w-36 bg-black/10 rounded-full" />
        <div className="h-11 w-36 bg-black/10 rounded-full" />
      </div>

      <div className="relative w-full aspect-[16/8] bg-black/[0.05] rounded-2xl mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <aside>
          <div className="h-3 w-32 bg-[#006828]/30 rounded mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-4/5 bg-black/10 rounded" />
            ))}
          </div>
        </aside>
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-black/10 rounded ${
                i % 4 === 0 ? "w-full" : i % 4 === 1 ? "w-11/12" : i % 4 === 2 ? "w-10/12" : "w-8/12"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
