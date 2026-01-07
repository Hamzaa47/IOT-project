# ESP32 "Bus Stop" Display Guide

This system turns your ESP32 into a **Smart Bus Stop Display** that shows the status of a simulated bus.

## 1. Hardware Wiring

| Component | Pin on ESP32 | Details |
| :--- | :--- | :--- |
| **OLED SDA** | GPIO **21** | Display Data |
| **OLED SCL** | GPIO **22** | Display Clock |
| **OLED VCC** | 3.3V | Power |
| **OLED GND** | GND | Ground |
| **Green LED** | GPIO **32** | Moving Indicator |
| **Red LED** | GPIO **33** | Stopped Indicator |
| **Buzzer** | GPIO **15** | Arrival Alert |

> **Note**: Connect the longer leg (+) of LEDs to the GPIO pins and the shorter leg (-) to GND (via a 220Ω resistor if available). Connect Buzzer + to GPIO 15 and - to GND.

## 2. Software Setup

### Step A: Start the Server & Simulation
1.  Open VS Code terminal.
2.  Start the Next.js server:
    ```bash
    npm run dev
    ```
3.  Open a **second** terminal.
4.  Start the Bus Simulation:
    ```bash
    node simulate-bus.js
    ```
    *You should see logs indicating the bus is moving and stopping.*

### Step B: Configure ESP32
1.  Open `trackmate_esp32/src/main.cpp`.
2.  **Update WiFi**: Set your `ssid` and `password`.
3.  **Update Server IP**:
    *   Find your computer's IP (Run `ipconfig` in terminal).
    *   Update Line 14: `const char* serverUrl = "http://YOUR_IP:3000/api/bus/status";`
    *   Example: `http://192.168.1.10:3000/api/bus/status`

### Step C: Upload
1.  Click the **PlatformIO Upload** button (Right Arrow icon) in the bottom bar.
2.  Open the Serial Monitor to debug.

## 3. Expected Behavior
- **Moving**: 🟢 Green LED ON. OLED shows "Next Stop: [Name]".
- **Arriving at Stop**: 🔴 Red LED ON. 🔊 Buzzer beeps 3 times. OLED shows "STOPPED".
- The cycle repeats as the simulation runs.
