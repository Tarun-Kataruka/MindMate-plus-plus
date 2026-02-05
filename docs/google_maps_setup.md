# Google Maps API Setup Guide

To enable the map features in **MindMate++** (fetching nearby therapists and displaying the interactive map), you need a valid Google Maps API Key.

## Prerequisites
- A Google Cloud Platform (GCP) Account.
- A Billing Account linked to your project (Google provides $200 free credit monthly, but a card is required).

## Step-by-Step Instructions

### 1. Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **"New Project"**.
3. Name it `MindMate-Maps` (or similar) and click **Create**.
4. Select the newly created project.

### 2. Enable APIs
You need to enable specific APIs for the features to work.
1. Open the navigation menu (≡) → **APIs & Services** → **Library**.
2. Search for and **Enable** the following APIs one by one:
   - **Places API (New)** or **Places API**: Required to search for therapists ("doctor", "psychologist").
   - **Maps SDK for Android**: Required for the map view on Android.
   - **Maps SDK for iOS**: Required for the map view on iOS.
   - **Maps Static API**: Required for the map preview on Web.

### 3. Create Credentials (API Key)
1. Go to **APIs & Services** → **Credentials**.
2. Click **+ CREATE CREDENTIALS** → **API key**.
3. Your API key will be created. **Copy it**.

### 4. Secure Your Key (Optional but Recommended)
1. Click on the newly created key name to edit it.
2. Under "API restrictions", select **Restrict key**.
3. Check the APIs you enabled (Places, Maps SDK Android/iOS, Static Maps).
4. Save.

### 5. Add Key to MindMate++
1. Open the file `client/.env` in your project.
2. Find the variable `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. Paste your key:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...YourKeyHere
   ```
4. **Restart the App**:
   - In your terminal, stop the server (Ctrl+C).
   - Run `npm start` again (or `npx expo start --clear`).

## Verification
- Open the app.
- Go to the **Find Care** tab.
- You should see "Finding best therapists nearby..." followed by a list of real places near your location.
- Toggle the map view to see pins on the map.
