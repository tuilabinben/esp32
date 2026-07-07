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

// 3. HTML Layout with a Live Responsive Chart
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🌿 Live Plant Analytics</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { 
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                    text-align: center; 
                    background: #0f172a; 
                    color: #f8fafc; 
                    padding: 30px 15px;
                    margin: 0;
                }
                h1 { margin-bottom: 5px; font-size: 2rem; }
                p { color: #94a3b8; margin-top: 0; margin-bottom: 30px; }
                .time-badge { background: #1e293b; padding: 4px 10px; border-radius: 12px; border: 1px solid #334155; }
                
                .card-container { display: flex; justify-content: center; gap: 20px; max-width: 700px; margin: 0 auto 30px auto; flex-wrap: wrap; }
                .card { background: #1e293b; padding: 20px; border-radius: 16px; flex: 1; min-width: 150px; border: 1px solid #334155; }
                .card h3 { margin: 0; font-size: 0.9rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
                .value { font-size: 2.2rem; font-weight: bold; margin-top: 10px; }
                .temp-val { color: #f43f5e; }
                .moist-val { color: #10b981; }

                /* Chart Canvas Container */
                .chart-container {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 20px;
                    padding: 20px;
                    max-width: 700px;
                    margin: 0 auto;
                    box-sizing: border-box;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <h1>🌿 Smart Plant History</h1>
            <p>Node Status: Online • Last Check-in: <span id="time" class="time-badge">${sensorData.lastUpdated}</span></p>
            
            <div class="card-container">
                <div class="card"><h3>Temperature</h3><div class="value temp-val" id="temp">${sensorData.temperature}°C</div></div>
                <div class="card"><h3>Soil Moisture</h3><div class="value moist-val" id="moisture">${sensorData.moisture}%</div></div>
            </div>

            <div class="chart-container">
                <canvas id="liveChart"></canvas>
            </div>
               
            <script>
                // Initialize the Line Chart
                const ctx = document.getElementById('liveChart').getContext('2d');
                const maxDataPoints = 20; // Maximum number of tracking increments shown on screen
                
                const liveChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [], // Timestamps will go here
                        datasets: [
                            {
                                label: 'Temperature (°C)',
                                data: [],
                                borderColor: '#f43f5e',
                                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                                tension: 0.3,
                                yAxisID: 'yTemp'
                            },
                            {
                                label: 'Soil Moisture (%)',
                                data: [],
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.3,
                                yAxisID: 'yMoist'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { labels: { color: '#f8fafc' } }
                        },
                        scales: {
                            x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                            yTemp: {
                                type: 'linear',
                                position: 'left',
                                title: { display: true, text: 'Temperature (°C)', color: '#f43f5e' },
                                grid: { color: '#334155' },
                                ticks: { color: '#94a3b8' }
                            },
                            yMoist: {
                                type: 'linear',
                                position: 'right',
                                title: { display: true, text: 'Moisture (%)', color: '#10b981' },
                                grid: { display: false }, // Hide gridlines to keep layout clean
                                min: 0,
                                max: 100,
                                ticks: { color: '#94a3b8' }
                            }
                        }
                    }
                });

                // Background data fetching routine loop
                let lastTimestamp = "";
                setInterval(async () => {
                    try {
                        const res = await fetch('/api/data');
                        const data = await res.json();
                        
                        // Update basic card values
                        document.getElementById('temp').innerText = data.temperature + "°C";
                        document.getElementById('moisture').innerText = data.moisture + "%";
                        document.getElementById('time').innerText = data.lastUpdated;

                        // Only add new data points to the graph if the ESP32 pushed a fresh update
                        if (data.lastUpdated !== "Never" && data.lastUpdated !== lastTimestamp) {
                            lastTimestamp = data.lastUpdated;

                            // Add new values to chart array lists
                            liveChart.data.labels.push(data.lastUpdated);
                            liveChart.data.datasets[0].data.push(parseFloat(data.temperature));
                            liveChart.data.datasets[1].data.push(parseInt(data.moisture));

                            // If tracking limits overflow, slide the older data points off the frame
                            if (liveChart.data.labels.length > maxDataPoints) {
                                liveChart.data.labels.shift();
                                liveChart.data.datasets[0].data.shift();
                                liveChart.data.datasets[1].data.shift();
                            }

                            liveChart.update(); // Re-render the visual graph line curves
                        }
                    } catch (err) { console.error("Error drawing live chart paths:", err); }
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Server running on port ${PORT}`);
});