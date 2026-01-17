/**
 * sketch.js
 * Boundary X Teachable Color Machine (Robust Serial Fix)
 * Baud Rate: 9600 | Method: Direct Write (No Stream)
 */

// === 1. 통신 변수 ===
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice = null;
let rxCharacteristic = null;
let isConnected = false; // Bluetooth State

let serialPort = null;
let serialWriter = null;
let isSerialConnected = false; // Serial State

let connectionStatusText = "연결 대기 중";
let isSendingData = false;

// === 2. 머신러닝 변수 ===
let video;
let knnClassifier;
let currentRGB = [0, 0, 0];
let isPredicting = false; 

let nextClassId = 1; 
let idToNameMap = {}; 

// DOM Elements
let classInput, addClassBtn, classListContainer, resetBtn;
let resultLabel, resultConfidence, btDataDisplay;
let flipButton, switchCameraButton;
let startRecognitionButton, stopRecognitionButton; 

let facingMode = "user";
let isFlipped = false;

function setup() {
  let canvas = createCanvas(400, 300);
  canvas.parent('p5-container');
  canvas.style('border-radius', '16px');

  knnClassifier = ml5.KNNClassifier();

  setupCamera();
  createUI();
}

function setupCamera() {
  let constraints = { video: { facingMode: facingMode }, audio: false };
  video = createCapture(constraints);
  video.size(400, 300);
  video.hide();
}

function stopVideo() {
    if (video) {
        if (video.elt.srcObject) {
            video.elt.srcObject.getTracks().forEach(track => track.stop());
        }
        video.remove();
        video = null;
    }
}

function createUI() {
  classInput = select('#class-input');
  addClassBtn = select('#add-class-btn');
  classListContainer = select('#class-list');
  resetBtn = select('#reset-model-btn');
  
  resultLabel = select('#result-label');
  resultConfidence = select('#result-confidence');
  btDataDisplay = select('#bluetooth-data-display');

  addClassBtn.mousePressed(addNewClass);
  classInput.elt.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addNewClass();
  });
  
  resetBtn.mousePressed(resetModel);

  // Camera Buttons
  flipButton = createButton("좌우 반전");
  flipButton.parent('camera-control-buttons');
  flipButton.addClass('start-button');
  flipButton.mousePressed(() => isFlipped = !isFlipped);

  switchCameraButton = createButton("전후방 전환");
  switchCameraButton.parent('camera-control-buttons');
  switchCameraButton.addClass('start-button');
  switchCameraButton.mousePressed(switchCamera);

  // Connection Buttons
  select('#btn-bt-connect').mousePressed(connectBluetooth);
  select('#btn-bt-disconnect').mousePressed(disconnectBluetooth);
  select('#btn-serial-connect').mousePressed(connectSerial);
  select('#btn-serial-disconnect').mousePressed(disconnectSerial);

  // Recognition Buttons
  startRecognitionButton = createButton("컬러 인식 시작");
  startRecognitionButton.parent('recognition-control-buttons');
  startRecognitionButton.addClass('start-button');
  startRecognitionButton.mousePressed(startClassify);

  stopRecognitionButton = createButton("인식 중지");
  stopRecognitionButton.parent('recognition-control-buttons');
  stopRecognitionButton.addClass('stop-button');
  stopRecognitionButton.mousePressed(stopClassify);

  updateStatusUI();
}

function addNewClass() {
    const className = classInput.value().trim();
    if (className === "") { alert("이름을 입력해주세요."); return; }
    const currentId = String(nextClassId++);
    idToNameMap[currentId] = className; 
    
    const row = createDiv('');
    row.addClass('train-btn-row');
    row.parent(classListContainer);
    
    const trainBtn = createButton(`<span class="id-badge">ID ${currentId}</span><span class="train-text">${className}</span>`);
    trainBtn.addClass('train-btn');
    trainBtn.parent(row);
    const countBadge = createSpan('0 data');
    countBadge.addClass('train-count');
    countBadge.parent(trainBtn);
    trainBtn.mousePressed(() => {
        addExample(currentId); 
        trainBtn.style('background', '#e0e0e0');
        setTimeout(() => trainBtn.style('background', '#f8f9fa'), 100);
    });

    const delBtn = createButton('×');
    delBtn.addClass('delete-class-btn');
    delBtn.parent(row);
    delBtn.mousePressed(() => { if(confirm(`삭제하시겠습니까?`)) row.remove(); });
    classInput.value('');
}

function addExample(labelId) {
    if (!currentRGB) return;
    knnClassifier.addExample(currentRGB, labelId);
    
    const count = knnClassifier.getCountByLabel()[labelId];
    const buttons = document.querySelectorAll('.train-btn');
    buttons.forEach(btn => {
        if (btn.innerText.includes(`ID ${labelId}`)) {
            const badge = btn.querySelector('.train-count');
            if(badge) badge.innerText = `${count} data`;
        }
    });
}

function resetModel() {
    if(confirm("모든 데이터를 삭제하시겠습니까?")) {
        knnClassifier.clearAllLabels();
        idToNameMap = {};
        nextClassId = 1;
        classListContainer.html(''); 
        resultLabel.html("데이터 없음");
        btDataDisplay.html("전송 데이터: 대기 중...");
        stopClassify(); 
    }
}

function startClassify() {
    if (knnClassifier.getNumLabels() <= 0) { alert("학습 데이터를 추가해주세요!"); return; }
    if (!isPredicting) { isPredicting = true; classify(); }
}

function stopClassify() {
    isPredicting = false;
    resultLabel.html("중지됨");
    sendDataToDevices("stop");
    btDataDisplay.html("전송됨: stop");
    btDataDisplay.style('color', '#EA4335');
}

function classify() {
    if (!isPredicting) return;
    if (knnClassifier.getNumLabels() <= 0) return;
    knnClassifier.classify(currentRGB, gotResults);
}

function gotResults(error, result) {
    if (error) { console.error(error); return; }

    if (result.confidencesByLabel) {
        const labelId = result.label;
        const confidence = result.confidencesByLabel[labelId] * 100;
        const name = idToNameMap[labelId] || "알 수 없음";

        resultLabel.html(`ID ${labelId} (${name})`);
        resultConfidence.html(`정확도: ${confidence.toFixed(0)}%`);

        if (isPredicting && confidence > 70) {
             let r = String(currentRGB[0]).padStart(3, '0');
             let g = String(currentRGB[1]).padStart(3, '0');
             let b = String(currentRGB[2]).padStart(3, '0');
             let dataToSend = `I${labelId}R${r}G${g}B${b}`;
             
             sendDataToDevices(dataToSend);
             btDataDisplay.html(`전송됨: ${dataToSend}`);
             btDataDisplay.style('color', '#0f0');
        } else {
             btDataDisplay.html(`전송 대기 (정확도 낮음)`);
             btDataDisplay.style('color', '#666');
        }
    }
    if (isPredicting) classify(); 
}

// === 3. 통신 로직 (Direct Write Fix) ===

async function connectSerial() {
    if (!("serial" in navigator)) { alert("Web Serial API 미지원 브라우저입니다."); return; }
    try {
        serialPort = await navigator.serial.requestPort();
        // [중요] 9600 bps 설정
        await serialPort.open({ baudRate: 9600 });
        // [중요] Raw Writer 직접 사용 (Stream 제거)
        serialWriter = serialPort.writable.getWriter();

        isSerialConnected = true;
        connectionStatusText = "USB 연결됨 (9600)";
        updateStatusUI(true, false, "usb");
    } catch (error) {
        console.error("Serial error:", error);
        connectionStatusText = "USB 연결 실패";
        updateStatusUI(false, true);
    }
}

async function disconnectSerial() {
    if (serialWriter) {
        serialWriter.releaseLock(); // Writer 해제
        serialWriter = null;
    }
    if (serialPort) {
        await serialPort.close();
        serialPort = null;
    }
    isSerialConnected = false;
    connectionStatusText = "USB 연결 해제됨";
    updateStatusUI(false);
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
    isConnected = true;
    connectionStatusText = "BLE 연결됨";
    updateStatusUI(true, false, "ble");
  } catch (error) {
    connectionStatusText = "BLE 연결 실패";
    updateStatusUI(false, true);
  }
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) bluetoothDevice.gatt.disconnect();
  isConnected = false; rxCharacteristic = null; bluetoothDevice = null;
  connectionStatusText = "BLE 연결 해제됨";
  updateStatusUI(false);
}

// [핵심] 통합 전송 함수 (Direct Write & CRLF)
async function sendDataToDevices(data) {
    // 줄바꿈 문자(\r\n)를 반드시 포함
    const finalData = data + "\r\n";

    // 1. Bluetooth
    if (isConnected && rxCharacteristic && !isSendingData) {
        try {
            isSendingData = true;
            await rxCharacteristic.writeValue(new TextEncoder().encode(finalData));
        } catch (e) { console.error(e); } 
        finally { isSendingData = false; }
    }

    // 2. USB Serial (수정됨)
    if (isSerialConnected && serialWriter) {
        try {
            // 문자열을 바이트 배열로 변환하여 직접 전송
            const rawData = new TextEncoder().encode(finalData);
            await serialWriter.write(rawData);
        } catch (e) { console.error("Serial Write Error:", e); }
    }
}

function updateStatusUI(connected=false, error=false) {
  const statusElement = select('#connectionStatus');
  if(statusElement) {
      statusElement.html(`상태: ${connectionStatusText}`);
      statusElement.removeClass('status-connected');
      statusElement.removeClass('status-error');
      if (connected) statusElement.addClass('status-connected');
      else if (error) statusElement.addClass('status-error');
  }
}

function draw() {
  background(0);
  if (!video || !video.width) return;

  push();
  if (isFlipped) { translate(width, 0); scale(-1, 1); }
  image(video, 0, 0, width, height);
  pop();

  video.loadPixels();
  const boxSize = 60; 
  const xStart = Math.floor(video.width/2 - boxSize/2);
  const yStart = Math.floor(video.height/2 - boxSize/2);
  let r=0, g=0, b=0, count=0;
  
  for (let x=xStart; x<xStart+boxSize; x++) {
      for (let y=yStart; y<yStart+boxSize; y++) {
          let idx = (y*video.width + x)*4;
          if (idx < video.pixels.length-3) {
              r+=video.pixels[idx]; g+=video.pixels[idx+1]; b+=video.pixels[idx+2]; count++;
          }
      }
  }
  if (count>0) currentRGB = [Math.round(r/count), Math.round(g/count), Math.round(b/count)];

  noFill(); stroke(255); strokeWeight(3);
  rect(width/2 - boxSize/2, height/2 - boxSize/2, boxSize, boxSize);
  fill(currentRGB[0], currentRGB[1], currentRGB[2]);
  stroke(255); circle(width-40, height-40, 50);
}

function switchCamera() {
  stopVideo();
  facingMode = facingMode === "user" ? "environment" : "user";
  setTimeout(setupCamera, 500);
}
