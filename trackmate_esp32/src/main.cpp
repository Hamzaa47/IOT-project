#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Make sure this is standard or parse manually. PlatformIO usually needs a lib for this.
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ======================= CONFIGURATION =======================
const char* ssid = "Redmi 12";
const char* password = "Tempest123";


const char* serverUrl = "http://10.184.130.101:3000/api/bus/status"; 

// Hardware Pins
#define LED_GREEN 32
#define LED_RED   33
#define BUZZER    15
#define OLED_SDA  21
#define OLED_SCL  22

// OLED Display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// State Tracking
String lastStatus = "UNKNOWN";
String lastStopName = "";
unsigned long lastPollTime = 0;
const unsigned long pollInterval = 1000; // Poll every 1 second

// ======================= SETUP =======================
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== ESP32 READY ===");
  Serial.println("Baud: 115200");
  Serial.println("Debug: Starting setup...");

  // Init Pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Init OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 10);
  display.println("Connecting to WiFi...");
  display.display();

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
  
  display.clearDisplay();
  display.setCursor(0, 10);
  display.println("WiFi Connected!");
  display.println(WiFi.localIP());
  display.display();
  delay(2000);
}

// ======================= HELPERS =======================

void displayStatus(String status, String stopName) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Bus Status:");
  
  display.setTextSize(2);
  display.setCursor(0, 20);
  if (status == "MOVING") {
    display.println("MOVING");
  } else {
    display.println("STOPPED");
  }

  display.setTextSize(1);
  display.setCursor(0, 45);
  display.print("Next: ");
  // Truncate if too long
  if(stopName.length() > 14) {
      display.println(stopName.substring(0, 14));
  } else {
      display.println(stopName);
  }
  
  display.display();
}

void beepBuzzer() {
  // Beep 3 times
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER, HIGH);
    delay(200);
    digitalWrite(BUZZER, LOW);
    delay(200);
  }
}



String extractJsonValue(String json, String key) {
  int keyIdx = json.indexOf("\"" + key + "\":");
  if (keyIdx == -1) return "";
  
  int valStart = json.indexOf("\"", keyIdx + key.length() + 2) + 1;
  int valEnd = json.indexOf("\"", valStart);
  return json.substring(valStart, valEnd);
}

// ======================= LOOP =======================
void loop() {
  if (millis() - lastPollTime > pollInterval) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      int httpCode = http.GET();

      if (httpCode > 0) {
        String payload = http.getString();
        Serial.print("Payload: ");
        Serial.println(payload);
        Serial.print("Payload (hex): ");
        for (size_t i = 0; i < payload.length(); i++) {
            Serial.print((uint8_t)payload[i], HEX);
            Serial.print(' ');
        }
        Serial.println();
        
        // Parse JSON
        String status = extractJsonValue(payload, "status");
        String nextStop = extractJsonValue(payload, "nextStop");

        // Logic
        if (status == "MOVING") {
            digitalWrite(LED_GREEN, HIGH);
            digitalWrite(LED_RED, LOW);
            digitalWrite(BUZZER, LOW); // Ensure off
        } else if (status == "STOPPED") {
            digitalWrite(LED_GREEN, LOW);
            digitalWrite(LED_RED, HIGH);
            
            // Check transition
            if (lastStatus == "MOVING") {
                beepBuzzer();
            }
        }
        
        displayStatus(status, nextStop);
        
        lastStatus = status;
        lastStopName = nextStop;

      } else {
        Serial.printf("HTTP request failed, code: %d\n", httpCode);
        if (httpCode > 0) {
          String errPayload = http.getString();
          Serial.printf("Payload: %s\n", errPayload.c_str());
        } else {
          Serial.println("HTTP GET failed (no response)");
        }
        Serial.printf("Server URL: %s\n", serverUrl);
        Serial.print("Local IP: ");
        Serial.println(WiFi.localIP());

        display.clearDisplay();
        display.setCursor(0,0);
        display.println("Conn Error");
        display.setCursor(0,10);
        display.print("HTTP:");
        display.println(httpCode);
        display.display();
      }
      http.end();
    }
    lastPollTime = millis();
  }
}
