# 🎨 Boundary X - AI Color Recognition

**Boundary X - AI Color Recognition** learns color regions locally in your browser and sends the selected color ID and bounding box to a micro:bit over Bluetooth.

## ✨ Key Features

- **Manual learning:** Collect exactly 10 samples for each automatic ID. Mixed-color samples are blocked. Complete training explicitly before recognition.
- **Data management:** Retrain or delete an ID, reset the model, download/share JSON files, and import validated color models. Canceling retraining preserves the previous model.
- **Selected-ID detection:** Choose one trained ID. The app detects its regions across the entire image and sends the largest region by pixel area.
- **Responsive layout:** Shared Boundary X object-recognition styling with desktop, tablet, phone portrait and landscape layouts.
- **Local processing:** CIELAB range matching, blur, morphology and region smoothing. No remote inference, image uploads, or model download.

## 🚀 Getting Started

1. Serve this directory over HTTPS or localhost and open `index.html`.
2. Allow camera access when the page opens, then add a learning ID. Use the separate Camera Settings card to switch cameras or mirror the image. The yellow learning frame and its caption appear only while collecting samples.
3. Fill the central square with one color. Tap **Add sample** 10 times, slightly varying angle and distance.
4. Complete training, select an ID, and start recognition.
5. Remove the object and verify that it is no longer detected.
6. Connect a micro:bit running a compatible Bluetooth UART receiver to transmit results.
7. Download your model before refreshing. Training data is held in memory and is not automatically saved.

Users of the hosted app do **not** need Node.js. For local development, any static HTTP server works, for example `python -m http.server 8000`.

## 📡 Communication Protocol

UTF-8 text with a trailing newline:

```text
i1x200y150w100h80d1\n
stop\n
```

| Field | Meaning |
| --- | --- |
| `i` | Selected color ID, 1–99 |
| `x`, `y` | Center in displayed orientation, normalized to a 400 × 300 coordinate space |
| `w`, `h` | Bounding-box size in the same coordinate space |
| `d` | Number of regions for the selected ID, capped at 99 |

The largest region is selected by matching pixel count. No detection, manual stop, camera loss, or hiding the page requests `stop`. Writes are serialized and split into at most 20-byte BLE chunks; receivers must accumulate bytes through the newline. The display says “sent” only after the write completes. Device action itself is not acknowledged by the app.

Service: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
Write characteristic: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

**Receiver update required:** This format replaces the old `I{id}R{r}G{g}B{b}` protocol. USB Serial is no longer included. A receiver-side timeout is recommended because browsers cannot guarantee delivery when disconnected or closed.

## 🧪 Recognition Settings

Default settings preserve the validated prototype: 200-pixel analysis width, 120 ms processing interval, Lab-axis range matching, color margin 8, extra lightness margin 15, minimum region area 1%, blur and mask cleanup enabled. Each of the 10 samples contributes a separate dominant-color range. The learning quality gate requires at least 80% of ROI pixels within the weighted Lab threshold.

This recognizes **colors**, not object identity. Objects and backgrounds with similar colors may match. Lighting, reflections, transparency and camera white balance affect the result. The app does not present a classifier-confidence percentage.

## 💾 Model Files

Version 1 JSON uses format `boundaryx-color-regions`. Each ID contains exactly 10 representative Lab colors and range bounds. Camera images are not saved. Imports validate all records before replacing current data, with confirmation when data already exists. Old KNN model files and prototype internals are not compatible. Recognition adjustment sliders are session settings and are not included in the model file.

## 🌐 Browser Notes

Camera access requires HTTPS or localhost and permission. Bluetooth requires a Web Bluetooth capable browser. Test Bluefy on iPhone with the actual device. File sharing depends on browser support; downloading is available as a fallback. Real hardware compatibility must be checked separately from simulated browser tests.

## 🛠️ Files

- `index.html`, `style.css`, `color.css`: UI and responsive layout.
- `sketch.js`: Camera, training, recognition and model-file workflow.
- `engine.js`: Validated color processing engine.
- `model.js`: Model validation and protocol formatting.
- `bluetooth.js`: Serialized Bluetooth UART transport.

## Help and Support

The in-app support card includes a nine-step guided tour, card-style troubleshooting, example-code and lesson-material sections, and update notes. Example-code and lesson links are pending and are displayed as unavailable until supplied.
