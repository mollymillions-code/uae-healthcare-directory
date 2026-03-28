import Link from "next/link";
import { Home, TrendingDown } from "lucide-react";
import type { TestPriceComparison } from "@/lib/labs";
import { formatPrice } from "@/lib/labs";

interface TestPriceTableProps {
  comparison: TestPriceComparison;
}

export function TestPriceTable({ comparison }: TestPriceTableProps) {
  const { test, prices, priceRange } = comparison;

  return (
    <div>
      {/* Savings banner */}
      {priceRange.savings > 0 && (
        <div className="bg-[#006828]/[0.04] border border-[#006828]/20 p-3 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[#006828] flex-shrink-0" />
          <p className="text-xs text-[#1c1c1c]">
            Save up to <strong className="text-[#006828]">{formatPrice(priceRange.savings)}</strong>{" "}
            ({priceRange.savingsPercent}%) by comparing {prices.length} labs for {test.shortName}
          </p>
        </div>
      )}

      {/* Price table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left py-3 px-3 font-bold text-[#1c1c1c]">Lab</th>
              <th className="text-right py-3 px-3 font-bold text-[#1c1c1c]">Price</th>
              <th className="text-center py-3 px-3 font-bold text-[#1c1c1c]">Home Collection</th>
              <th className="text-center py-3 px-3 font-bold text-[#1c1c1c]">Accreditations</th>
              <th className="text-right py-3 px-3 font-bold text-[#1c1c1c]" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={p.labSlug} className={`${i % 2 === 0 ? "bg-[#f8f8f6]" : ""} ${p.isCheapest ? "ring-1 ring-accent/30" : ""}`}>
                <td className="py-2.5 px-3">
                  <Link href={`/labs/${p.labSlug}`} className="text-xs font-medium text-[#1c1c1c] hover:text-[#006828] transition-colors">
                    {p.labName}
                  </Link>
                  {p.isCheapest && (
                    <span className="ml-2 text-[9px] bg-[#006828] text-white px-1.5 py-0.5 font-bold uppercase">
                      Cheapest
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`text-sm font-bold ${p.isCheapest ? "text-[#006828]" : "text-[#1c1c1c]"}`}>
                    {formatPrice(p.price)}
                  </span>
                  {p.discountedPrice && (
                    <span className="block text-[10px] text-black/40 line-through">
                      {formatPrice(p.discountedPrice)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {p.homeCollection ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#1c1c1c]">
                      <Home className="w-3 h-3 text-[#006828]" />
                      {p.homeCollectionFee === 0 ? "Free" : `AED ${p.homeCollectionFee}`}
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
    </div>
  );
}
