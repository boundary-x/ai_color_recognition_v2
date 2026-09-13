(function(root){
  const LIMIT=10, MAX_IDS=99;
  function validate(data){
    if(data?.format!=='boundaryx-color-regions'||data.version!==1||!Array.isArray(data.classes)||!data.classes.length||data.classes.length>MAX_IDS)throw Error('지원하지 않는 색상 모델 파일입니다.');
    const ids=new Set();
    const vector=(v,min,max)=>Array.isArray(v)&&v.length===3&&v.every((x,k)=>Number.isFinite(x)&&x>=min[k]&&x<=max[k]);
    const lab=v=>vector(v,[0,-128,-128],[100,128,128]);
    return data.classes.map(c=>{
      if(!Number.isInteger(c.id)||c.id<1||c.id>MAX_IDS||ids.has(c.id)||c.count!==LIMIT||!vector(c.rgb,[0,0,0],[255,255,255])||!Array.isArray(c.samples)||c.samples.length!==LIMIT||!c.samples.every(lab)||!Array.isArray(c.ranges)||c.ranges.length!==LIMIT||!c.ranges.every(r=>Array.isArray(r)&&r.length===3&&r.every((a,k)=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite)&&a[0]<=a[1]&&a[0]>=[0,-128,-128][k]&&a[1]<=[100,128,128][k])))throw Error('ID 또는 샘플 데이터가 올바르지 않습니다. ID마다 10개 샘플이 필요합니다.');
      ids.add(c.id);return {id:c.id,count:LIMIT,rgb:[...c.rgb],lab:[...c.samples[0]],samples:c.samples.map(a=>[...a]),ranges:c.ranges.map(r=>r.map(a=>[...a]))};
    });
  }
  function primary(regions){
    return regions.length ? regions.reduce((a,b)=>(b.count||b.w*b.h)>(a.count||a.w*a.h)?b:a) : null;
  }
  function packet(id,regions,width,height){
    if(!regions.length)return 'stop';
    const r=primary(regions);
    const clamp=(v,max)=>Math.max(0,Math.min(max,Math.round(v)));
    return `i${id}x${clamp((r.x+r.w/2)/width*400,400)}y${clamp((r.y+r.h/2)/height*300,300)}w${clamp(r.w/width*400,400)}h${clamp(r.h/height*300,300)}d${Math.min(99,regions.length)}`;
  }
  root.ColorModel={LIMIT,MAX_IDS,validate,primary,packet};if(typeof module!=='undefined')module.exports=root.ColorModel;
})(globalThis);
