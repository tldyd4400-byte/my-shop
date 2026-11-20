import { STORE } from "./store.ts";

export const LOCATION_MAP = {
  src: "/images/eomeuittul/openstreetmap-location-pin.png",
  alt: `OpenStreetMap 지도에 표시한 ${STORE.name} 위치: ${STORE.address}`,
  width: 1200,
  height: 774,
} as const;
