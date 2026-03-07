// Google Maps / Places API wrapper
// Using Leaflet + OpenStreetMap (free, no API key) instead of Google Maps

export function getMockFacilities(type) {
  const facilities = {
    pharmacy: [
      { name: 'Shoppers Drug Mart', address: '75 King St S, Waterloo, ON', distance: '0.8 km', open: true, hours: '8 AM - 10 PM', phone: '(519) 886-1010', rating: 4.2, lat: 43.4630, lng: -80.5220 },
      { name: 'Rexall', address: '220 King St N, Waterloo, ON', distance: '1.2 km', open: true, hours: '9 AM - 9 PM', phone: '(519) 888-7200', rating: 4.0, lat: 43.4700, lng: -80.5240 },
      { name: 'Pharmasave', address: '91 King St N, Waterloo, ON', distance: '1.5 km', open: false, hours: '9 AM - 6 PM', phone: '(519) 745-2200', rating: 4.5, lat: 43.4675, lng: -80.5190 },
    ],
    walkin: [
      { name: 'K-W Walk-In Clinic', address: '455 Highland Rd W, Kitchener, ON', distance: '2.1 km', open: true, hours: '8 AM - 8 PM', phone: '(519) 742-4455', rating: 3.8, lat: 43.4480, lng: -80.5080 },
      { name: 'Grand River Walk-In', address: '185 King St S, Waterloo, ON', distance: '0.9 km', open: true, hours: '9 AM - 5 PM', phone: '(519) 880-1234', rating: 4.1, lat: 43.4610, lng: -80.5215 },
      { name: 'Fairway Medical Clinic', address: '710 Belmont Ave W, Kitchener, ON', distance: '3.4 km', open: false, hours: '8:30 AM - 4:30 PM', phone: '(519) 743-6131', rating: 4.3, lat: 43.4350, lng: -80.5000 },
    ],
  };

  return facilities[type] || [];
}

export function getDirectionsUrl(address) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address);
}
