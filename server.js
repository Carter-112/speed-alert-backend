const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

// Your Google Maps API Key
const API_KEY = "AIzaSyAJNIL9betBD2RfS6mZXpiJL-LwEOo_qMk";

app.use(express.json());

// Endpoint to get speed limit based on latitude and longitude
app.get("/speed-limit", async (req, res) => {
    const { latitude, longitude } = req.query;

    try {
        const response = await axios.get(
            `https://roads.googleapis.com/v1/speedLimits`,
            {
                params: {
                    path: `${latitude},${longitude}`,
                    key: API_KEY
                }
            }
        );

        if (response.data && response.data.speedLimits && response.data.speedLimits.length > 0) {
            res.json(response.data.speedLimits[0]);
        } else {
            res.status(404).json({ error: "Speed limit data not found" });
        }
    } catch (error) {
        console.error("Error fetching speed limit:", error.message);
        res.status(500).json({ error: "Error fetching speed limit" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
