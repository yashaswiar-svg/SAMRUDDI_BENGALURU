// maps.js — Google Maps Platform integration for Mitra NammaEco
// Uses: Places API (Nearby Search) + Distance Matrix API
// Finds real wholesale markets near the worker and calculates trip savings

const axios = require('axios');

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Known wholesale/sabji mandis in Bengaluru with their coordinates
// Fallback list used if Places API returns no results
const KNOWN_MARKETS = [
  { name: 'KR Market (Krishna Rajendra)', lat: 12.9634, lng: 77.5765, type: 'wholesale' },
  { name: 'Yeshwantpur APMC', lat: 13.0275, lng: 77.5548, type: 'wholesale' },
  { name: 'Binny Mill Road Market', lat: 12.9756, lng: 77.5720, type: 'wholesale' },
  { name: 'Jayanagar Complex Market', lat: 12.9260, lng: 77.5832, type: 'retail' },
  { name: 'Malleshwaram Market', lat: 13.0030, lng: 77.5650, type: 'retail' },
  { name: 'Commercial Street Market', lat: 12.9797, lng: 77.6090, type: 'retail' },
];

// Average auto-rickshaw fare in Bengaluru (₹ per km, 2024 rates)
const AUTO_RATE_PER_KM = 15;
const AUTO_BASE_FARE = 30;

// Typical wholesale discount vs local supplier (by item category)
const WHOLESALE_DISCOUNT = {
  vegetables: 0.28,  // 28% cheaper at wholesale
  fruits: 0.22,
  grains: 0.18,
  spices: 0.25,
  flowers: 0.30,
  default: 0.25
};

function detectItemCategory(item) {
  const lower = item.toLowerCase();
  if (/tomato|onion|potato|carrot|cabbage|brinjal|bhindi|palak|sabji|vegetable/.test(lower)) return 'vegetables';
  if (/banana|mango|apple|grape|orange|fruit/.test(lower)) return 'fruits';
  if (/rice|wheat|dal|pulses|grain/.test(lower)) return 'grains';
  if (/chilli|pepper|turmeric|coriander|spice/.test(lower)) return 'spices';
  if (/flower|jasmine|rose|marigold/.test(lower)) return 'flowers';
  return 'default';
}

// Step 1: Find nearby wholesale markets using Google Places API
async function findNearbyMarkets(lat, lng, radiusMeters = 8000) {
  if (!MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY not set — using fallback market list');
    return KNOWN_MARKETS;
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        keyword: 'wholesale market sabji mandi APMC',
        type: 'store',
        key: MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results.slice(0, 5).map(place => ({
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        placeId: place.place_id,
        rating: place.rating,
        type: 'places_api'
      }));
    }

    // Fallback to known markets if Places API returns nothing useful
    console.log('Places API returned no results, using known markets');
    return KNOWN_MARKETS;
  } catch (err) {
    console.error('Places API error:', err.message);
    return KNOWN_MARKETS;
  }
}

// Step 2: Get real travel distance + duration via Distance Matrix API
async function getTravelDistance(originLat, originLng, destinations) {
  if (!MAPS_API_KEY) {
    // Return estimated distances using Haversine formula
    return destinations.map(dest => ({
      ...dest,
      distanceKm: haversineKm(originLat, originLng, dest.lat, dest.lng),
      durationMin: null,
      source: 'haversine'
    }));
  }

  try {
    const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const response = await axios.get(url, {
      params: {
        origins: `${originLat},${originLng}`,
        destinations: destStr,
        mode: 'driving',
        units: 'metric',
        key: MAPS_API_KEY
      }
    });

    const elements = response.data.rows?.[0]?.elements || [];
    return destinations.map((dest, i) => {
      const el = elements[i];
      if (el?.status === 'OK') {
        return {
          ...dest,
          distanceKm: el.distance.value / 1000,
          durationMin: Math.round(el.duration.value / 60),
          source: 'maps_api'
        };
      }
      return {
        ...dest,
        distanceKm: haversineKm(originLat, originLng, dest.lat, dest.lng),
        durationMin: null,
        source: 'haversine_fallback'
      };
    });
  } catch (err) {
    console.error('Distance Matrix error:', err.message);
    return destinations.map(dest => ({
      ...dest,
      distanceKm: haversineKm(originLat, originLng, dest.lat, dest.lng),
      durationMin: null,
      source: 'haversine_fallback'
    }));
  }
}

// Haversine distance formula (straight-line km)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) { return deg * Math.PI / 180; }

// Step 3: Calculate auto fare (both ways)
function calcAutoFare(distanceKm) {
  return Math.round((AUTO_BASE_FARE + distanceKm * AUTO_RATE_PER_KM) * 2); // both ways
}

// Step 4: Full savings analysis — the main export
async function getSupplierSavingsAnalysis({ lat, lng, item, currentPricePerKg }) {
  // Default to Bengaluru city center if no location provided
  const workerLat = lat || 12.9716;
  const workerLng = lng || 77.5946;

  const category = detectItemCategory(item);
  const discountRate = WHOLESALE_DISCOUNT[category];
  const wholesalePrice = Math.round(currentPricePerKg * (1 - discountRate));
  const savingPerKg = currentPricePerKg - wholesalePrice;

  // Find markets and distances
  const nearbyMarkets = await findNearbyMarkets(workerLat, workerLng);
  const marketsWithDistance = await getTravelDistance(workerLat, workerLng, nearbyMarkets);

  // Sort by distance — closest first
  marketsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  const closest = marketsWithDistance[0];

  const autoFare = calcAutoFare(closest.distanceKm);
  const breakEvenKg = savingPerKg > 0 ? Math.ceil(autoFare / savingPerKg) : 999;

  // Build maps URL for directions
  const mapsUrl = `https://www.google.com/maps/dir/${workerLat},${workerLng}/${closest.lat},${closest.lng}`;

  return {
    item,
    category,
    currentPricePerKg,
    wholesalePrice,
    savingPerKg,
    discountRate: Math.round(discountRate * 100),

    market: {
      name: closest.name,
      distanceKm: Math.round(closest.distanceKm * 10) / 10,
      durationMin: closest.durationMin,
      lat: closest.lat,
      lng: closest.lng,
      mapsUrl,
      source: closest.source
    },

    economics: {
      autoFareBothWays: autoFare,
      breakEvenKg,
      isWorthGoing: (qty) => qty >= breakEvenKg,
    },

    // All markets for display in the React map
    allMarkets: marketsWithDistance.map(m => ({
      name: m.name,
      distanceKm: Math.round(m.distanceKm * 10) / 10,
      durationMin: m.durationMin,
      lat: m.lat,
      lng: m.lng,
      autoFare: calcAutoFare(m.distanceKm),
      breakEvenKg: savingPerKg > 0 ? Math.ceil(calcAutoFare(m.distanceKm) / savingPerKg) : 999,
      mapsUrl: `https://www.google.com/maps/dir/${workerLat},${workerLng}/${m.lat},${m.lng}`
    }))
  };
}

module.exports = { getSupplierSavingsAnalysis, findNearbyMarkets };
