# Therapist Page - API Integration Guide

## Current Implementation

The therapist page now includes:
- ✅ Real Bengaluru-based locations (Indiranagar, Koramangala, Whitefield, HSR Layout, etc.)
- ✅ Expo Location for user's current location
- ✅ Distance calculation from user to therapists
- ✅ Appointments section at the top (toggleable)
- ✅ Directions button opens Google Maps with route
- ✅ Book Now functionality with appointment tracking

## To Get Real Therapist Data

### Option 1: Use Google Places API (Recommended)

1. **Get API Key** (when Google fixes their payment issue):
   - Go to Google Cloud Console
   - Enable Places API
   - Create credentials

2. **Install package**:
   ```bash
   npm install @googlemaps/google-maps-services-js
   ```

3. **Replace mock data in `fetchNearbyTherapists`**:
   ```typescript
   const response = await fetch(
     `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
     `location=${latitude},${longitude}` +
     `&radius=5000` +
     `&type=doctor` +
     `&keyword=therapist|psychologist|counselor` +
     `&key=YOUR_GOOGLE_API_KEY`
   );
   const data = await response.json();
   ```

### Option 2: Use Your Backend API

Create an endpoint in your server:

```javascript
// server/routes/therapists.js
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;
  
  // Query your database
  const therapists = await Therapist.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: radius || 5000
      }
    }
  });
  
  res.json(therapists);
});
```

Then update the client:

```typescript
const response = await fetch(
  `YOUR_SERVER_URL/api/therapists/nearby?lat=${latitude}&lng=${longitude}&radius=5000`
);
const therapists = await response.json();
setTherapists(therapists);
```

### Option 3: Use Practo/1mg API (India-specific)

These platforms have healthcare provider APIs. Contact them for API access.

## Current Location

The app uses Expo Location which:
- ✅ Requests user permission
- ✅ Gets accurate GPS coordinates
- ✅ Works on both iOS and Android
- ✅ No API key needed

## Directions Feature

When user clicks "Directions":
- Opens Google Maps app (if installed)
- Shows route from user's location to therapist
- Falls back to web browser if app not available

## Appointments Feature

- Stored in local state (currently)
- Shows at top of screen with badge counter
- Click badge to toggle appointments view
- Book Now adds appointment to list

### To Persist Appointments:

Add to your backend:
```javascript
// POST /api/appointments
{
  userId: "user_id",
  therapistId: "therapist_id",
  date: "2024-12-10",
  time: "2:00 PM",
  status: "upcoming"
}
```

## Next Steps

1. Set up your backend API for therapists
2. Add authentication to track user appointments
3. Implement real booking system with calendar
4. Add payment integration
5. Send notifications for upcoming appointments
