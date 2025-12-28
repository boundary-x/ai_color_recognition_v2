/**
 * sketch.js
 * Boundary X Teachable Color Machine (Hybrid Name+ID Edition)
 * Features:
 * 1. User inputs Name -> System assigns ID
 * 2. KNN Classification on IDs
 * 3. Result Display shows "ID + Name"
 * 4. Bluetooth sends "ID"
 */

// Bluetooth UUIDs
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice = null;
let rxCharacteristic = null;
let txCharacteristic = null;
let isConnected = false;
let bluetoothStatus = "연결 대기 중";
let isSendingData = false;

// ML Variables
let video;
let knnClassifier;
let currentRGB = [0, 0, 0];
let isPredicting = false;

// ID Mapping System
let nextClassId = 1; 
let idToNameMap = {}; // { "1": "사과", "2": "바나나" }

// DOM Elements
let classInput, addClassBtn, classListContainer, resetBtn;
let resultLabel, resultConfidence, btDataDisplay;
let flipButton, switchCameraButton, connectBluetoothButton, disconnectBluetoothButton;

// Camera
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
  
  resetBtn.mousePressed(() => {
      if(confirm("모든 학습 데이터를 삭제하시겠습니까?")) {
          knnClassifier.clearAllLabels();
          idToNameMap = {};
          nextClassId = 1;
          
          classListContainer.html(''); 
          resultLabel.html("데이터 없음");
          resultConfidence.html("");
          btDataDisplay.html("전송 데이터: 대기 중...");
      }
  });

  // Buttons
  flipButton = createButton("좌우 반전");
  flipButton.parent('camera-control-buttons');
  flipButton.addClass('start-button');
  flipButton.mousePressed(() => isFlipped = !isFlipped);

  switchCameraButton = createButton("전후방 전환");
  switchCameraButton.parent('camera-control-buttons');
  switchCameraButton.addClass('start-button');
  switchCameraButton.mousePressed(switchCamera);

  connectBluetoothButton = createButton("기기 연결");
  connectBluetoothButton.parent('bluetooth-control-buttons');
  connectBluetoothButton.addClass('start-button');
  connectBluetoothButton.mousePressed(connectBluetooth);

  disconnectBluetoothButton = createButton("연결 해제");
  disconnectBluetoothButton.parent('bluetooth-control-buttons');
  disconnectBluetoothButton.addClass('stop-button');
  disconnectBluetoothButton.mousePressed(disconnectBluetooth);

  updateBluetoothStatusUI();
}

// [핵심] 이름 입력 -> ID 생성 및 UI 표시
function addNewClass() {
    const className = classInput.value().trim();
    if (className === "") {
        alert("이름을 입력해주세요.");
        return;
    }

    // ID 자동 할당
    const currentId = String(nextClassId++);
    idToNameMap[currentId] = className; // 매핑 저장

    // UI 생성
    const row = createDiv('');
    row.addClass('train-btn-row');
    row.parent(classListContainer);

    // 버튼 텍스트: "ID 1 : 사과"
    const trainBtn = createButton(
        `<span class="id-badge">ID ${currentId}</span>
         <span class="train-text">${className}</span>`
    );
    trainBtn.addClass('train-btn');
    trainBtn.parent(row);
    
    // 데이터 개수 표시
    const countBadge = createSpan('0 data');
    countBadge.addClass('train-count');
    countBadge.parent(trainBtn);

    trainBtn.mousePressed(() => {
        addExample(currentId); // 실제 학습은 "ID 번호"로 수행
        
        // 클릭 효과
        trainBtn.style('background', '#e0e0e0');
        setTimeout(() => trainBtn.style('background', '#f8f9fa'), 100);
    });

    // 삭제 버튼
    const delBtn = createButton('×');
    delBtn.addClass('delete-class-btn');
    delBtn.parent(row);
    delBtn.mousePressed(() => {
        if(confirm(`[ID ${currentId}: ${className}] 버튼을 삭제하시겠습니까?`)) {
            row.remove();
        }
    });

    classInput.value(''); // 입력창 초기화
}

// ID 번호를 라벨로 학습
function addExample(labelId) {
    if (!currentRGB) return;

    knnClassifier.addExample(currentRGB, labelId); // Label = "1"

    updateButtonCount(labelId);

    if (!isPredicting) {
        classify();
    }
}

function updateButtonCount(labelId) {
    const count = knnClassifier.getCountByLabel()[labelId];
    
    // UI 업데이트 (ID 뱃지가 포함된 버튼 찾기)
    const buttons = document.querySelectorAll('.train-btn');
    buttons.forEach(btn => {
        if (btn.innerHTML.includes(`ID ${labelId}`)) {
            const badge = btn.querySelector('.train-count');
            if(badge) badge.innerText = `${count} data`;
        }
    });
}

function classify() {
    isPredicting = true;
    if (knnClassifier.getNumLabels() <= 0) return;
    knnClassifier.classify(currentRGB, gotResults);
}

function gotResults(error, result) {
    if (error) {
        console.error(error);
        return;
    }

    if (result.confidencesByLabel) {
        const labelId = result.label; // "1"
        const confidence = result.confidencesByLabel[labelId] * 100;
        
        // [핵심] ID를 사용하여 이름(Name)을 찾음
        const name = idToNameMap[labelId] || "알 수 없음";

        // 결과 표시: "ID 1 (사과)"
        resultLabel.html(`ID ${labelId} (${name})`);
        resultLabel.style('color', '#000');
        resultConfidence.html(`정확도: ${confidence.toFixed(0)}%`);

        if (confidence > 60) {
             sendBluetoothData(labelId); // 전송은 깔끔하게 "1"만
             btDataDisplay.html(`전송됨: ${labelId} (${name})`);
             btDataDisplay.style('color', '#0f0');
        } else {
             btDataDisplay.html(`전송 대기 (정확도 낮음)`);
             btDataDisplay.style('color', '#666');
        }
    }

    classify();
}

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
  const boxSize = 20;
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

/* --- Bluetooth Logic --- */

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
    console.error("Connection failed", error);
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

async function sendBluetoothData(data) {
  if (!rxCharacteristic || !isConnected) return;
  if (isSendingData) return;

  try {
    isSendingData = true;
    const encoder = new TextEncoder();
    // 데이터 (숫자 ID) 전송
    await rxCharacteristic.writeValue(encoder.encode(data + "\n"));
  } catch (error) {
    console.error("Error sending data:", error);
  } finally {
    isSendingData = false;
  }
}
