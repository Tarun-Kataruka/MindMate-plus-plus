const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DEFAULT_RADIUS_METERS = 25000; // 25 km
const PAGE_SIZE = 20;
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryTypeDisplayName',
].join(',');

export async function getNearbyTherapists(req, res) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      message: 'Therapist search is not configured. Set GOOGLE_MAPS_API_KEY and enable Places API (New) in Google Cloud.',
    });
  }

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
      try {
        errJson = JSON.parse(errText);
      } catch {
        errJson = { error: { message: errText } };
      }
      const googleMessage = errJson?.error?.message || errText;
      console.error('Places API error:', response.status, googleMessage);
      const hint =
        response.status === 403
          ? 'Enable "Places API (New)" in Google Cloud Console → APIs & Services → Library, and ensure the API key is allowed to use it.'
          : response.status === 400
            ? 'Bad request. ' + (googleMessage || '')
            : response.status === 402
              ? 'Billing not enabled or quota exceeded. Enable billing for the Google Cloud project.'
              : '';
      return res.status(502).json({
        message: 'Could not fetch places from Google.',
        details: googleMessage,
        hint,
      });
    }

    const data = await response.json();
    const places = data.places || [];

    const therapists = places.map((p) => {
      const name = p.displayName?.text || 'Therapist';
      const address = p.formattedAddress || '';
      const latitude = p.location?.latitude ?? 0;
      const longitude = p.location?.longitude ?? 0;
      const specialty = p.primaryTypeDisplayName || 'Mental health professional';

      return {
        id: (p.id || name).replace(/^places\//, '') || `place-${latitude}-${longitude}`,
        name,
        specialty,
        rating: 0,
        reviews: 0,
        distance: null,
        address,
        phone: '',
        latitude,
        longitude,
        available: true,
        experience: '',
        price: '',
        image: '',
        websiteUri: '',
      };
    });

    return res.json({ therapists });
  } catch (err) {
    console.error('getNearbyTherapists error:', err);
    return res.status(500).json({ message: 'Failed to fetch nearby therapists.', error: err.message });
  }
}
