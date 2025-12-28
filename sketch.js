const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice = null, rxCharacteristic = null, isConnected = false;
let bluetoothStatus = "Disconnected", isSendingData = false;
let video, isFlipped = false, facingMode = "user", isColorDetectionActive = false;
let startDetectionButton, stopDetectionButton, connectBluetoothButton, disconnectBluetoothButton;
let switchCameraButton, flipCameraButton, colorDisplay;

function setup() {
  let canvas = createCanvas(400, 300);
  canvas.parent('p5-container');
  canvas.style('border-radius', '20px');
  setupCamera();
  createUI();
}

function setupCamera() {
  video = createCapture({ video: { facingMode: facingMode } });
  video.size(400, 300);
  video.hide();
}

function createUI() {
  colorDisplay = select('#colorDisplay');

  flipCameraButton = createButton("↔️ 카메라 좌우 반전").mousePressed(toggleFlip);
  flipCameraButton.parent('camera-control-buttons');

  switchCameraButton = createButton("🔄 전후방 카메라 전환").mousePressed(switchCamera);
  switchCameraButton.parent('camera-control-buttons');

  connectBluetoothButton = createButton("🔗 블루투스 연결").mousePressed(connectBluetooth);
  connectBluetoothButton.parent('bluetooth-control-buttons');

  disconnectBluetoothButton = createButton("❌ 블루투스 연결 해제").mousePressed(disconnectBluetooth);
  disconnectBluetoothButton.parent('bluetooth-control-buttons');

  startDetectionButton = createButton("🟢 색상 감지 시작").mousePressed(startColorDetection);
  startDetectionButton.parent('object-control-buttons');

  stopDetectionButton = createButton("🔴 색상 감지 중지").mousePressed(stopColorDetection);
  stopDetectionButton.parent('object-control-buttons');

  updateBluetoothStatus();
}

function draw() {
  background(220);

  video.loadPixels();

  let r = 0, g = 0, b = 0, count = 0;
  if (isColorDetectionActive) {
    const boxSize = 50;
    const centerX = video.width / 2;
    const centerY = video.height / 2;
    const xStart = centerX - boxSize / 2;
    const yStart = centerY - boxSize / 2;

    for (let x = xStart; x < xStart + boxSize; x++) {
      for (let y = yStart; y < yStart + boxSize; y++) {
        const index = (y * video.width + x) * 4;
        r += video.pixels[index];
        g += video.pixels[index + 1];
        b += video.pixels[index + 2];
        count++;
      }
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    const displayData = `R${String(r).padStart(3, "0")} G${String(g).padStart(3, "0")} B${String(b).padStart(3, "0")}`;
    const sendData = `R${String(r).padStart(3, "0")}G${String(g).padStart(3, "0")}B${String(b).padStart(3, "0")}`;
    
    sendBluetoothData(sendData);
    colorDisplay.html(`마이크로비트로 전송된 데이터: ${displayData}`);
  }

  if (isFlipped) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();
  } else {
    image(video, 0, 0);
  }

  const boxSize = 50, centerX = width / 2, centerY = height / 2;
  noFill();
  stroke(255, 0, 0);
  strokeWeight(2);
  rect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);

  if (isColorDetectionActive) {
    const previewSize = 50;
    fill(r, g, b);
    noStroke();
    rect(width - previewSize - 10, height - previewSize - 10, previewSize, previewSize);
  }
}

async function connectBluetooth() {
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "BBC micro:bit" }],
      optionalServices: [UART_SERVICE_UUID]
    });
    const server = await bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE_UUID);
    rxCharacteristic = await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);
    txCharacteristic = await service.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);
    txCharacteristic.startNotifications();
    txCharacteristic.addEventListener("characteristicvaluechanged", handleReceivedData);
    isConnected = true;
    bluetoothStatus = `Connected to ${bluetoothDevice.name}`;
  } catch (error) {
    console.error("Bluetooth connection failed:", error);
    bluetoothStatus = "Connection Failed";
  }
  updateBluetoothStatus();
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
    isConnected = false;
    bluetoothStatus = "Disconnected";
    rxCharacteristic = null;
    txCharacteristic = null;
    bluetoothDevice = null;
  }
  updateBluetoothStatus();
}

function updateBluetoothStatus() {
  const statusElement = select('#bluetoothStatus');
  statusElement.html(`상태: ${bluetoothStatus}`);
  statusElement.style('background-color', isConnected ? '#d0f0fd' : '#f9f9f9');
  statusElement.style('color', isConnected ? '#78B3FF' : '#FE818D');
}

function handleReceivedData(event) {
  const receivedData = new TextDecoder().decode(new Uint8Array(event.target.value.buffer));
  console.log("Received:", receivedData);
}

async function sendBluetoothData(data) {
  if (!rxCharacteristic || !isConnected || isSendingData) return;
  try {
    isSendingData = true;
    const encoder = new TextEncoder();
    await rxCharacteristic.writeValue(encoder.encode(`${data}\n`));
    console.log("Sent:", data);
  } catch (error) {
    console.error("Error sending data:", error);
  } finally {
    isSendingData = false;
  }
}

function startColorDetection() {
  if (!isConnected) {
    alert("블루투스가 연결되어 있지 않습니다.");
    return;
  }
  isColorDetectionActive = true;
}

function stopColorDetection() {
  isColorDetectionActive = false;
  sendBluetoothData("stop");
  colorDisplay.html("마이크로비트로 전송된 데이터: 없음");
}

function toggleFlip() {
  isFlipped = !isFlipped;
}

function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  video.remove();
  setupCamera();
}
