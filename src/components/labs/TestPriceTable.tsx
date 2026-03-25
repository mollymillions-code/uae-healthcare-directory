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
        <div className="bg-accent-muted border border-accent/20 p-3 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-xs text-dark">
            Save up to <strong className="text-accent">{formatPrice(priceRange.savings)}</strong>{" "}
            ({priceRange.savingsPercent}%) by comparing {prices.length} labs for {test.shortName}
          </p>
        </div>
      )}

      {/* Price table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b-2 border-dark">
              <th className="text-left py-3 px-3 font-bold text-dark">Lab</th>
              <th className="text-right py-3 px-3 font-bold text-dark">Price</th>
              <th className="text-center py-3 px-3 font-bold text-dark">Home Collection</th>
              <th className="text-center py-3 px-3 font-bold text-dark">Accreditations</th>
              <th className="text-right py-3 px-3 font-bold text-dark" />
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={p.labSlug} className={`${i % 2 === 0 ? "bg-light-50" : ""} ${p.isCheapest ? "ring-1 ring-accent/30" : ""}`}>
                <td className="py-2.5 px-3">
                  <Link href={`/labs/${p.labSlug}`} className="text-xs font-medium text-dark hover:text-accent transition-colors">
                    {p.labName}
                  </Link>
                  {p.isCheapest && (
                    <span className="ml-2 text-[9px] bg-accent text-white px-1.5 py-0.5 font-bold uppercase">
                      Cheapest
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`text-sm font-bold ${p.isCheapest ? "text-accent" : "text-dark"}`}>
                    {formatPrice(p.price)}
                  </span>
                  {p.discountedPrice && (
                    <span className="block text-[10px] text-muted line-through">
                      {formatPrice(p.discountedPrice)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {p.homeCollection ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-dark">
                      <Home className="w-3 h-3 text-accent" />
                      {p.homeCollectionFee === 0 ? "Free" : `AED ${p.homeCollectionFee}`}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">Walk-in only</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {p.accreditations.slice(0, 2).map((a) => (
                      <span key={a} className="text-[9px] bg-light-100 text-dark px-1 py-0.5 font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Link
                    href={`/labs/${p.labSlug}`}
                    className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
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
