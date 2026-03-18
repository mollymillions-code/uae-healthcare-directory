import { MapPin } from "lucide-react";

interface GoogleMapEmbedProps {
  query: string;
  placeId?: string | null;
  className?: string;
}

export function GoogleMapEmbed({ query, placeId, className = "" }: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // If no API key, show a styled dark placeholder with green CTA
  if (!apiKey) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId ? `&query_place_id=${placeId}` : ""}`;
    return (
      <div className={`bg-dark flex flex-col items-center justify-center ${className}`} style={{ minHeight: "300px" }}>
        <div className="text-center p-6">
          <div className="h-12 w-12 bg-dark-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-accent" />
          </div>
          <p className="text-white/60 text-sm mb-4">Interactive map preview</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  const src = placeId
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;

  return (
    <iframe
      width="100%"
      height="300"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={src}
      title={`Map showing location of ${query}`}
      className={className}
    />
  );
}
