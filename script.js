const backendURL = "https://your-backend.onrender.com"; // Replace with your Render URL

async function fetchSpeedLimit(latitude, longitude) {
    try {
        const response = await fetch(`${backendURL}/speed-limit?latitude=${latitude}&longitude=${longitude}`);
        const data = await response.json();
        
        if (data.speedLimit) {
            return data.speedLimit; // Return the actual speed limit from the API
        } else {
            console.warn("Speed limit data not found for this location.");
            return 55; // Default speed limit if not found
        }
    } catch (error) {
        console.error("Error fetching speed limit:", error);
        return 55; // Default to 55 mph on error
    }
}

function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(async (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedMph = (speed * 2.23694).toFixed(2); // Convert m/s to mph

            // Fetch the actual speed limit from the backend
            const speedLimit = await fetchSpeedLimit(latitude, longitude);

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

function playAlertSound() {
    const alertDiv = document.getElementById("alertSound");
    alertDiv.hidden = false;
    const audio = new Audio("alert.mp3");
    audio.play();
}

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
