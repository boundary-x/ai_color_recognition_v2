// Serialize UART writes; split newline-delimited messages into BLE-sized chunks.
class ColorBluetooth {
  constructor(status,sent){this.status=status;this.sent=sent;this.device=null;this.characteristic=null;this.pending=null;this.writing=false;this.connecting=false;this.epoch=0;}
  get connected(){return Boolean(this.device?.gatt.connected&&this.characteristic);}
  async connect(){
    if(this.connecting||this.connected)return;
    if(!navigator.bluetooth){this.status('이 브라우저는 블루투스를 지원하지 않습니다.','error');return;}
    this.connecting=true;this.status('기기를 선택하고 있습니다.','pending');
    try{
      const device=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'BBC micro:bit'}],optionalServices:['6e400001-b5a3-f393-e0a9-e50e24dcca9e']});
      this.device=device;
      device.addEventListener('gattserverdisconnected',()=>{if(this.device===device){this.epoch++;this.characteristic=null;this.pending=null;this.status('연결 해제됨','idle');}});
      const server=await device.gatt.connect();const service=await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      this.characteristic=await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
      this.status('연결됨: '+device.name,'connected');
    }catch(e){this.disconnect(false);this.status(e.name==='NotFoundError'?'기기 선택이 취소됐습니다.':'연결 실패: '+e.message,e.name==='NotFoundError'?'idle':'error');}finally{this.connecting=false;}
  }
  disconnect(report=true){this.epoch++;this.pending=null;this.characteristic=null;if(this.device?.gatt.connected)this.device.gatt.disconnect();if(report)this.status('연결 해제됨','idle');}
  send(data){if(!this.connected)return;this.pending=data;this.drain();}
  async drain(){
    if(this.writing)return;this.writing=true;const epoch=this.epoch;
    try{while(this.pending!==null&&this.connected&&epoch===this.epoch){const data=this.pending;this.pending=null;const bytes=new TextEncoder().encode(data+'\n');const characteristic=this.characteristic;
      for(let i=0;i<bytes.length;i+=20){let timer;try{await Promise.race([characteristic.writeValue(bytes.slice(i,i+20)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('전송 응답 시간이 초과됐습니다.')),3000);})]);}finally{clearTimeout(timer);}if(epoch!==this.epoch)return;}
      if(this.pending===null||this.pending===data)this.sent(data);
    }}catch(e){this.disconnect(false);this.status('전송 실패: '+e.message,'error');}finally{this.writing=false;if(this.pending!==null&&this.connected)this.drain();}
  }
}
