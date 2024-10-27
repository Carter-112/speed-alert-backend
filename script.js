const backendURL = "https://roads.googleapis.com/v1/speedLimits";
const apiKey = "AIzaSyAJNIL9betBD2RfS6mZXpiJL-LwEOo_qMk";

let tracking = false; // Tracks whether speed tracking is active
let watchId = null; // Holds the geolocation watch ID

// Function to fetch the speed limit from the Google Maps API
async function fetchSpeedLimit(latitude, longitude) {
    try {
        const response = await fetch(`${backendURL}?path=${latitude},${longitude}&key=${apiKey}`);
        const data = await response.json();

        if (data.speedLimits && data.speedLimits.length > 0) {
            return data.speedLimits[0].speedLimit;
        } else {
            console.warn("Speed limit data not found for this location.");
            return null; // No valid data available
        }
    } catch (error) {
        console.error("Error fetching speed limit:", error);
        return null;
    }
}

// Function to start or stop tracking based on current state
function toggleTracking() {
    if (tracking) {
        // Stop tracking
        navigator.geolocation.clearWatch(watchId);
        tracking = false;
        document.getElementById("toggleTrackingButton").innerText = "Start Tracking";
        document.getElementById("alertSound").hidden = true;
    } else {
        // Start tracking
        tracking = true;
        document.getElementById("toggleTrackingButton").innerText = "Stop Tracking";
        startTracking();
    }
}

// Function to initiate location tracking
function startTracking() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(async (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedMph = (speed * 2.23694).toFixed(2); // Convert m/s to mph

            // Fetch the actual speed limit from the API
            const speedLimit = await fetchSpeedLimit(latitude, longitude);

            // If no speed limit data is available, exit
            if (speedLimit === null) return;

            // Calculate allowed speed based on user offset setting
            const offset = parseInt(document.getElementById("offset1").value); // Customize as needed
            const allowedSpeed = speedLimit + offset;

            // Display speed and limit in the UI
            const speedDisplay = document.getElementById("speedDisplay");
            speedDisplay.innerHTML = `
                <p>Speed Limit: ${speedLimit} mph</p>
                <p>Current Speed: <span id="currentSpeed">${speedMph} mph</span></p>
            `;

            // Change color to red if speed exceeds allowed offset
            const currentSpeedElement = document.getElementById("currentSpeed");
            if (speedMph > allowedSpeed) {
                currentSpeedElement.style.color = "red";
                playAlertSound();
            } else {
                currentSpeedElement.style.color = "black";
                document.getElementById("alertSound").hidden = true;
            }
        }, showError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to play an alert sound
function playAlertSound() {
    const alertDiv = document.getElementById("alertSound");
    alertDiv.hidden = false;
    const audio = new Audio("alert.mp3");
    audio.play();
}

// Error handler for geolocation errors
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}
