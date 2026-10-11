/**
 * Geolocation and Haversine Distance Calculations for CareConnect
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const SEARCH_RADIUS_TIERS = [2, 5, 10, 15]; // in kilometers

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns the next expansion radius in km, or null if maximum reached (15km)
 */
export function getNextRadius(currentRadius: number): number | null {
  const currentIndex = SEARCH_RADIUS_TIERS.indexOf(currentRadius);
  if (currentIndex === -1) {
    // Default to first tier if not found
    return SEARCH_RADIUS_TIERS[0];
  }
  if (currentIndex < SEARCH_RADIUS_TIERS.length - 1) {
    return SEARCH_RADIUS_TIERS[currentIndex + 1];
  }
  return null; // Reached maximum (15km)
}

/**
 * Helper to extract lat and lon from GeoLocation Point [lon, lat]
 */
export function pointToCoords(point: { type: string; coordinates: [number, number] }): Coordinates {
  return {
    longitude: point.coordinates[0],
    latitude: point.coordinates[1],
  };
}

/**
 * Convert lat/lon to GeoLocation Point [lon, lat]
 */
export function coordsToPoint(coords: Coordinates) {
  return {
    type: 'Point' as const,
    coordinates: [coords.longitude, coords.latitude] as [number, number],
  };
}
