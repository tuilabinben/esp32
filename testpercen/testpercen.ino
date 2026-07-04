#include <WiFi.h>
#include <HTTPClient.h>
#include <math.h>

// --- Wi-Fi Settings ---
const char* ssid = "Bin Ben1";          // Replace with your home Wi-Fi name
const char* password = "suong2203";  // Replace with your home Wi-Fi password

// --- Render Cloud Server Settings ---
// Replace with your real Render URL followed by /api/update
const char* cloudServer = "https://esp32-plant.onrender.com/api/update"; 

// --- Pin Configurations ---
const int moisturePin = 34; // Pin connected to soil moisture sensor analog output
const int tempPin = 35;     // Pin connected to the temperature module analog output

// Thermistor Resistance-to-Temperature Function
float readTemperature(int tempValue) {
    const float R_FIXED = 10000.0; // 10k fixed resistor on the module
    const float R0 = 10000.0;      // 10k thermistor resistance at 25C
    const float BETA = 3950.0;     // Beta coefficient of your thermistor
    const float T0 = 298.15;       // 25C in Kelvin

    // Prevent division by zero if ADC reads 4095
    if (tempValue >= 4095) tempValue = 4094;
    if (tempValue <= 0) tempValue = 1;

    float resistance = R_FIXED * (float)tempValue / (4095.0 - tempValue);
    float temperature = 1.0 / ((log(resistance / R0) / BETA) + (1.0 / T0));
    temperature -= 273.15; // Convert Kelvin to Celsius

    // Apply calibration offset if your room reads too hot/cold (e.g., -6.5)
    temperature += -6.5; // Adjust this value based on your calibration
    
    return temperature; 
}

void setup() {
    Serial.begin(115200);
    delay(2000);

    // Connect to Wi-Fi Network
    Serial.println();
    Serial.print("Connecting to Wi-Fi: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nWi-Fi Connected successfully!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
}

void loop() {
    // Check if still connected to Wi-Fi before sending data
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        // 1. Read Raw Analog Values
        int tempRaw = analogRead(tempPin);
        int moistureRaw = analogRead(moisturePin);

        // 2. Convert raw values into usable numbers
        // Adjust the map parameters (2525, 1000) based on your dry/wet sensor readings
        int moisturePercent = map(moistureRaw, 2525, 1000, 0, 100);
        moisturePercent = constrain(moisturePercent, 0, 100);
        float temperature = readTemperature(tempRaw);

        // 3. Construct the HTTP GET Request parameters matching your server.js API
        // Format: https://your-link.onrender.com/api/update?temp=28.5&moisture=65
        String url = String(cloudServer) + "?temp=" + String(temperature, 1) + 
                     "&moisture=" + String(moisturePercent);
        
        Serial.print("Sending data to Render Cloud... ");
        
        // 4. Send the HTTP request
        http.begin(url);
        int httpResponseCode = http.GET();
        
        if (httpResponseCode > 0) {
            Serial.print("Server Replied with Code: ");
            Serial.println(httpResponseCode); // 200 means success!
        } else {
            Serial.print("Error sending request. Code: ");
            Serial.println(httpResponseCode);
        }
        
        // Free memory resources
        http.end();
    } else {
        Serial.println("Wi-Fi disconnected! Reconnecting...");
        WiFi.begin(ssid, password);
    }

    // Delay 15–20 seconds between updates so you don't overwhelm the free server tier
    delay(20000); 
}