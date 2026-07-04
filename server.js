const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Render provides the port automatically

// Global variable to hold the latest sensor readings in server memory
let sensorData = {
    temperature: "0.0",
    moisture: "0",
    lastUpdated: "Never"
};

// 1. Endpoint for ESP32 to upload data via HTTP GET
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

// 3. Simple HTML webpage layout served directly
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cloud IoT Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; background: #121212; color: #e0e0e0; padding: 20px; }
                .card-container { display: flex; justify-content: center; flex-wrap: wrap; }
                .card { background: #1e1e1e; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: inline-block; margin: 15px; width: 220px; border: 1px solid #333; }
                h1 { color: #ffffff; margin-bottom: 5px; } .value { font-size: 2.5rem; font-weight: bold; color: #00adb5; margin-top: 10px; }
                p { color: #888; }
            </style>
        </head>
           <body>
               <h1>Live Plant Monitor</h1>
               <p>Last Update: <span id="time">${sensorData.lastUpdated}</span></p>
               <div class="card-container">
                   <div class="card"><h3>Temperature</h3><div class="value" id="temp">${sensorData.temperature}°C</div></div>
                   <div class="card"><h3>Soil Moisture</h3><div class="value" id="moisture">${sensorData.moisture}%</div></div>
               </div>
               
               <script>
                   // Auto-refresh the dashboard data every 3 seconds without reloading the page
                   setInterval(async () => {
                       try {
                           const res = await fetch('/api/data');
                           const data = await res.json();
                           document.getElementById('temp').innerText = data.temperature + "°C";
                           document.getElementById('moisture').innerText = data.moisture + "%";
                           document.getElementById('time').innerText = data.lastUpdated;
                       } catch (err) { console.error("Error fetching data:", err); }
                   }, 3000);
               </script>
           </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Server running on port ${PORT}`);
});