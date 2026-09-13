# 🎨 Boundary X - AI Color Recognition V2

**Boundary X - AI Color Recognition V2** is a web-based application that learns colors from a webcam and detects matching color regions in real time.

Powered by **CIELAB color-range matching**, it processes camera images directly in the browser. Users collect samples for each color ID, select an ID to recognize, and transmit its position and size to a **BBC Micro:bit** via **Web Bluetooth (BLE)**.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Tech](https://img.shields.io/badge/Stack-Canvas%20%7C%20CIELAB%20%7C%20Web%20Bluetooth-00E676)

**[Open the Web App](https://boundary-x.github.io/ai_color_recognition_v2/)**

---

## ✨ Key Features

### 1. 🎨 Color Learning

- **Automatic IDs:** Adds classes as ID1, ID2, and so on.
- **Manual Sampling:** Collects one sample per tap, with exactly **10 samples** required to complete each ID.
- **Sample Quality Check:** Blocks samples containing mixed colors. A yellow frame and an instruction below it identify the learning area.
- **Data Management:** Supports undoing the last sample, retraining, deleting IDs, and resetting all data. Canceling retraining preserves the previous model.

### 2. 🔍 Real-time Region Recognition

- **Selected-ID Detection:** Recognizes one selected, fully trained ID across the entire camera image.
- **Transmission Target:** Highlights the region with the most matching color pixels using a **thick blue box** and a transmission-target label.
- **Other Regions:** Displays remaining matches with **thin green boxes**.
- **Adjustable Detection:** Provides color tolerance, lightness tolerance, and minimum region size controls.

### 3. 💾 Model Storage & Sharing

- **JSON Download:** Saves trained IDs and their color samples and ranges.
- **File Sharing:** Shares the model through supported browser sharing menus.
- **Model Import:** Validates the file before replacing existing training data, with confirmation when data already exists.
- **Local Processing:** Camera images are neither included in model files nor uploaded for recognition.

### 4. 🔗 Wireless Connectivity (BLE)

- **Direct Connection:** Connects to a BBC Micro:bit using the Nordic UART Service.
- **Region Data:** Transmits the selected ID, center coordinates, bounding-box size, and detection count.
- **Stop Signal:** Requests `stop` when the selected color is not detected or recognition is stopped.

### 5. 📱 Responsive UI & Support

- **Automatic Camera Start:** Requests camera access when the page opens.
- **Camera Settings:** Provides front/rear camera switching and horizontal mirroring.
- **Responsive Layout:** Supports desktop, tablet, and phone portrait and landscape screens.
- **In-App Guide:** Includes a nine-step highlighted walkthrough, troubleshooting cards, and update notes. Example-code and lesson-material links are marked as pending until supplied.

---

## 🚀 How to Use

1. Open the web app and allow camera access.
2. Add a learning ID and fill the yellow frame with one color.
3. Tap **Add Sample** 10 times, slightly changing the object's angle or distance between samples.
4. Select **Complete Training**, choose an ID, and start recognition.
5. Move the object around, then remove it to check that detection disappears.
6. Connect a micro:bit running a compatible Bluetooth UART receiver to receive data.
7. Download the model before refreshing or closing the page.

Recognition can be tested without connecting a micro:bit. Training data is held in memory and is not automatically saved. Model files exclude camera images and recognition-adjustment slider settings; files from the older KNN app are not compatible.

---

## 📡 Communication Protocol

The app transmits UTF-8 text through Bluetooth UART, followed by a newline (`\n`).

**Data Format:**

```text
i{ID}x{CenterX}y{CenterY}w{Width}h{Height}d{Count}\n
```

**Parameters:**

| Field | Description |
| --- | --- |
| `i` | Selected color ID, 1–99 |
| `x`, `y` | Center coordinates in the displayed orientation, normalized to 400 × 300 |
| `w`, `h` | Bounding-box width and height in the same coordinate space |
| `d` | Number of regions matching the selected ID, capped at 99 |

**Examples:**

- **ID1, center (200, 150), size 100 × 80, two detected regions:** `i1x200y150w100h80d2`
- **No matching region or recognition stopped:** `stop`

If multiple regions match, the region with the greatest matching pixel count is transmitted. This is the region highlighted in blue; priority is not determined by distance from the center or bounding-box area.

Messages are serialized and split into BLE chunks of at most 20 bytes. The receiver must accumulate data until the newline. “Sent” means the Bluetooth write completed, not that the device acknowledged or acted on the command. A receiver-side timeout can stop hardware if the connection is lost.

**Nordic UART UUIDs:**

- Service: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- Write characteristic: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

The receiver must support this format instead of the previous `I{id}R{r}G{g}B{b}` format. USB Serial is not included in this version.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Image Processing:** Canvas API, CIELAB color-range matching, blur, morphology, and region smoothing
- **Connectivity:** Web Bluetooth API (Nordic UART Service)
- **Model Storage:** JSON files (`boundaryx-color-regions`, version 1)
- **Sharing:** Web Share API where supported

Each of the 10 learning samples contributes a separate dominant-color range. Default processing uses a 200-pixel-wide image at a 120 ms interval, color tolerance 8, extra lightness tolerance 15, and minimum region area 1%.

The app recognizes colors rather than object identity. Similar-colored backgrounds and objects may also match. Lighting, reflections, transparency, and camera white balance affect results.

---

## 🌐 Requirements

- Camera access requires **HTTPS or localhost** and camera permission.
- Wireless transmission requires a **Web Bluetooth-compatible browser** and compatible micro:bit receiver code.
- On iPhone, use a browser with Bluetooth support such as Bluefy and verify operation with the actual device.
- File sharing depends on browser support; model download is available as an alternative.
- **Node.js is not required to use the hosted web app.** For local development, serve this folder using any static HTTP server, such as `python -m http.server 8000`.

---

## 📝 License

- Copyright © 2024 Boundary X Co. All rights reserved.
- All rights to the source code and design of this project belong to BoundaryX.
- Web: [boundaryx.io](https://boundaryx.io)
- Contact: [Contact Boundary X](https://boundaryx.io/contact)
