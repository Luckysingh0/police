const $ = id => document.getElementById(id);
const state = { mode:"set", query:"" };

const gplByCode = new Map();
for (const row of GPL_DEPLOYMENTS) {
  for (const code of row.equipmentCodes || []) {
    if (!gplByCode.has(norm(code))) gplByCode.set(norm(code), []);
    gplByCode.get(norm(code)).push(row);
  }
}

function norm(v){
  return String(v ?? "").toLocaleUpperCase().replace(/\s+/g," ").trim();
}
function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function highlight(v,q){
  const s=esc(v);
  if(!q) return s;
  const e=esc(q).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return s.replace(new RegExp(e,"ig"),m=>`<mark>${m}</mark>`);
}
function quantity(v,kind="unit"){
  if(!v) return "—";
  const s=String(v).trim();
  if(/^\d+$/.test(s)){
    const n=Number(s);
    if(kind==="battery") return `${n} ${n===1?"battery":"batteries"}`;
    return `${n} ${n===1?"unit":"units"}`;
  }
  return esc(s);
}
function codeMatches(row,q){return (row.equipmentCodes||[]).some(c=>norm(c).includes(q))}
function placeMatches(row,q){return norm(row.location).includes(q)}
function aniMatches(row,q){return (row.aniRecords||[]).some(a=>norm(a.ani).includes(q))}

function gplMatches(q){
  if(!q) return [];
  return GPL_DEPLOYMENTS.filter(r=>{
    if(state.mode==="set") return codeMatches(r,q);
    if(state.mode==="ani") return aniMatches(r,q);
    if(state.mode==="place") return placeMatches(r,q);
    return codeMatches(r,q)||aniMatches(r,q)||placeMatches(r,q);
  });
}

function aniOnlyMatches(q){
  if(!q || (state.mode!=="ani" && state.mode!=="all")) return [];
  const linkedKeys=new Set(gplMatches(q).map(r=>`${r.slNo}|${r.pdfPage}`));
  const out=[];
  for(const a of ALL_ANI){
    if(!norm(a.ani).includes(q) && !norm(a.setNumber).includes(q)) continue;
    const linked=(gplByCode.get(norm(a.setNumber))||[]).length>0;
    if(linked) continue;
    out.push({
      slNo:a.slNo,pdfPage:`ANI PDF p.${a.pdfPage}`,location:null,
      equipmentCodes:[a.setNumber],stMobSetNX3720:null,
      antenna:{"0 db GP":null,"3 db GP":null,"0 db Magnetic":null,"Whip Antenna":null},
      powerSupply:null,battery12V:null,tMast:null,giPole:null,pneumaticMast:null,
      hhSetNX3220:null,suBattsCharger:null,paSystem:null,remarks:null,
      equipmentCodes:[a.setNumber],aniRecords:[a],aniOnly:true
    });
  }
  return out;
}

function results(){
  const q=norm(state.query);
  if(!q) return [];
  const a=gplMatches(q);
  const b=aniOnlyMatches(q);
  const seen=new Set(a.map(r=>`${r.slNo}|${r.pdfPage}`));
  return a.concat(b.filter(r=>!seen.has(`${r.slNo}|${r.pdfPage}`)));
}

function card(row){
  const q=state.query;
  const codes=(row.equipmentCodes||[]).length
    ? row.equipmentCodes.map(c=>`<span class="chip">${highlight(c,q)}</span>`).join("")
    : `<span class="muted">PDF में उपलब्ध नहीं</span>`;
  const anis=(row.aniRecords||[]).length
    ? row.aniRecords.map(a=>`<span class="chip">📞 ${highlight(a.ani,q)} <small>${esc(a.source)}</small></span>`).join("")
    : `<span class="muted">ANI PDF में उपलब्ध नहीं</span>`;

  const ants=[
    ["📡 0 db GP",row.antenna["0 db GP"]],
    ["📡 3 db GP",row.antenna["3 db GP"]],
    ["📡 0 db Magnetic",row.antenna["0 db Magnetic"]],
    ["📡 Whip Antenna",row.antenna["Whip Antenna"]]
  ].map(([label,v])=>`<div class="ant">${label} × <b>${quantity(v)}</b></div>`).join("");

  const e=[
    ["ST/MOB SET NX3720",row.stMobSetNX3720,"code"],
    ["POWER SUPPLY",row.powerSupply,"unit"],
    ["12V BATTERY",row.battery12V,"battery"],
    ["T. MAST",row.tMast,"unit"],
    ["GI POLE",row.giPole,"unit"],
    ["PNEUMATIC MAST",row.pneumaticMast,"unit"],
    ["H/H SET WITH BATTS NX3220",row.hhSetNX3220,"code"],
    ["S/U BATTS / CHARGER",row.suBattsCharger,"unit"],
    ["PA SYSTEM",row.paSystem,"unit"],
    ["REMARKS",row.remarks,"raw"]
  ].map(([label,v,type])=>{
    let d="—";
    if(v){
      if(type==="code"||type==="raw") d=highlight(v,q);
      else d=quantity(v,type);
    }
    return `<tr><td>${label}</td><td class="value">${d}</td></tr>`;
  }).join("");

  const location=row.location
    ? highlight(row.location,q)
    : "स्थान नाम PDF में उपलब्ध नहीं";

  return `<article class="card">
    <h3 class="card-title">📍 ${location}</h3>
    <div class="meta">S.L. No. ${row.slNo} • PDF Page ${row.pdfPage}</div>

    <div class="section">
      <div class="section-title">SET / EQUIPMENT CODES</div>
      <div class="chips">${codes}</div>
    </div>

    <div class="section">
      <div class="section-title">ANI NUMBER</div>
      <div class="chips">${anis}</div>
    </div>

    <div class="section">
      <div class="section-title">ANTENNA</div>
      <div class="antenna-grid">${ants}</div>
    </div>

    <div class="section">
      <div class="section-title">EQUIPMENT DETAILS</div>
      <table class="details"><tbody>${e}</tbody></table>
    </div>

    ${row.aniOnly ? `<div class="source-note">यह entry ANI PDF में है; GPL deployment PDF में इसका location/equipment deployment record नहीं मिला।</div>` : ""}
  </article>`;
}

function render(){
  const list=results();
  $("matchesStat").textContent=list.length;
  $("countText").textContent=`${list.length} match${list.length===1?"":"es"}`;
  if(!state.query){
    $("results").innerHTML=`<div class="empty">Search box में Set Number, ANI Number या जगह/थाना दर्ज करें।<br>Search तुरंत update होगा।</div>`;
    return;
  }
  $("results").innerHTML=list.length
    ? list.map(card).join("")
    : `<div class="empty"><b>कोई matching entry नहीं मिली।</b><br>Search mode या search text बदलकर देखें।</div>`;
}

function setMode(mode){
  state.mode=mode;
  document.querySelectorAll(".mode").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  const input=$("search");
  const cfg={
    set:["उदाहरण: C4110644","Exact और partial Set Number / Equipment Code search"],
    ani:["उदाहरण: 861029 या 865055","Exact और partial ANI Number search"],
    place:["उदाहरण: KOTWALI","थाना/जगह का पूरा या partial नाम search"],
    all:["Set Number, ANI या जगह — सभी search करें","एक ही box से Set Number, ANI Number और जगह/थाना search करें"]
  }[mode];
  input.placeholder=cfg[0];
  $("hint").textContent=cfg[1];
  render();
  input.focus();
}

document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$("search").addEventListener("input",e=>{state.query=e.target.value;render()});
$("clearBtn").addEventListener("click",()=>{$("search").value="";state.query="";render();$("search").focus()});

$("entriesStat").textContent=GPL_DEPLOYMENTS.length;
$("codesStat").textContent=new Set([
  ...GPL_DEPLOYMENTS.flatMap(r=>r.equipmentCodes||[]),
  ...ALL_ANI.map(r=>r.setNumber)
].filter(Boolean).map(norm)).size;

render();
