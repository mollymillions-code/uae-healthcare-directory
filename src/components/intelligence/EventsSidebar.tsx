import type { JournalEvent } from "@/lib/intelligence/types";
import { formatDateShort } from "./utils";
import { MapPin, ExternalLink } from "lucide-react";

interface EventsSidebarProps {
  events: JournalEvent[];
}

export function EventsSidebar({ events }: EventsSidebarProps) {
  if (events.length === 0) return null;

  return (
    <aside>
      <h3 className="font-['Geist',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#006828] mb-4">
        Upcoming Events
      </h3>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={event.id}>
            {i > 0 && <div className="border-b border-black/[0.06] my-3" />}
            <div className="flex gap-3">
              <div className="shrink-0 w-12 text-center">
                <div className="font-['Geist',sans-serif] text-xl font-bold text-[#1c1c1c] leading-none">
                  {new Date(event.date).getDate()}
                </div>
                <div className="font-['Geist',sans-serif] text-[9px] uppercase tracking-wider text-black/40 mt-0.5">
                  {new Date(event.date).toLocaleDateString("en-GB", { month: "short" })}
                </div>
              </div>
              <div className="min-w-0">
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5"
                  >
                    <h4 className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] leading-snug group-hover:text-[#006828] transition-colors">
                      {event.name}
                    </h4>
                    <ExternalLink className="h-3 w-3 text-black/40 group-hover:text-[#006828] transition-colors shrink-0 mt-0.5" />
                  </a>
                ) : (
                  <h4 className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] leading-snug">
                    {event.name}
                  </h4>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-black/40" />
                  <span className="text-xs text-black/40">{event.location}</span>
                </div>
                {event.endDate && (
                  <span className="text-[10px] text-black/40 mt-1 block">
                    {formatDateShort(event.date)} – {formatDateShort(event.endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
