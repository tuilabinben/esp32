const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Global variable to hold the latest sensor readings in server memory
let sensorData = {
    temperature: "0.0",
    moisture: "0",
    lastUpdated: "Never"
};

// 1. Endpoint for ESP32 to upload data
app.get('/api/update', (req, res) => {
    if (req.query.temp && req.query.moisture) {
        sensorData.temperature = req.query.temp;
        sensorData.moisture = req.query.moisture;
        sensorData.lastUpdated = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        console.log(`Cloud Received -> Temp: ${sensorData.temperature}°C | Moisture: ${sensorData.moisture}%`);
        return res.status(200).send("Data Received by Cloud");
    }
    res.status(400).send("Missing query parameters");
});

// 2. Endpoint for the website frontend to fetch data
app.get('/api/data', (req, res) => {
    res.json(sensorData);
});

// 3. Fully Customized, Modern HTML/CSS Webpage Layout
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🌿 Smart Plant Monitor</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                /* Base Styles & Premium Dark Gradient Background */
                body { 
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    text-align: center; 
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); 
                    color: #f8fafc; 
                    padding: 40px 20px;
                    margin: 0;
                    min-height: 100vh;
                    box-sizing: border-box;
                }
                
                header { margin-bottom: 40px; }
                h1 { font-size: 2.5rem; margin: 0 0 10px 0; color: #fff; font-weight: 800; letter-spacing: -0.05em; }
                header p { color: #94a3b8; font-size: 1rem; margin: 0; }
                .time-badge { background: #312e81; color: #c7d2fe; padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 0.9rem; }

                /* Dashboard Grid Layout */
                .card-container { 
                    display: flex; 
                    justify-content: center; 
                    gap: 24px;
                    max-width: 900px;
                    margin: 0 auto;
                    flex-wrap: wrap; 
                }

                /* Sleek Glassmorphism Cards */
                .card { 
                    background: rgba(30, 41, 59, 0.7); 
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    padding: 30px; 
                    border-radius: 24px; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                    flex: 1;
                    min-width: 260px; 
                    border: 1px solid rgba(255,255,255,0.08); 
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                }

                .card h3 { margin: 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
                .value { font-size: 3.5rem; font-weight: 800; margin: 15px 0 5px 0; letter-spacing: -0.02em; }
                
                /* Dynamic Colors for Sensor Types */
                .temp-card .value { color: #f43f5e; }     /* Vibrant Coral/Rose */
                .moisture-card .value { color: #10b981; } /* Emerald Green */

                /* Plant Status Banner */
                .status-banner {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid #10b981;
                    color: #34d399;
                    padding: 12px 24px;
                    border-radius: 12px;
                    display: inline-block;
                    margin-top: 40px;
                    font-weight: 600;
                }
                .status-banner.dry {
                    background: rgba(244, 63, 94, 0.15);
                    border: 1px solid #f43f5e;
                    color: #fb7185;
                }
            </style>
        </head>
        <body>
            <header>
                <h1>🌿 Plant Oasis</h1>
                <p>Cloud IoT Monitoring Node • Last Check-in: <span id="time" class="time-badge">${sensorData.lastUpdated}</span></p>
            </header>
            
            <div class="card-container">
                <div class="card temp-card">
                    <h3>Room Temp</h3>
                    <div class="value" id="temp">${sensorData.temperature}°C</div>
                </div>
                
                <div class="card moisture-card">
                    <h3>Soil Moisture</h3>
                    <div class="value" id="moisture">${sensorData.moisture}%</div>
                </div>
            </div>

            <div id="status" class="status-banner">Plant Status: Healthy</div>
               
            <script>
                // Live fetch loop updating UI values fluidly every 3 seconds
                setInterval(async () => {
                    try {
                        const res = await fetch('/api/data');
                        const data = await res.json();
                        
                        document.getElementById('temp').innerText = data.temperature + "°C";
                        document.getElementById('moisture').innerText = data.moisture + "%";
                        document.getElementById('time').innerText = data.lastUpdated;

                        // Customize dynamic behavior: change banner styling based on real moisture data
                        const statusBanner = document.getElementById('status');
                        const mPercent = parseInt(data.moisture);
                        if(mPercent < 30) {
                            statusBanner.innerText = "Status: Thirsty! Needs Water 💧";
                            statusBanner.className = "status-banner dry";
                        } else {
                            statusBanner.innerText = "Status: Soil is perfectly healthy ✨";
                            statusBanner.className = "status-banner";
                        }
                    } catch (err) { console.error("Error fetching live cloud data:", err); }
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Server running on port ${PORT}`);
});