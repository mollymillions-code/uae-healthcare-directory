interface GoogleMapEmbedProps {
  query: string;
  placeId?: string | null;
  className?: string;
}

export function GoogleMapEmbed({ query, className = "" }: GoogleMapEmbedProps) {
  // Free Google Maps embed — no API key required
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

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
