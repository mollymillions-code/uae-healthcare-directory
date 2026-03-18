interface GoogleMapEmbedProps {
  query: string;
  placeId?: string | null;
  className?: string;
}

export function GoogleMapEmbed({ query, placeId, className = "" }: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // If no API key, show a static map placeholder
  if (!apiKey) {
    return (
      <div className={`bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm ${className}`} style={{ minHeight: "300px" }}>
        <div className="text-center p-4">
          <p className="font-medium">Map Preview</p>
          <p className="text-xs mt-1">Google Maps API key required</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId ? `&query_place_id=${placeId}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:text-brand-700 text-xs mt-2 inline-block"
          >
            View on Google Maps
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
      className={`rounded-xl ${className}`}
    />
  );
}
