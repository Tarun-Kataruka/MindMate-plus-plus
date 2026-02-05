import fetch from 'node-fetch';

export const getNearbyTherapists = async (req, res) => {
    const { location, radius, keyword } = req.query;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Validate API key
    if (!apiKey) {
        console.error('Google Maps API key not configured');
        return res.status(500).json({
            status: 'ERROR',
            message: 'Google Maps API key not configured'
        });
    }

    // Validate required parameters
    if (!location) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Location parameter is required (format: lat,lng)'
        });
    }

    if (!radius) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Radius parameter is required'
        });
    }

    // Validate location format (should be lat,lng)
    const locationParts = location.split(',');
    if (locationParts.length !== 2 || isNaN(locationParts[0]) || isNaN(locationParts[1])) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid location format. Expected: lat,lng'
        });
    }

    try {
        const type = req.query.type; // Get optional type parameter

        // Build URL with optional type parameter
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${keyword || 'therapist'}&key=${apiKey}`;

        if (type) {
            url += `&type=${type}`;
        }

        console.log(`Fetching nearby therapists for location: ${location}, radius: ${radius}, type: ${type || 'none'}`);
        console.log(`Full API URL: ${url.substring(0, 100)}...`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Google Maps API returned status ${response.status}`);
            return res.status(response.status).json({
                status: 'ERROR',
                message: `Google Maps API error: ${response.statusText}`
            });
        }

        const data = await response.json();

        // Log detailed response info
        console.log(`API Response - Status: ${data.status}, Results: ${data.results?.length || 0}`);

        if (data.error_message) {
            console.error(`Google Maps API Error Message: ${data.error_message}`);
        }

        // Check for API errors in response
        if (data.status === 'ZERO_RESULTS') {
            console.log('No therapists found in the specified area');
        } else if (data.status !== 'OK') {
            console.warn(`Google Maps API returned status: ${data.status}`);
        } else if (data.results) {
            console.log(`Successfully fetched ${data.results.length} places`);
            console.log(`Place names: ${data.results.slice(0, 5).map((p) => p.name).join(', ')}...`);
        }

        // Set caching headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        res.json(data);
    } catch (error) {
        console.error('Error in getNearbyTherapists proxy:', error.message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch from Google Maps. Please try again later.'
        });
    }
};

export const getPlacePhoto = async (req, res) => {
    const { photoreference, maxwidth } = req.query;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Validate API key
    if (!apiKey) {
        console.error('Google Maps API key not configured');
        return res.status(500).json({
            status: 'ERROR',
            message: 'Google Maps API key not configured'
        });
    }

    // Validate required parameters
    if (!photoreference) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Photo reference parameter is required'
        });
    }

    const photoMaxWidth = maxwidth || 400; // Default to 400 if not specified

    try {
        const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${photoMaxWidth}&photoreference=${photoreference}&key=${apiKey}`;

        console.log(`Fetching photo with reference: ${photoreference.substring(0, 20)}...`);

        // Fetch the photo and pipe it to the response
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Google Maps Photo API returned ${response.status}: ${response.statusText}`);
            return res.status(response.status).send('Failed to fetch photo');
        }

        const contentType = response.headers.get('content-type');

        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

        // Pipe the stream to the response to prevent "Premature close"
        response.body.pipe(res);
    } catch (error) {
        console.error('Error in getPlacePhoto proxy:', error.message);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'ERROR',
                message: 'Failed to fetch photo from Google Maps'
            });
        }
    }
};
