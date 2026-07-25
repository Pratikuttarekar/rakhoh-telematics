// Haversine formula for spherical distance calculations
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

export function isWithinGeofence(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number = 100
): boolean {
  const distMeters = calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);
  return distMeters <= radiusMeters;
}

export function calculateETA(distanceKm: number, speedKmh: number): number {
  if (speedKmh <= 0 || distanceKm <= 0) return 0;
  // Convert hours to minutes
  return Math.round((distanceKm / speedKmh) * 60);
}

export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (toDeg(theta) + 360) % 360;
  return parseFloat(bearing.toFixed(1));
}

export function interpolatePosition(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  fraction: number
): [number, number] {
  const lat = lat1 + (lat2 - lat1) * fraction;
  const lon = lon1 + (lon2 - lon1) * fraction;
  return [lat, lon];
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
