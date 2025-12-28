/**
 * sketch.js
 * Boundary X Color Recognition
 * Features:
 * 1. Average RGB Calculation
 * 2. Modern UI Integration
 * 3. Bluetooth Data Transmission
 */

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice = null, rxCharacteristic = null, isConnected = false;
let bluetoothStatus = "연결 대기 중", isSendingData = false;
let video, isFlipped = false, facingMode = "user", isColorDetectionActive = false;
let startDetectionButton, stopDetectionButton, connectBluetoothButton, disconnectBluetoothButton;
let switchCameraButton, flipCameraButton, colorDisplay;

function setup() {
  let canvas = createCanvas(400, 300);
  canvas.parent('p5-container');
  canvas.style('border-radius', '16px'); // 스타일 통일
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

  // [수정] 버튼 스타일 클래스 추가
  flipCameraButton = createButton("좌우 반전").mousePressed(toggleFlip);
  flipCameraButton.parent('camera-control-buttons');
  flipCameraButton.addClass('start-button');

  switchCameraButton = createButton("전후방 전환").mousePressed(switchCamera);
  switchCameraButton.parent('camera-control-buttons');
  switchCameraButton.addClass('start-button');

  connectBluetoothButton = createButton("기기 연결").mousePressed(connectBluetooth);
  connectBluetoothButton.parent('bluetooth-control-buttons');
  connectBluetoothButton.addClass('start-button');

  disconnectBluetoothButton = createButton("연결 해제").mousePressed(disconnectBluetooth);
  disconnectBluetoothButton.parent('bluetooth-control-buttons');
  disconnectBluetoothButton.addClass('stop-button');

  startDetectionButton = createButton("색상 감지 시작").mousePressed(startColorDetection);
  startDetectionButton.parent('object-control-buttons');
  startDetectionButton.addClass('start-button');

  stopDetectionButton = createButton("감지 중지").mousePressed(stopColorDetection);
  stopDetectionButton.parent('object-control-buttons');
  stopDetectionButton.addClass('stop-button');

  updateBluetoothStatus();
}

function draw() {
  background(0); // 블랙 배경

  video.loadPixels();

  let r = 0, g = 0, b = 0, count = 0;
  if (isColorDetectionActive) {
    const boxSize = 50;
    const centerX = video.width / 2;
    const centerY = video.height / 2;
    const xStart = Math.floor(centerX - boxSize / 2);
    const yStart = Math.floor(centerY - boxSize / 2);

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

    // 데이터 표시 형식 통일
    const displayData = `R${String(r).padStart(3, "0")} G${String(g).padStart(3, "0")} B${String(b).padStart(3, "0")}`;
    const sendData = `R${String(r).padStart(3, "0")}G${String(g).padStart(3, "0")}B${String(b).padStart(3, "0")}`;
    
    sendBluetoothData(sendData);
    
    colorDisplay.html(`전송됨: ${displayData}`);
    colorDisplay.style('color', '#0f0');
  }

  // 화면 그리기
  if (isFlipped) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();
  } else {
    image(video, 0, 0);
  }

  // 중앙 박스 그리기
  const boxSize = 50, centerX = width / 2, centerY = height / 2;
  noFill();
  stroke(255, 0, 0);
  strokeWeight(3);
  rect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);

  // 인식된 색상 미리보기 (우측 하단)
  if (isColorDetectionActive) {
    const previewSize = 50;
    fill(r, g, b);
    stroke(255);
    strokeWeight(2);
    rect(width - previewSize - 20, height - previewSize - 20, previewSize, previewSize);
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
    bluetoothStatus = `연결됨: ${bluetoothDevice.name}`;
  } catch (error) {
    console.error("Bluetooth connection failed:", error);
    bluetoothStatus = "연결 실패";
    updateBluetoothStatus(false, true);
    return;
  }
  updateBluetoothStatus(true);
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
    isConnected = false;
    bluetoothStatus = "연결 해제됨";
    rxCharacteristic = null;
    txCharacteristic = null;
    bluetoothDevice = null;
  }
  updateBluetoothStatus();
}

function updateBluetoothStatus(connected = false, error = false) {
  const statusElement = select('#bluetoothStatus');
  if(statusElement) {
      statusElement.html(`상태: ${bluetoothStatus}`);
      statusElement.removeClass('status-connected');
      statusElement.removeClass('status-error');
      
      if (connected) {
        statusElement.addClass('status-connected');
      } else if (error) {
        statusElement.addClass('status-error');
      }
  }
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
    // console.log("Sent:", data);
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
  colorDisplay.html("전송 대기 중...");
  colorDisplay.style('color', '#78B3FF');
}

function toggleFlip() {
  isFlipped = !isFlipped;
}

function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  video.remove();
  setupCamera();
}
