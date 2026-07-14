#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiManager.h>
#include <math.h>

// --- Render Cloud Server ---
const char* cloudServer = "https://esp32-plant.onrender.com/api/update";

// --- Pin Configurations ---
const int moisturePin = 34;
const int tempPin = 35;
const int RESET_BUTTON = 25;

// --- Non-blocking delay timer ---
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 2000;

float readTemperature(int tempValue) {
    const float R_FIXED = 10000.0;
    const float R0 = 10000.0;
    const float BETA = 3950.0;
    const float T0 = 298.15;

    if (tempValue >= 4095) tempValue = 4094;
    if (tempValue <= 0) tempValue = 1;

    float resistance = R_FIXED * (float)tempValue / (4095.0 - tempValue);
    float temperature = 1.0 / ((log(resistance / R0) / BETA) + (1.0 / T0));
    temperature -= 273.15;
    temperature += -6.5;
    return temperature;
}

void openWiFiPortal() {
    Serial.println("Entering WiFi config mode...");
    WiFiManager wm;
    wm.resetSettings();
    wm.startConfigPortal("SPORO", "12345678");
    Serial.println("WiFi configured! Restarting...");
    delay(1000);
    ESP.restart();
}

void checkResetButton() {
    if (digitalRead(RESET_BUTTON) == LOW) {
        delay(50);  // debounce
        if (digitalRead(RESET_BUTTON) != LOW) return;  // noise, ignore

        Serial.println("Button held... keep holding for 3 seconds to reset WiFi");
        unsigned long holdStart = millis();

        while (digitalRead(RESET_BUTTON) == LOW) {
            if (millis() - holdStart >= 3000) {
                openWiFiPortal();
                return;
            }
        }
        Serial.println("Button released early, ignoring.");
    }
}

void sendData() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        int tempRaw = analogRead(tempPin);
        int moistureRaw = analogRead(moisturePin);

        int moisturePercent = map(moistureRaw, 2525, 1000, 0, 100);
        moisturePercent = constrain(moisturePercent, 0, 100);
        float temperature = readTemperature(tempRaw);

        String url = String(cloudServer) + "?temp=" + String(temperature, 1) +
                     "&moisture=" + String(moisturePercent);

        Serial.println("Sending...");

        http.begin(url);
        int httpResponseCode = http.GET();

        if (httpResponseCode > 0) {
            Serial.print("Server replied: ");
            Serial.println(httpResponseCode);
        } else {
            Serial.print("HTTP Error: ");
            Serial.println(httpResponseCode);
        }

        http.end();

    } else {
        Serial.println("WiFi lost! Reconnecting...");
        WiFi.reconnect();
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    pinMode(RESET_BUTTON, INPUT_PULLUP);

    WiFiManager wm;
    bool connected = wm.autoConnect("SPORO", "12345678");

    if (!connected) {
        Serial.println("Failed to connect. Restarting...");
        delay(3000);
        ESP.restart();
    }

    Serial.println("WiFi Connected!");
    Serial.print("WiFi: ");
    Serial.println(WiFi.SSID());
}

void loop() {
    checkResetButton();

    if (millis() - lastSend >= SEND_INTERVAL) {
        lastSend = millis();
        sendData();
    }
}