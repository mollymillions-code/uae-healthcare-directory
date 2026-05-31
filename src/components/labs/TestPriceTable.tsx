import Link from "next/link";
import { Home } from "lucide-react";
import type { TestPriceComparison } from "@/lib/labs";

interface TestPriceTableProps {
  comparison: TestPriceComparison;
}

export function TestPriceTable({ comparison }: TestPriceTableProps) {
  const { prices } = comparison;

  if (prices.length === 0) return null;

  return (
    <div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left py-3 px-3 font-bold text-[#1c1c1c]">Lab</th>
              <th className="text-center py-3 px-3 font-bold text-[#1c1c1c]">Home Collection</th>
              <th className="text-center py-3 px-3 font-bold text-[#1c1c1c]">Accreditations</th>
              <th className="text-right py-3 px-3 font-bold text-[#1c1c1c]" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={p.labSlug} className={i % 2 === 0 ? "bg-[#f8f8f6]" : ""}>
                <td className="py-2.5 px-3">
                  <Link href={`/labs/${p.labSlug}`} className="text-xs font-medium text-[#1c1c1c] hover:text-[#006828] transition-colors">
                    {p.labName}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {p.homeCollection ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#1c1c1c]">
                      <Home className="w-3 h-3 text-[#006828]" />
                      Available
                    </span>
                  ) : (
                    <span className="text-[11px] text-black/40">Walk-in only</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {p.accreditations.slice(0, 2).map((a) => (
                      <span key={a} className="text-[9px] bg-[#f8f8f6] text-[#1c1c1c] px-1 py-0.5 font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Link
                    href={`/labs/${p.labSlug}`}
                    className="text-[11px] font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
                  >
                    View lab →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-black/40 mt-3">Contact each lab directly for current pricing.</p>
    </div>
  );
}
