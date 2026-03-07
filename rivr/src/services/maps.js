// OpenStreetMap Overpass API wrapper for real facility data

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS = 50000; // 50km
const AVG_CITY_SPEED_KMH = 40;
const ROAD_FACTOR = 1.3; // road distance ≈ 1.3x straight-line

const QUERY_TAGS = {
  hospital: '["amenity"="hospital"]["emergency"="yes"]',
  er:       '["amenity"="hospital"]["emergency"="yes"]',
  walkin:   '["amenity"="clinic"]',
  pharmacy: '["amenity"="pharmacy"]',
};

const FALLBACK_NAMES = {
  hospital: 'General Hospital',
  er:       'General Hospital',
  walkin:   'Medical Clinic',
  pharmacy: 'Local Pharmacy',
};

// Haversine distance in km
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function estimateDriveTime(distanceKm) {
  return Math.max(1, Math.round((distanceKm * ROAD_FACTOR) / AVG_CITY_SPEED_KMH * 60));
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, enableHighAccuracy: true },
    );
  });
}

export async function fetchNearbyFacilities(type, lat, lng) {
  const queryTag = QUERY_TAGS[type];
  if (!queryTag) return [];

  const query = `
    [out:json][timeout:25];
    (
      node${queryTag}(around:${SEARCH_RADIUS},${lat},${lng});
      way${queryTag}(around:${SEARCH_RADIUS},${lat},${lng});
      relation${queryTag}(around:${SEARCH_RADIUS},${lat},${lng});
    );
    out center;
  `;

  try {
    const res = await fetch(OVERPASS_URL, { method: 'POST', body: query });
    if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
    const data = await res.json();

    const facilities = [];
    for (const el of data.elements) {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat == null || elLng == null) continue;

      const distance = calculateDistance(lat, lng, elLat, elLng);
      const driveTime = estimateDriveTime(distance);
      const name = el.tags?.name;

      facilities.push({
        id: el.id,
        name: name || FALLBACK_NAMES[type],
        hasRealName: !!name,
        address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
          .filter(Boolean).join(' ') || 'Address unavailable',
        phone: el.tags?.phone || null,
        lat: elLat,
        lng: elLng,
        distance,
        driveDistance: `${distance} km`,
        driveTime: `${driveTime} min drive`,
        open: true,
      });
    }

    return facilities.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Overpass API Error:', error);
    return [];
  }
}

export function getDirectionsUrl(address, lat, lng) {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address);
}
