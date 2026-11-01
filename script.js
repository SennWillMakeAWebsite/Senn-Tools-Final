(() => {
"use strict";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const toast = (msg) => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("show"),2400); };
const views=["dashboard","editor","converter","utilities","media"];
function showView(name){views.forEach(v=>$("#view-"+v).classList.toggle("active",v===name));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name && !b.dataset.tool));$("#crumbCurrent").textContent=({dashboard:"Overview",editor:"Image Studio",converter:"Converter",utilities:"Utilities",media:"Media Links"})[name]||name;$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>{showView(b.dataset.view);if(b.dataset.tool){setTimeout(()=>{if(b.dataset.tool==="compress")showPanel("export");if(b.dataset.tool==="resize")showPanel("transform");},50);}}));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("senn-theme",document.body.classList.contains("light")?"light":"dark");});
if(localStorage.getItem("senn-theme")==="light")document.body.classList.add("light");

// Image editor state. Every slider updates the canvas immediately.
const defaults={brightness:100,contrast:100,saturate:100,exposure:0,temperature:0,tint:0,sharpness:0,blur:0,vignette:0};
let state={...defaults,rotation:0,flipX:1,flipY:1,effect:"none",width:null,height:null,crop:null};
let sourceImage=null,sourceFile=null,sourceURL=null;
const canvas=$("#afterCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
const before=$("#beforeImage");
const hasImage=()=>!!sourceImage;
function showLoaded(on){$("#dropZone").classList.toggle("hidden",on);$("#comparePanel").classList.toggle("hidden",!on);$("#fileEmpty").classList.toggle("hidden",on);$("#fileDetails").classList.toggle("hidden",!on);$("#downloadEdited").disabled=!on;$("#downloadEdited2").disabled=!on;}
function setFile(file){if(!file||!file.type.startsWith("image/")){toast("Pilih file gambar yang valid.");return;}if(sourceURL)URL.revokeObjectURL(sourceURL);sourceFile=file;sourceURL=URL.createObjectURL(file);const img=new Image();img.onload=()=>{sourceImage=img;state={...defaults,rotation:0,flipX:1,flipY:1,effect:"none",width:img.naturalWidth,height:img.naturalHeight,crop:{x:0,y:0,w:img.naturalWidth,h:img.naturalHeight}};before.src=sourceURL;$("#beforeDimensions").textContent=`${img.naturalWidth} × ${img.naturalHeight}`;$("#afterDimensions").textContent=`${img.naturalWidth} × ${img.naturalHeight}`;$("#loadedName").textContent=file.name;$("#loadedSize").textContent=formatBytes(file.size);$("#fileInfo").textContent=`${img.naturalWidth} × ${img.naturalHeight} · ${formatBytes(file.size)}`;$("#fileThumb").style.backgroundImage=`url("${sourceURL}")`;$("#resizeWidth").value=img.naturalWidth;$("#resizeHeight").value=img.naturalHeight;$("#cropX").value=0;$("#cropY").value=0;$("#cropW").value=img.naturalWidth;$("#cropH").value=img.naturalHeight;$$ ("[data-filter]").forEach(i=>{i.value=defaults[i.dataset.filter];updateOutput(i.dataset.filter,i.value);});showLoaded(true);render();toast("Image loaded. Live preview is ready.");};img.onerror=()=>toast("Gagal membaca gambar ini.");img.src=sourceURL;}
function formatBytes(n){if(n<1024)return n+" B";if(n<1048576)return(n/1024).toFixed(1)+" KB";return(n/1048576).toFixed(2)+" MB";}
$("#browseImage").addEventListener("click",()=>$("#imageInput").click());
$("#imageInput").addEventListener("change",e=>setFile(e.target.files[0]));
const drop=$("#dropZone");["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("dragging");}));["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("dragging");}));drop.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
function updateOutput(key,val){const out=$("#"+key+"Val");if(out)out.textContent=key==="brightness"||key==="contrast"||key==="saturate"?val+"%":key==="blur"?val+"px":key==="vignette"?val+"%":val;}
$$("[data-filter]").forEach(input=>input.addEventListener("input",()=>{const k=input.dataset.filter;state[k]=Number(input.value);updateOutput(k,input.value);render();}));
function effectFilter(){switch(state.effect){case"mono":return"grayscale(1)";case"sepia":return"sepia(1)";case"vintage":return"sepia(.55) contrast(1.12) saturate(.85)";case"cool":return"hue-rotate(12deg) saturate(1.1)";case"warm":return"sepia(.25) saturate(1.18)";default:return"";}}
function render(){if(!hasImage())return;const rot=((state.rotation%360)+360)%360;const swapped=rot===90||rot===270;const w=Math.max(1,Math.round(state.width||sourceImage.naturalWidth)),h=Math.max(1,Math.round(state.height||sourceImage.naturalHeight));canvas.width=swapped?h:w;canvas.height=swapped?w:h;ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rot*Math.PI/180);ctx.scale(state.flipX,state.flipY);const exposure=Math.pow(2,state.exposure/100);const brightness=state.brightness*exposure;let filter=`brightness(${brightness}%) contrast(${state.contrast}%) saturate(${state.saturate}%) ${effectFilter()} blur(${state.blur}px)`;ctx.filter=filter;const cr=state.crop||{x:0,y:0,w:sourceImage.naturalWidth,h:sourceImage.naturalHeight};ctx.drawImage(sourceImage,cr.x,cr.y,cr.w,cr.h,-w/2,-h/2,w,h);ctx.restore();ctx.filter="none";
  // Color temperature and tint are pixel-level transforms, so the exported canvas contains the visible changes.
  if(state.temperature!==0||state.tint!==0||state.sharpness>0||state.vignette>0){let im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data;const t=state.temperature/100,ti=state.tint/100,sharp=state.sharpness;const W=canvas.width,H=canvas.height;let original=new Uint8ClampedArray(d);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let i=(y*W+x)*4;let r=original[i],g=original[i+1],b=original[i+2];r+=t*42+ti*8;g+=ti*22;b-=t*42-ti*8;
      if(sharp>0&&x>0&&y>0&&x<W-1&&y<H-1){const avg=(original[i-4]+original[i+4]+original[i-W*4]+original[i+W*4])/4;r+=(r-avg)*sharp*.28;g+=(g-avg)*sharp*.28;b+=(b-avg)*sharp*.28;}
      if(state.vignette>0){const dx=(x-W/2)/(W/2),dy=(y-H/2)/(H/2),dist=Math.min(1,(dx*dx+dy*dy)/2);const factor=1-(state.vignette/100)*dist*.8;r*=factor;g*=factor;b*=factor;}
      d[i]=r;d[i+1]=g;d[i+2]=b;
    }ctx.putImageData(im,0,0);
  }
  $("#afterDimensions").textContent=`${canvas.width} × ${canvas.height}`;$("#previewStatus").textContent="Preview rendered · changes are live";
}
function resetGroup(group){const keys=group==="adjust"?Object.keys(defaults):[];keys.forEach(k=>{state[k]=defaults[k];const el=$(`[data-filter="${k}"]`);if(el){el.value=defaults[k];updateOutput(k,defaults[k]);}});if(group==="all"){state={...defaults,rotation:0,flipX:1,flipY:1,effect:"none",width:sourceImage.naturalWidth,height:sourceImage.naturalHeight,crop:{x:0,y:0,w:sourceImage.naturalWidth,h:sourceImage.naturalHeight}};$$("[data-filter]").forEach(i=>{i.value=defaults[i.dataset.filter];updateOutput(i.dataset.filter,defaults[i.dataset.filter]);});$("#resizeWidth").value=sourceImage.naturalWidth;$("#resizeHeight").value=sourceImage.naturalHeight;$("#cropX").value=0;$("#cropY").value=0;$("#cropW").value=sourceImage.naturalWidth;$("#cropH").value=sourceImage.naturalHeight;$$ ("[data-effect]").forEach(b=>b.classList.remove("selected"));}render();}
$("#resetEdits").addEventListener("click",()=>{if(hasImage())resetGroup("all");});
$$("[data-reset]").forEach(b=>b.addEventListener("click",()=>{if(hasImage())resetGroup(b.dataset.reset);}));
function showPanel(name){$$(".tool-chip").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));["adjust","transform","effects","export"].forEach(n=>$("#panel-"+n).classList.toggle("hidden",n!==name));}
$$(".tool-chip").forEach(b=>b.addEventListener("click",()=>showPanel(b.dataset.panel)));
$$("[data-effect]").forEach(b=>b.addEventListener("click",()=>{state.effect=b.dataset.effect;$$("[data-effect]").forEach(x=>x.classList.toggle("selected",x===b));render();}));
$("#rotateLeft").addEventListener("click",()=>{if(hasImage()){state.rotation-=90;render();}});
$("#rotateRight").addEventListener("click",()=>{if(hasImage()){state.rotation+=90;render();}});
$("#flipHorizontal").addEventListener("click",()=>{if(hasImage()){state.flipX*=-1;render();}});
$("#flipVertical").addEventListener("click",()=>{if(hasImage()){state.flipY*=-1;render();}});
$("#keepRatio").addEventListener("change",()=>{if($("#keepRatio").checked&&hasImage())$("#resizeHeight").value=Math.round(Number($("#resizeWidth").value)*sourceImage.naturalHeight/sourceImage.naturalWidth);});
$("#resizeWidth").addEventListener("input",()=>{if($("#keepRatio").checked&&hasImage())$("#resizeHeight").value=Math.round(Number($("#resizeWidth").value)*sourceImage.naturalHeight/sourceImage.naturalWidth);});
$("#applyResize").addEventListener("click",()=>{if(!hasImage())return toast("Load an image first.");const w=Number($("#resizeWidth").value),h=Number($("#resizeHeight").value);if(!w||!h||w>12000||h>12000)return toast("Masukkan ukuran 1–12000 px.");state.width=w;state.height=h;render();toast("Resize applied to preview.");});
$("#applyCrop").addEventListener("click",()=>{if(!hasImage())return toast("Load an image first.");const x=Number($("#cropX").value),y=Number($("#cropY").value),w=Number($("#cropW").value),h=Number($("#cropH").value);if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(w)||!Number.isInteger(h)||x<0||y<0||w<1||h<1||x+w>sourceImage.naturalWidth||y+h>sourceImage.naturalHeight)return toast("Crop area is outside the original image.");state.crop={x,y,w,h};state.width=w;state.height=h;$("#resizeWidth").value=w;$("#resizeHeight").value=h;render();toast("Crop applied to preview.");});
$("#resetCrop").addEventListener("click",()=>{if(!hasImage())return toast("Load an image first.");state.crop={x:0,y:0,w:sourceImage.naturalWidth,h:sourceImage.naturalHeight};state.width=sourceImage.naturalWidth;state.height=sourceImage.naturalHeight;$("#cropX").value=0;$("#cropY").value=0;$("#cropW").value=sourceImage.naturalWidth;$("#cropH").value=sourceImage.naturalHeight;$("#resizeWidth").value=sourceImage.naturalWidth;$("#resizeHeight").value=sourceImage.naturalHeight;render();toast("Crop reset.");});
function exportBlob(mime,quality,cb){if(!hasImage())return toast("Load an image first.");canvas.toBlob(blob=>{if(!blob)return toast("Export failed. Try PNG.");cb(blob);},mime,quality);}
function downloadBlob(blob,name){const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
function exportEdited(){const mime=$("#exportFormat").value,quality=Number($("#exportQuality").value)/100;let name=($("#exportName").value||"senn-edited-image").replace(/\.[^.]+$/,"");const ext=mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":"png";exportBlob(mime,quality,b=>{downloadBlob(b,`${name}.${ext}`);toast("Edited image exported.");});}
$("#downloadEdited").addEventListener("click",exportEdited);$("#downloadEdited2").addEventListener("click",exportEdited);
$("#exportQuality").addEventListener("input",e=>$("#qualityVal").textContent=e.target.value+"%");
$("#removeImage").addEventListener("click",()=>{sourceImage=null;sourceFile=null;if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=null;$("#imageInput").value="";showLoaded(false);ctx.clearRect(0,0,canvas.width,canvas.height);toast("Image removed.");});
$("#quickCompress").addEventListener("click",()=>{showView("converter");$("#compressInput").scrollIntoView({behavior:"smooth",block:"center"});});
$("#quickResize").addEventListener("click",()=>{showPanel("transform");toast("Resize controls opened.");});
$("#quickConvert").addEventListener("click",()=>showView("converter"));

// Standalone converter/compressor
function processFile(inputId,formatId,qualityId,messageId,prefix){const file=$("#"+inputId).files[0];if(!file)return toast("Pilih gambar terlebih dahulu.");const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;const cctx=c.getContext("2d");cctx.drawImage(img,0,0);const mime=$("#"+formatId).value,q=Number($("#"+qualityId).value)/100;c.toBlob(blob=>{URL.revokeObjectURL(url);if(!blob){$("#"+messageId).textContent="Conversion failed.";return;}const ext=mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":"png";downloadBlob(blob,`${prefix}-${file.name.replace(/\.[^.]+$/,"")}.${ext}`);$("#"+messageId).textContent=`Done: ${formatBytes(file.size)} → ${formatBytes(blob.size)} (${blob.size<file.size?"smaller":"new format"})`;},mime,q);};img.onerror=()=>{URL.revokeObjectURL(url);toast("Could not read this image.");};img.src=url;}
$("#convertBtn").addEventListener("click",()=>processFile("convertInput","convertFormat","convertQuality","convertMessage","converted"));
$("#compressBtn").addEventListener("click",()=>processFile("compressInput","compressFormat","compressQuality","compressMessage","compressed"));
$("#convertQuality").addEventListener("input",e=>$("#convertQualityVal").textContent=e.target.value+"%");
$("#compressQuality").addEventListener("input",e=>$("#compressQualityVal").textContent=e.target.value+"%");

// QR, text, color and unit utilities
$("#makeQr").addEventListener("click",()=>{const v=$("#qrText").value.trim();if(!v)return toast("Masukkan teks atau URL.");const img=document.createElement("img");img.alt="Generated QR code";img.src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(v);$("#qrOutput").replaceChildren(img);});
function updateTextStats(){const v=$("#textInput").value;$("#charCount").textContent=v.length+" characters";$("#wordCount").textContent=(v.trim()?v.trim().split(/\s+/).length:0)+" words";$("#lineCount").textContent=(v? v.split(/\n/).length:0)+" lines";}
$("#textInput").addEventListener("input",updateTextStats);
$$("[data-case]").forEach(b=>b.addEventListener("click",()=>{const t=$("#textInput");if(b.dataset.case==="upper")t.value=t.value.toUpperCase();else if(b.dataset.case==="lower")t.value=t.value.toLowerCase();else t.value=t.value.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());updateTextStats();}));
$("#copyText").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#textInput").value);toast("Text copied.");}catch{toast("Clipboard permission unavailable.");}});
function updateColor(){const hex=$("#colorPicker").value;const n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;$("#hexColor").textContent=hex.toUpperCase();$("#rgbColor").textContent=`rgb(${r}, ${g}, ${b})`;}
$("#colorPicker").addEventListener("input",updateColor);updateColor();
$("#copyHex").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#hexColor").textContent);toast("HEX copied.");}catch{toast("Clipboard permission unavailable.");}});
const factors={km:1000,m:1,cm:.01,mm:.001,mi:1609.344,ft:.3048,in:.0254,gb:1073741824,mb:1048576,kb:1024};
function updateUnit(){const a=$("#unitFrom").value,b=$("#unitTo").value,v=Number($("#unitValue").value);if(!Number.isFinite(v))return;let result;if((a in factors&&b in factors)&&((['gb','mb','kb'].includes(a))===(['gb','mb','kb'].includes(b))))result=v*factors[a]/factors[b];else result=NaN;$("#unitResult").textContent=Number.isFinite(result)?`${Number(result.toPrecision(8)).toLocaleString()} ${b}`:"Choose units from the same group";}
["unitValue","unitFrom","unitTo"].forEach(id=>$("#"+id).addEventListener("input",updateUnit));updateUnit();

// Safe media link detection: no scraping or bypass download endpoints.
let currentMediaURL="";
$("#checkMedia").addEventListener("click",()=>{const raw=$("#mediaUrl").value.trim();let u;try{u=new URL(raw);}catch{return toast("Masukkan URL yang valid.");}const host=u.hostname.toLowerCase().replace(/^www\./,"");let platform="";if(host==="youtube.com"||host==="m.youtube.com"||host==="youtu.be"||host==="youtube-nocookie.com")platform="YOUTUBE";if(host==="tiktok.com"||host==="m.tiktok.com")platform="TIKTOK";if(!platform)return toast("Masukkan tautan TikTok atau YouTube.");currentMediaURL=u.href;$("#mediaPlatform").textContent=platform;$("#mediaTitle").textContent=platform==="YOUTUBE"?"YouTube link detected":"TikTok link detected";$("#mediaDescription").textContent="Link looks valid. Open it on the official platform to view available creator and download options.";$("#mediaResult").classList.remove("hidden");});
$("#openMedia").addEventListener("click",()=>{if(currentMediaURL)window.open(currentMediaURL,"_blank","noopener,noreferrer");});
$("#copyMedia").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(currentMediaURL);toast("Link copied.");}catch{toast("Clipboard permission unavailable.");}});
})();