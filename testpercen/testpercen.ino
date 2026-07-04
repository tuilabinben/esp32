#include <math.h>

float readTemperature(int tempValue)
{
    const float R_FIXED = 10000.0;
    const float R0 = 10000.0;
    const float BETA = 3950.0;
    const float T0 = 298.15;   // 25°C in Kelvin

    float resistance = R_FIXED * (float)tempValue / (4095.0 - tempValue);

    float temperature =
        1.0 / ((log(resistance / R0) / BETA) + (1.0 / T0));

    temperature -= 273.15;

    const float CALIBRATION_OFFSET = -6.5; 
    temperature += CALIBRATION_OFFSET;

    return temperature;
}

const int sensorPin = 34;
const int tempPin = 35;

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("Soil Moisture Test");
}

void loop() {

  int tempValue = analogRead(tempPin);

  int sensorValue = analogRead(sensorPin);

  int moisturePercent = map(sensorValue, 2525, 1000, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  float temperature = readTemperature(tempValue);

  Serial.print("ADC1: ");
  Serial.print(sensorValue);

  Serial.print(" | ADC2: ");
  Serial.print(tempValue);

  Serial.print(" | temperature: ");
  Serial.print(temperature, 1);
  Serial.print(" C");

  Serial.print(" | Moisture: ");
  Serial.print(moisturePercent);

  Serial.println("%");

  delay(5000);
}