async function fetchSpeedLimit(latitude, longitude) {
    try {
        const response = await fetch(`http://localhost:3000/speed-limit?latitude=${latitude}&longitude=${longitude}`);
        const data = await response.json();

        if (data.speedLimit) {
            return data.speedLimit; // Return the actual speed limit from the API
        } else {
            console.warn("Speed limit data not found for this location.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching speed limit:", error);
        return null;
    }
}

function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(async (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedMph = (speed * 2.23694).toFixed(2); // Convert m/s to mph

            // Fetch the actual speed limit from the backend
            const speedLimit = await fetchSpeedLimit(latitude, longitude);

            if (speedLimit === null) {
                alert("Unable to retrieve speed limit data. Defaulting to 55 mph.");
                return;
            }

            const allowedSpeed = speedLimit; // Using speed limit directly for comparison
            document.getElementById("speedDisplay").innerText = 
                `Current Speed: ${speedMph} mph | Speed Limit: ${allowedSpeed} mph`;

            if (speedMph > allowedSpeed) {
                playAlertSound();
            } else {
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
