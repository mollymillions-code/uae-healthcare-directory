import type { JournalEvent } from "@/lib/journal/types";
import { formatDateShort } from "./utils";
import { MapPin } from "lucide-react";

interface EventsSidebarProps {
  events: JournalEvent[];
}

export function EventsSidebar({ events }: EventsSidebarProps) {
  if (events.length === 0) return null;

  return (
    <aside>
      <h3 className="font-kicker text-[10px] uppercase tracking-[0.15em] text-gold mb-4">
        Upcoming Events
      </h3>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={event.id}>
            {i > 0 && <div className="rule my-3" />}
            <div className="flex gap-3">
              <div className="shrink-0 w-12 text-center">
                <div className="font-display text-xl font-bold text-ink leading-none">
                  {new Date(event.date).getDate()}
                </div>
                <div className="font-kicker text-[9px] uppercase tracking-wider text-ink-muted mt-0.5">
                  {new Date(event.date).toLocaleDateString("en-GB", { month: "short" })}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-sm font-semibold text-ink leading-snug">
                  {event.name}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-ink-muted" />
                  <span className="text-xs text-ink-muted">{event.location}</span>
                </div>
                {event.endDate && (
                  <span className="label mt-1 block">
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
