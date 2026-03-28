"use client";

import Link from "next/link";
import { formatPrice, type LabComparison } from "@/lib/labs";

interface LabComparisonTableProps {
  comparison: LabComparison;
}

export function LabComparisonTable({ comparison }: LabComparisonTableProps) {
  const { labs, priceMatrix } = comparison;

  if (priceMatrix.length === 0) {
    return (
      <p className="text-sm text-black/40 text-center py-6">
        No common tests found between these labs to compare.
      </p>
    );
  }

  // Count cheapest wins per lab
  const cheapestCounts = new Map<string, number>();
  for (const row of priceMatrix) {
    if (row.cheapestLabSlug) {
      cheapestCounts.set(row.cheapestLabSlug, (cheapestCounts.get(row.cheapestLabSlug) || 0) + 1);
    }
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-4">
        {labs.map((lab) => (
          <div key={lab.slug} className="bg-[#f8f8f6] px-3 py-2 border border-black/[0.06]">
            <Link href={`/labs/${lab.slug}`} className="text-xs font-bold text-[#1c1c1c] hover:text-[#006828]">
              {lab.name}
            </Link>
            <p className="text-[10px] text-black/40">
              Cheapest in {cheapestCounts.get(lab.slug) || 0} of {priceMatrix.length} tests
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left py-3 px-3 font-bold text-[#1c1c1c] w-44">Test</th>
              {labs.map((lab) => (
                <th key={lab.slug} className="text-center py-3 px-3 font-bold text-[#1c1c1c]">
                  <Link href={`/labs/${lab.slug}`} className="hover:text-[#006828] transition-colors text-xs">
                    {lab.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priceMatrix.map((row, i) => (
              <tr key={row.testSlug} className={i % 2 === 0 ? "bg-[#f8f8f6]" : ""}>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/labs/test/${row.testSlug}`}
                    className="text-xs font-medium text-[#1c1c1c] hover:text-[#006828] transition-colors"
                  >
                    {row.testName}
                  </Link>
                </td>
                {row.prices.map((p) => (
                  <td
                    key={p.labSlug}
                    className={`py-2.5 px-3 text-center text-xs font-bold ${
                      p.labSlug === row.cheapestLabSlug
                        ? "text-[#006828] bg-[#006828]/[0.04]/30"
                        : "text-[#1c1c1c]"
                    }`}
                  >
                    {p.price !== null ? formatPrice(p.price) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
