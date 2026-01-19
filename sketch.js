/**
 * sketch.js
 * Boundary X Teachable Color Machine
 * * Features:
 * 1. Dual Connection: Supports Bluetooth (BLE) & USB Serial (Web Serial API)
 * 2. Android Tablet Fix: Added Vendor ID filter for Web Serial
 * 3. Anti-Flicker: Throttling data transmission (100ms interval)
 * * Protocol: I{id}R{rrr}G{ggg}B{bbb} (e.g., I1R255G000B000)
 */

// === 1. Global Variables ===

// Bluetooth UUIDs (Nordic UART Service)
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Bluetooth Variables
let bluetoothDevice = null;
let rxCharacteristic = null;
let txCharacteristic = null;
let isConnected = false;
let bluetoothStatus = "연결 대기 중";
let isSendingData = false;

// Serial (USB) Variables
let serialPort;
let serialWriter;
let isSerialConnected = false;
let serialStatus = "연결 대기 중";

// ML & Logic Variables
let video;
let knnClassifier;
let currentRGB = [0, 0, 0];
let isPredicting = false; 

// Throttling Variables (데이터 전송 속도 제한)
let lastSentTime = 0;
const SEND_INTERVAL = 100; // 0.1초(100ms) 간격으로만 전송

// ID Mapping System
let nextClassId = 1; 
let idToNameMap = {}; 

// DOM Elements
let classInput, addClassBtn, classListContainer, resetBtn;
let resultLabel, resultConfidence, btDataDisplay;
let flipButton, switchCameraButton;
let connectBluetoothButton, disconnectBluetoothButton;
let connectSerialBtn, disconnectSerialBtn; 
let startRecognitionButton, stopRecognitionButton; 

// Camera Settings
let facingMode = "user";
let isFlipped = false;

// === 2. Setup & UI ===

function setup() {
  let canvas = createCanvas(400, 300);
  canvas.parent('p5-container');
  canvas.style('border-radius', '16px');

  knnClassifier = ml5.KNNClassifier();

  setupCamera();
  createUI();
}

function setupCamera() {
  let constraints = {
    video: {
      facingMode: facingMode
    },
    audio: false
  };
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
  // Select DOM Elements
  classInput = select('#class-input');
  addClassBtn = select('#add-class-btn');
  classListContainer = select('#class-list');
  resetBtn = select('#reset-model-btn');
  
  resultLabel = select('#result-label');
  resultConfidence = select('#result-confidence');
  btDataDisplay = select('#bluetooth-data-display');

  // Event Listeners for Input
  addClassBtn.mousePressed(addNewClass);
  classInput.elt.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addNewClass();
  });
  
  resetBtn.mousePressed(resetModel);

  // Camera Control Buttons
  flipButton = createButton("좌우 반전");
  flipButton.parent('camera-control-buttons');
  flipButton.addClass('start-button');
  flipButton.mousePressed(() => isFlipped = !isFlipped);

  switchCameraButton = createButton("전후방 전환");
  switchCameraButton.parent('camera-control-buttons');
  switchCameraButton.addClass('start-button');
  switchCameraButton.mousePressed(switchCamera);

  // Bluetooth Buttons
  connectBluetoothButton = createButton("BT 연결 (무선)");
  connectBluetoothButton.parent('bluetooth-control-buttons');
  connectBluetoothButton.addClass('start-button');
  connectBluetoothButton.mousePressed(connectBluetooth);

  disconnectBluetoothButton = createButton("BT 해제");
  disconnectBluetoothButton.parent('bluetooth-control-buttons');
  disconnectBluetoothButton.addClass('stop-button');
  disconnectBluetoothButton.mousePressed(disconnectBluetooth);

  // Serial (USB) Buttons
  connectSerialBtn = createButton("USB 연결 (유선)");
  connectSerialBtn.parent('serial-control-buttons');
  connectSerialBtn.addClass('start-button');
  connectSerialBtn.mousePressed(connectSerial);

  disconnectSerialBtn = createButton("USB 해제");
  disconnectSerialBtn.parent('serial-control-buttons');
  disconnectSerialBtn.addClass('stop-button');
  disconnectSerialBtn.mousePressed(disconnectSerial);

  // Recognition Buttons
  startRecognitionButton = createButton("컬러 인식 시작");
  startRecognitionButton.parent('recognition-control-buttons');
  startRecognitionButton.addClass('start-button');
  startRecognitionButton.mousePressed(startClassify);

  stopRecognitionButton = createButton("인식 중지");
  stopRecognitionButton.parent('recognition-control-buttons');
  stopRecognitionButton.addClass('stop-button');
  stopRecognitionButton.mousePressed(stopClassify);

  // Initialize UI Status
  updateBluetoothStatusUI();
  updateSerialStatusUI();
}

// === 3. Class Management Logic ===

function addNewClass() {
    const className = classInput.value().trim();
    if (className === "") {
        alert("이름을 입력해주세요.");
        return;
    }

    const currentId = String(nextClassId++);
    idToNameMap[currentId] = className; 

    const row = createDiv('');
    row.addClass('train-btn-row');
    row.parent(classListContainer);

    const trainBtn = createButton(
        `<span class="id-badge">ID ${currentId}</span>
         <span class="train-text">${className}</span>`
    );
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
    delBtn.mousePressed(() => {
        if(confirm(`[ID ${currentId}: ${className}] 버튼을 삭제하시겠습니까?`)) {
            row.remove();
        }
    });

    classInput.value('');
}

function addExample(labelId) {
    if (!currentRGB) return;
    knnClassifier.addExample(currentRGB, labelId);
    updateButtonCount(labelId);
}

function updateButtonCount(labelId) {
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
    if(confirm("모든 학습 데이터를 삭제하시겠습니까?")) {
        knnClassifier.clearAllLabels();
        idToNameMap = {};
        nextClassId = 1;
        
        classListContainer.html(''); 
        resultLabel.html("데이터 없음");
        resultConfidence.html("");
        btDataDisplay.html("전송 데이터: 대기 중...");
        btDataDisplay.style('color', '#666');
        
        stopClassify(); 
    }
}

// === 4. Classification & Data Sending Logic ===

function startClassify() {
    if (knnClassifier.getNumLabels() <= 0) {
        alert("먼저 학습 데이터를 추가해주세요!");
        return;
    }
    if (!isPredicting) {
        isPredicting = true;
        classify(); 
    }
}

function stopClassify() {
    isPredicting = false;
    
    resultLabel.html("중지됨");
    resultLabel.style('color', '#666');
    resultConfidence.html("");
    
    // [중요] Stop 명령을 블루투스와 시리얼 모두에게 전송
    sendBluetoothData("stop");
    sendSerialData("stop");
    
    btDataDisplay.html("전송됨: stop");
    btDataDisplay.style('color', '#EA4335');
}

function classify() {
    if (!isPredicting) return;
    if (knnClassifier.getNumLabels() <= 0) return;

    knnClassifier.classify(currentRGB, gotResults);
}

// [핵심] 결과 처리 및 쓰로틀링(속도제한) 적용
function gotResults(error, result) {
    if (error) {
        console.error(error);
        return;
    }

    if (result.confidencesByLabel) {
        const labelId = result.label;
        const confidence = result.confidencesByLabel[labelId] * 100;
        const name = idToNameMap[labelId] || "알 수 없음";

        // 화면 UI는 실시간 업데이트 (사용자 경험을 위해)
        resultLabel.html(`ID ${labelId} (${name})`);
        resultLabel.style('color', '#000');
        resultConfidence.html(`정확도: ${confidence.toFixed(0)}%`);

        // 하드웨어 전송은 조건부 실행
        if (isPredicting && confidence > 60) {
             
             // [스로틀링] 현재 시간 체크
             let now = millis();
             
             // 마지막 전송 후 0.1초(100ms)가 지났을 때만 전송
             if (now - lastSentTime > SEND_INTERVAL) {
                 
                 // 3자리 패딩 (000 ~ 255)
                 let r = String(currentRGB[0]).padStart(3, '0');
                 let g = String(currentRGB[1]).padStart(3, '0');
                 let b = String(currentRGB[2]).padStart(3, '0');
                 
                 // 프로토콜 생성
                 let dataToSend = `I${labelId}R${r}G${g}B${b}`;
                 
                 // 연결된 모든 기기에 전송
                 sendBluetoothData(dataToSend);
                 sendSerialData(dataToSend);
                 
                 btDataDisplay.html(`전송됨: ${dataToSend}`);
                 btDataDisplay.style('color', '#0f0');

                 // 전송 시간 갱신
                 lastSentTime = now;
             }
        } else {
             btDataDisplay.html(`전송 대기 (정확도 낮음)`);
             btDataDisplay.style('color', '#666');
        }
    }

    if (isPredicting) {
        classify(); 
    }
}

// === 5. P5 Draw Loop ===

function draw() {
  background(0);

  if (!video || !video.width) {
      fill(255);
      textAlign(CENTER);
      text("카메라 로딩 중...", width/2, height/2);
      return;
  }

  push();
  if (isFlipped) {
    translate(width, 0);
    scale(-1, 1);
  }
  image(video, 0, 0, width, height);
  pop();

  video.loadPixels();
  
  const boxSize = 60; 
  const cx = video.width / 2;
  const cy = video.height / 2;
  const xStart = Math.floor(cx - boxSize / 2);
  const yStart = Math.floor(cy - boxSize / 2);

  let r = 0, g = 0, b = 0, count = 0;
  
  for (let x = xStart; x < xStart + boxSize; x++) {
      for (let y = yStart; y < yStart + boxSize; y++) {
          let index = (y * video.width + x) * 4;
          if (index < video.pixels.length - 3) {
              r += video.pixels[index];
              g += video.pixels[index + 1];
              b += video.pixels[index + 2];
              count++;
          }
      }
  }
  
  if (count > 0) {
      currentRGB = [
          Math.round(r / count), 
          Math.round(g / count), 
          Math.round(b / count)
      ];
  }

  noFill();
  stroke(255);
  strokeWeight(3);
  rect(width/2 - boxSize/2, height/2 - boxSize/2, boxSize, boxSize);

  fill(currentRGB[0], currentRGB[1], currentRGB[2]);
  stroke(255);
  strokeWeight(2);
  circle(width - 40, height - 40, 50);
}

function switchCamera() {
  stopVideo();
  facingMode = facingMode === "user" ? "environment" : "user";
  setTimeout(setupCamera, 500);
}

/* === 6. Bluetooth Logic (Web Bluetooth API) === */

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

    isConnected = true;
    bluetoothStatus = "연결됨: " + bluetoothDevice.name;
    updateBluetoothStatusUI(true);
    
  } catch (error) {
    console.error("BT Connection failed", error);
    bluetoothStatus = "연결 실패";
    updateBluetoothStatusUI(false, true);
  }
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  isConnected = false;
  bluetoothStatus = "연결 해제됨";
  rxCharacteristic = null;
  txCharacteristic = null;
  bluetoothDevice = null;
  updateBluetoothStatusUI(false);
}

function updateBluetoothStatusUI(connected = false, error = false) {
  const statusElement = select('#bluetoothStatus');
  if(statusElement) {
      statusElement.html(`블루투스: ${bluetoothStatus}`);
      statusElement.removeClass('status-connected');
      statusElement.removeClass('status-error');
      
      if (connected) statusElement.addClass('status-connected');
      else if (error) statusElement.addClass('status-error');
  }
}

async function sendBluetoothData(data) {
  if (!rxCharacteristic || !isConnected) return;
  if (isSendingData) return; // 블루투스 자체 전송 중복 방지

  try {
    isSendingData = true;
    const encoder = new TextEncoder();
    await rxCharacteristic.writeValue(encoder.encode(data + "\n"));
  } catch (error) {
    console.error("BT Send Error:", error);
  } finally {
    isSendingData = false;
  }
}

/* === 7. Serial Logic (Web Serial API & Android Fix) === */

async function connectSerial() {
  if (!navigator.serial) {
    alert("이 브라우저는 Web Serial API를 지원하지 않습니다. (PC Chrome/Edge 권장)");
    return;
  }

  try {
    // [안드로이드 호환성 픽스] Vendor ID 필터 추가
    // 0x0D28은 BBC micro:bit의 공통 Vendor ID입니다.
    const filters = [
      { usbVendorId: 0x0d28 } 
    ];

    // 필터를 적용하여 포트 요청 (안드로이드 인식률 향상)
    serialPort = await navigator.serial.requestPort({ filters });
    
    // 마이크로비트 기본 속도인 115200으로 포트 열기
    await serialPort.open({ baudRate: 115200 });

    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(serialPort.writable);
    serialWriter = textEncoder.writable.getWriter();

    isSerialConnected = true;
    serialStatus = "연결됨 (USB)";
    updateSerialStatusUI(true);

  } catch (error) {
    console.error("Serial Connection Failed:", error);
    
    // 필터 문제로 장치를 못 찾을 경우 힌트 제공
    if (error.name === "NotFoundError") {
        alert("기기를 찾을 수 없습니다.\n1. 케이블이 OTG인지 확인하세요.\n2. 마이크로비트 펌웨어가 최신인지 확인하세요.");
    } else {
        serialStatus = "연결 실패 (취소됨)";
        updateSerialStatusUI(false, true);
    }
  }
}

async function disconnectSerial() {
  if (serialWriter) {
    await serialWriter.close();
    serialWriter = null;
  }
  if (serialPort) {
    await serialPort.close();
    serialPort = null;
  }
  
  isSerialConnected = false;
  serialStatus = "연결 해제됨";
  updateSerialStatusUI(false);
}

function updateSerialStatusUI(connected = false, error = false) {
  const el = select('#serialStatus');
  if(el) {
    el.html(`유선(USB): ${serialStatus}`);
    el.removeClass('status-connected');
    el.removeClass('status-error');
    if(connected) el.addClass('status-connected');
    else if(error) el.addClass('status-error');
  }
}

async function sendSerialData(data) {
  if (serialWriter && isSerialConnected) {
    try {
      // 줄바꿈 문자(\n)를 포함하여 전송
      await serialWriter.write(data + "\n");
    } catch (e) {
      console.error("Serial Write Error:", e);
    }
  }
}
