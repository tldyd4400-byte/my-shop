import Image from "next/image";

import { LOCATION_MAP } from "@/lib/content/location-map";

export function MapAttribution() {
  return (
    <a className="map-attribution" href="https://www.openstreetmap.org/copyright">
      © OpenStreetMap contributors
    </a>
  );
}

export function LocationMap({ className, sizes }: { className?: string; sizes: string }) {
  return (
    <figure className={className}>
      <Image {...LOCATION_MAP} alt={LOCATION_MAP.alt} sizes={sizes} />
      <figcaption><MapAttribution /></figcaption>
    </figure>
  );
}
