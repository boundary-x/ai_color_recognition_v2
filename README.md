# 🎨 Boundary X - AI Color Recognition

**Boundary X - AI Color Recognition** is a web-based application that utilizes machine learning to recognize colors in real-time.  
Users can train the AI to identify specific colors via a webcam and transmit the recognition results to external hardware (e.g., BBC Micro:bit) using **Bluetooth (BLE)** or **USB Serial**.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Tech](https://img.shields.io/badge/Stack-p5.js%20%7C%20ml5.js-yellow)

## ✨ Key Features

### 1. 🧠 AI Teachable Machine
- **KNN Classifier:** Real-time color training and classification using ml5.js.
- **Custom Classes:** Users can define their own labels (e.g., "Apple", "Banana") and collect data instantly.
- **Real-time Feedback:** Displays recognition results and confidence levels immediately.

### 2. 🔗 Dual Connectivity
Supports two methods for hardware communication:
- **Bluetooth (Web Bluetooth API):** Wireless connection using the Nordic UART Service.
- **USB Serial (Web Serial API):** Wired connection via USB cable (includes compatibility patches for Android tablets).

### 3. 📱 Responsive UI & UX
- **Cross-Platform:** Optimized layout for PC, Tablet, and Mobile devices.
- **Sticky Canvas:** The camera view remains fixed on the screen while scrolling on mobile devices for better usability.
- **Camera Controls:** Supports front/rear camera switching and mirroring (flip).

### 4. ⚡ Performance Optimization
- **Data Throttling:** Limits data transmission intervals to 100ms to prevent hardware buffer overflow.

---

## 📡 Communication Protocol

When the AI recognizes a color with high confidence, it sends a string data packet to the connected device.

**Data Format:**
```text
I{ID}R{Red}G{Green}B{Blue}\n
```

**Details:**
- **I (Index):** The ID of the trained class (e.g., 1, 2, 3...)
- **R (Red):** Red color value (000 ~ 255, 3-digit padding)
- **G (Green):** Green color value (000 ~ 255, 3-digit padding)
- **B (Blue):** Blue color value (000 ~ 255, 3-digit padding)
- **\n:** End of Line character

**Examples:**
> **Recognized as Class ID 1 (Red) with RGB(255, 0, 0):**
> `I1R255G000B000`

> **When recognition is stopped:**
> `stop`

**Tech Stack:**
- **Frontend:** HTML5, CSS3
- **Creative Coding:** p5.js (Canvas, Video handling)
- **Machine Learning:** ml5.js (KNN Classifier)
- **Hardware I/O:** Web Bluetooth API (BLE) / Web Serial API (USB)

**License:**
- Copyright © 2024 Boundary X Co. All rights reserved.
- All rights to the source code and design of this project belong to BoundaryX.
- Web: boundaryx.io
- Contact: https://boundaryx.io/contact
