const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS_METERS = 15000; // 15 km

// Google Places API (optional, used when GOOGLE_MAPS_API_KEY is set)
const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PAGE_SIZE = 20;
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryTypeDisplayName',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.currentOpeningHours',
  'places.businessStatus',
].join(',');

/* ========== FREE: OpenStreetMap Overpass API ========== */

async function fetchFromOverpass(lat, lng, radius) {
  // Query for mental health related facilities
  const query = `
    [out:json][timeout:25];
    (
      node["healthcare"="psychotherapist"](around:${radius},${lat},${lng});
      node["healthcare"="counselling"](around:${radius},${lat},${lng});
      node["healthcare:speciality"~"psychiatry|psychology|psychotherapy|mental"](around:${radius},${lat},${lng});
      node["amenity"="doctors"]["healthcare:speciality"~"psychiatry|psychology"](around:${radius},${lat},${lng});
      node["amenity"="clinic"]["name"~"[Mm]ental|[Pp]sych|[Cc]ounsel|[Tt]herap|[Mm]ind"](around:${radius},${lat},${lng});
      node["amenity"="hospital"]["name"~"[Mm]ental|[Pp]sych|[Mm]ind"](around:${radius},${lat},${lng});
      node["amenity"="doctors"]["name"~"[Pp]sych|[Cc]ounsel|[Tt]herap|[Mm]ental|[Mm]ind"](around:${radius},${lat},${lng});
      way["healthcare"="psychotherapist"](around:${radius},${lat},${lng});
      way["healthcare"="counselling"](around:${radius},${lat},${lng});
      way["healthcare:speciality"~"psychiatry|psychology|psychotherapy|mental"](around:${radius},${lat},${lng});
      way["amenity"="clinic"]["name"~"[Mm]ental|[Pp]sych|[Cc]ounsel|[Tt]herap|[Mm]ind"](around:${radius},${lat},${lng});
      way["amenity"="hospital"]["name"~"[Mm]ental|[Pp]sych|[Mm]ind"](around:${radius},${lat},${lng});
    );
    out center body;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  let elements = data.elements || [];

  // If we got very few mental health results, broaden to general healthcare
  if (elements.length < 5) {
    const broadQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="doctors"](around:${Math.min(radius, 10000)},${lat},${lng});
        node["amenity"="clinic"](around:${Math.min(radius, 10000)},${lat},${lng});
        node["healthcare"](around:${Math.min(radius, 10000)},${lat},${lng});
        way["amenity"="clinic"](around:${Math.min(radius, 10000)},${lat},${lng});
        way["amenity"="doctors"](around:${Math.min(radius, 10000)},${lat},${lng});
        way["healthcare"](around:${Math.min(radius, 10000)},${lat},${lng});
      );
      out center body;
    `;

    const broadRes = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(broadQuery)}`,
    });

    if (broadRes.ok) {
      const broadData = await broadRes.json();
      const broadElements = broadData.elements || [];
      // Merge, avoiding duplicates
      const existingIds = new Set(elements.map((e) => e.id));
      for (const el of broadElements) {
        if (!existingIds.has(el.id)) {
          elements.push(el);
        }
      }
    }
  }

  // Deduplicate by name+location and limit
  const seen = new Set();
  elements = elements.filter((el) => {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) return false;
    const key = `${(el.tags?.name || '').toLowerCase()}_${elLat.toFixed(4)}_${elLng.toFixed(4)}`;
    if (seen.has(key) && el.tags?.name) return false;
    seen.add(key);
    return true;
  });

  return elements.slice(0, PAGE_SIZE).map((el) => {
    const elLat = el.lat ?? el.center?.lat ?? 0;
    const elLng = el.lon ?? el.center?.lon ?? 0;
    const tags = el.tags || {};

    const specialty = getSpecialty(tags);
    const name = tags.name || tags['name:en'] || specialty;

    return {
      id: `osm-${el.id}`,
      name,
      specialty,
      rating: 0,
      reviews: 0,
      distance: null,
      address: buildAddress(tags),
      phone: tags.phone || tags['contact:phone'] || '',
      latitude: elLat,
      longitude: elLng,
      available: true,
      isOpen: null,
      experience: '',
      price: '',
      image: '',
      websiteUri: tags.website || tags['contact:website'] || '',
    };
  });
}

function getSpecialty(tags) {
  const spec = tags['healthcare:speciality'] || '';
  if (spec.match(/psychiatr/i)) return 'Psychiatrist';
  if (spec.match(/psycholog/i)) return 'Psychologist';
  if (spec.match(/psychotherap/i)) return 'Psychotherapist';
  if (spec.match(/mental/i)) return 'Mental health professional';

  if (tags.healthcare === 'psychotherapist') return 'Psychotherapist';
  if (tags.healthcare === 'counselling') return 'Counselling center';
  if (tags.healthcare === 'doctor' || tags.amenity === 'doctors') return 'Doctor';
  if (tags.amenity === 'hospital') return 'Hospital';
  if (tags.amenity === 'clinic') return 'Clinic';
  if (tags.healthcare) return tags.healthcare.charAt(0).toUpperCase() + tags.healthcare.slice(1);
  return 'Healthcare facility';
}

function buildAddress(tags) {
  const parts = [
    tags['addr:housename'],
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.join(', ') || tags['addr:full'] || '';
}

/* ========== Google Places API (when key is available) ========== */

async function fetchFromGoogle(apiKey, lat, lng, radius) {
  const body = {
    textQuery: 'therapist psychologist mental health counselor psychiatrist counseling',
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
    pageSize: PAGE_SIZE,
    rankPreference: 'DISTANCE',
  };

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try { errJson = JSON.parse(errText); } catch { errJson = { error: { message: errText } }; }
    const googleMessage = errJson?.error?.message || errText;
    console.error('Places API error:', response.status, googleMessage);
    throw new Error(googleMessage);
  }

  const data = await response.json();
  const places = data.places || [];
  const toText = (v) =>
    v == null ? '' : typeof v === 'string' ? v : (v.text ?? '');

  return places.map((p) => {
    const isOpen = p.currentOpeningHours?.openNow ?? null;
    return {
      id: (p.id || '').replace(/^places\//, '') || `place-${p.location?.latitude}-${p.location?.longitude}`,
      name: toText(p.displayName) || 'Therapist',
      specialty: toText(p.primaryTypeDisplayName) || 'Mental health professional',
      rating: p.rating ?? 0,
      reviews: p.userRatingCount ?? 0,
      distance: null,
      address: p.formattedAddress || '',
      phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
      latitude: p.location?.latitude ?? 0,
      longitude: p.location?.longitude ?? 0,
      available: p.businessStatus === 'OPERATIONAL',
      isOpen,
      experience: '',
      price: '',
      image: '',
      websiteUri: p.websiteUri || '',
    };
  });
}

/* ========== Main handler ========== */

export async function getNearbyTherapists(req, res) {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = Math.min(
    Math.max(parseInt(req.query.radius, 10) || DEFAULT_RADIUS_METERS, 1000),
    50000
  );

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'Query params lat and lng are required and must be numbers.' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let therapists;

    if (apiKey) {
      // Use Google Places API if key is available
      therapists = await fetchFromGoogle(apiKey, lat, lng, radius);
    } else {
      // Free fallback: OpenStreetMap Overpass API
      console.log('GOOGLE_MAPS_API_KEY not set — using free OpenStreetMap data.');
      therapists = await fetchFromOverpass(lat, lng, radius);
    }

    return res.json({ therapists });
  } catch (err) {
    console.error('getNearbyTherapists error:', err);
    return res.status(500).json({ message: 'Failed to fetch nearby therapists.', error: err.message });
  }
}
