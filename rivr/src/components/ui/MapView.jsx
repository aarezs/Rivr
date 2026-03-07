import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Clock, Phone, Navigation, Star } from 'lucide-react';
import { getDirectionsUrl } from '../../services/maps';

// Fix default marker icons in Leaflet + bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom colored marker
function createColoredIcon(color) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: '<div style="background:' + color + '; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"><div style="width:8px; height:8px; background:white; border-radius:50%;"></div></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Recommended marker (with star)
function createRecommendedIcon(color) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: '<div style="background:' + color + '; width:36px; height:36px; border-radius:50%; border:3px solid #FFD700; box-shadow:0 2px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; position:relative;"><div style="width:10px; height:10px; background:white; border-radius:50%;"></div><div style="position:absolute; top:-8px; right:-4px; background:#FFD700; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px;">★</div></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// Component to auto-fit map bounds
function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const validLocs = locations.filter(l => l.lat && l.lng);
      if (validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [locations, map]);
  return null;
}

// Component to show user location
function UserLocation() {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
      },
      () => {
        // Default to Waterloo, ON
        setPosition([43.4643, -80.5204]);
      }
    );
  }, [map]);

  if (!position) return null;

  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div style="width:16px; height:16px; background:#4285F4; border-radius:50%; border:3px solid white; box-shadow:0 0 0 3px rgba(66,133,244,0.3);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return <Marker position={position} icon={userIcon} />;
}

// Calculate mock driving distance & time from user location (Waterloo center) to facility
function calcMockDriving(facility) {
  const userLat = 43.4643;
  const userLng = -80.5204;
  if (!facility.lat || !facility.lng) return { driveDistance: null, driveTime: null };
  // Haversine approximation
  const R = 6371;
  const dLat = (facility.lat - userLat) * Math.PI / 180;
  const dLng = (facility.lng - userLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(facility.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Road distance is ~1.3x straight-line
  const roadKm = Math.round(straightKm * 1.3 * 10) / 10;
  // Assume average 40 km/h city driving
  const driveMin = Math.max(1, Math.round(roadKm / 40 * 60));
  return { driveDistance: roadKm + ' km', driveTime: driveMin + ' min drive' };
}

export default function MapView({ facilities, type, showWaitTimes = false }) {
  const typeColors = {
    pharmacy: '#2E9BDA',
    walkin: '#ECC94B',
    er: '#F56565',
  };
  const color = typeColors[type] || '#2E9BDA';

  // Enrich facilities with mock driving info
  const enrichedFacilities = facilities.map(f => {
    const driving = calcMockDriving(f);
    return { ...f, driveDistance: driving.driveDistance, driveTime: driving.driveTime };
  });

  // Default center: Waterloo, ON
  const defaultCenter = [43.4643, -80.5204];
  const hasCoords = enrichedFacilities.some(f => f.lat && f.lng);

  return (
    <div className="space-y-3">
      {/* Interactive Map */}
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: '240px' }}>
        <MapContainer
          center={hasCoords ? [enrichedFacilities[0].lat, enrichedFacilities[0].lng] : defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <UserLocation />
          {hasCoords && <FitBounds locations={enrichedFacilities} />}
          {enrichedFacilities.map((facility, index) => {
            if (!facility.lat || !facility.lng) return null;
            const icon = facility.recommended
              ? createRecommendedIcon(color)
              : createColoredIcon(color);
            return (
              <Marker
                key={index}
                position={[facility.lat, facility.lng]}
                icon={icon}
              >
                <Popup>
                  <div style={{ color: '#1A2332', minWidth: '180px' }}>
                    <strong>{facility.name}</strong>
                    <br />
                    <span style={{ fontSize: '12px' }}>{facility.address}</span>
                    {facility.driveTime && (
                      <><br /><span style={{ fontSize: '12px', color: '#4A5568' }}>{facility.driveDistance} &middot; {facility.driveTime}</span></>
                    )}
                    {showWaitTimes && facility.waitTimeDisplay && (
                      <><br /><span style={{ fontSize: '12px', color: '#E53E3E' }}>Wait: {facility.waitTimeDisplay}</span></>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Facility list */}
      <div className="space-y-2">
        {enrichedFacilities.map((facility, index) => (
          <div
            key={index}
            className="glass rounded-xl p-4 transition-all duration-300 hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white text-sm truncate">{facility.name}</h4>
                  {facility.recommended && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                      ★ Best
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-text-light text-xs mb-2">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{facility.address}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {(facility.driveDistance || facility.distance) && (
                    <span className="flex items-center gap-1 text-text-light">
                      <Navigation className="w-3 h-3" /> {facility.driveDistance || facility.distance}
                    </span>
                  )}
                  {facility.driveTime && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Clock className="w-3 h-3" /> {facility.driveTime}
                    </span>
                  )}
                  {facility.hours && (
                    <span className="flex items-center gap-1 text-text-light">
                      <Clock className="w-3 h-3" /> {facility.hours}
                    </span>
                  )}
                  {facility.open !== undefined && (
                    <span className={'font-medium ' + (facility.open ? 'text-success' : 'text-danger')}>
                      {facility.open ? '● Open' : '● Closed'}
                    </span>
                  )}
                  {showWaitTimes && facility.waitTimeDisplay && (
                    <span className="flex items-center gap-1 text-warning font-medium">
                      <Clock className="w-3 h-3" /> {facility.waitTimeDisplay}
                    </span>
                  )}
                </div>
              </div>

              <a
                href={getDirectionsUrl(facility.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: color + '20', color: color }}
              >
                <Navigation className="w-5 h-5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
