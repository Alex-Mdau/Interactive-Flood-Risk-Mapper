// I have included comments to aid in understanding what does what.
// Global variable to hold the map instance
let map;
// Global variable to hold the marker for the last queried location
let currentMarker = null;

/**
 * Initializes the Leaflet map and adds the base tile layer.
 */
function initializeMap() {
    // Initial map view: Centered near Los Angeles for context
    map = L.map('map').setView([34.0522, -118.2437], 10); 

    // Add a base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add simulated flood risk zones
    addSimulatedRiskZones();
}

/**
 * Adds simulated high-risk flood zone polygons to the map.
 * In a real application, this data would be fetched from a GeoJSON API.
 */
function addSimulatedRiskZones() {
    // Simple GeoJSON data simulating a few high-risk areas (e.g., near river banks/low elevation)
    const simulatedFloodZones = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": { "risk": "High" },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-118.295, 34.010],
                            [-118.305, 34.015],
                            [-118.310, 34.005],
                            [-118.300, 34.000],
                            [-118.295, 34.010]
                        ]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": { "risk": "Moderate" },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-118.225, 34.055],
                            [-118.235, 34.060],
                            [-118.240, 34.050],
                            [-118.230, 34.045],
                            [-118.225, 34.055]
                        ]
                    ]
                }
            }
        ]
    };

    // Styling function for the flood zones
    function style(feature) {
        return {
            fillColor: '#ff0000', // Red for high risk
            weight: 2,
            opacity: 0.7,
            color: '#990000',
            fillOpacity: 0.3
        };
    }

    // Add GeoJSON layer to the map
    L.geoJSON(simulatedFloodZones, {
        style: style,
        onEachFeature: function(feature, layer) {
            layer.bindPopup("Simulated Risk: " + feature.properties.risk);
        }
    }).addTo(map);
}

/**
 * Fetches the AI-based flood risk prediction for the given coordinates.
 */
async function getRiskPrediction() {
    const latInput = document.getElementById('lat-input').value;
    const lonInput = document.getElementById('lon-input').value;
    const resultDiv = document.getElementById('risk-result');

    // Basic input validation
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        resultDiv.innerHTML = '<span style="color: red;">Please enter valid latitude (-90 to 90) and longitude (-180 to 180).</span>';
        return;
    }

    resultDiv.innerHTML = 'Calculating risk...';

    try {
        const response = await fetch('/predict_risk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat: lat, lon: lon })
        });

        const data = await response.json();

        if (data.success) {
            // Display the result
            let color = 'green';
            if (data.risk_score >= 80) color = 'darkred';
            else if (data.risk_score >= 60) color = 'red';
            else if (data.risk_score >= 40) color = 'orange';

            resultDiv.innerHTML = `
                <p><strong>Location:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
                <p><strong>Predicted Risk Score:</strong> <span style="color: ${color}; font-size: 1.2em;">${data.risk_score}/100</span></p>
                <p><strong>Assessment:</strong> ${data.message}</p>
            `;

            // Add or move the map marker
            updateMapMarker(lat, lon, data.risk_score, data.message);
        } else {
            resultDiv.innerHTML = `<span style="color: red;">Prediction Error: ${data.message}</span>`;
        }

    } catch (error) {
        console.error('Error fetching prediction:', error);
        resultDiv.innerHTML = '<span style="color: red;">Could not connect to the prediction service.</span>';
    }
}

/**
 * Updates the map marker for the queried location.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {number} score - Risk score.
 * @param {string} message - Risk message.
 */
function updateMapMarker(lat, lon, score, message) {
    const popupContent = `
        <strong>Risk Score:</strong> ${score}/100<br>
        <strong>Assessment:</strong> ${message}<br>
        <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}
    `;

    // Remove old marker if it exists
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Define a custom blue marker icon
    const blueIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Add new marker
    currentMarker = L.marker([lat, lon], {icon: blueIcon})
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup();

    // Center the map on the new marker
    map.setView([lat, lon], 12);
}

// Initialize map when the script loads
document.addEventListener('DOMContentLoaded', initializeMap);
