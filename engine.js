/* Whole-frame segmentation: local edges plus a fixed seed-color bound prevent gradual color bridging. */
(function(root){
const lut=Float32Array.from({length:256},(_,i)=>{let v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
function lab(r,g,b){r=lut[r];g=lut[g];b=lut[b];const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);return [116*y-16,500*(x-y),200*(y-z)];}
function distance(a,b){return .65*(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;}
function segment(data,w,h,tolerance,minPixels){const n=w*h,L=new Float32Array(n*3),labels=new Int32Array(n);labels.fill(-1);for(let i=0;i<n;i++)L.set(lab(data[i*4],data[i*4+1],data[i*4+2]),i*3);const queue=new Int32Array(n),regions=[];let id=0;const diff=(i,j)=>.65*(L[i*3]-L[j*3])**2+(L[i*3+1]-L[j*3+1])**2+(L[i*3+2]-L[j*3+2])**2;
for(let seed=0;seed<n;seed++){if(labels[seed]>=0)continue;let head=0,tail=1;queue[0]=seed;labels[seed]=id;let x0=w,y0=h,x1=0,y1=0,sum=[0,0,0],rgb=[0,0,0];while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(let c=0;c<3;c++){sum[c]+=L[p*3+c];rgb[c]+=data[p*4+c];}for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1]){if(q<0||labels[q]>=0)continue;if(diff(p,q)<=tolerance*tolerance&&diff(seed,q)<=tolerance*tolerance*2.25){labels[q]=id;queue[tail++]=q;}}}
// Exclude dominant backgrounds, but retain valid objects touching one screen edge.
if(tail>=minPixels&&tail<n*.65&&x1-x0>=2&&y1-y0>=2)regions.push({id,count:tail,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,lab:sum.map(v=>v/tail),rgb:rgb.map(v=>Math.round(v/tail))});id++;}
return {regions,labels};}
function filterRegions(regions,w,h,minChroma=24,includeNeutral=false){return regions.filter(r=>{
const fill=r.count/(r.w*r.h),chroma=Math.hypot(r.lab[1],r.lab[2]);
const edges=Number(r.x===0)+Number(r.y===0)+Number(r.x+r.w>=w)+Number(r.y+r.h>=h);
return fill>=.55&&r.count/(w*h)<=.35&&edges<3&&(includeNeutral||chroma>=minChroma);
});}

// Match learned colors before connected-component extraction; candidate filters do not apply.
function detect(data,w,h,classes,tolerance,minPixels,options={}){
 const n=w*h;let mask=new Int32Array(n);mask.fill(-1);const ranges=classes.map(c=>c.ranges||[c.bounds||bounds(c.samples||[c.lab])]);
 for(let p=0;p<n;p++){const v=lab(data[p*4],data[p*4+1],data[p*4+2]);let best=-1,d1=Infinity,d2=Infinity;
 classes.forEach((c,k)=>{const d=options.range?Math.min(...ranges[k].map(range=>Math.max(...v.map((value,axis)=>{const [lo,hi]=range[axis],gap=Math.max(lo-value,0,value-hi),margin=axis===0?tolerance/Math.sqrt(.65)+(options.lightExtra||0):tolerance;return (gap/margin)**2;}))))*tolerance*tolerance:Math.min(...(c.samples||[c.lab]).map(s=>distance(v,s)));if(d<d1){d2=d1;d1=d;best=k;}else d2=Math.min(d2,d);});
 if(d1<tolerance*tolerance&&d2-d1>20)mask[p]=best;}
 if(options.cleanup)mask=opening(mask,w,h);
 // Fill isolated holes without extending the silhouette.
 const clean=mask.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;if(mask[p]>=0)continue;const votes={};for(const q of [p-1,p+1,p-w,p+w])if(mask[q]>=0)votes[mask[q]]=(votes[mask[q]]||0)+1;for(const k in votes)if(votes[k]>=3)clean[p]=Number(k);}
 const seen=new Uint8Array(n),queue=new Int32Array(n),regions=[];
 for(let p=0;p<n;p++){if(seen[p]||clean[p]<0)continue;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;queue[0]=p;seen[p]=1;const k=clean[p];while(head<tail){const q=queue[head++],x=q%w,y=(q/w)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const r of [x?q-1:-1,x<w-1?q+1:-1,y?q-w:-1,y<h-1?q+w:-1])if(r>=0&&!seen[r]&&clean[r]===k){seen[r]=1;queue[tail++]=r;}}
 if(tail>=minPixels)regions.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,count:tail,learned:classes[k]});}
 return regions;
}
function smooth(regions,previous){const used=new Set();return regions.map(r=>{let best=null,score=.15;for(const p of previous){if(used.has(p)||p.learned.id!==r.learned.id)continue;const iw=Math.max(0,Math.min(p.x+p.w,r.x+r.w)-Math.max(p.x,r.x)),ih=Math.max(0,Math.min(p.y+p.h,r.y+r.h)-Math.max(p.y,r.y)),i=iw*ih,s=i/(p.w*p.h+r.w*r.h-i);if(s>score){best=p;score=s;}}if(!best)return r;used.add(best);const out={...r};for(const k of ['x','y','w','h'])out[k]=best[k]*.35+r[k]*.65;return out;});}

function blur(data,w,h){const out=new Uint8ClampedArray(data.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0,s=[0,0,0];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=Math.max(0,Math.min(w-1,x+dx)),yy=Math.max(0,Math.min(h-1,y+dy)),p=(yy*w+xx)*4;n++;for(let c=0;c<3;c++)s[c]+=data[p+c];}const p=(y*w+x)*4;for(let c=0;c<3;c++)out[p+c]=s[c]/n;out[p+3]=255;}return out;}
function bounds(samples){return [0,1,2].map(k=>{const a=samples.map(v=>v[k]).sort((a,b)=>a-b);return [a[Math.floor((a.length-1)*.1)],a[Math.ceil((a.length-1)*.9)]];});}
function opening(mask,w,h){const eroded=new Int32Array(mask.length);eroded.fill(-1);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x,k=mask[p];if(k<0)continue;let ok=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(mask[p+dy*w+dx]!==k)ok=false;if(ok)eroded[p]=k;}const out=new Int32Array(mask.length);out.fill(-1);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,k=mask[p];if(k<0)continue;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&eroded[yy*w+xx]===k)out[p]=k;}}return out;}
function representative(pixels){
 const bins=new Map();for(const v of pixels){const key=v.map(x=>Math.floor(x/8)).join(',');if(!bins.has(key))bins.set(key,[]);bins.get(key).push(v);}
 const group=[...bins.values()].sort((a,b)=>b.length-a.length)[0];const center=[0,1,2].map(k=>group.reduce((s,v)=>s+v[k],0)/group.length);
 const members=pixels.filter(v=>distance(v,center)<=64);const limits=bounds(members);return {center,ranges:limits.map(([lo,hi],k)=>[Math.max(lo,center[k]-4),Math.min(hi,center[k]+4)]),coverage:members.length/pixels.length};
}
root.ColorEngine={lab,distance,segment,filterRegions,detect,smooth,blur,bounds,opening,representative};if(typeof module!=='undefined')module.exports=root.ColorEngine;
})(globalThis);
