const backendURL = "https://roads.googleapis.com/v1/speedLimits";
const apiKey = "AIzaSyAJNIL9betBD2RfS6mZXpiJL-LwEOo_qMk";

let tracking = false; // Indicates if tracking is on (`true`) or off (`false`)
let watchId = null; // Stores the geolocation watch ID

// Initializes the page and restores previous tracking state if active
function initializePage() {
    loadOffsets();

    // Check if tracking was previously active
    const wasTracking = localStorage.getItem("tracking") === "true";
    if (wasTracking) {
        toggleTracking(); // Automatically resumes tracking if it was active
    }
}

// Saves offset selections to localStorage
function saveOffset(offsetId) {
    const offsetValue = document.getElementById(offsetId).value;
    localStorage.setItem(offsetId, offsetValue);
}

// Loads offset selections from localStorage
function loadOffsets() {
    ["offset1", "offset2", "offset3"].forEach(offsetId => {
        const savedValue = localStorage.getItem(offsetId);
        if (savedValue) {
            document.getElementById(offsetId).value = savedValue;
        }
    });
}

// Fetches the speed limit from the Google Maps API based on current location
async function fetchSpeedLimit(latitude, longitude) {
    try {
        const response = await fetch(`${backendURL}?path=${latitude},${longitude}&key=${apiKey}`);
        const data = await response.json();
        
        if (data.speedLimits && data.speedLimits.length > 0) {
            return data.speedLimits[0].speedLimit;
        } else {
            console.warn("No speed limit data available for this location.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching speed limit:", error);
        return null;
    }
}

// Toggles tracking on or off depending on the current state
function toggleTracking() {
    if (tracking) {
        stopTracking();
    } else {
        startTracking();
    }
}

// Starts tracking, updates button text, and saves state
function startTracking() {
    tracking = true; // Update tracking state to active
    document.getElementById("toggleTrackingButton").innerText = "Stop Tracking";
    localStorage.setItem("tracking", "true"); // Save tracking state to localStorage

    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(async (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedMph = (speed * 2.23694).toFixed(2); // Convert speed to MPH

            const speedLimit = await fetchSpeedLimit(latitude, longitude);
            if (speedLimit === null) return;

            const offset = parseInt(document.getElementById("offset1").value);
            const allowedSpeed = speedLimit + offset;

            // Update speed display and check for alerts
            const speedDisplay = document.getElementById("speedDisplay");
            speedDisplay.innerHTML = `
                <p>Speed Limit: ${speedLimit} mph</p>
                <p>Current Speed: <span id="currentSpeed">${speedMph} mph</span></p>
            `;

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

// Stops tracking, updates button text, and saves state
function stopTracking() {
    navigator.geolocation.clearWatch(watchId); // Stop geolocation updates
    tracking = false; // Update tracking state to inactive
    document.getElementById("toggleTrackingButton").innerText = "Start Tracking";
    document.getElementById("alertSound").hidden = true;
    localStorage.setItem("tracking", "false"); // Save tracking state to localStorage
}

// Plays an alert sound if speed exceeds the limit
function playAlertSound() {
    const alertDiv = document.getElementById("alertSound");
    alertDiv.hidden = false;
    const audio = new Audio("assets/alert.mp3"); // Path to alert sound
    audio.play();
}

// Error handler for geolocation issues
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Location access denied. Please enable location permissions.");
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
