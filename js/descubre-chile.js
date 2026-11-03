/* ================================================================
   DESCUBRE CHILE — Full Spanish App Engine
   v3: relief map of the 16 regions (js/descubre-chile-data.js +
   js/descubre-chile-art.js), zone / region games, illustrated
   timeline, richer memory + ordering games, restyled quiz.
   Saved shape (zs_chile_<user>) is unchanged; only fields are added:
     vreg      – array of region codes opened on the map
     memBests  – {pairs: fewest moves} per board size (memBest is still
                 the 10-pair record)
   New star records use the same {bestStars,bestPct,lastPlayed} shape:
     zonas, regiones, capitales, pistas, dragregiones, ordena
   ================================================================ */

let qTopic = null;
let qQs = [];
let qIdx = 0;
let qScore = 0;

function getUserKey() {
  return typeof getUserAppKey === 'function' ? getUserAppKey('zs_chile_') : null;
}
function getUserProgress(){const k=getUserKey();if(!k)return{};try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}}
function _dcWrite(k,p){
  try { localStorage.setItem(k,JSON.stringify(p)); } catch (e) { console.warn('[Chile] save failed:', e); }
  if(typeof CloudSync!=='undefined'&&CloudSync.online)CloudSync.push(k);
}
function saveTopicProgress(id,stars,pct){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  const prev=p[id]||{bestStars:0,bestPct:0};
  p[id]={bestStars:Math.max(prev.bestStars||0,stars),bestPct:Math.max(prev.bestPct||0,pct),lastPlayed:new Date().toISOString()};
  _dcWrite(k,p);
  if (typeof ActivityLog !== 'undefined' && stars > 0) {
    ActivityLog.log('Descubre Chile', '🇨🇱', `Completó el tema "${id}" — ${stars} estrella${stars!==1?'s':''}`);
  }
}
function saveVisited(id){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  if(!Array.isArray(p.vr))p.vr=[];if(p.vr.includes(id))return;p.vr.push(id);
  _dcWrite(k,p);
}
function saveRegionVisited(code){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  if(!Array.isArray(p.vreg))p.vreg=[];if(p.vreg.includes(code))return;p.vreg.push(code);
  _dcWrite(k,p);
}
function saveMemBest(m,pairs){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  pairs=pairs||10;
  if(pairs===10&&(!p.memBest||m<p.memBest))p.memBest=m;
  if(!p.memBests||typeof p.memBests!=='object')p.memBests={};
  if(!p.memBests[pairs]||m<p.memBests[pairs])p.memBests[pairs]=m;
  _dcWrite(k,p);
  if (typeof ActivityLog !== 'undefined') {
    ActivityLog.log('Descubre Chile', '🇨🇱', `Completó el juego de memoria en ${m} movimientos`);
  }
}

function dcTier(){const u=typeof getActiveUser==='function'?getActiveUser():null;return typeof getAgeTier==='function'?getAgeTier(u?u.age:null):'intermediate'}
function dcSfx(n){try{if(typeof SFX!=='undefined'&&SFX[n])SFX[n]()}catch(e){}}
function dcShuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function dcStars(pct){return pct>=90?3:pct>=60?2:pct>0?1:0}

function showFeedback(e){
  const el=document.getElementById('feedback');
  if(!el)return;
  const inner=el.querySelector('span')||el;
  inner.textContent=e;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}

const DC_GAME_IDS=['zonas','regiones','capitales','pistas','dragquiz','dragregiones','ordena'];
function updateProgress(){
  const p=getUserProgress();
  const zones=(Array.isArray(p.vr)?p.vr:[]).filter(z=>REGIONS[z]).length;
  const regs=(Array.isArray(p.vreg)?p.vreg:[]).length;
  const topics=TOPICS.filter(t=>p[t.id]&&p[t.id].bestStars>0).length;
  const games=DC_GAME_IDS.filter(g=>p[g]&&p[g].bestStars>0).length+((p.memBest||(p.memBests&&Object.keys(p.memBests).length))?1:0);
  const pct=Math.min(100,Math.round(100*(0.10*zones/5+0.35*Math.min(regs,18)/18+0.35*topics/TOPICS.length+0.20*games/(DC_GAME_IDS.length+1))));
  const pf=document.getElementById('progressFill');
  const pl=document.getElementById('progressLabel');
  if(pf)pf.style.width=pct+'%';
  if(pl)pl.textContent='Chile explorado: '+pct+'%';
  if(typeof DCMap!=='undefined')DCMap.markVisited();
}

// ── ZONE OVERVIEWS (the five classic zones) ──

const REGIONS={
  norte:{icon:'🏜️',title:'Norte Grande',sub:'El desierto más seco del mundo',facts:[
    {t:'🏜️ Desierto de Atacama',p:'El norte de Chile alberga el Desierto de Atacama, uno de los lugares más secos del planeta. Tiene salares, géiseres y flamencos en lagos de altura.',f:'¡La NASA prueba sus robots para Marte en el Atacama porque el suelo es muy parecido!'},
    {t:'⭐ Cielos estrellados',p:'El Atacama tiene los cielos más limpios del mundo para observar estrellas. Chile tiene los telescopios más grandes del planeta.',f:'Desde el norte de Chile puedes ver más de 5.000 estrellas a simple vista.'},
    {t:'🦩 Altiplano',p:'En las alturas del norte viven flamencos, vicuñas y llamas. Los pueblos aymaras han habitado esta zona por miles de años.',f:'Los géiseres del Tatio (a 4.300 m) son los más altos del mundo.'},
    {t:'🏴 Iquique y Arica',p:'Dos ciudades norteñas con grandes playas, historia del salitre y recientemente importantes puertos pesqueros.',f:'Arica es la ciudad más al norte de Chile y a veces se llama "la ciudad de la eterna primavera".'},
    {t:'⚓ Glorias Navales',p:'El 21 de mayo de 1879, Arturo Prat dio su vida en Iquique a bordo de la Esmeralda durante la Guerra del Pacífico. Hoy es el Día de las Glorias Navales.',f:'Prat tenía sólo 31 años cuando saltó al abordaje del Huáscar.'}
  ]},
  centro:{icon:'🏙️',title:'Chile Central',sub:'Santiago, Valparaíso y los valles',facts:[
    {t:'🏙️ Santiago',p:'La capital fue fundada en 1541 por Pedro de Valdivia junto al río Mapocho. Hoy tiene más de 7 millones de habitantes rodeados por los Andes.',f:'Desde Santiago puedes ver la cordillera nevada ¡a solo 45 minutos en auto!'},
    {t:'🎨 Valparaíso',p:'Ciudad famosa por sus cerros coloridos, ascensores históricos y arte callejero. Es Patrimonio de la Humanidad.',f:'Valparaíso tiene más de 15 ascensores funiculares, algunos con más de 100 años.'},
    {t:'🍇 Valles',p:'El centro tiene valles fértiles con clima mediterráneo ideal para la agricultura y los viñedos.',f:'Chile es el cuarto exportador de vino del mundo.'},
    {t:'🏔️ Cajón del Maipo',p:'Cordón cordillerano cerca de Santiago, con ríos, termas y glaciares. Destino favorito de excursiones.',f:'En invierno, centros como Farellones y Valle Nevado reciben nieve cada año.'},
    {t:'🌊 Viña del Mar',p:'La "Ciudad Jardín" colinda con Valparaíso y celebra cada febrero el Festival de la Canción.',f:'El Reloj de Flores de Viña tiene más de 60 años y sigue marcando la hora.'}
  ]},
  sur:{icon:'🌲',title:'Sur de Chile',sub:'Lagos, volcanes y pueblos originarios',facts:[
    {t:'🌋 Volcanes y lagos',p:'El sur tiene decenas de volcanes activos rodeados de lagos cristalinos. El Villarrica es uno de los más activos de Sudamérica.',f:'Chile tiene más de 2.000 volcanes y unos 90 están activos.'},
    {t:'🪶 El pueblo Mapuche',p:'Los Mapuche son el pueblo originario más grande de Chile. Nunca fueron conquistados por los españoles.',f:'Los Mapuche resistieron por más de 300 años, desde 1536 hasta 1883.'},
    {t:'🌲 Bosques milenarios',p:'Los bosques del sur tienen araucarias que existen hace más de 200 millones de años y alerces de más de 3.000 años.',f:'La araucaria es un "fósil viviente" porque casi no ha cambiado desde la era de los dinosaurios.'},
    {t:'🌿 Chiloé',p:'Archipiélago con iglesias de madera (Patrimonio de la Humanidad), palafitos de colores y leyendas como la del Trauco y la Pincoya.',f:'Hay 16 iglesias chilotas declaradas Patrimonio por la UNESCO.'},
    {t:'🏛️ Concepción y el Biobío',p:'Concepción es la segunda zona metropolitana del país, a orillas del río Biobío. Durante siglos fue la frontera de guerra entre Chile y el pueblo Mapuche.',f:'El puente Juan Pablo II en el Biobío tiene 2,3 km — el más largo sobre un río en Chile.'}
  ]},
  patagonia:{icon:'🧊',title:'Patagonia',sub:'Glaciares, viento y Torres del Paine',facts:[
    {t:'🏔️ Torres del Paine',p:'Uno de los lugares más hermosos del planeta. Torres de granito, lagos turquesa y glaciares impresionantes.',f:'El Glaciar Grey tiene más de 6 km de ancho y miles de años de antigüedad.'},
    {t:'🐆 Pumas',p:'Torres del Paine tiene una de las poblaciones más densas de pumas del mundo.',f:'Si visitas Torres del Paine, ¡tienes buenas chances de ver un puma!'},
    {t:'🐧 Pingüinos',p:'En el extremo sur viven pingüinos de Magallanes y de Humboldt.',f:'El pingüino de Humboldt lleva ese nombre por la corriente fría desde la Antártida.'},
    {t:'🚢 Estrecho de Magallanes',p:'El paso natural entre el Atlántico y el Pacífico descubierto por Fernando de Magallanes en 1520. Punta Arenas es la capital regional.',f:'Antes del Canal de Panamá, todos los barcos entre Europa y Asia cruzaban este estrecho.'},
    {t:'🐏 Estancias ovejeras',p:'Las estancias patagónicas criaron ovejas por millones en los siglos XIX y XX. Muchas siguen funcionando hoy.',f:'Un huaso patagónico se llama "gaucho" al otro lado de los Andes en Argentina.'}
  ]},
  pascua:{icon:'🗿',title:'Rapa Nui',sub:'Moai, misterio y cultura polinésica',facts:[
    {t:'🗿 Los Moai',p:'Isla de Pascua está a 3.700 km de la costa. El pueblo Rapa Nui talló casi 1.000 estatuas gigantes, ¡algunas de más de 80 toneladas!',f:'Nadie sabe con certeza cómo movieron los Moai — algunos creen que los "caminaron" meciéndolos.'},
    {t:'🏝️ Cultura Rapa Nui',p:'Desarrollaron una escritura única llamada Rongorongo que aún no ha sido descifrada. Inventaron el Tangata Manu (hombre pájaro).',f:'Rapa Nui es uno de los lugares habitados más aislados del mundo.'},
    {t:'🌺 Naturaleza',p:'La isla tiene cráteres volcánicos con lagos, playas de arena rosa y caballos salvajes.',f:'El lugar habitado más cercano es isla Pitcairn, ¡a 2.000 km!'},
    {t:'🗣️ El idioma Rapa Nui',p:'Además del español, en la isla se habla el rapa nui, idioma polinésico emparentado con el tahitiano y el hawaiano.',f:'"Iorana" significa hola, adiós y bienvenida.'}
  ]}
};


// ── MAP VIEW (zoomable, scrollable relief map) ──
function DCMapView(host, opts){
  opts=opts||{};
  const W=DC_GEO.W,H=DC_GEO.H;
  host.classList.add('dc-mapbox');
  host.innerHTML='<div class="dc-view" id="'+opts.id+'View">'+DCArt.mapSVG({id:opts.id,labels:opts.labels!==false,title:opts.title})+'</div>'+
    '<div class="dc-zoom" role="group" aria-label="Zoom del mapa">'+
      '<button type="button" class="dc-zbtn" data-z="in" aria-label="Acercar">+</button>'+
      '<button type="button" class="dc-zbtn" data-z="out" aria-label="Alejar">−</button>'+
      '<button type="button" class="dc-zbtn dc-zfit" data-z="fit" aria-label="Ver todo Chile"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'+
    '</div>';
  const view=host.querySelector('.dc-view'),svg=view.querySelector('svg');
  let z=1;
  DCArt.relief(svg);
  function fitZ(){const vw=view.clientWidth||1,vh=view.clientHeight||1;return Math.min(1,vh/(vw*H/W))}
  function levels(){const f=fitZ();return [f,1,1.7,2.6,3.6].filter((v,i,a)=>v>=f-1e-6&&a.indexOf(v)===i).sort((a,b)=>a-b)}
  function applyLod(){
    const ppu=(svg.clientWidth||1)/W;
    host.classList.toggle('lod-2',ppu>=0.82);
    host.classList.toggle('lod-0',ppu<0.36);
    // keep labels readable: ~11px on screen at least, never smaller than the map design size
    host.style.setProperty('--lbl',Math.min(Math.max(19,11.5/ppu),16/ppu,30).toFixed(1)+'px');
    host.style.setProperty('--capf',Math.min(Math.max(13,10.5/ppu),13.5/ppu).toFixed(1)+'px');
  }
  function setZoom(nz,cx,cy){
    const vw=view.clientWidth,vh=view.clientHeight;
    const f=fitZ();nz=Math.max(f,Math.min(4,nz));
    if(cx==null){cx=vw/2;cy=vh/2}
    const sw=svg.clientWidth||vw,sh=svg.clientHeight||vw*H/W;
    const fx=(view.scrollLeft+cx-(svg.offsetLeft||0))/sw,fy=(view.scrollTop+cy)/sh;
    z=nz;svg.style.width=Math.round(z*vw)+'px';
    const nw=svg.clientWidth,nh=svg.clientHeight;
    view.scrollLeft=fx*nw-cx;view.scrollTop=fy*nh-cy;
    applyLod();
  }
  function step(dir){const L=levels();let i=L.findIndex(v=>v>z+1e-3);if(dir<0){i=-1;for(let k=L.length-1;k>=0;k--)if(L[k]<z-1e-3){i=k;break}}if(i>=0)setZoom(L[i])}
  host.querySelector('.dc-zoom').addEventListener('click',e=>{
    const b=e.target.closest('[data-z]');if(!b)return;
    if(b.dataset.z==='in')step(1);else if(b.dataset.z==='out')step(-1);else setZoom(fitZ());
  });
  // pinch-zoom (two fingers) + ctrl/⌘-wheel
  let pinch=null;
  view.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];const r=view.getBoundingClientRect();pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:z,mx:(a.clientX+b.clientX)/2-r.left,my:(a.clientY+b.clientY)/2-r.top}}},{passive:true});
  view.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){e.preventDefault();const a=e.touches[0],b=e.touches[1];const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);setZoom(pinch.z*d/pinch.d,pinch.mx,pinch.my)}},{passive:false});
  view.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null});
  view.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();const r=view.getBoundingClientRect();setZoom(z*(e.deltaY<0?1.15:0.87),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  // taps
  host.addEventListener('click',e=>{
    if(e.target.closest('.dc-zoom'))return;
    const isl=e.target.closest('[data-island]');
    if(isl){opts.onTap&&opts.onTap(isl.dataset.island,'island',isl,e);return}
    const r=e.target.closest('.dc-reg,.dc-lbl');
    if(r&&r.dataset.id){opts.onTap&&opts.onTap(r.dataset.id,'region',r,e)}
  });
  let rz=null;
  window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>setZoom(Math.max(z,fitZ())),120)});
  function regEls(id){return svg.querySelectorAll('.dc-reg[data-id="'+id+'"]')}
  function scrollToY(yUnits,smooth){
    const ppu=svg.clientWidth/W;
    view.scrollTo({top:Math.max(0,yUnits*ppu-view.clientHeight*0.4),left:Math.max(0,(view.scrollWidth-view.clientWidth)*0.62),behavior:smooth?'smooth':'auto'});
  }
  function focusRegion(id,frac){
    const g=DCArt.geoById(id);if(!g)return;
    const ppu=svg.clientWidth/W;const cy=(g.bb[1]+g.bb[3])/2*ppu,top=g.bb[1]*ppu,bot=g.bb[3]*ppu;
    const vis=frac!=null?view.clientHeight*frac*2:view.clientHeight;
    if(frac!=null||top<view.scrollTop+20||bot>view.scrollTop+vis-20){
      view.scrollTo({top:Math.max(0,cy-(frac!=null?view.clientHeight*frac:view.clientHeight/2)),behavior:'smooth'});
    }
    const lft=g.bb[0]*ppu,rgt=g.bb[2]*ppu;
    if(lft<view.scrollLeft||rgt>view.scrollLeft+view.clientWidth)view.scrollTo({left:Math.max(0,(lft+rgt)/2-view.clientWidth/2),behavior:'smooth'});
  }
  function init(startZ){
    const go=()=>{if(!view.clientWidth){return setTimeout(go,120)}setZoom(startZ==='fit'?fitZ():(startZ||1));if(opts.startLat!=null)scrollToY((DC_GEO.LATTOP-opts.startLat)*DC_GEO.K)};
    go();
  }
  return {host,view,svg,setZoom,fitZ,init,regEls,scrollToY,focusRegion,get zoom(){return z}};
}

// ── MAIN MAP CONTROLLER ──
const DC_FACT_KINDS=[['geo','Geografía'],['places','Lugares'],['products','Productos'],['history','Historia']];
const DCMap=(function(){
  let mv=null,mode='explore',sel=null,game=null,mounted=false;
  const $=id=>document.getElementById(id);
  const esc=s=>(typeof escHtml==='function'?escHtml(s):DCArt.esc(s));
  const zoneOf=id=>DC_ZONES.find(z=>z.id===id);
  const info=id=>DC_ISLANDS[id]||DCArt.regionById(id);
  const wide=()=>window.matchMedia('(min-width: 900px)').matches;

  function mount(){
    if(mounted)return;mounted=true;
    const host=$('dcMap');if(!host)return;
    mv=DCMapView(host,{id:'mm',onTap:onTap,title:'Mapa en relieve de Chile con sus 16 regiones. Toca una región.'});
    mv.init(1);
    $('dcModes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setMode(b.dataset.mode)});
    $('dcJump').addEventListener('click',e=>{const b=e.target.closest('[data-lat]');if(b)mv.scrollToY((DC_GEO.LATTOP-(+b.dataset.lat))*DC_GEO.K,true)});
    $('dcPanel').addEventListener('click',onPanelClick);
    $('dcBanner').addEventListener('click',e=>{if(e.target.closest('[data-act="quit"]'))setMode('explore');else if(e.target.closest('[data-act="say"]')&&game&&game.spoken)say(game.spoken)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('dcPanel').classList.contains('sheet'))closeSheet()});
    const t=dcTier();
    if(t==='beginner')$('dcModes').classList.add('young');
    markVisited();
    renderIntro();
  }

  function setMode(m){
    mode=m;game=null;clearMarks();
    document.querySelectorAll('#dcModes [data-mode]').forEach(b=>{const on=b.dataset.mode===m;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
    const host=$('dcMap');
    host.classList.toggle('zones',m==='zones');
    host.classList.toggle('nolabels',m==='find');
    host.classList.remove('nocaps');
    $('dcBanner').hidden=true;
    closeSheet(true);
    if(m==='explore')renderIntro();
    else if(m==='zones')startZones();
    else renderFindSetup();
  }

  function onTap(id,kind){
    if(mode==='zones'&&game)return zoneTap(kind==='island'?(id==='RN'?'pascua':'centro'):DCArt.geoById(id).zone,id,kind);
    if(mode==='find'&&game){if(kind==='region')findTap(id);return}
    if(mode!=='explore')return;
    select(id);
  }

  // ── explore ──
  function select(id){
    sel=id;clearMarks();
    if(mv&&!DC_ISLANDS[id])mv.regEls(id).forEach(el=>el.classList.add('sel'));
    renderRegion(id);
    saveRegionVisited(id);
    const z=DC_ISLANDS[id]?DC_ISLANDS[id].zone:DCArt.geoById(id).zone;
    saveVisited(z);
    updateProgress();
    if(!wide()){
      openSheet();
      const host=$('dcMap'),r=host.getBoundingClientRect();
      if(Math.abs(r.top-8)>4)window.scrollTo({top:window.scrollY+r.top-8,behavior:'smooth'});
      // the sheet covers ~58% of the screen: centre the region in the part that stays visible
      if(!DC_ISLANDS[id]&&mv)mv.focusRegion(id,Math.max(0.12,(window.innerHeight*0.42-24)/2/mv.view.clientHeight));
    }else if(!DC_ISLANDS[id]&&mv)mv.focusRegion(id);
  }
  function openSheet(){const p=$('dcPanel');p.classList.add('sheet');p.scrollTop=0;document.body.classList.add('dc-sheet-open')}
  function closeSheet(silent){const p=$('dcPanel');if(!p)return;p.classList.remove('sheet');document.body.classList.remove('dc-sheet-open');if(!silent&&mode==='explore'){sel=null;clearMarks();renderIntro()}}
  function clearMarks(){if(!mv)return;mv.svg.querySelectorAll('.dc-reg').forEach(el=>el.classList.remove('sel','ok','bad','reveal','done','hint'))}
  function markVisited(){
    if(!mv)return;const p=getUserProgress();const v=Array.isArray(p.vreg)?p.vreg:[];
    mv.svg.querySelectorAll('.dc-lbl').forEach(el=>el.classList.toggle('visited',v.includes(el.dataset.id)));
  }

  function regionButtons(){
    const p=getUserProgress();const v=Array.isArray(p.vreg)?p.vreg:[];
    return DC_ZONES.map(z=>{
      const ids=z.id==='pascua'?['RN']:z.regions.concat(z.id==='centro'?['JF']:[]);
      return '<div class="dc-zgroup"><button type="button" class="dc-zhead" data-zone="'+z.id+'" style="--zc:'+z.color+'"><span class="dc-zdot"></span>'+esc(REGIONS[z.id]?REGIONS[z.id].title:z.name)+'<span class="dc-zmore">ver zona ›</span></button><div class="dc-rlist">'+
        ids.map(id=>{const r=info(id);return '<button type="button" class="dc-rbtn'+(v.includes(id)?' seen':'')+'" data-region="'+id+'">'+esc(r.short||r.name)+(v.includes(id)?'<span class="dc-tick" aria-label="visitada">✓</span>':'')+'</button>'}).join('')+'</div></div>';
    }).join('');
  }
  function renderIntro(){
    const p=getUserProgress();const v=(Array.isArray(p.vreg)?p.vreg:[]).length;
    const t=dcTier();
    $('dcPanel').innerHTML='<div class="dc-pn-intro">'+
      '<h2>Chile, de norte a sur</h2>'+
      '<p>'+(t==='beginner'?'¡Toca el mapa para descubrir cada lugar! Prueba el juego <b>Zonas</b>.':'Chile tiene <b>16 regiones</b>. Toca una en el mapa para ver su capital, su geografía y su historia. Acerca con <b>+</b> o con dos dedos.')+'</p>'+
      '<div class="dc-meter"><div class="dc-meter-fill" style="width:'+Math.round(Math.min(v,18)/18*100)+'%"></div><span>'+Math.min(v,18)+' de 18 lugares visitados</span></div>'+
      regionButtons()+'</div>';
  }
  function factIcon(k){return DCArt.icon(k)}
  function renderRegion(id){
    const r=info(id),isl=!!DC_ISLANDS[id];const z=zoneOf(r.zone);const t=dcTier();
    const order=DC_REGIONS.map(x=>x.id).concat(['RN','JF']);const i=order.indexOf(id);
    const prev=order[(i+order.length-1)%order.length],next=order[(i+1)%order.length];
    const kinds=t==='beginner'?DC_FACT_KINDS.slice(0,2):DC_FACT_KINDS;
    $('dcPanel').innerHTML=
      '<button type="button" class="dc-pn-close" data-act="close" aria-label="Cerrar">✕</button>'+
      '<div class="dc-pn-head" style="--zc:'+(z?z.color:'#888')+'">'+
        '<div class="dc-pn-thumb">'+(isl?DCArt.islandThumb(id):DCArt.regionThumb(id,120))+'</div>'+
        '<div><div class="dc-pn-zone">'+esc(isl?'Territorio insular · Región de Valparaíso':'Zona '+(z?z.name:''))+'</div>'+
        '<h2>'+esc(isl?r.name:'Región de '+r.name)+'</h2>'+
        '<div class="dc-pn-cap">'+DCArt.icon('capital')+'<span>'+(isl?'Poblado principal':'Capital')+': <b>'+esc(r.capital)+'</b></span></div></div>'+
      '</div>'+
      '<p class="dc-pn-tag">'+esc(r.tag)+'</p>'+
      '<div class="dc-facts">'+kinds.map(([k,lab])=>'<div class="dc-fact dc-fact-'+k+'"><div class="dc-fact-ic">'+factIcon(k)+'</div><div><h3>'+lab+'</h3><p>'+esc(r[k])+'</p></div></div>').join('')+'</div>'+
      (id==='RN'&&REGIONS.pascua?'<button type="button" class="dc-more" data-zone="pascua">Más sobre Rapa Nui ›</button>':'')+
      '<div class="dc-pn-nav"><button type="button" class="btn-ghost" data-region="'+prev+'">‹ '+esc(info(prev).short||info(prev).name)+'</button><button type="button" class="btn-ghost" data-region="'+next+'">'+esc(info(next).short||info(next).name)+' ›</button></div>';
  }
  function renderZone(zid){
    const r=REGIONS[zid];if(!r)return;const z=zoneOf(zid);
    saveVisited(zid);updateProgress();
    if(mv){clearMarks();if(z)z.regions.forEach(id=>mv.regEls(id).forEach(el=>el.classList.add('sel')))}
    $('dcPanel').innerHTML='<button type="button" class="dc-pn-close" data-act="close" aria-label="Cerrar">✕</button>'+
      '<div class="dc-pn-head" style="--zc:'+(z?z.color:'#888')+'"><div class="dc-pn-thumb dc-pn-zic">'+DCArt.zoneIcon(zid)+'</div><div><div class="dc-pn-zone">Zona</div><h2>'+esc(r.title)+'</h2><div class="dc-pn-cap"><span>'+esc(r.sub)+'</span></div></div></div>'+
      '<div class="dc-facts">'+r.facts.map(f=>'<div class="dc-fact"><div><h3>'+esc(f.t)+'</h3><p>'+esc(f.p)+'</p>'+(f.f?'<div class="fun-fact"><b>¿Sabías que…?</b> '+esc(f.f)+'</div>':'')+'</div></div>').join('')+'</div>'+
      (z&&z.regions.length?'<div class="dc-rlist dc-rlist-zone">'+z.regions.map(id=>'<button type="button" class="dc-rbtn" data-region="'+id+'">'+esc(info(id).short||info(id).name)+'</button>').join('')+'</div>':'');
    if(!wide())openSheet();
  }
  function onPanelClick(e){
    const a=e.target.closest('[data-act]');
    if(a&&a.dataset.act==='close'){closeSheet();return}
    if(a&&a.dataset.act==='start-find'){startFind(a.dataset.kind);return}
    if(a&&a.dataset.act==='again'){if(mode==='zones')startZones();else renderFindSetup();return}
    const r=e.target.closest('[data-region]');if(r){if(mode!=='explore')setMode('explore');select(r.dataset.region);return}
    const z=e.target.closest('[data-zone]');if(z){if(mode!=='explore')setMode('explore');renderZone(z.dataset.zone);return}
  }

  // ── banner helper ──
  function banner(html){const b=$('dcBanner');b.hidden=false;b.innerHTML=html+'<button type="button" class="dc-quit" data-act="quit" aria-label="Salir del juego">✕</button>'}
  function dots(n,i,res){let s='<div class="dc-dots" aria-hidden="true">';for(let k=0;k<n;k++)s+='<i class="'+(k<i?(res[k]?'ok':'miss'):k===i?'cur':'')+'"></i>';return s+'</div>'}
  function starsSVG(n){let s='<div class="dc-stars" aria-label="'+n+' estrellas">';for(let i=0;i<3;i++)s+=DCArt.star(i<n);return s+'</div>'}
  function flash(ids,cls,ms){ids.forEach(id=>mv.regEls(id).forEach(el=>{el.classList.add(cls);if(ms)setTimeout(()=>el.classList.remove(cls),ms)}))}

  // ── Zones game (youngest) ──
  function startZones(){
    const n=dcTier()==='beginner'?5:8;
    let seq=dcShuffle(DC_ZONES.map(z=>z.id));while(seq.length<n)seq=seq.concat(dcShuffle(DC_ZONES.map(z=>z.id)).slice(0,n-seq.length));
    game={type:'zones',seq:seq.slice(0,n),i:0,miss:0,res:[],tries:0,lock:false};
    $('dcMap').classList.add('zones');
    mv.setZoom(mv.fitZ());
    $('dcPanel').innerHTML='<div class="dc-pn-intro"><h2>Juego de las zonas</h2><p>Chile es muy largo. Tiene un <b style="color:#C2410C">Norte</b> con desierto, un <b style="color:#B91C1C">Centro</b> con la capital, un <b style="color:#047857">Sur</b> con lagos y volcanes, la <b style="color:#1D4ED8">Patagonia</b> con hielo, y la isla <b style="color:#92400E">Rapa Nui</b> en el mar.</p><div class="dc-zlegend">'+DC_ZONES.map(z=>'<span style="--zc:'+z.color+'"><i></i>'+esc(z.name)+'</span>').join('')+'</div></div>';
    zonePrompt();
  }
  function say(t){
    try{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='es-CL';u.rate=.95;speechSynthesis.speak(u)}catch(e){}
  }
  function zonePrompt(){
    const z=zoneOf(game.seq[game.i]);game.tries=0;game.lock=false;
    const spoken='Toca '+(z.id==='pascua'?'la isla Rapa Nui':'el '+z.name)+': '+z.hint;
    if(dcTier()==='beginner')say(spoken);
    game.spoken=spoken;
    banner('<div class="dc-bn-ic">'+DCArt.zoneIcon(z.id)+'</div><div class="dc-bn-txt"><div class="dc-bn-q">Toca '+(z.id==='pascua'?'la isla ':'el ')+'<b style="color:'+z.color+'">'+esc(z.id==='pascua'?'Rapa Nui':z.name.toUpperCase())+'</b></div><div class="dc-bn-s">'+esc(z.hint)+'</div>'+dots(game.seq.length,game.i,game.res)+'</div>'+('speechSynthesis' in window?'<button type="button" class="dc-say" data-act="say" aria-label="Escuchar otra vez">🔊</button>':''));
  }
  function zoneTap(zid,id,kind){
    if(game.lock)return;
    const target=game.seq[game.i],z=zoneOf(target);
    if(zid===target){
      game.lock=true;game.res[game.i]=game.tries===0;
      if(target!=='pascua')flash(z.regions,'ok');
      else{const i=mv.svg.querySelector('[data-island="RN"]');if(i){i.classList.add('ok');setTimeout(()=>i.classList.remove('ok'),900)}}
      dcSfx('correct');showFeedback('🎉');
      setTimeout(()=>{clearMarks();game.i++;if(game.i>=game.seq.length)zonesDone();else zonePrompt()},950);
    }else{
      game.tries++;game.miss++;dcSfx('wrong');
      const wz=zoneOf(zid);
      if(wz&&wz.regions.length)flash(wz.regions,'bad',700);
      const order=['norte','centro','sur','patagonia'];
      const dir=target==='pascua'?'Rapa Nui es una isla: búscala en el mar, en el cuadro de la izquierda.':(order.indexOf(target)<order.indexOf(zid)?'¡Busca más arriba, hacia el norte! ⬆️':'¡Busca más abajo, hacia el sur! ⬇️');
      const s=$('dcBanner').querySelector('.dc-bn-s');if(s)s.innerHTML='Ese es '+(zid==='pascua'?'Rapa Nui':'el '+esc(wz?wz.name:''))+'. '+dir;
      if(game.tries>=2&&target!=='pascua')flash(z.regions,'hint',1400);
    }
  }
  function zonesDone(){
    const n=game.seq.length,miss=game.miss;
    const stars=miss<=1?3:miss<=3?2:1;const pct=Math.max(0,Math.round(100*(n-Math.min(n,miss))/n));
    saveTopicProgress('zonas',stars,pct);updateProgress();dcSfx('cheer');
    banner('<div class="dc-bn-ic">'+DCArt.medal(stars)+'</div><div class="dc-bn-txt"><div class="dc-bn-q">¡Muy bien! Encontraste todas las zonas</div>'+starsSVG(stars)+'</div>');
    $('dcPanel').innerHTML='<div class="dc-pn-intro dc-result">'+DCArt.medal(stars)+'<h2>'+(stars===3?'¡Excelente explorador!':'¡Buen trabajo!')+'</h2>'+starsSVG(stars)+'<p>'+(miss===0?'¡Sin ningún error!':'Errores: '+miss)+'</p><button type="button" class="btn-red" data-act="again">Jugar otra vez</button></div>';
    game=null;
  }

  // ── Find-the-region game ──
  const FIND_KINDS={regiones:{lab:'Por nombre',desc:'Te digo el nombre de la región.'},capitales:{lab:'Por capital',desc:'Te digo la capital: ¿de qué región es?'},pistas:{lab:'Por pista',desc:'Te doy una pista de geografía o historia.'}};
  function renderFindSetup(){
    const t=dcTier();const p=getUserProgress();
    const def=t==='expert'?'pistas':t==='advanced'?'capitales':'regiones';
    clearMarks();$('dcMap').classList.add('nolabels');
    $('dcPanel').innerHTML='<div class="dc-pn-intro"><h2>Encuentra la región</h2><p>Busca en el mapa la región que te pido. Los nombres están escondidos. Si fallas, te digo si está más al norte o más al sur.</p>'+
      '<div class="dc-kinds">'+Object.keys(FIND_KINDS).map(k=>{const st=p[k]&&p[k].bestStars||0;return '<button type="button" class="dc-kind'+(k===def?' rec':'')+'" data-act="start-find" data-kind="'+k+'"><b>'+FIND_KINDS[k].lab+'</b><span>'+FIND_KINDS[k].desc+'</span>'+starsSVG(st)+(k===def?'<em>Recomendado</em>':'')+'</button>'}).join('')+'</div></div>';
    banner('<div class="dc-bn-ic">'+DCArt.icon('compass')+'</div><div class="dc-bn-txt"><div class="dc-bn-q">Elige cómo jugar</div><div class="dc-bn-s">'+(wide()?'Elige un modo a la derecha.':'Elige un modo debajo del mapa.')+'</div></div>');
  }
  function startFind(kind){
    const t=dcTier();const n=t==='intermediate'||t==='beginner'?8:t==='advanced'?10:12;
    game={type:'find',kind,seq:dcShuffle(DC_REGIONS.map(r=>r.id)).slice(0,n),i:0,pts:0,res:[],tries:0,lock:false};
    $('dcMap').classList.add('nolabels');
    $('dcMap').classList.toggle('nocaps',kind!=='capitales');
    $('dcPanel').innerHTML='<div class="dc-pn-intro"><h2>'+FIND_KINDS[kind].lab+'</h2><p>Primer intento: 3 puntos · segundo: 2 · tercero: 1. Usa <b>+</b> para acercarte a las regiones pequeñas del centro.</p><div class="dc-score" id="dcScore">Puntos: 0</div></div>';
    findPrompt();
  }
  function findPrompt(){
    const r=DCArt.regionById(game.seq[game.i]);game.tries=0;game.lock=false;
    let q;
    if(game.kind==='capitales')q='¿En qué región está <b>'+esc(r.capital)+'</b>?';
    else if(game.kind==='pistas')q=esc(r.clue);
    else q='Encuentra: <b>'+esc(r.short?r.short:r.name)+'</b>';
    banner('<div class="dc-bn-ic">'+DCArt.icon('pin')+'</div><div class="dc-bn-txt"><div class="dc-bn-q">'+q+'</div><div class="dc-bn-s">Pregunta '+(game.i+1)+' de '+game.seq.length+'</div>'+dots(game.seq.length,game.i,game.res)+'</div>');
  }
  function findTap(id){
    if(game.lock)return;
    const target=game.seq[game.i],tr=DCArt.regionById(target),tg=DCArt.geoById(target);
    const s=$('dcBanner').querySelector('.dc-bn-s');
    if(id===target){
      game.lock=true;const pts=3-game.tries;game.pts+=pts;game.res[game.i]=game.tries===0;
      flash([id],'ok');dcSfx('correct');
      if(s)s.innerHTML='✓ ¡Sí! <b>'+esc(tr.name)+'</b> · capital '+esc(tr.capital)+' (+'+pts+')';
      $('dcScore')&&($('dcScore').textContent='Puntos: '+game.pts);
      saveRegionVisited(id);
      setTimeout(()=>{clearMarks();game.i++;if(game.i>=game.seq.length)findDone();else findPrompt()},1300);
    }else{
      game.tries++;dcSfx('wrong');
      const wr=DCArt.regionById(id),wg=DCArt.geoById(id);
      flash([id],'bad',800);
      const dir=tg.c[1]<wg.c[1]?'más al norte ⬆️':'más al sur ⬇️';
      if(game.tries>=3){
        game.lock=true;game.res[game.i]=false;
        flash([target],'reveal');
        if(s)s.innerHTML='Era <b>'+esc(tr.name)+'</b> (capital '+esc(tr.capital)+'). ¡La próxima vez!';
        mv.focusRegion(target);
        setTimeout(()=>{clearMarks();game.i++;if(game.i>=game.seq.length)findDone();else findPrompt()},2200);
      }else if(s){
        s.innerHTML='Esa es <b>'+esc(wr.short||wr.name)+'</b>. Busca '+dir;
        if(game.tries===2&&dcTier()!=='expert'){const z=zoneOf(tg.zone);if(z)flash(z.regions,'hint',1600)}
      }
    }
  }
  function findDone(){
    const max=3*game.seq.length,pct=Math.round(100*game.pts/max),stars=dcStars(pct);
    saveTopicProgress(game.kind,stars,pct);updateProgress();if(pct>=60)dcSfx('cheer');
    $('dcMap').classList.remove('nolabels','nocaps');
    banner('<div class="dc-bn-ic">'+DCArt.medal(stars)+'</div><div class="dc-bn-txt"><div class="dc-bn-q">'+game.pts+' de '+max+' puntos</div>'+starsSVG(stars)+'</div>');
    $('dcPanel').innerHTML='<div class="dc-pn-intro dc-result">'+DCArt.medal(stars)+'<h2>'+(stars===3?'¡Cartógrafo experto!':stars===2?'¡Muy bien!':'¡Sigue practicando!')+'</h2>'+starsSVG(stars)+'<p>'+game.pts+' de '+max+' puntos ('+pct+'%). Ahora los nombres vuelven a aparecer: ¡revisa las que fallaste!</p><button type="button" class="btn-red" data-act="again">Jugar otra vez</button></div>';
    game=null;
  }

  return {mount,setMode,select,markVisited,openZone:renderZone,get view(){return mv}};
})();

// Legacy entry points (older links / tests call these with zone ids)
function openRegion(id){
  const tab=document.querySelector('.tab-btn[data-tab="mapa"]');if(tab)tab.click();
  DCMap.mount();
  if(REGIONS[id])DCMap.openZone(id);else DCMap.select(id);
}
function closeRegion(){const p=document.getElementById('dcPanel');if(p)p.classList.remove('sheet');document.body.classList.remove('dc-sheet-open')}
window.openRegion = openRegion;
window.closeRegion = closeRegion;


window.startQuiz = startQuiz;
window.ans = ans;
window.initMemory = initMemory;
window.renderQuizMenu = renderQuizMenu;
window.renderTopics = renderTopics;
window.renderStories = renderStories;

// ── STORIES ──

const TOPICS=[
  {id:'geography',icon:'🏔️',name:'Geografía',stories:[
    {t:'🌎 La forma de Chile',p:'Chile se extiende por más de 4.300 km de norte a sur, pero en promedio solo tiene 177 km de ancho.',f:'Si pusieras a Chile sobre Europa, llegaría desde Noruega hasta el Sahara.'},
    {t:'🗻 Los Andes',p:'Los poderosos Andes recorren toda la frontera este. Algunos picos superan los 6.000 metros.',f:'Chile tiene más de 2.000 volcanes, ¡y unos 90 están activos!'}
  ]},
  {id:'antartica',icon:'🧊',name:'La Antártica Chilena',stories:[
    {t:'❄️ El Continente Blanco',p:'La Antártica es el lugar más frío, seco y ventoso del planeta. Gran parte de ella está cubierta de hielo durante todo el año.',f:'En la Antártica no viven osos polares, ¡pero sí hay muchos pingüinos!'},
    {t:'🏔️ Territorio Chileno Antártico',p:'Chile tiene bases científicas y militares en la Antártica, donde investigadores estudian el clima, la flora y la fauna del lugar.',f:'Villa Las Estrellas es un poblado en la Antártica donde viven familias e incluso hay una escuela.'}
  ]},
  {id:'indigenous',icon:'🪶',name:'Pueblos originarios',stories:[
    {t:'🪶 Los Mapuche',p:'Los Mapuche ("gente de la tierra") son el pueblo originario más grande de Chile. Nunca fueron conquistados por España.',f:'Defendieron sus tierras por más de 300 años, desde 1536 hasta 1883.'},
    {t:'🗿 Rapa Nui',p:'Isla de Pascua está a 3.700 km de la costa. Los Rapa Nui tallaron casi 1.000 estatuas Moai gigantes.',f:'Nadie sabe con certeza cómo movieron los Moai.'},
    {t:'🏝️ Aymaras y Diaguitas',p:'Los Aymara han vivido en los Andes pastoreando llamas. Los Diaguitas eran hábiles ceramistas con hermosos diseños.',f:'Los Aymara celebran el Año Nuevo el 21 de junio durante el solsticio de invierno.'}
  ]},
  {id:'history',icon:'⚔️',name:'Historia',stories:[
    {t:'🚢 Llegada española',p:'En 1540, Pedro de Valdivia fundó Santiago el 12 de febrero de 1541. Chile fue parte del Imperio Español por casi 300 años.',f:'Santiago fue fundada junto al cerro Santa Lucía, que puedes visitar hoy.'},
    {t:'🗡️ La Independencia',p:'El 18 de septiembre de 1810 Chile dio su primer paso hacia la independencia. Se declaró total el 12 de febrero de 1818.',f:'El 18 de septiembre es Fiestas Patrias — con comida, cueca y volantines.'},
    {t:'🇨🇱 Bernardo O\'Higgins',p:'El Padre de la Patria. Su padre era irlandés y su madre chilena. Fue el primer Director Supremo de Chile.',f:'A pesar de ser mitad irlandés, O\'Higgins es uno de los héroes más celebrados.'}
  ]},
  {id:'culture',icon:'🥘',name:'Cultura y comida',stories:[
    {t:'🥟 Empanadas de pino',p:'Masa horneada rellena de carne, cebolla, huevo duro, aceitunas y pasas. Se comen especialmente en Fiestas Patrias.',f:'Se venden más de 300 millones de empanadas durante las Fiestas Patrias.'},
    {t:'💃 La Cueca',p:'El baile nacional. Las parejas agitan pañuelos representando el cortejo entre un gallo y una gallina.',f:'Fue declarada baile nacional oficial en 1979.'},
    {t:'🫖 La Once',p:'Tradición de té/café de la tarde con sándwiches y pastelitos, entre 5 y 7 PM.',f:'Una teoría dice que viene de las 11 letras de "aguardiente".'}
  ]},
  {id:'nature',icon:'🦅',name:'Naturaleza',stories:[
    {t:'🦅 El Cóndor Andino',p:'Una de las aves voladoras más grandes del mundo con envergadura de más de 3 metros. Aparece en el escudo nacional.',f:'Los cóndores pueden vivir más de 70 años.'},
    {t:'🌲 La Araucaria',p:'Árbol prehistórico que existe hace 200+ millones de años. Es el árbol nacional y produce piñones nutritivos.',f:'Es un "fósil viviente" que casi no ha cambiado desde los dinosaurios.'},
    {t:'🐆 Pumas y Huemules',p:'Los pumas recorren los bosques del sur. El huemul es un ciervo en peligro que aparece en el escudo junto al cóndor.',f:'Torres del Paine tiene una de las poblaciones más densas de pumas.'}
  ]},
  {id:'famous',icon:'🌟',name:'Chilenos famosos',stories:[
    {t:'📝 Pablo Neruda',p:'El poeta más famoso de Chile, Nobel de Literatura 1971. Escribió sobre el amor, la naturaleza y Chile. "Puedo escribir los versos más tristes esta noche. / Escribir, por ejemplo: La noche está estrellada, / y tiritan, azules, los astros, a lo lejos."',f:'Neruda coleccionaba objetos curiosos — una de sus casas tiene un bar con forma de barco.'},
    {t:'📖 Gabriela Mistral',p:'Primera latinoamericana en ganar el Nobel de Literatura (1945). Maestra y diplomática que luchó por la educación. "Donde haya un árbol que plantar, plántalo tú; / donde haya un error que enmendar, enmiéndalo tú; / donde haya un esfuerzo que todos esquivan, acéptalo tú."',f:'Su rostro aparece en el billete de 5.000 pesos chilenos.'},
    {t:'🖋️ Nicanor Parra',p:'Creador de la "antipoesía" — versos simples con humor y crítica. Vivió 103 años. "Durante medio siglo / la poesía fue / el paraíso del tonto solemne. / Hasta que vine yo / y me instalé con mi montaña rusa."',f:'Además de poeta, Parra era físico y profesor de matemáticas.'},
    {t:'⚽ Alexis Sánchez',p:'Jugó en Barcelona y Arsenal. Chile ganó la Copa América en 2015 y 2016.',f:'Marcelo Ríos fue el primer tenista latinoamericano #1 del mundo en 1998.'},
    {t:'🎶 Violeta Parra',p:'Hermana mayor de Nicanor. Rescató y cantó música del campo chileno. Autora de "Gracias a la vida" y "Volver a los 17". Su canto inspira a toda Latinoamérica hasta hoy.',f:'El 4 de octubre (su cumpleaños) se celebra el Día de la Música Chilena.'}
  ]},
  {id:'inventors',icon:'🔬',name:'Ciencia e Inventos',stories:[
    {t:'🔬 Vacuna contra la hepatitis B',p:'El bioquímico chileno Pablo Valenzuela fue clave en la creación de la primera vacuna recombinante contra la hepatitis B.',f:'Valenzuela también ayudó a descubrir el virus de la hepatitis C.'},
    {t:'💧 Atrapanieblas',p:'Un invento chileno que usa mallas para atrapar las gotas de agua de la neblina (camanchaca) en el norte.',f:'Un solo atrapanieblas grande puede recolectar cientos de litros de agua al día.'},
    {t:'🌍 Telescopios gigantes',p:'En Chile está el Observatorio ALMA y se construye el Telescopio Extremadamente Grande (ELT).',f:'El ELT tendrá un espejo principal de 39 metros de diámetro, el más grande del mundo.'}
  ]},
  {id:'volcanes',icon:'🌋',name:'Volcanes de Chile',stories:[
    {t:'🌋 Cinturón de Fuego',p:'Chile está en el Cinturón de Fuego del Pacífico, una zona con muchos volcanes y terremotos. Hay más de 2.000 volcanes en Chile, y unos 90 están activos.',f:'El Nevado Ojos del Salado es el volcán más alto del mundo (6.891 m).'}
  ]},
  {id:'animales',icon:'🦙',name:'Fauna Local',stories:[
    {t:'🦙 Vicuñas y Guanacos',p:'Son camélidos sudamericanos que habitan en los Andes. La vicuña vive a gran altitud y tiene una lana muy fina y valiosa.',f:'El guanaco es más grande y puede correr a casi 60 km/h.'}
  ]},
  {id:'folk',icon:'🎶',name:'Canto y Folclor',stories:[
    {t:'🪗 Si vas para Chile',p:'Canción tradicional escrita por Chito Faró en 1942, casi un himno no oficial. "Si vas para Chile, te ruego que pases / por donde vive mi amada…"',f:'La toca cada grupo folclórico en cualquier peña chilena.'},
    {t:'🌷 Gracias a la vida',p:'Violeta Parra compuso este canto en 1966, pocos meses antes de su muerte. Un agradecimiento a la vida por el oído, la vista, los pasos y el canto. Tiene versiones en muchos idiomas.',f:'Mercedes Sosa y Joan Baez grabaron versiones famosas.'},
    {t:'⛰️ Arriba en la cordillera',p:'Patricio Manns la escribió en 1965. Cuenta la historia de un arriero solitario. "Arriba en la cordillera / donde el viento hace empinado / anduvo una vez un hombre…"',f:'Es una de las cuecas más interpretadas fuera del género típico.'},
    {t:'💃 La cueca',p:'Baile nacional desde 1979. Representa el cortejo del gallo y la gallina: los bailarines se mueven en círculos, se esquivan y agitan pañuelos al aire.',f:'Hay cueca brava urbana, cueca chilota del sur y cueca nortina con quenas.'},
    {t:'🐎 Tonadas del campo',p:'La tonada es el canto rural acompañado de guitarra. Habla de la tierra, el trabajo, el amor y la fiesta. Su prima cercana es el corrido.',f:'Los Huasos Quincheros mantuvieron vivo este repertorio por más de 80 años.'},
    {t:'🪕 Instrumentos típicos',p:'La guitarra, el arpa (sí, un arpa pequeña), el bombo y las cajas andinas se escuchan en cualquier peña. En el altiplano se suma la zampoña.',f:'El charango (un tipo de guitarrita) tenía caparazón de armadillo antiguamente; hoy se hace de madera.'}
  ]},
  // PRUNED [2026-04-03]: Removed 'astronomia' and 'cocina' to make room for 'fiestas_patrias' and stay within MAX 12 limit.
  // UPDATED [2026-04-24]: Replaced duplicate 'volcanes_chile' with 'folk' to add a canto + folclor topic without exceeding the cap.
  {id:'fiestas_patrias',icon:'🪁',name:'Fiestas Patrias',stories:[
    {t:'🇨🇱 El 18 de Septiembre',p:'Celebramos el inicio de nuestra independencia. Las familias se reúnen en las fondas para comer, bailar y celebrar.',f:'En esta fecha se declaran feriados irrenunciables para celebrar.'},
    {t:'💃 La Cueca',p:'Es el baile nacional. Representa el cortejo del gallo y la gallina, y se baila agitando pañuelos al aire.',f:'Fue declarada baile nacional de Chile en el año 1979.'}
  ]}
];

let curTopic=null;
const dcEsc=s=>(typeof escHtml==='function'?escHtml(s):DCArt.esc(s));
const dcStripIcon=s=>String(s).replace(/^[^\p{L}\p{N}¿¡"'«]+/u,'');

function renderTopics(){
  const el=document.getElementById('historyTopics');
  if(!el)return;
  const prog=getUserProgress();
  el.innerHTML='';
  const all=[{id:'timeline',icon:'⏳',name:'Línea de tiempo'}].concat(TOPICS);
  all.forEach(t=>{
    const done=prog[t.id]&&prog[t.id].bestStars>0;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='topic-btn'+(curTopic===t.id?' active':'')+(t.id==='timeline'?' topic-tl':'');
    btn.setAttribute('aria-pressed',curTopic===t.id?'true':'false');
    btn.textContent=t.icon+' '+t.name+(done?' ✓':'');
    btn.onclick=()=>{curTopic=t.id;renderTopics();renderStories(t.id)};
    el.appendChild(btn);
  });
}

function renderStories(id){
  const el=document.getElementById('storyList');
  if(!el)return;
  if(id==='timeline'){renderTimeline(el);return}
  const topic=TOPICS.find(t=>t.id===id);if(!topic)return;
  el.innerHTML='';
  const head=document.createElement('div');
  head.className='story-banner';
  head.innerHTML=DCArt.banner(topic.id)+'<div class="story-banner-t"><h2>'+dcEsc(topic.name)+'</h2><span>'+topic.stories.length+' historia'+(topic.stories.length!==1?'s':'')+' · toca para leer</span></div>';
  el.appendChild(head);
  topic.stories.forEach((s,i)=>{
    const c=document.createElement('article');
    c.className='story-card';
    const bid='st-'+id+'-'+i;
    c.innerHTML='<button type="button" class="story-toggle" aria-expanded="false" aria-controls="'+bid+'"><span class="story-num">'+(i+1)+'</span><h3>'+dcEsc(dcStripIcon(s.t))+'</h3><span class="story-chev" aria-hidden="true"></span></button>'+
      '<div class="story-body" id="'+bid+'"><p>'+dcEsc(s.p)+'</p>'+(s.f?'<div class="fun-fact">'+DCArt.icon('bulb')+'<div><strong>¿Sabías que…?</strong> '+dcEsc(s.f)+'</div></div>':'')+'</div>';
    const tg=c.querySelector('.story-toggle');
    tg.onclick=()=>{const on=c.classList.toggle('expanded');tg.setAttribute('aria-expanded',on)};
    el.appendChild(c);
  });
  if(QB[id]){
    const q=document.createElement('div');q.className='story-cta';
    q.innerHTML='<span>¿Leíste todo? Pon a prueba lo que aprendiste.</span>';
    const b=document.createElement('button');b.type='button';b.className='btn-red';b.textContent='Quiz de '+topic.name;
    b.onclick=()=>{document.querySelector('.tab-btn[data-tab="quiz"]').click();startQuiz(id)};
    q.appendChild(b);el.appendChild(q);
  }
}

const DC_ERAS=[[-1e9,'Antes de los españoles','Pueblos originarios'],[1520,'Conquista y Colonia','1520 – 1810'],[1810,'Independencia','1810 – 1818'],[1819,'República','1819 – hoy']];
function eraOf(y){let e=DC_ERAS[0];DC_ERAS.forEach(x=>{if(y>=x[0])e=x});return e}
function renderTimeline(el){
  let h='<div class="story-banner tl-banner">'+DCArt.banner('timeline')+'<div class="story-banner-t"><h2>Línea de tiempo de Chile</h2><span>De las momias Chinchorro al rescate de los 33</span></div></div><ol class="dc-tl">';
  let era=null;
  DC_TIMELINE.forEach((e,i)=>{
    const er=eraOf(e.y);
    if(er!==era){era=er;h+='<li class="dc-tl-era"><span>'+dcEsc(er[1])+'</span><small>'+dcEsc(er[2])+'</small></li>'}
    const r=DC_ISLANDS[e.region]||DCArt.regionById(e.region);
    h+='<li class="dc-tl-item'+(i%2?' alt':'')+'"><div class="dc-tl-year">'+dcEsc(e.label)+'</div><div class="dc-tl-dot" aria-hidden="true"></div>'+
      '<div class="dc-tl-card"><div class="dc-tl-art">'+DCArt.vignette(e.art)+'</div><div class="dc-tl-txt"><h3>'+dcEsc(e.t)+'</h3><p>'+dcEsc(e.d)+'</p>'+
      (r?'<button type="button" class="dc-tl-map" data-region="'+e.region+'">'+DCArt.icon('pin')+'<span>'+dcEsc(r.short||r.name)+'</span></button>':'')+'</div></div></li>';
  });
  h+='</ol>';
  el.innerHTML=h;
  el.querySelectorAll('.dc-tl-map').forEach(b=>b.onclick=()=>{
    document.querySelector('.tab-btn[data-tab="mapa"]').click();
    DCMap.mount();DCMap.setMode('explore');DCMap.select(b.dataset.region);
  });
}

const MEM_PAIRS=[
  {icon:'🗡️',name:'Pedro de Valdivia',match:'Fundó Santiago 1541'},
  {icon:'🇨🇱',name:'Bernardo O\'Higgins',match:'Padre de la Patria'},
  {icon:'📝',name:'Pablo Neruda',match:'Nobel Literatura 1971'},
  {icon:'📖',name:'Gabriela Mistral',match:'Primera Nobel latina'},
  {icon:'🪶',name:'Pueblo Mapuche',match:'Nunca conquistados'},
  {icon:'⚽',name:'Alexis Sánchez',match:'Copa América 2015'},
  {icon:'🎵',name:'Violeta Parra',match:'Compuso Gracias a la vida'},
  {icon:'🎹',name:'Claudio Arrau',match:'Pianista de fama mundial'},
  {icon:'🌊',name:'Terremoto de Valdivia',match:'Magnitud 9,5 en 1960'},
  {icon:'🔭',name:'Observatorio ALMA',match:'Radiotelescopio en Atacama'}
];

// Extra pairs for older players (factual, dated)
const MEM_PAIRS_EXTRA=[
  {icon:'⚓',name:'Arturo Prat',match:'Combate Naval de Iquique 1879'},
  {icon:'⛵',name:'Hernando de Magallanes',match:'Cruzó el estrecho en 1520'},
  {icon:'🪶',name:'Lautaro',match:'Victoria en Tucapel 1553'},
  {icon:'🐎',name:'Diego de Almagro',match:'Primera expedición 1536'},
  {icon:'⛏️',name:'Ignacio Domeyko',match:'Geólogo del siglo XIX'},
  {icon:'🗿',name:'Rapa Nui',match:'Se unió a Chile en 1888'}
];
const MEM_CAT={'Pedro de Valdivia':'his','Bernardo O\'Higgins':'his','Arturo Prat':'his','Hernando de Magallanes':'his','Diego de Almagro':'his','Lautaro':'pue','Pueblo Mapuche':'pue','Rapa Nui':'pue','Pablo Neruda':'art','Gabriela Mistral':'art','Violeta Parra':'art','Claudio Arrau':'art','Alexis Sánchez':'dep','Terremoto de Valdivia':'nat','Observatorio ALMA':'sci','Ignacio Domeyko':'sci'};
const MEM_CAT_NAME={his:'Historia',pue:'Pueblos',art:'Arte',dep:'Deporte',nat:'Naturaleza',sci:'Ciencia'};
let memCards=[],memFlipped=[],memMatched=0,memMoves=0,memLocked=false,memPairsN=10;

function memPairCount(){const t=dcTier();return t==='beginner'?6:t==='intermediate'?8:t==='advanced'?10:12}
function initMemory(){
  memMatched=0;memMoves=0;memLocked=false;memFlipped=[];
  memPairsN=memPairCount();
  const pool=memPairsN<=10?MEM_PAIRS.slice():MEM_PAIRS.concat(MEM_PAIRS_EXTRA);
  // smaller boards keep the best-known names first
  const pairs=memPairsN===10?MEM_PAIRS.slice():memPairsN<10?dcShuffle(MEM_PAIRS.slice(0,8)).slice(0,memPairsN):dcShuffle(pool).slice(0,memPairsN);
  const mmEl=document.getElementById('memMoves');
  const mpEl=document.getElementById('memPairs');
  const mtEl=document.getElementById('memTotal');
  const msgEl=document.getElementById('memoryMsg');
  const bestEl=document.getElementById('memBest');
  if(mmEl)mmEl.textContent='0';
  if(mpEl)mpEl.textContent='0';
  if(mtEl)mtEl.textContent=pairs.length;
  if(msgEl)msgEl.innerHTML='';
  const prog=getUserProgress();const best=(prog.memBests&&prog.memBests[memPairsN])||(memPairsN===10?prog.memBest:null);
  if(bestEl)bestEl.textContent=best?best:'—';
  const cards=[];
  pairs.forEach((p,i)=>{
    const cat=MEM_CAT[p.name]||'his';
    cards.push({type:'person',text:p.name,pid:i,cat});
    cards.push({type:'fact',text:p.match,pid:i,cat});
  });
  memCards=dcShuffle(cards);
  const g=document.getElementById('memoryGrid');
  if(g){g.dataset.n=memCards.length;g.innerHTML='';
    memCards.forEach((c,i)=>{
      const d=document.createElement('button');
      d.type='button';d.className='memory-card mc-'+c.cat;d.dataset.i=i;
      d.setAttribute('aria-label','Carta '+(i+1)+' (boca abajo)');
      d.innerHTML='<div class="memory-card-inner"><div class="memory-back">'+DCArt.cardBack()+'</div><div class="memory-front">'+(c.type==='person'?
        '<span class="mf-medal">'+DCArt.medallion(c.text,c.cat)+'</span><span class="mf-text">'+dcEsc(c.text)+'</span><span class="mf-cat">'+MEM_CAT_NAME[c.cat]+'</span>':
        '<span class="mf-ribbon">'+DCArt.icon('laurel')+'</span><span class="mf-text mf-fact">'+dcEsc(c.text)+'</span>')+'</div></div>';
      d.onclick=()=>flipCard(i);
      g.appendChild(d);
    });
  }
}
function renderMem(){
  document.querySelectorAll('#memoryGrid .memory-card').forEach(d=>{
    const i=+d.dataset.i,c=memCards[i];
    const up=memFlipped.includes(i)||c.matched;
    d.classList.toggle('flipped',memFlipped.includes(i));d.classList.toggle('matched',!!c.matched);
    d.setAttribute('aria-label',up?c.text:'Carta '+(i+1)+' (boca abajo)');
  });
}
function flipCard(i){
  if(memLocked||memFlipped.includes(i)||memCards[i].matched)return;
  memFlipped.push(i);renderMem();
  if(memFlipped.length===2){
    memMoves++;
    const mmEl=document.getElementById('memMoves');
    if(mmEl)mmEl.textContent=memMoves;
    memLocked=true;
    const a=memCards[memFlipped[0]],b=memCards[memFlipped[1]];
    if(a.pid===b.pid&&a.type!==b.type){
      setTimeout(()=>{
        a.matched=true;b.matched=true;memMatched++;
        const mpEl=document.getElementById('memPairs');
        if(mpEl)mpEl.textContent=memMatched;
        memFlipped=[];memLocked=false;showFeedback('🎉');dcSfx('correct');renderMem();
        const n=memCards.length/2;
        if(memMatched===n){
          const msgEl=document.getElementById('memoryMsg');
          const great=memMoves<=Math.round(n*1.6);
          if(msgEl)msgEl.innerHTML='<div class="mem-done">'+DCArt.medal(great?3:memMoves<=n*2.2?2:1)+'<div><b>¡Completado en '+memMoves+' movimientos!</b><span>'+(great?'¡Memoria de cóndor!':'Récord a superar: '+memMoves)+'</span></div></div>';
          saveMemBest(memMoves,n);updateProgress();dcSfx('cheer');
          const bestEl=document.getElementById('memBest');const p=getUserProgress();if(bestEl&&p.memBests)bestEl.textContent=p.memBests[n]||memMoves;
        }
      },600);
    }else{
      dcSfx('wrong');
      setTimeout(()=>{memFlipped=[];memLocked=false;renderMem()},900);
    }
  }
}

// ── ORDENA LA HISTORIA ──
let ord=null;
function ordSize(){const t=dcTier();return t==='beginner'?2:t==='intermediate'?3:t==='advanced'?4:5}
function initOrder(){
  const k=ordSize();
  ord={round:0,rounds:5,k,miss:0,placed:[],cards:[],lock:false};
  ordRound();
}
function ordPick(k){
  // spread-out picks for small sets, close dates for experts
  const ev=DC_TIMELINE.slice();
  for(let tries=0;tries<200;tries++){
    const pick=dcShuffle(ev).slice(0,k).sort((a,b)=>a.y-b.y);
    let ok=true;
    for(let i=1;i<pick.length;i++){if(pick[i].y===pick[i-1].y)ok=false;if(k<=3&&pick[i].y-pick[i-1].y<40)ok=false}
    if(ok)return pick;
  }
  return dcShuffle(ev).slice(0,k).sort((a,b)=>a.y-b.y);
}
function ordRound(){
  const el=document.getElementById('orderArea');if(!el)return;
  const sorted=ordPick(ord.k);
  ord.sorted=sorted;ord.cards=dcShuffle(sorted);ord.placed=[];ord.lock=false;
  ordRender('Toca los hechos del <b>más antiguo</b> al <b>más reciente</b>.');
}
function ordRender(msg){
  const el=document.getElementById('orderArea');
  let h='<div class="ord-top"><span class="quiz-badge">Ronda '+(ord.round+1)+'/'+ord.rounds+'</span><span class="ord-miss">Errores: '+ord.miss+'</span></div>';
  h+='<p class="ord-msg" aria-live="polite">'+msg+'</p><ol class="ord-track">';
  for(let i=0;i<ord.k;i++){const e=ord.placed[i];h+='<li class="ord-slot'+(e?' filled':'')+'"><span class="ord-n">'+(i+1)+'</span>'+(e?'<span class="ord-y">'+dcEsc(e.label)+'</span><span class="ord-t">'+dcEsc(e.t)+'</span>':'<span class="ord-empty">?</span>')+'</li>'}
  h+='</ol><div class="ord-cards">';
  ord.cards.forEach((e,i)=>{if(ord.placed.includes(e))return;h+='<button type="button" class="ord-card" data-i="'+i+'"><span class="ord-art">'+DCArt.vignette(e.art)+'</span><span class="ord-ct"><b>'+dcEsc(e.t)+'</b>'+(ord.k>=4?'':'<small>'+dcEsc(e.d)+'</small>')+'</span></button>'});
  h+='</div>';
  el.innerHTML=h;
  el.querySelectorAll('.ord-card').forEach(b=>b.onclick=()=>ordTap(+b.dataset.i,b));
}
function ordTap(i,btn){
  if(ord.lock)return;
  const e=ord.cards[i],want=ord.sorted[ord.placed.length];
  if(e===want){
    ord.placed.push(e);dcSfx('correct');
    if(ord.placed.length===ord.k){
      ord.lock=true;
      ordRender('✓ ¡Correcto! '+dcEsc(ord.sorted.map(x=>x.label).join(' → ')));
      setTimeout(()=>{ord.round++;if(ord.round>=ord.rounds)ordDone();else ordRound()},1600);
    }else ordRender('¡Bien! ¿Qué vino después?');
  }else{
    ord.miss++;dcSfx('wrong');
    btn.classList.add('shake');
    const tip=dcTier()==='expert'?'':' Pista: «'+dcEsc(e.t)+'» fue en '+dcEsc(e.label)+'.';
    setTimeout(()=>ordRender('Hay un hecho <b>más antiguo</b> que ese.'+tip),450);
  }
}
function ordDone(){
  const el=document.getElementById('orderArea');
  const stars=ord.miss<=1?3:ord.miss<=4?2:1;const pct=Math.round(100*ord.rounds*ord.k/(ord.rounds*ord.k+ord.miss));
  saveTopicProgress('ordena',stars,pct);updateProgress();dcSfx('cheer');
  el.innerHTML='<div class="results-box">'+DCArt.medal(stars)+'<div class="r-title">'+(stars===3?'¡Historiador experto!':'¡Buen trabajo!')+'</div><div class="r-sub">'+ord.rounds+' rondas · '+ord.miss+' error'+(ord.miss!==1?'es':'')+'</div><div class="dc-stars">'+[0,1,2].map(i=>DCArt.star(i<stars)).join('')+'</div><button type="button" class="btn-red" onclick="initOrder()">Jugar otra vez</button></div>';
}
window.initOrder=initOrder;

const QB={
  geography:[
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Qué río cruza la ciudad de Santiago?',a:'Río Mapocho',o:['Río Mapocho','Río Loa','Río Baker','Río Maule'], tier:'beginner'},
    {q:'¿Cómo se llama el estrecho en el extremo sur de Chile?',a:'Estrecho de Magallanes',o:['Estrecho de Magallanes','Estrecho de Bering','Canal de Panamá','Estrecho de Gibraltar'], tier:'intermediate'},
    {q:'¿Cuánto mide Chile de norte a sur?',a:'Más de 4.300 km',o:['Más de 4.300 km','Unos 1.000 km','Alrededor de 2.500 km','Menos de 500 km'], tier:'expert', explain:'Chile es uno de los países más largos del mundo: se extiende más de 4.300 km de norte a sur.'},
    {q:'¿Qué desierto chileno es uno de los más secos?',a:'Atacama',o:['Atacama','Sahara','Gobi','Kalahari'], tier:'intermediate', explain:'El desierto de Atacama es el más árido del mundo; en algunas zonas casi nunca llueve.'},
    {q:'¿Qué montañas están en la frontera este?',a:'Los Andes',o:['Los Andes','Las Rocosas','Los Alpes','El Himalaya'], tier:'beginner'},
    {q:'¿Dónde está Torres del Paine?',a:'Patagonia',o:['Patagonia','Atacama','Santiago','Isla de Pascua'], tier:'intermediate'},
    {q:'¿Por qué la NASA prueba robots en Atacama?',a:'Suelo parecido a Marte',o:['Suelo parecido a Marte','Muchos cráteres','Mucho frío','No hay gravedad'], tier:'advanced', explain:'El suelo seco y árido del desierto de Atacama se parece al de Marte, ideal para probar robots exploradores.'},
    {q:'¿Cuál es el océano que baña las costas de Chile?',a:'Océano Pacífico',o:['Océano Pacífico','Océano Atlántico','Océano Índico','Mar Caribe'], tier:'beginner'},
    {q:'¿En qué continente está Chile?',a:'América del Sur',o:['América del Sur','Europa','África','Oceanía'], tier:'beginner'},
    {q:'¿Qué volcán es uno de los más activos del sur?',a:'Villarrica',o:['Villarrica','Osorno','Llaima','Calbuco'], tier:'intermediate'},
    {q:'¿Cuál es el ancho promedio de Chile?',a:'177 km',o:['177 km','500 km','10 km','1.000 km'], tier:'expert', explain:'Chile es muy angosto: su ancho promedio es de unos 177 km entre la cordillera y el mar.'},
    {q:'¿Cuál es el archipiélago chileno famoso por sus iglesias de madera?',a:'Chiloé',o:['Chiloé','Juan Fernández','Galápagos','Malvinas'], tier:'advanced', explain:'Las iglesias de madera de Chiloé son Patrimonio de la Humanidad de la UNESCO.'},
    {q:'¿En qué zona de Chile están los salares y géiseres?',a:'Norte',o:['Norte','Centro','Sur','Patagonia'], tier:'intermediate'},
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Dónde se encuentran los glaciares milenarios como el Glaciar Grey?',a:'Patagonia',o:['Patagonia','Atacama','Valles Centrales','Isla de Pascua'], tier:'intermediate'},
    {q:'¿A qué distancia de la costa está aproximadamente Isla de Pascua?',a:'3.700 km',o:['3.700 km','500 km','1.000 km','10.000 km'], tier:'advanced', explain:'Isla de Pascua está a unos 3.700 km de la costa, lo que la hace una de las islas habitadas más aisladas del mundo.'},
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Cuál es la capital de Chile?',a:'Santiago',o:['Santiago','Valparaíso','Concepción','Antofagasta'], tier:'beginner'},
    {q:'¿Qué país está al norte de Chile?',a:'Perú',o:['Perú','Argentina','Bolivia','Brasil'], tier:'intermediate'},
    {q:'¿Cuál es el lago más grande de Chile?',a:'Lago General Carrera',o:['Lago General Carrera','Lago Llanquihue','Lago Villarrica','Lago Ranco'], tier:'advanced', explain:'El Lago General Carrera, en la Patagonia, es el lago más grande de Chile y es compartido con Argentina.'},
    {q:'¿Qué cordillera recorre la costa chilena?',a:'Cordillera de la Costa',o:['Cordillera de la Costa','Cordillera de los Andes','Cordillera Frontal','Cordillera Domeyko'], tier:'intermediate'},
    {q:'¿En qué región se encuentra el desierto de Atacama?',a:'Norte Grande',o:['Norte Grande','Zona Central','Patagonia','Sur'], tier:'beginner'},
    {q:'¿Qué río del norte es el más largo de Chile?',a:'Río Loa',o:['Río Loa','Río Bío Bío','Río Maipo','Río Baker'], tier:'advanced', explain:'El Río Loa, en el norte, es el más largo de Chile y forma una curva característica en pleno desierto.'},
    {q:'¿En qué región se encuentra el campo de hielo Patagónico Sur?',a:'Magallanes',o:['Magallanes','Antofagasta','Coquimbo','Valparaíso'], tier:'expert', explain:'El Campo de Hielo Patagónico Sur, en la región de Magallanes, es una de las mayores reservas de agua dulce fuera de los polos.'},
    {q:'¿Cuál es el punto más austral del Chile continental americano?',a:'Cabo de Hornos',o:['Cabo de Hornos','Punta Arenas','Puerto Montt','Chiloé'], tier:'advanced', explain:'El Cabo de Hornos, donde se juntan los océanos Pacífico y Atlántico, es el punto más austral de América.'}
  ],
  antartica:[
    {q:'¿En qué mes es más cálido en la Antártica chilena?',a:'Enero',o:['Enero','Julio','Agosto','Septiembre'], tier:'beginner'},
    {q:'¿Cómo se llama la base militar chilena más antigua en la Antártica?',a:'Base Prat',o:['Base Prat','Base O\'Higgins','Base Frei','Base Escudero'], tier:'advanced'},
    {q:'¿Qué continente está más cerca de la Antártica?',a:'América del Sur',o:['América del Sur','África','Oceanía','Europa'], tier:'intermediate'},
    {q:'¿Cuál es la temperatura media en el interior de la Antártica?',a:'Bajo cero',o:['Bajo cero','10 grados','20 grados','30 grados'], tier:'intermediate'},
    {q:'¿Qué océano rodea la Antártica?',a:'Océano Antártico',o:['Océano Antártico','Océano Atlántico','Océano Pacífico','Océano Índico'], tier:'beginner'},
    {q:'¿Cuál es la base civil más conocida de Chile en la Antártica?',a:'Villa Las Estrellas',o:['Villa Las Estrellas','Punta Arenas','Puerto Williams','Base Prat'], tier:'advanced', explain:'Villa Las Estrellas es un poblado chileno en la Antártica que cuenta hasta con escuela y familias.'},
    {q:'¿Qué tratado regula la presencia de países en la Antártica?',a:'Tratado Antártico',o:['Tratado Antártico','Acuerdo de París','Pacto de Santiago','Convención de Ginebra'], tier:'expert', explain:'El Tratado Antártico, firmado en 1959, reserva el continente para la paz y la ciencia.'},
    {q:'¿Qué animal es común encontrar en la Antártica?',a:'Pingüino',o:['Pingüino','Oso Polar','León','Mono'], tier:'beginner'},
    {q:'¿Cómo se llama el poblado chileno en la Antártica que tiene una escuela?',a:'Villa Las Estrellas',o:['Villa Las Estrellas','Punta Arenas','Puerto Williams','Base Prat'], tier:'advanced'},
    {q:'¿Cuál es la característica principal del clima antártico?',a:'Frío y seco',o:['Frío y seco','Caluroso y húmedo','Lluvioso','Templado'], tier:'beginner'},
    {q:'¿Qué estudian principalmente los científicos en la Antártica?',a:'El clima y la fauna',o:['El clima y la fauna','La agricultura','Los bosques','La minería de oro'], tier:'intermediate'},
    {q:'¿Qué tratado regula la Antártica?',a:'Tratado Antártico',o:['Tratado Antártico','Tratado de Paz','Pacto del Sur','Acuerdo Polar'], tier:'advanced'},
    {q:'¿Hay osos polares en la Antártica?',a:'No',o:['No','Sí','Solo en invierno','Solo en verano'], tier:'beginner'},
    {q:'¿Qué porcentaje de agua dulce del mundo está en la Antártica?',a:'Alrededor del 70%',o:['Alrededor del 70%','El 10%','El 30%','El 90%'], tier:'expert', explain:'Cerca del 70% del agua dulce del planeta está congelada en el hielo de la Antártica.'},
    {q:'¿Qué pingüino, el más grande, vive en la Antártica?',a:'El pingüino emperador',o:['El pingüino emperador','El pingüino de Humboldt','El flamenco','El cóndor'], tier:'intermediate', explain:'El pingüino emperador es el más grande y cría sobre el hielo antártico.'},
    {q:'¿En qué año se firmó el Tratado Antártico?',a:'1959',o:['1959','1810','1945','2000'], tier:'expert', explain:'El Tratado Antártico se firmó en 1959 y reserva el continente para la paz y la ciencia.'}
  ],
  indigenous:[
    {q:'¿Qué idioma habla el pueblo mapuche?',a:'Mapudungun',o:['Mapudungun','Aymara','Quechua','Rapa Nui'], tier:'beginner'},
    {q:'¿Quiénes construyeron canoas o "dalcas" en los canales del sur?',a:'Los Chonos',o:['Los Chonos','Los Diaguitas','Los Atacameños','Los Aimaras'], tier:'advanced'},
    {q:'¿En qué zona de Chile habitaban los Selknam?',a:'Tierra del Fuego',o:['Tierra del Fuego','Desierto de Atacama','Isla de Pascua','Valles Centrales'], tier:'intermediate'},
    {q:'¿Qué pueblo originario desarrolló la cerámica con diseños geométricos?',a:'Los Diaguitas',o:['Los Diaguitas','Los Mapuches','Los Chonos','Los Selknam'], tier:'advanced'},
    {q:'¿Cuándo celebran el Año Nuevo los Aymaras?',a:'Solsticio de invierno',o:['Solsticio de invierno','En Navidad','El 18 de septiembre','El 1 de enero'], tier:'intermediate'},
    {q:'¿Dónde habitan principalmente los Aymaras?',a:'En el altiplano',o:['En el altiplano','En los canales del sur','En Isla de Pascua','En Valparaíso'], tier:'intermediate'},
    {q:'¿Qué significa "Mapuche"?',a:'Gente de la tierra',o:['Gente de la tierra','Guerreros de montaña','Hijos del sol','Guardianes del bosque'], tier:'beginner'},
    {q:'¿Cómo se llaman las estatuas de Isla de Pascua?',a:'Moai',o:['Moai','Tótems','Obeliscos','Pilares'], tier:'beginner', explain:'Los moai son gigantescas estatuas de piedra talladas por los antiguos rapa nui en Isla de Pascua.'},
    {q:'¿Cuánto resistieron los Mapuche?',a:'Más de 300 años',o:['Más de 300 años','50 años','10 años','1.000 años'], tier:'advanced'},
    {q:'¿Quiénes pastorean llamas en los Andes?',a:'Los Aymara',o:['Los Aymara','Los Mapuche','Los Rapa Nui','Los Inca'], tier:'intermediate'},
    {q:'¿A qué distancia está Isla de Pascua?',a:'3.700 km',o:['3.700 km','100 km','500 km','10.000 km'], tier:'expert'},
    {q:'¿Qué famoso baile chilote es originario del sur?',a:'La Trastrasera',o:['La Trastrasera','La Cueca','El Sau Sau','El Tango'], tier:'advanced'},
    {q:'¿Quiénes construyeron los Moai?',a:'Los Rapa Nui',o:['Los Rapa Nui','Los Mapuches','Los Incas','Los Diaguitas'], tier:'beginner'},
    {q:'¿Cómo llaman los Rapa Nui a la Isla de Pascua en su propia lengua?',a:'Rapa Nui',o:['Rapa Nui','Te Pito','Hanga Roa','Motu Nui'], tier:'advanced'},
    {q:'¿Cómo se llaman los sombreros de piedra roja que coronan algunos Moai?',a:'Pukao',o:['Pukao','Ahu','Tapa','Rongo'], tier:'expert', explain:'Los pukao son tocados de escoria roja que se colocaban sobre la cabeza de algunos Moai.'},
    {q:'¿Qué pueblo del Norte Grande cultivaba en oasis y terrazas del salar de Atacama?',a:'Los Atacameños (Likan Antai)',o:['Los Atacameños (Likan Antai)','Los Selknam','Los Chonos','Los Yaganes'], tier:'expert', explain:'Los atacameños o Likan Antai cultivaban en terrazas y oasis cerca del salar de Atacama.'},
    {q:'¿Qué pueblo canoero habitó los canales del extremo sur cerca del Cabo de Hornos?',a:'Los Yaganes',o:['Los Yaganes','Los Diaguitas','Los Aymaras','Los Picunches'], tier:'advanced', explain:'Los yaganes fueron un pueblo canoero que vivió en los canales más australes, cerca del Cabo de Hornos.'}
  ],
  history:[
    {q:'¿Quién fundó Santiago?',a:'Pedro de Valdivia',o:['Pedro de Valdivia','O\'Higgins','Colón','Bolívar'], tier:'intermediate'},
    {q:'¿En qué año se fundó la ciudad de Santiago?',a:'1541',o:['1541','1810','1492','1900'], tier:'intermediate'},
    {q:'¿Quién fue el primer presidente de Chile?',a:'Manuel Blanco Encalada',o:['Manuel Blanco Encalada','Bernardo O\'Higgins','Arturo Prat','José Miguel Carrera'], tier:'advanced'},
    {q:'¿Qué combate naval ocurrió el 21 de mayo?',a:'Combate Naval de Iquique',o:['Combate Naval de Iquique','Batalla de Maipú','Desastre de Rancagua','Batalla de Chacabuco'], tier:'beginner'},
    {q:'¿Cuándo es Fiestas Patrias?',a:'18 de septiembre',o:['18 de septiembre','4 de julio','25 de diciembre','12 de febrero'], tier:'beginner'},
    {q:'¿Quién es el Padre de la Patria?',a:'Bernardo O\'Higgins',o:['Bernardo O\'Higgins','Pedro de Valdivia','Arturo Prat','Manuel Baquedano'], tier:'intermediate'},
    {q:'¿En qué año fue la independencia total?',a:'1818',o:['1818','1776','1910','1541'], tier:'expert', explain:'Chile declaró su independencia el 12 de febrero de 1818, tras años de lucha contra España.'},
    {q:'¿De qué país era el padre de O\'Higgins?',a:'Irlanda',o:['Irlanda','España','Inglaterra','Francia'], tier:'advanced', explain:'Ambrosio O\'Higgins, padre de Bernardo, nació en Irlanda y llegó a ser virrey del Perú.'},
    {q:'¿Qué pueblo originario resistió la conquista española?',a:'Mapuche',o:['Mapuche','Inca','Azteca','Maya'], tier:'beginner'},
    {q:'¿Junto a qué río se fundó Santiago?',a:'Mapocho',o:['Mapocho','Bío Bío','Loa','Maipo'], tier:'beginner'},
    {q:'¿Qué cerro está en el centro de Santiago donde se fundó la ciudad?',a:'Santa Lucía',o:['Santa Lucía','San Cristóbal','Aconcagua','Manquehue'], tier:'advanced'},
    {q:'¿En qué año se fundó Santiago?',a:'1541',o:['1541','1810','1492','1600'], tier:'intermediate'},
    {q:'¿En qué fecha ocurrió la Primera Junta de Gobierno?',a:'18 de septiembre de 1810',o:['18 de septiembre de 1810','12 de febrero de 1818','21 de mayo de 1879','1 de enero de 1800'], tier:'advanced', explain:'La Primera Junta de Gobierno del 18 de septiembre de 1810 marca el inicio del proceso de independencia.'},
    {q:'¿Qué país gobernó Chile antes de su independencia?',a:'España',o:['España','Inglaterra','Francia','Portugal'], tier:'beginner'},
    {q:'¿Qué cordillera tuvo que cruzar el Ejército de los Andes?',a:'Cordillera de los Andes',o:['Cordillera de los Andes','Cordillera de la Costa','Los Alpes','Los Pirineos'], tier:'intermediate'},
    {q:'¿Qué héroe naval comandó la Esmeralda?',a:'Arturo Prat',o:['Arturo Prat','Manuel Baquedano','Bernardo O\'Higgins','José Miguel Carrera'], tier:'intermediate'},
    {q:'¿En qué ciudad ocurrió el Combate Naval el 21 de mayo?',a:'Iquique',o:['Iquique','Valparaíso','Antofagasta','Arica'], tier:'advanced'},
    {q:'¿Qué batalla selló la independencia de Chile en 1818?',a:'Batalla de Maipú',o:['Batalla de Maipú','Batalla de Chacabuco','Combate Naval de Iquique','Batalla de Rancagua'], tier:'expert', explain:'La Batalla de Maipú, el 5 de abril de 1818, aseguró definitivamente la independencia de Chile.'},
    {q:'¿Quién fue el primer Director Supremo de Chile?',a:'Bernardo O\'Higgins',o:['Bernardo O\'Higgins','José Miguel Carrera','Manuel Bulnes','Pedro de Valdivia'], tier:'intermediate'},
    {q:'¿En qué siglo se fundó la ciudad de Santiago?',a:'Siglo XVI (16)',o:['Siglo XVI (16)','Siglo XVIII (18)','Siglo XIX (19)','Siglo XV (15)'], tier:'advanced'},
    {q:'¿Quién dirigió la primera expedición española a Chile en 1536?',a:'Diego de Almagro',o:['Diego de Almagro','Pedro de Valdivia','Francisco Pizarro','Hernán Cortés'], tier:'advanced', explain:'Diego de Almagro encabezó en 1536 la primera expedición española que llegó a territorio chileno.'},
    {q:'¿Cómo se llamó la guerra entre Chile, Perú y Bolivia de 1879 a 1883?',a:'Guerra del Pacífico',o:['Guerra del Pacífico','Guerra de la Independencia','Guerra Civil','Guerra contra la Confederación'], tier:'advanced', explain:'La Guerra del Pacífico (1879-1883) enfrentó a Chile con Perú y Bolivia por los territorios del salitre.'},
    {q:'¿Qué recurso del desierto fue la causa económica de la Guerra del Pacífico?',a:'El salitre',o:['El salitre','El cobre','El petróleo','El oro'], tier:'expert', explain:'El salitre del desierto, usado como fertilizante y en explosivos, fue el motor económico de la Guerra del Pacífico.'},
    {q:'¿Qué territorios anexó Chile tras la Guerra del Pacífico?',a:'Tarapacá y Antofagasta',o:['Tarapacá y Antofagasta','Aysén y Magallanes','Chiloé y Valdivia','Mendoza y San Juan'], tier:'expert'},
    {q:'Durante la "era del salitre", ¿en qué se transformaron muchas oficinas salitreras al cerrar?',a:'Pueblos fantasma',o:['Pueblos fantasma','Grandes ciudades','Puertos pesqueros','Centros de esquí'], tier:'expert'},
    {q:'¿Qué guerrero mapuche lideró la resistencia y derrotó a Pedro de Valdivia en Tucapel (1553)?',a:'Lautaro',o:['Lautaro','Caupolicán','Galvarino','Colo Colo'], tier:'expert', explain:'Lautaro, joven toqui mapuche, derrotó y dio muerte a Pedro de Valdivia en la batalla de Tucapel en 1553.'},
    {q:'¿Quién fue el jefe del Ejército de los Andes junto a O\'Higgins?',a:'José de San Martín',o:['José de San Martín','Simón Bolívar','Manuel Rodríguez','Diego Portales'], tier:'advanced', explain:'El general argentino José de San Martín cruzó los Andes junto a O\'Higgins para liberar Chile.'}
  ],
  culture:[
    {q:'¿Qué instrumento folclórico se parece a un charango o guitarrita?',a:'Guitarrón chileno',o:['Guitarrón chileno','Violín','Arpa','Flauta'], tier:'advanced'},
    {q:'¿Qué comida chilena se hace con choclo molido?',a:'Pastel de choclo',o:['Pastel de choclo','Empanada de pino','Cazuela','Completos'], tier:'beginner'},
    {q:'¿Cuál es el baile nacional de Chile?',a:'La Cueca',o:['La Cueca','El Tango','La Salsa','El Candombe'], tier:'beginner'},
    {q:'¿Qué instrumento de cuerdas se usa frecuentemente en la música folclórica chilena?',a:'La guitarra',o:['La guitarra','El violín','El piano','La trompeta'], tier:'intermediate'},
    {q:'¿Qué lleva la empanada de pino?',a:'Carne, cebolla, huevo, aceitunas',o:['Carne, cebolla, huevo, aceitunas','Pollo con queso','Porotos con arroz','Pescado con limón'], tier:'beginner'},
    {q:'¿Qué animales representa la cueca?',a:'Gallo y gallina',o:['Gallo y gallina','Águila y cóndor','Gato y ratón','Caballo y yegua'], tier:'intermediate'},
    {q:'¿Qué es la "once"?',a:'Té de la tarde con comida',o:['Té de la tarde con comida','Un baile','Una jugada de fútbol','Un postre'], tier:'beginner'},
    {q:'¿Qué es un "completo"?',a:'Hot dog con palta',o:['Hot dog con palta','Desayuno completo','Torta','Torneo de fútbol'], tier:'beginner'},
    {q:'¿Cuándo se comen más empanadas?',a:'Fiestas Patrias',o:['Fiestas Patrias','Navidad','Semana Santa','Año Nuevo'], tier:'beginner'},
    {q:'¿Qué famoso sándwich lleva carne, porotos verdes, tomate y ají verde?',a:'Chacarero',o:['Chacarero','Barros Luco','Italiano','Chemilico'], tier:'intermediate'},
    {q:'¿En qué mes se celebran las Fiestas Patrias en Chile?',a:'Septiembre',o:['Septiembre','Diciembre','Julio','Octubre'], tier:'beginner'},
    {q:'¿En qué ciudad del extremo sur se celebra el Carnaval de Invierno?',a:'Punta Arenas',o:['Punta Arenas','Valparaíso','La Serena','Iquique'], tier:'advanced'},
    {q:'¿Qué embarcación tradicional usaban los Chonos en los canales del sur?',a:'Dalca',o:['Dalca','Caravela','Goleta','Balsa de totora'], tier:'advanced'},
    {q:'¿Qué metal es hoy la principal exportación de Chile, líder mundial en su producción?',a:'El cobre',o:['El cobre','El hierro','La plata','El estaño'], tier:'advanced', explain:'Chile es el mayor productor de cobre del mundo, su principal exportación.'},
    {q:'¿Cuál es la mina de cobre a tajo abierto más grande del mundo, ubicada en Chile?',a:'Chuquicamata',o:['Chuquicamata','El Teniente','La Escondida','Andina'], tier:'expert', explain:'Chuquicamata, en el norte de Chile, es una de las minas de cobre a tajo abierto más grandes del mundo.'}
  ],
  nature:[
    {q:'¿Cuál es la flor nacional de Chile?',a:'Copihue',o:['Copihue','Rosa','Margarita','Girasol'], tier:'beginner', explain:'El copihue es la flor nacional de Chile y crece en los bosques húmedos del sur.'},
    {q:'¿Qué árbol nativo chileno puede vivir miles de años?',a:'Alerce',o:['Alerce','Pino','Eucalipto','Roble'], tier:'advanced'},
    {q:'¿Qué animal nativo es un pequeño ciervo?',a:'Pudú',o:['Pudú','Huemul','Zorro','Guanaco'], tier:'intermediate'},
    {q:'¿Qué animal marino se puede avistar frecuentemente en la Reserva Nacional Pingüino de Humboldt?',a:'Delfín',o:['Delfín','Tiburón blanco','Estrella de mar','Caballito de mar'], tier:'expert'},
    {q:'¿Envergadura del cóndor andino?',a:'Más de 3 metros',o:['Más de 3 metros','1 metro','50 cm','10 metros'], tier:'advanced'},
    {q:'¿Edad de la especie araucaria?',a:'200+ millones de años',o:['200+ millones de años','1.000 años','50 años','1 millón de años'], tier:'expert', explain:'La araucaria es un árbol muy antiguo: su linaje existe desde hace más de 200 millones de años, época de los dinosaurios.'},
    {q:'¿Qué animales están en el escudo?',a:'Cóndor y huemul',o:['Cóndor y huemul','Puma y águila','Llama y cóndor','Pingüino y flamenco'], tier:'beginner'},
    {q:'¿Dónde hay pumas en Chile?',a:'Torres del Paine',o:['Torres del Paine','Atacama','Santiago','Isla de Pascua'], tier:'intermediate'},
    {q:'¿Qué corriente trae agua fría?',a:'Corriente de Humboldt',o:['Corriente de Humboldt','Corriente del Golfo','Anillo del Pacífico','Flujo chileno'], tier:'advanced', explain:'La Corriente de Humboldt trae agua fría desde el sur y llena el mar chileno de peces.'},
    {q:'¿Qué animal del sur es un ciervo pequeño?',a:'Pudú',o:['Pudú','Huemul','Guanaco','Zorro'], tier:'beginner'},
    {q:'¿En qué parte viven los pingüinos en Chile?',a:'En el sur',o:['En el sur','En el desierto','En Santiago','En Isla de Pascua'], tier:'intermediate'},
    {q:'¿Qué pájaro habita en los salares del norte?',a:'Flamenco',o:['Flamenco','Cóndor','Gaviota','Pelícano'], tier:'beginner'},
    {q:'¿Qué ave corredora habita las estepas patagónicas?',a:'Ñandú',o:['Ñandú','Avestruz','Pingüino','Cóndor'], tier:'intermediate'},
    {q:'¿Cuál es el árbol nacional de Chile, sagrado para los Mapuche?',a:'Araucaria',o:['Araucaria','Alerce','Coihue','Roble'], tier:'advanced', explain:'La araucaria o pehuén es el árbol nacional de Chile y sus piñones son alimento sagrado para los pehuenches.'},
    {q:'¿Qué planta del desierto de Atacama florece tras lluvias inusuales en el "desierto florido"?',a:'La añañuca',o:['La añañuca','El copihue','La araucaria','El cardón'], tier:'expert', explain:'Cuando llueve en Atacama, la añañuca y otras flores cubren el suelo en el llamado "desierto florido".'},
    {q:'¿Qué fenómeno marino frente a Chile enfría las aguas y favorece la pesca?',a:'La Corriente de Humboldt',o:['La Corriente de Humboldt','El Niño','La Corriente del Golfo','El Tsunami'], tier:'advanced'}
  ],
  famous:[
    {q:'¿Quién escribió "Altazor"?',a:'Vicente Huidobro',o:['Vicente Huidobro','Pablo Neruda','Gabriela Mistral','Nicanor Parra'], tier:'expert', explain:'"Altazor" es la gran obra del poeta Vicente Huidobro, creador del movimiento creacionista.'},
    {q:'¿Qué famoso pianista chileno toca a nivel mundial?',a:'Claudio Arrau',o:['Claudio Arrau','Roberto Bravo','Valentín Trujillo','Tomás González'], tier:'advanced', explain:'Claudio Arrau, nacido en Chillán, fue uno de los pianistas más célebres del siglo XX.'},
    {q:'¿Poeta chileno Nobel en 1971?',a:'Pablo Neruda',o:['Pablo Neruda','Gabriela Mistral','Isabel Allende','Huidobro'], tier:'intermediate'},
    {q:'¿Primera Nobel latina de Literatura?',a:'Gabriela Mistral',o:['Gabriela Mistral','Neruda','García Márquez','Vargas Llosa'], tier:'intermediate'},
    {q:'¿Futbolista chileno del Barcelona?',a:'Alexis Sánchez',o:['Alexis Sánchez','Arturo Vidal','Marcelo Ríos','Claudio Bravo'], tier:'beginner'},
    {q:'¿Cuándo ganó Chile la Copa América?',a:'2015',o:['2015','2000','1990','1970'], tier:'intermediate'},
    {q:'¿En qué billete está Gabriela Mistral?',a:'5.000 pesos',o:['5.000 pesos','1.000 pesos','10.000 pesos','20.000 pesos'], tier:'expert', explain:'El rostro de la poetisa Gabriela Mistral aparece en el billete chileno de 5.000 pesos.'},
    {q:'¿Qué deporte practicaba Marcelo Ríos?',a:'Tenis',o:['Tenis','Fútbol','Gimnasia','Natación'], tier:'beginner'},
    {q:'¿En qué año fue Marcelo Ríos número 1 del mundo?',a:'1998',o:['1998','2000','1995','2005'], tier:'advanced'},
    {q:'¿Qué explorador cruzó por primera vez el estrecho que lleva su nombre en 1520?',a:'Hernando de Magallanes',o:['Hernando de Magallanes','Cristóbal Colón','Pedro de Valdivia','Diego de Almagro'], tier:'expert', explain:'Hernando de Magallanes cruzó en 1520 el estrecho del sur de Chile que hoy lleva su nombre.'},
    {q:'¿Quién compuso la canción "Gracias a la vida"?',a:'Violeta Parra',o:['Violeta Parra','Víctor Jara','Los Jaivas','Margot Loyola'], tier:'intermediate'},
    {q:'¿Cuál es una de las obras más famosas de Pablo Neruda?',a:'Veinte poemas de amor y una canción desesperada',o:['Veinte poemas de amor y una canción desesperada','Cien años de soledad','La casa de los espíritus','Martín Rivas'], tier:'advanced'},
    {q:'¿En qué año recibió Gabriela Mistral el Premio Nobel de Literatura?',a:'1945',o:['1945','1971','1920','1955'], tier:'expert', explain:'En 1945 Gabriela Mistral se convirtió en la primera persona latinoamericana en ganar el Nobel de Literatura.'},
    {q:'¿Cuál era el verdadero nombre de Gabriela Mistral?',a:'Lucila Godoy Alcayaga',o:['Lucila Godoy Alcayaga','Neftalí Reyes Basoalto','Isabel Allende','Marcela Paz'], tier:'expert'},
    {q:'¿Cuál era el verdadero nombre del poeta Pablo Neruda?',a:'Neftalí Reyes Basoalto',o:['Neftalí Reyes Basoalto','Lucila Godoy','Vicente García','Ricardo Eliécer'], tier:'expert', explain:'Pablo Neruda era el seudónimo de Neftalí Reyes Basoalto, Premio Nobel de Literatura en 1971.'}
  ],
  inventors:[
    {q:'¿Qué científico chileno ayudó a crear la vacuna de la hepatitis B?',a:'Pablo Valenzuela',o:['Pablo Valenzuela','Humberto Maturana','Francisco Varela','Ignacio Domeyko'], tier:'expert'},
    {q:'¿Qué es un atrapanieblas?',a:'Una malla para atrapar agua',o:['Una malla para atrapar agua','Un telescopio especial','Un tipo de tienda de campaña','Un barco de pesca'], tier:'advanced'},
    {q:'¿Qué fenómeno del norte aprovechan los atrapanieblas?',a:'La camanchaca',o:['La camanchaca','El viento puelche','La lluvia intensa','El sol del desierto'], tier:'advanced', explain:'Los atrapanieblas capturan la camanchaca, la densa niebla costera del norte, para obtener agua.'},
    {q:'¿Cómo se llama el gran observatorio ubicado en el norte?',a:'ALMA',o:['ALMA','Hubble','James Webb','Paranal'], tier:'intermediate'},
    {q:'¿Qué virus ayudó a descubrir Pablo Valenzuela?',a:'Hepatitis C',o:['Hepatitis C','Gripe','Sarampión','Varicela'], tier:'advanced'},
    {q:'¿Cuál será el telescopio más grande del mundo en construcción en Chile?',a:'ELT',o:['ELT','VLT','ALMA','Hubble'], tier:'expert', explain:'El Extremely Large Telescope (ELT), que se construye en el norte de Chile, será el telescopio óptico más grande del mundo.'},
    {q:'¿En qué año se inauguró el observatorio ALMA?',a:'2013',o:['2013','1990','2005','2020'], tier:'intermediate'},
    {q:'¿En qué localidad están los atrapanieblas pioneros en Chile?',a:'Chungungo',o:['Chungungo','Santiago','Punta Arenas','Valparaíso'], tier:'expert'},
    {q:'¿En qué año nació el biólogo y filósofo Francisco Varela?',a:'1946',o:['1946','1920','1980','1965'], tier:'advanced'},
    {q:'¿Qué tipo de telescopio es ALMA, en el llano de Chajnantor?',a:'Radiotelescopio',o:['Radiotelescopio','Telescopio óptico','Telescopio de rayos X','Telescopio infrarrojo casero'], tier:'expert', explain:'ALMA es un gran radiotelescopio formado por decenas de antenas en el altiplano de Chajnantor.'},
    {q:'¿Por qué el desierto de Atacama es ideal para los observatorios astronómicos?',a:'Cielos despejados y secos',o:['Cielos despejados y secos','Mucha lluvia','Bosques densos','Alta humedad'], tier:'advanced', explain:'Los cielos despejados, secos y sin contaminación lumínica de Atacama lo hacen perfecto para observar las estrellas.'},
    {q:'¿En qué cerro del norte se construye el Telescopio Extremadamente Grande (ELT)?',a:'Cerro Armazones',o:['Cerro Armazones','Cerro Paranal','Cerro Tololo','Cerro La Silla'], tier:'expert', explain:'El ELT se construye en la cima del Cerro Armazones, en pleno desierto de Atacama.'},
    {q:'¿Cómo se llama el observatorio de cuatro grandes telescopios en el cerro Paranal?',a:'VLT',o:['VLT','ALMA','ELT','Hubble'], tier:'advanced', explain:'El Very Large Telescope (VLT), en el cerro Paranal, reúne cuatro telescopios ópticos grandes.'},
    {q:'¿Qué científico del siglo XIX estudió la geología y la minería de Chile?',a:'Ignacio Domeyko',o:['Ignacio Domeyko','Pablo Valenzuela','Claudio Arrau','Pedro de Valdivia'], tier:'expert', explain:'Ignacio Domeyko, llegado a Chile en el siglo XIX, estudió los minerales del país y enseñó geología y minería.'}
  ],
  volcanes:[
    {q:'¿En qué "cinturón" de la Tierra está ubicado Chile?',a:'Cinturón de Fuego',o:['Cinturón de Fuego','Cinturón de Asteroides','Cinturón de Orión','Cinturón Ecuatorial'], tier:'advanced', explain:'Chile está en el Cinturón de Fuego del Pacífico, por eso tiene tantos volcanes y terremotos.'},
    {q:'¿Aproximadamente cuántos volcanes hay en Chile?',a:'Más de 2.000',o:['Más de 2.000','Unos 100','Alrededor de 50','Menos de 10'], tier:'intermediate'},
    {q:'¿Cuántos volcanes activos tiene Chile aproximadamente?',a:'Unos 90',o:['Unos 90','1.000','5','Ninguno'], tier:'expert', explain:'Chile tiene cerca de 90 volcanes activos, uno de los mayores números del mundo.'},
    {q:'¿Cuál es el volcán más alto del mundo ubicado en Chile?',a:'Nevado Ojos del Salado',o:['Nevado Ojos del Salado','Villarrica','Osorno','Llaima'], tier:'expert', explain:'El Nevado Ojos del Salado, en la frontera con Argentina, es el volcán más alto del mundo con casi 6.900 metros.'},
    {q:'¿Qué volcán es famoso por su forma de cono perfecto en el sur?',a:'Osorno',o:['Osorno','Llaima','Calbuco','Villarrica'], tier:'advanced'},
    {q:'¿En qué cordillera están los volcanes de Chile?',a:'Los Andes',o:['Los Andes','La Costa','Domeyko','Nahuelbuta'], tier:'beginner'},
    {q:'¿En qué región se encuentra el volcán Villarrica?',a:'La Araucanía',o:['La Araucanía','Antofagasta','Magallanes','Coquimbo'], tier:'intermediate'},
    {q:'¿Qué ciudad turística está a los pies del volcán Villarrica?',a:'Pucón',o:['Pucón','Valparaíso','Iquique','Concepción'], tier:'beginner'},
    {q:'¿En la orilla de qué lago se ve el volcán Osorno?',a:'Lago Llanquihue',o:['Lago Llanquihue','Lago General Carrera','Lago Chungará','Lago Budi'], tier:'advanced'},
    {q:'¿Qué volcán de la Región de Los Lagos hizo grandes erupciones en abril de 2015?',a:'Calbuco',o:['Calbuco','Villarrica','Osorno','Lonquimay'], tier:'advanced'},
    {q:'¿Qué volcán de la Araucanía tuvo una erupción a comienzos de marzo de 2015?',a:'Villarrica',o:['Villarrica','Calbuco','Chaitén','Llaima'], tier:'expert', explain:'El volcán Villarrica, uno de los más activos de Chile, tuvo una erupción en marzo de 2015.'},
    {q:'¿Qué columna de material puede subir kilómetros en el aire durante una erupción?',a:'Columna eruptiva de ceniza',o:['Columna eruptiva de ceniza','Columna de agua','Columna de hielo','Columna de arena'], tier:'advanced'}
  ],
  animales:[
    {q:'¿Qué tipo de animales son las vicuñas y guanacos?',a:'Camélidos sudamericanos',o:['Camélidos sudamericanos','Roedores grandes','Aves andinas','Reptiles de altura'], tier:'intermediate'},
    {q:'¿Dónde habita principalmente la vicuña?',a:'A gran altitud en los Andes',o:['A gran altitud en los Andes','En la costa del Pacífico','En los bosques del sur','En la selva lluviosa'], tier:'intermediate'},
    {q:'¿Qué animal tiene una de las lanas más finas y valiosas?',a:'La vicuña',o:['La vicuña','La oveja común','El guanaco','El zorro'], tier:'advanced', explain:'La fibra de la vicuña es una de las más finas y caras del mundo, por eso este animal está protegido.'},
    {q:'¿A qué velocidad puede correr un guanaco?',a:'Casi 60 km/h',o:['Casi 60 km/h','Unos 10 km/h','Más de 100 km/h','30 km/h'], tier:'expert', explain:'El guanaco puede correr a casi 60 km/h para escapar de pumas y otros depredadores.'},
    {q:'¿Qué animal es el pudú?',a:'Un pequeño ciervo',o:['Un pequeño ciervo','Un roedor','Un ave','Un tipo de zorro'], tier:'beginner'},
    {q:'¿Dónde vive principalmente el pudú?',a:'En el sur de Chile',o:['En el sur de Chile','En el desierto','En la Isla de Pascua','En Santiago'], tier:'intermediate'},
    {q:'¿Qué animal marino se puede ver en las costas chilenas?',a:'El lobo marino',o:['El lobo marino','El oso polar','La morsa','El manatí'], tier:'beginner'},
    {q:'¿Qué animal es el huemul?',a:'Un ciervo nativo',o:['Un ciervo nativo','Un felino','Una rapaz','Un roedor'], tier:'beginner'},
    {q:'¿Cuál es el felino más grande que habita en Chile?',a:'El puma',o:['El puma','El gato colocolo','El jaguar','El güiña'], tier:'intermediate'},
    {q:'¿Qué ave del escudo nacional puede vivir más de 70 años?',a:'El cóndor',o:['El cóndor','El águila','El flamenco','El pingüino'], tier:'beginner', explain:'El cóndor andino, que aparece en el escudo, puede vivir más de 70 años.'},
    {q:'¿Cómo se llama la nutria que vive en la costa de Chile?',a:'El chungungo',o:['El chungungo','La vicuña','El huemul','El pudú'], tier:'intermediate', explain:'El chungungo es la nutria marina de la costa chilena.'},
    {q:'¿Cuál es el felino silvestre más pequeño de América y vive en los bosques del sur de Chile?',a:'La güiña',o:['La güiña','El puma','El jaguar','El zorro culpeo'], tier:'advanced', explain:'La güiña es el felino silvestre más pequeño de América y habita los bosques del centro y sur de Chile.'},
    {q:'¿Cuántas especies de flamenco viven en Chile?',a:'Tres',o:['Tres','Una','Cinco','Diez'], tier:'expert', explain:'En Chile viven tres especies: el flamenco chileno, el flamenco andino y el flamenco de James.'}
  ],
  volcanes_chile:[
    {q:'¿En qué región del Pacífico se encuentra Chile?',a:'Cinturón de Fuego',o:['Cinturón de Fuego','Anillo de Agua','Zona de Tormentas','Cordillera Central'], tier:'intermediate'},
    {q:'¿Aproximadamente cuántos volcanes hay en Chile?',a:'Más de 2.000',o:['Más de 2.000','Menos de 100','Alrededor de 500','Solo 10'], tier:'expert'},
    {q:'¿Cuál de estos volcanes tiene un lago de lava?',a:'Villarrica',o:['Villarrica','Osorno','Llaima','Calbuco'], tier:'advanced'},
    {q:'¿Qué expulsa un volcán cuando hace erupción?',a:'Lava y ceniza',o:['Lava y ceniza','Agua salada','Solo humo','Hielo'], tier:'beginner'},
    {q:'¿Qué instrumento se usa para medir los sismos cerca de un volcán?',a:'Sismógrafo',o:['Sismógrafo','Termómetro','Telescopio','Barómetro'], tier:'advanced'},
    {q:'¿Qué volcán hizo erupción en 2015 en la Región de Los Lagos?',a:'Calbuco',o:['Calbuco','Villarrica','Osorno','Llaima'], tier:'expert'},
    {q:'¿Cuál fue la magnitud del terremoto de Valdivia de 1960, el más fuerte registrado en la historia?',a:'9,5',o:['9,5','7,0','6,2','8,0'], tier:'expert', explain:'El terremoto de Valdivia de 1960, de magnitud 9,5, es el más fuerte jamás registrado por instrumentos.'},
    {q:'¿En qué año ocurrió el terremoto de Valdivia, el mayor jamás medido?',a:'1960',o:['1960','1985','2010','1939'], tier:'advanced'},
    {q:'¿Qué gran ola provocó el terremoto de Valdivia de 1960 que cruzó el Pacífico?',a:'Un tsunami',o:['Un tsunami','Una marejada leve','Una nevada','Una sequía'], tier:'expert', explain:'El terremoto de Valdivia generó un enorme tsunami que cruzó el Pacífico y llegó hasta Japón y Hawái.'},
    {q:'¿Qué volcán del norte se alza junto al lago Chungará?',a:'El Parinacota',o:['El Parinacota','El Osorno','El Villarrica','El Calbuco'], tier:'advanced', explain:'El volcán Parinacota está en el altiplano, junto al lago Chungará, en el Parque Nacional Lauca.'},
    {q:'¿Qué servicio del Estado vigila los volcanes de Chile?',a:'SERNAGEOMIN',o:['SERNAGEOMIN','SERVEL','ALMA','SAG'], tier:'expert', explain:'El Servicio Nacional de Geología y Minería, SERNAGEOMIN, vigila la actividad de los volcanes.'},
    {q:'¿Qué volcán del sur hizo erupción en 2008 y cubrió de ceniza el pueblo del mismo nombre?',a:'El Chaitén',o:['El Chaitén','El Osorno','El Parinacota','El Licancabur'], tier:'expert', explain:'En mayo de 2008 el volcán Chaitén, en la Región de Los Lagos, hizo erupción después de siglos de calma.'}
  ],
  folk:[
    {q:'¿Quién compuso "Gracias a la vida"?',a:'Violeta Parra',o:['Violeta Parra','Mercedes Sosa','Patricio Manns','Víctor Jara'], tier:'beginner'},
    {q:'¿Cuál es el baile nacional de Chile?',a:'La Cueca',o:['La Cueca','El Tango','La Cumbia','El Vals'], tier:'beginner'},
    {q:'¿En qué año fue declarada la cueca baile nacional?',a:'1979',o:['1979','1810','1950','2000'], tier:'expert', explain:'La cueca fue declarada oficialmente baile nacional de Chile en 1979.'},
    {q:'¿Qué pañuelo agitan los bailarines de cueca?',a:'Un pañuelo blanco',o:['Un pañuelo blanco','Una bandera','Un sombrero','Una flor'], tier:'beginner'},
    {q:'¿Quién escribió "Si vas para Chile"?',a:'Chito Faró',o:['Chito Faró','Víctor Jara','Patricio Manns','Los Huasos Quincheros'], tier:'intermediate'},
    {q:'¿Quién escribió "Arriba en la cordillera"?',a:'Patricio Manns',o:['Patricio Manns','Violeta Parra','Víctor Jara','Chito Faró'], tier:'intermediate'},
    {q:'¿Qué tipo de canto rural se acompaña con guitarra?',a:'La tonada',o:['La tonada','La cueca','La sirilla','El corrido'], tier:'intermediate'},
    {q:'¿Cuál de estos NO es una variante de la cueca?',a:'Cueca tropical',o:['Cueca tropical','Cueca brava','Cueca chilota','Cueca nortina'], tier:'advanced'},
    {q:'¿Qué instrumento andino de cuerda tenía caparazón de armadillo antiguamente?',a:'El charango',o:['El charango','La guitarra','El bombo','La quena'], tier:'advanced', explain:'El charango es un pequeño instrumento andino de cuerdas que antiguamente se hacía con caparazón de quirquincho.'},
    {q:'¿Qué grupo folclórico mantuvo vivo el repertorio de tonadas por más de 80 años?',a:'Los Huasos Quincheros',o:['Los Huasos Quincheros','Inti-Illimani','Quilapayún','Los Jaivas'], tier:'advanced'},
    {q:'¿Qué grupo chileno fusionó el folclore andino con el rock progresivo?',a:'Los Jaivas',o:['Los Jaivas','Los Huasos Quincheros','Los Cuatro Cuartos','Los de Ramón'], tier:'expert', explain:'Los Jaivas mezclaron instrumentos andinos con rock progresivo, creando un sonido único de Chile.'},
    {q:'¿Qué instrumento de viento andino se fabrica con cañas de distinto largo?',a:'La zampoña',o:['La zampoña','El charango','El bombo','El guitarrón'], tier:'advanced'}
  ],
  fiestas_patrias:[
    {q:'¿Qué fecha principal se celebra en las Fiestas Patrias?',a:'El 18 de septiembre',o:['El 18 de septiembre','El 21 de mayo','El 1 de enero','El 25 de diciembre'], tier:'beginner'},
    {q:'¿Qué baile tradicional se baila en las fondas?',a:'La Cueca',o:['La Cueca','La Cumbia','El Tango','El Reggaetón'], tier:'beginner'},
    {q:'¿En qué año se declaró a la Cueca como baile nacional?',a:'1979',o:['1979','1810','1990','2000'], tier:'expert', explain:'La cueca fue declarada baile nacional de Chile en 1979 por decreto oficial.'},
    {q:'¿Qué animal representa el cortejo de la Cueca?',a:'Gallo y gallina',o:['Gallo y gallina','Cóndor y águila','Puma y huemul','Caballo y yegua'], tier:'intermediate'},
    {q:'¿Qué juego típico se juega elevándolo con hilo al viento?',a:'El volantín',o:['El volantín','El trompo','El emboque','Las bolitas'], tier:'beginner'},
    {q:'¿Qué comida es tradicional en Fiestas Patrias?',a:'La empanada de pino',o:['La empanada de pino','El sushi','La pizza','Los tacos'], tier:'beginner'},
    {q:'¿Qué día sigue al 18 en el fin de semana de Fiestas Patrias?',a:'El 19 de septiembre',o:['El 19 de septiembre','El 12 de febrero','El 21 de mayo','El 1 de mayo'], tier:'beginner'},
    {q:'¿Qué es una fonda?',a:'Un lugar de fiesta con comida y baile',o:['Un lugar de fiesta con comida y baile','Un tipo de barco','Una montaña','Un volcán'], tier:'beginner', explain:'En Fiestas Patrias las fondas son ramadas donde se come, se baila cueca y se juega.'},
    {q:'¿Qué bebida lleva trigo cocido y duraznos secos?',a:'El mote con huesillo',o:['El mote con huesillo','El pisco sour','La chicha','El ulpo'], tier:'intermediate', explain:'El mote con huesillo es una bebida fría de mote de trigo y huesillos, los duraznos secos.'},
    {q:'¿Qué juguete de madera se hace girar en el suelo con un cordel?',a:'El trompo',o:['El trompo','El volantín','La rayuela','El emboque'], tier:'beginner'}
  ]
};

function renderQuizMenu(){
  const prog=getUserProgress();
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  const t=dcTier();
  let h='<div class="qz-head"><h2>Elige un tema</h2><p>'+({beginner:'4 preguntas fáciles',intermediate:'6 preguntas',advanced:'Todas las preguntas hasta nivel avanzado',expert:'Todas las preguntas, nivel experto'})[t]+'</p></div><div class="qz-grid">';
  TOPICS.forEach(tp=>{
    if(!QB[tp.id])return;
    const st=prog[tp.id]&&prog[tp.id].bestStars||0;
    h+='<button type="button" class="qz-topic" onclick="startQuiz(\''+tp.id+'\')"><span class="qz-thumb">'+DCArt.banner(tp.id)+'</span><span class="qz-name">'+dcEsc(tp.name)+'</span><span class="qz-st" aria-label="'+st+' de 3 estrellas">'+[0,1,2].map(i=>DCArt.star(i<st)).join('')+'</span></button>';
  });
  h+='</div>';
  qa.innerHTML=h;
}

function startQuiz(id) {
  qTopic = id;
  const tier = dcTier();

  if (!QB[id] || !Array.isArray(QB[id]) || !QB[id].length) {
    console.warn('[Descubre Chile] No quiz bank for id:', id);
    renderQuizMenu();
    return;
  }
  let qs = QB[id].slice();

  // Filter: include questions at or below the kid's tier
  const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
  const maxTierIdx = tierOrder.indexOf(tier);
  qs = qs.filter(q => {
    const qTierIdx = tierOrder.indexOf(q.tier || 'intermediate');
    return qTierIdx <= maxTierIdx;
  });

  // Cap question count by age
  if (tier === 'beginner') qs = dcShuffle(qs).slice(0, 4);
  else if (tier === 'intermediate') qs = dcShuffle(qs).slice(0, 6);
  else qs = dcShuffle(qs); // advanced/expert get all filtered questions, shuffled

  qQs = qs;
  qIdx = 0;
  qScore = 0;
  qMissed = [];
  showQ();
}

let qMissed=[],qOpts=[];
function showQ(){
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  if(qIdx>=qQs.length){finishQ();return}
  const q=qQs[qIdx];
  const tp=TOPICS.find(t=>t.id===qTopic);
  qOpts=dcShuffle(q.o);
  let h='<div class="quiz-top"><div class="quiz-badge">Pregunta '+(qIdx+1)+'/'+qQs.length+'</div><div class="quiz-score">'+DCArt.star(true)+' '+qScore+'</div></div>';
  h+='<div class="quiz-progress-wrap"><div class="quiz-progress-fill" style="width:'+(qIdx/qQs.length*100)+'%"></div></div>';
  h+='<div class="quiz-card" id="qC"><div class="quiz-art">'+DCArt.banner(qTopic)+'<span>'+dcEsc(tp?tp.name:'')+'</span></div><div class="quiz-q-text">'+dcEsc(q.q)+'</div></div><div class="quiz-opts">';
  qOpts.forEach((o,i)=>{h+='<button type="button" class="quiz-opt-btn" data-i="'+i+'" onclick="ans(this)"><span class="qo-l">'+'ABCD'[i]+'</span><span class="qo-t">'+dcEsc(o)+'</span></button>'});
  h+='</div><div id="qNext"></div>';
  qa.innerHTML=h;
}

function ans(btn){
  const q=qQs[qIdx];if(!q)return;
  const sel=btn.dataset.i!=null?qOpts[+btn.dataset.i]:btn.textContent;
  const ok=sel===q.a;
  document.querySelectorAll('.quiz-opt-btn').forEach(b=>{
    b.classList.add('disabled');b.disabled=true;
    if(qOpts[+b.dataset.i]===q.a)b.classList.add('reveal');
  });
  const qc=document.getElementById('qC');
  if(ok){qScore++;btn.classList.add('sel-correct');if(qc)qc.classList.add('correct');showFeedback('🎉');dcSfx('correct')}
  else{btn.classList.add('sel-wrong');if(qc)qc.classList.add('wrong');showFeedback('🤔');dcSfx('wrong');qMissed.push(q)}
  if(qc&&q.explain&&!qc.querySelector('.dc-explain')){const ex=document.createElement('div');ex.className='dc-explain';ex.textContent=q.explain;qc.appendChild(ex)}
  const t=dcTier();
  // older readers get time to read the explanation; they move on themselves
  if(q.explain&&(t==='advanced'||t==='expert')){
    const n=document.getElementById('qNext');
    if(n){n.innerHTML='<button type="button" class="btn-red qz-next">Siguiente ›</button>';const b=n.querySelector('button');b.onclick=()=>{qIdx++;showQ()};b.focus()}
  } else setTimeout(()=>{qIdx++;showQ()},q.explain?2200:1200);
}

function finishQ(){
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  const pct=Math.round(qScore/qQs.length*100);
  const stars=pct>=90?3:pct>=60?2:1;
  if(pct>=60)dcSfx('cheer');
  saveTopicProgress(qTopic,stars,pct);updateProgress();

  const showResults = () => {
    let t,s;
    if(pct>=90){t='¡Excelente!';s=qScore+' de '+qQs.length+' — ¡eres experto/a!'}
    else if(pct>=60){t='¡Muy bien!';s=qScore+' de '+qQs.length+' — ¡gran conocimiento!'}
    else{t='¡Sigue intentando!';s=qScore+' de '+qQs.length+' — lee las historias y vuelve.'}
    let rev='';
    if(qMissed.length&&dcTier()!=='beginner'){
      rev='<div class="qz-review"><h3>Para repasar</h3>'+qMissed.map(q=>'<div class="qz-rv"><span>'+dcEsc(q.q)+'</span><b>'+dcEsc(q.a)+'</b></div>').join('')+'</div>';
    }
    qa.innerHTML='<div class="results-box">'+DCArt.medal(stars)+'<div class="r-title">'+t+'</div><div class="r-sub">'+s+'</div><div class="dc-stars r-stars">'+[0,1,2].map(i=>DCArt.star(i<stars)).join('')+'</div>'+rev+'<div class="r-btns"><button type="button" class="btn-red" onclick="startQuiz(\''+qTopic+'\')">Reintentar</button><button type="button" class="btn-ghost" onclick="renderQuizMenu()">Otros temas</button></div></div>';
  };

  if (typeof LearningCheck !== 'undefined') {
    LearningCheck.maybePrompt('history', showResults);
  } else {
    showResults();
  }
}


// ── UBICA: drag names onto the real map ──
let dragTimer=null, dragTime=60, dragScore=0, dragMiss=0, dragMode=null, dragMV=null, dragSel=null, dragTotal=5;
const dragRegions = [
  {id:'norte', name:'Norte', color:'#E87040'},
  {id:'centro', name:'Centro', color:'#D93636'},
  {id:'sur', name:'Sur', color:'#2CB5A0'},
  {id:'patagonia', name:'Patagonia', color:'#0039A6'},
  {id:'pascua', name:'Rapa Nui', color:'#E8A838'}
];
let activeDragEl=null, offsetX=0, offsetY=0;

function dragMount(){
  if(dragMV)return;
  const host=document.getElementById('dcDragMap');if(!host)return;
  dragMV=DCMapView(host,{id:'dm',labels:false,title:'Mapa de Chile para ubicar zonas y regiones',onTap:(id,kind)=>{if(dragSel)dragTryDrop(dragSel,kind==='island'?{island:id}:{region:id})}});
  host.classList.add('nolabels','nocaps');
  dragMV.init('fit');
  if(!dragMode)dragSetMode(['advanced','expert'].includes(dcTier())?'regiones':'zonas',true);
}
function dragSetMode(m,quiet){
  dragMode=m;
  document.querySelectorAll('#dragModes [data-dmode]').forEach(b=>{const on=b.dataset.dmode===m;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
  dragReset();
  const total=m==='zonas'?5:16;
  document.getElementById('dragTotal').textContent=total;
  document.getElementById('dragHint').textContent=m==='zonas'?'Arrastra cada zona a su lugar (o tócala y luego toca el mapa).':'Arrastra las 16 regiones a su lugar. Usa + para acercar el centro.';
  if(dragMV){if(m==='regiones')dragMV.setZoom(Math.min(1,dragMV.fitZ()*2.4));else dragMV.setZoom(dragMV.fitZ())}
}
function dragReset(){
  clearInterval(dragTimer);
  const c=document.getElementById('dragTokens');if(c)c.innerHTML='';
  if(dragMV){dragMV.svg.querySelectorAll('.dc-reg').forEach(z=>{z.classList.remove('filled','active-target','bad');z.style.fill=''});dragMV.svg.querySelectorAll('.dg-lbl').forEach(n=>n.remove());const i=dragMV.svg.querySelector('[data-island="RN"]');if(i)i.classList.remove('filled')}
  const b=document.getElementById('dragStartBtn');if(b){b.style.display='inline-block';b.textContent='▶️ Comenzar Reto'}
  document.getElementById('dragScore').textContent='0';
  document.getElementById('dragTime').textContent=dragMode==='regiones'?dragLimit():60;
}
function dragLimit(){const t=dcTier();return dragMode==='zonas'?(t==='beginner'?90:60):(t==='expert'?180:t==='advanced'?240:300)}
function dragLabel(text,x,y,cls){
  const t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('class','dg-lbl '+(cls||''));t.setAttribute('text-anchor','middle');t.textContent=text;
  dragMV.svg.appendChild(t);
}
function dragTryDrop(t,hit){
  if(!t||t.classList.contains('placed'))return false;
  const id=t.dataset.id;let ok=false,targets=[];
  if(dragMode==='zonas'){
    const zone=hit.island==='RN'?'pascua':hit.island==='JF'?'centro':hit.region?DCArt.geoById(hit.region).zone:null;
    ok=zone===id;
    if(ok){const z=DC_ZONES.find(x=>x.id===id);targets=z.regions}
  }else{ok=hit.region===id;targets=[id]}
  if(ok){
    const col=(DC_ZONES.find(z=>z.id===(dragMode==='zonas'?id:DCArt.geoById(id).zone))||{}).color;
    targets.forEach(rid=>dragMV.regEls(rid).forEach(el=>{el.classList.add('filled');el.style.fill=col}));
    if(id==='pascua'){const i=dragMV.svg.querySelector('[data-island="RN"]');if(i)i.classList.add('filled')}
    if(targets.length){
      let sx=0,sy=0;targets.forEach(rid=>{const g=DCArt.geoById(rid);sx+=g.c[0];sy+=g.c[1]});
      dragLabel(t.textContent,Math.round(sx/targets.length),Math.round(sy/targets.length)+6,dragMode==='zonas'?'dg-zone':'');
    }
    t.classList.add('placed');t.setAttribute('aria-disabled','true');t.classList.remove('sel');dragSel=null;
    dcSfx('correct');
    dragScore++;document.getElementById('dragScore').textContent=dragScore;
    if(dragScore===dragTotal)dragWin();
  }else{
    dragMiss++;dcSfx('wrong');
    if(hit.region)dragMV.regEls(hit.region).forEach(el=>{el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),600)});
    t.classList.add('shake');setTimeout(()=>t.classList.remove('shake'),450);
  }
  return ok;
}
function dragWin(){
  clearInterval(dragTimer);
  showFeedback('🏆');dcSfx('cheer');
  if(dragMode==='zonas'){saveTopicProgress('dragquiz', 3, 100)}
  else{const stars=dragMiss<=2?3:dragMiss<=6?2:1;saveTopicProgress('dragregiones',stars,Math.round(100*16/(16+dragMiss)))}
  updateProgress();
  const b=document.getElementById('dragStartBtn');b.style.display='inline-block';b.textContent='Jugar de nuevo';
  document.getElementById('dragHint').innerHTML='¡Completado! Errores: '+dragMiss+'.';
  if(typeof ActivityLog!=='undefined') ActivityLog.log('Descubre Chile','📍','Completó el Reto de Ubicación');
}
function hitAt(x,y,t){
  t.style.visibility='hidden';const el=document.elementFromPoint(x,y);t.style.visibility='';
  if(!el)return {};
  const isl=el.closest&&el.closest('[data-island]');if(isl)return {island:isl.dataset.island};
  const r=el.closest&&el.closest('#dcDragMap .dc-reg');if(r)return {region:r.dataset.id,el:r};
  return {};
}
function initDragQuiz(){
  dragMount();
  dragReset();
  dragScore=0;dragMiss=0;dragSel=null;dragTime=dragLimit();
  const items=dragMode==='zonas'?dragRegions.map(r=>({id:r.id,name:r.name})):DC_REGIONS.map(r=>({id:r.id,name:r.short||r.name}));
  dragTotal=items.length;
  document.getElementById('dragTime').textContent=dragTime;
  document.getElementById('dragStartBtn').style.display='none';
  const container=document.getElementById('dragTokens');
  container.innerHTML='';
  dcShuffle(items).forEach(r=>{
    const t=document.createElement('button');
    t.type='button';t.className='drag-token';t.textContent=r.name;t.dataset.id=r.id;
    container.appendChild(t);
    let moved=false,sx=0,sy=0;
    t.addEventListener('pointerdown',e=>{
      if(t.classList.contains('placed'))return;
      activeDragEl=t;moved=false;sx=e.clientX;sy=e.clientY;
      const rect=t.getBoundingClientRect();offsetX=e.clientX-rect.left;offsetY=e.clientY-rect.top;
      t.setPointerCapture(e.pointerId);
    });
    t.addEventListener('pointermove',e=>{
      if(activeDragEl!==t)return;
      if(!moved&&Math.hypot(e.clientX-sx,e.clientY-sy)<6)return;
      if(!moved){moved=true;t.style.width=t.offsetWidth+'px';t.classList.add('dragging')}
      t.style.left=(e.clientX-offsetX)+'px';t.style.top=(e.clientY-offsetY)+'px';
      dragMV.svg.querySelectorAll('.active-target').forEach(z=>z.classList.remove('active-target'));
      const h=hitAt(e.clientX,e.clientY,t);if(h.el&&!h.el.classList.contains('filled'))h.el.classList.add('active-target');
      // auto-scroll the map view near its edges
      const vr=dragMV.view.getBoundingClientRect();
      if(e.clientX>vr.left&&e.clientX<vr.right){if(e.clientY<vr.top+40&&e.clientY>vr.top-30)dragMV.view.scrollTop-=14;else if(e.clientY>vr.bottom-40&&e.clientY<vr.bottom+30)dragMV.view.scrollTop+=14}
    });
    const end=e=>{
      if(activeDragEl!==t)return;activeDragEl=null;
      try{t.releasePointerCapture(e.pointerId)}catch(_){}
      dragMV.svg.querySelectorAll('.active-target').forEach(z=>z.classList.remove('active-target'));
      if(!moved){ // tap-to-select
        document.querySelectorAll('.drag-token.sel').forEach(o=>{if(o!==t){o.classList.remove('sel');o.setAttribute('aria-pressed','false')}});
        const on=t.classList.toggle('sel');t.setAttribute('aria-pressed',on);dragSel=on?t:null;return;
      }
      const h=hitAt(e.clientX,e.clientY,t);
      t.classList.remove('dragging');t.style.left='';t.style.top='';t.style.width='';
      if(h.region||h.island)dragTryDrop(t,h);
    };
    t.addEventListener('pointerup',end);
    t.addEventListener('pointercancel',e=>{activeDragEl=null;t.classList.remove('dragging');t.style.left='';t.style.top='';t.style.width=''});
  });
  dragTimer=setInterval(()=>{
    dragTime--;
    document.getElementById('dragTime').textContent=dragTime;
    if(dragTime<=0){
      clearInterval(dragTimer);
      const b=document.getElementById('dragStartBtn');b.style.display='inline-block';b.textContent='Intentar de nuevo';
      container.querySelectorAll('.drag-token').forEach(x=>{if(!x.classList.contains('placed'))x.disabled=true});
      if(dragMode==='regiones'&&dragScore>=8){saveTopicProgress('dragregiones',1,Math.round(100*dragScore/16));updateProgress()}
      document.getElementById('dragHint').textContent='¡Se acabó el tiempo! Ubicaste '+dragScore+' de '+dragTotal+'.';
      dcSfx('wrong');
    }
  },1000);
}
window.initDragQuiz=initDragQuiz;
window.dragSetMode=dragSetMode;

// ── INIT (safe — runs after DOM ready) ──
function dcInit(){
  // Auto-pull sync
  if (typeof CloudSync !== 'undefined' && CloudSync.online) {
    const k = getUserKey();
    if (k) CloudSync.pull(k);
  }

  // Tab nav
  const tabBar=document.getElementById('tabBar');
  if(tabBar){
    tabBar.addEventListener('click',e=>{
      const b=e.target.closest('[data-tab]');if(!b)return;
      document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false')});
      const target=document.getElementById('tab-'+b.dataset.tab);
      if(target)target.classList.add('active');
      b.classList.add('active');b.setAttribute('aria-selected','true');
      document.body.classList.toggle('dc-wide-tab',b.dataset.tab==='mapa'||b.dataset.tab==='mapa-drag');
      if(b.dataset.tab!=='mapa'){const p=document.getElementById('dcPanel');if(p)p.classList.remove('sheet');document.body.classList.remove('dc-sheet-open')}
      if(b.dataset.tab==='mapa-drag')setTimeout(dragMount,30);
      if(b.dataset.tab==='quiz'&&!qQs.length)renderQuizMenu();
    });
  }
  const gm=document.getElementById('gameModes');
  if(gm)gm.addEventListener('click',e=>{
    const b=e.target.closest('[data-game]');if(!b)return;
    gm.querySelectorAll('[data-game]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});
    document.getElementById('game-memory').hidden=b.dataset.game!=='memory';
    document.getElementById('game-order').hidden=b.dataset.game!=='order';
    if(b.dataset.game==='order'&&!ord)initOrder();
  });
  const dm=document.getElementById('dragModes');
  if(dm)dm.addEventListener('click',e=>{const b=e.target.closest('[data-dmode]');if(b){dragMount();dragSetMode(b.dataset.dmode)}});

  // User greeting (nav.js handles the badge)
  const user=getActiveUser();
  if(user){
    const greetEl=document.getElementById('greeting');
    if(greetEl){
      if(user.age&&user.age<=6) greetEl.textContent='¡Explora el mapa, '+user.name+'!';
      else if(user.age&&user.age>=10) greetEl.textContent='¡Desafía todos los quizzes, '+user.name+'!';
      else greetEl.textContent='¡Vamos, '+user.name+'!';
    }
  }
  document.body.classList.add('dc-wide-tab');

  curTopic='timeline';
  renderTopics();
  renderStories(curTopic);
  initMemory();
  renderQuizMenu();
  DCMap.mount();
  updateProgress();
}

document.addEventListener('DOMContentLoaded', dcInit);

// === NEW CONTENT ADDED 2026-03-23 by Content Guardian Agent ===
// Math Galaxy – 12 new problems added to generators
// Descubre Chile – 1 new topic + 10 new quiz questions

