// -----------------------------------------
// ESP32 Soil Moisture Sensor Test
// Sensor: Capacitive Soil Moisture v1.2
// AO -> GPIO34
// -----------------------------------------

const int sensorPin = 34;

void setup() {

  // Start Serial Communication
  Serial.begin(115200);

  // Set ADC resolution to 12-bit (0 - 4095)
  analogReadResolution(12);

  Serial.println();
  Serial.println("=================================");
  Serial.println("ESP32 Soil Moisture Sensor Test");
  Serial.println("=================================");
}

void loop() {

  // Read analog value from the sensor
  int moistureValue = analogRead(sensorPin);

  // Display the value
  Serial.print("ADC Value: ");
  Serial.println(moistureValue);

  // Read once every second
  delay(1000);
}