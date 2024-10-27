const backendURL = "https://roads.googleapis.com/v1/speedLimits";
const apiKey = "AIzaSyAJNIL9betBD2RfS6mZXpiJL-LwEOo_qMk";

let tracking = false;
let watchId = null;

// Initialize the page
function initializePage() {
    // Load stored offsets
    loadOffsets();

    // Check and request geolocation permission
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
    } else {
        // Check if tracking was active before the page refresh and auto-resume
        const wasTracking = localStorage.getItem("tracking") === "true";
        if (wasTracking) {
            tracking = true;
            document.getElementById("toggleTrackingButton").innerText = "Stop Tracking";
            startTracking();
        }
    }
}

// Save selected offset to localStorage
function saveOffset(offsetId) {
    const offsetValue = document.getElementById(offsetId).value;
    localStorage.setItem(offsetId, offsetValue);
}

// Load offsets from localStorage
function loadOffsets() {
    ["offset1", "offset2", "offset3"].forEach(offsetId => {
        const savedValue = localStorage.getItem(offsetId);
        if (savedValue) {
            document.getElementById(offsetId).value = savedValue;
        }
    });
}

// Function to fetch the speed limit from the Google Maps API
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

// Function to start or stop tracking based on current state
function toggleTracking() {
    if (tracking) {
        stopTracking();
    } else {
        startTracking();
    }
}

// Function to start tracking
function startTracking() {
    tracking = true;
    document.getElementById("toggleTrackingButton").innerText = "Stop Tracking";
    localStorage.setItem("tracking", "true"); // Save tracking state to localStorage

    watchId = navigator.geolocation.watchPosition(async (position) => {
        const { latitude, longitude, speed } = position.coords;
        const speedMph = (speed * 2.23694).toFixed(2);

        const speedLimit = await fetchSpeedLimit(latitude, longitude);
        if (speedLimit === null) return;

        const offset = parseInt(document.getElementById("offset1").value);
        const allowedSpeed = speedLimit + offset;

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
}

// Function to stop tracking
function stopTracking() {
    navigator.geolocation.clearWatch(watchId);
    tracking = false;
    document.getElementById("toggleTrackingButton").innerText = "Start Tracking";
    document.getElementById("alertSound").hidden = true;
    localStorage.setItem("tracking", "false"); // Save tracking state to localStorage
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
