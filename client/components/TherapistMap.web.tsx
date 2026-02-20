import React, { useMemo } from "react";

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
}

interface Props {
  latitude: number;
  longitude: number;
  therapists: Therapist[];
}

export default function TherapistMap({ latitude, longitude, therapists }: Props) {
  const html = useMemo(() => {
    const markersJs = therapists
      .map(
        (t) =>
          `L.marker([${t.latitude}, ${t.longitude}], { icon: therapistIcon })` +
          `.addTo(map).bindPopup('<b>${(t.name || "Therapist").replace(/'/g, "\\'")}</b>` +
          `${t.specialty ? "<br/>" + t.specialty.replace(/'/g, "\\'") : ""}');`
      )
      .join("\n    ");

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // User location
    L.circleMarker([${latitude}, ${longitude}], {
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 1,
      radius: 8,
      weight: 3
    }).addTo(map).bindPopup('You are here');

    // Therapist markers
    var therapistIcon = L.divIcon({
      className: '',
      html: '<div style="background:#4AAE63;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    ${markersJs}

    ${therapists.length > 0 ? `
    // Fit bounds to show all markers
    var allPoints = [[${latitude}, ${longitude}]];
    ${therapists.map((t) => `allPoints.push([${t.latitude}, ${t.longitude}]);`).join("\n    ")}
    if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [30, 30], maxZoom: 14 });
    }` : ""}
  <\/script>
</body>
</html>`;
  }, [latitude, longitude, therapists]);

  // On web, render an iframe with the Leaflet map
  return React.createElement("iframe", {
    srcDoc: html,
    style: {
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: 20,
    },
  });
}
