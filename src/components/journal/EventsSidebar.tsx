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
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-4">
        Upcoming Events
      </h3>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={event.id}>
            {i > 0 && <div className="border-b border-light-200 my-3" />}
            <div className="flex gap-3">
              <div className="shrink-0 w-12 text-center">
                <div className="font-sans text-xl font-bold text-dark leading-none">
                  {new Date(event.date).getDate()}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted mt-0.5">
                  {new Date(event.date).toLocaleDateString("en-GB", { month: "short" })}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="font-sans text-sm font-semibold text-dark leading-snug">
                  {event.name}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted" />
                  <span className="text-xs text-muted">{event.location}</span>
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
