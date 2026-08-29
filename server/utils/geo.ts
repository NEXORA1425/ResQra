/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

/**
 * Calculates estimated travel ETA in minutes based on distance and emergency vehicle speed.
 * Assumes urban emergency speed of ~35 km/h with traffic factors.
 */
export function calculateETA(distanceKm: number, speedKmH: number = 38): number {
  if (distanceKm <= 0) return 2;
  const rawMinutes = (distanceKm / speedKmH) * 60;
  // Add 1.5 - 2.5 min dispatch readiness lag
  const eta = Math.ceil(rawMinutes + 2);
  return Math.max(eta, 2);
}
