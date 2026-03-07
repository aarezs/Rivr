export const erWaitTimes = [
  {
    id: 'grand-river',
    name: 'Grand River Hospital',
    address: '835 King St W, Kitchener, ON N2G 1G3',
    phone: '(519) 749-4300',
    lat: 43.4500,
    lng: -80.5100,
    waitTimeMinutes: 210,
    waitTimeDisplay: '3.5 hrs',
    distance: null, // calculated at runtime
    capacity: 'High',
    departmentStatus: 'Open',
  },
  {
    id: 'st-marys',
    name: "St. Mary's General Hospital",
    address: '911 Queen\'s Blvd, Kitchener, ON N2M 1B2',
    phone: '(519) 744-3311',
    lat: 43.4420,
    lng: -80.4770,
    waitTimeMinutes: 168,
    waitTimeDisplay: '2.8 hrs',
    distance: null,
    capacity: 'Moderate',
    departmentStatus: 'Open',
  },
  {
    id: 'cambridge-memorial',
    name: 'Cambridge Memorial Hospital',
    address: '700 Coronation Blvd, Cambridge, ON N1R 3G2',
    phone: '(519) 621-2330',
    lat: 43.3770,
    lng: -80.3260,
    waitTimeMinutes: 90,
    waitTimeDisplay: '1.5 hrs',
    distance: null,
    capacity: 'Low',
    departmentStatus: 'Open',
  },
];

export function getERsSortedByWait() {
  return [...erWaitTimes].sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes);
}

export function getRecommendedER() {
  return getERsSortedByWait()[0];
}
