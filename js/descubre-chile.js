/* ================================================================
   DESCUBRE CHILE — Full Spanish App Engine
   Fixed: null-safe DOM access, DOMContentLoaded init
   ================================================================ */

let qTopic = null;
let qQs = [];
let qIdx = 0;
let qScore = 0;

function getUserKey() {
  return typeof getUserAppKey === 'function' ? getUserAppKey('zs_chile_') : null;
}
function getUserProgress(){const k=getUserKey();if(!k)return{};try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}}
function saveTopicProgress(id,stars,pct){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  const prev=p[id]||{bestStars:0,bestPct:0};
  p[id]={bestStars:Math.max(prev.bestStars,stars),bestPct:Math.max(prev.bestPct,pct),lastPlayed:new Date().toISOString()};
  try {
    localStorage.setItem(k,JSON.stringify(p));
  } catch (e) {
    console.warn('[Chile] Failed to save topic progress:', e);
  }
  if(typeof CloudSync!=='undefined'&&CloudSync.online)CloudSync.push(k);

  if (typeof ActivityLog !== 'undefined' && stars > 0) {
    ActivityLog.log('Descubre Chile', '🇨🇱', `Completó el tema "${id}" — ${stars} estrella${stars!==1?'s':''}`);
  }
}
function saveVisited(id){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  if(!p.vr)p.vr=[];if(!p.vr.includes(id))p.vr.push(id);
  try {
    localStorage.setItem(k,JSON.stringify(p));
  } catch (e) {}
  if(typeof CloudSync!=='undefined'&&CloudSync.online)CloudSync.push(k);
}
function saveMemBest(m){
  const k=getUserKey();if(!k)return;
  const p=getUserProgress();
  if(!p.memBest||m<p.memBest)p.memBest=m;
  try {
    localStorage.setItem(k,JSON.stringify(p));
  } catch (e) {}
  if(typeof CloudSync!=='undefined'&&CloudSync.online)CloudSync.push(k);

  if (typeof ActivityLog !== 'undefined') {
    ActivityLog.log('Descubre Chile', '🇨🇱', `Completó el juego de memoria en ${m} movimientos`);
  }
}

function showFeedback(e){
  const el=document.getElementById('feedback');
  if(!el)return;
  const inner=el.querySelector('span')||el;
  inner.textContent=e;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),900);
}

function updateProgress(){
  const p=getUserProgress();const regs=(p.vr||[]).length;
  const topics=Object.keys(p).filter(k=>k!=='vr'&&k!=='memBest'&&p[k].bestStars>0).length;
  const mem=p.memBest?1:0;const total=regs+topics+mem;const max=5+6+1;
  const pct=Math.min(100,Math.round((total/max)*100));
  const pf=document.getElementById('progressFill');
  const pl=document.getElementById('progressLabel');
  if(pf)pf.style.width=pct+'%';
  if(pl)pl.textContent='Chile explorado: '+pct+'%';
  (p.vr||[]).forEach(id=>{const el=document.getElementById('reg-'+id);if(el)el.classList.add('visited')});
}

// ── MAP DATA ──
const REGIONS={
  norte:{icon:'🏜️',title:'Norte Grande',sub:'El desierto más seco del mundo',facts:[
    {t:'🏜️ Desierto de Atacama',p:'El norte de Chile alberga el Desierto de Atacama, uno de los lugares más secos del planeta. Tiene salares, géiseres y flamencos en lagos de altura.',f:'¡La NASA prueba sus robots para Marte en el Atacama porque el suelo es muy parecido!'},
    {t:'⭐ Cielos estrellados',p:'El Atacama tiene los cielos más limpios del mundo para observar estrellas. Chile tiene los telescopios más grandes del planeta.',f:'Desde el norte de Chile puedes ver más de 5.000 estrellas a simple vista.'},
    {t:'🦩 Altiplano',p:'En las alturas del norte viven flamencos, vicuñas y llamas. Los pueblos aymaras han habitado esta zona por miles de años.',f:'Los géiseres del Tatio (a 4.300 m) son los más altos del mundo.'}
  ]},
  centro:{icon:'🏙️',title:'Chile Central',sub:'Santiago, Valparaíso y los valles',facts:[
    {t:'🏙️ Santiago',p:'La capital fue fundada en 1541 por Pedro de Valdivia junto al río Mapocho. Hoy tiene más de 7 millones de habitantes rodeados por los Andes.',f:'Desde Santiago puedes ver la cordillera nevada ¡a solo 45 minutos en auto!'},
    {t:'🎨 Valparaíso',p:'Ciudad famosa por sus cerros coloridos, ascensores históricos y arte callejero. Es Patrimonio de la Humanidad.',f:'Valparaíso tiene más de 15 ascensores funiculares, algunos con más de 100 años.'},
    {t:'🍇 Valles',p:'El centro tiene valles fértiles con clima mediterráneo ideal para la agricultura y los viñedos.',f:'Chile es el cuarto exportador de vino del mundo.'}
  ]},
  sur:{icon:'🌲',title:'Sur de Chile',sub:'Lagos, volcanes y pueblos originarios',facts:[
    {t:'🌋 Volcanes y lagos',p:'El sur tiene decenas de volcanes activos rodeados de lagos cristalinos. El Villarrica es uno de los más activos de Sudamérica.',f:'Chile tiene más de 2.000 volcanes y unos 90 están activos.'},
    {t:'🪶 El pueblo Mapuche',p:'Los Mapuche son el pueblo originario más grande de Chile. Nunca fueron conquistados por los españoles.',f:'Los Mapuche resistieron por más de 300 años, desde 1536 hasta 1883.'},
    {t:'🌲 Bosques milenarios',p:'Los bosques del sur tienen araucarias que existen hace más de 200 millones de años y alerces de más de 3.000 años.',f:'La araucaria es un "fósil viviente" porque casi no ha cambiado desde la era de los dinosaurios.'}
  ]},
  patagonia:{icon:'🧊',title:'Patagonia',sub:'Glaciares, viento y Torres del Paine',facts:[
    {t:'🏔️ Torres del Paine',p:'Uno de los lugares más hermosos del planeta. Torres de granito, lagos turquesa y glaciares impresionantes.',f:'El Glaciar Grey tiene más de 6 km de ancho y miles de años de antigüedad.'},
    {t:'🐆 Pumas',p:'Torres del Paine tiene una de las poblaciones más densas de pumas del mundo.',f:'Si visitas Torres del Paine, ¡tienes buenas chances de ver un puma!'},
    {t:'🐧 Pingüinos',p:'En el extremo sur viven pingüinos de Magallanes y de Humboldt.',f:'El pingüino de Humboldt lleva ese nombre por la corriente fría desde la Antártida.'}
  ]},
  pascua:{icon:'🗿',title:'Rapa Nui',sub:'Moai, misterio y cultura polinésica',facts:[
    {t:'🗿 Los Moai',p:'Isla de Pascua está a 3.700 km de la costa. El pueblo Rapa Nui talló casi 1.000 estatuas gigantes, ¡algunas de más de 80 toneladas!',f:'Nadie sabe con certeza cómo movieron los Moai — algunos creen que los "caminaron" meciéndolos.'},
    {t:'🏝️ Cultura Rapa Nui',p:'Desarrollaron una escritura única llamada Rongorongo que aún no ha sido descifrada. Inventaron el Tangata Manu (hombre pájaro).',f:'Rapa Nui es uno de los lugares habitados más aislados del mundo.'},
    {t:'🌺 Naturaleza',p:'La isla tiene cráteres volcánicos con lagos, playas de arena rosa y caballos salvajes.',f:'El lugar habitado más cercano es isla Pitcairn, ¡a 2.000 km!'}
  ]}
};

function openRegion(id){
  const r=REGIONS[id];if(!r)return;
  const titleEl=document.getElementById('rmTitle');
  const subEl=document.getElementById('rmSub');
  const factsEl=document.getElementById('rmFacts');
  const modal=document.getElementById('regionModal');
  if(titleEl)titleEl.innerHTML=r.icon+' '+r.title;
  if(subEl)subEl.textContent=r.sub;
  if(factsEl)factsEl.innerHTML=r.facts.map(f=>'<div class="fact-item"><h4>'+f.t+'</h4><p>'+f.p+'</p>'+(f.f?'<div class="fun-fact">💡 <strong>¿Sabías que…?</strong> '+f.f+'</div>':'')+'</div>').join('');
  if(modal)modal.classList.add('active');
  saveVisited(id);updateProgress();
}
function closeRegion(){const m=document.getElementById('regionModal');if(m)m.classList.remove('active')}

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
    {t:'📝 Pablo Neruda',p:'El poeta más famoso de Chile, Nobel de Literatura 1971. Escribió sobre el amor, la naturaleza y Chile.',f:'Neruda coleccionaba objetos curiosos — una casa tiene un bar con forma de barco.'},
    {t:'📖 Gabriela Mistral',p:'Primera latinoamericana en ganar el Nobel de Literatura (1945). Maestra y diplomática que luchó por la educación.',f:'Su rostro aparece en el billete de 5.000 pesos.'},
    {t:'⚽ Alexis Sánchez',p:'Jugó en Barcelona y Arsenal. Chile ganó la Copa América en 2015 y 2016.',f:'Marcelo Ríos fue el primer tenista latinoamericano #1 del mundo en 1998.'}
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
  {id:'volcanes_chile',icon:'🌋',name:'Los Volcanes de Chile',stories:[
    {t:'🌋 Un país de volcanes',p:'Chile está en el Cinturón de Fuego del Pacífico. Hay más de 2.000 volcanes, y muchos están activos.',f:'El volcán Villarrica tiene un lago de lava en su cráter.'}
  ]},
  // PRUNED [2026-04-03]: Removed 'astronomia' and 'cocina' to make room for 'fiestas_patrias' and stay within MAX 12 limit.
  {id:'fiestas_patrias',icon:'🪁',name:'Fiestas Patrias',stories:[
    {t:'🇨🇱 El 18 de Septiembre',p:'Celebramos el inicio de nuestra independencia. Las familias se reúnen en las fondas para comer, bailar y celebrar.',f:'En esta fecha se declaran feriados irrenunciables para celebrar.'},
    {t:'💃 La Cueca',p:'Es el baile nacional. Representa el cortejo del gallo y la gallina, y se baila agitando pañuelos al aire.',f:'Fue declarada baile nacional de Chile en el año 1979.'}
  ]}
];
let curTopic=null;

function renderTopics(){
  const el=document.getElementById('historyTopics');
  if(!el)return;
  const prog=getUserProgress();
  el.innerHTML='';
  TOPICS.forEach(t=>{
    const done=prog[t.id]&&prog[t.id].bestStars>0;
    const btn=document.createElement('button');
    btn.className='topic-btn'+(curTopic===t.id?' active':'');
    btn.textContent=t.icon+' '+t.name+(done?' ✓':'');
    btn.onclick=()=>{curTopic=t.id;renderTopics();renderStories(t.id)};
    el.appendChild(btn);
  });
}

function renderStories(id){
  const topic=TOPICS.find(t=>t.id===id);if(!topic)return;
  const el=document.getElementById('storyList');
  if(!el)return;
  el.innerHTML='';
  topic.stories.forEach(s=>{
    const c=document.createElement('div');
    c.className='story-card';
    c.innerHTML='<h3>'+s.t+'</h3><p>'+s.p+'</p>'+(s.f?'<div class="fun-fact">💡 <strong>¿Sabías que…?</strong> '+s.f+'</div>':'');
    c.onclick=()=>c.classList.toggle('expanded');
    el.appendChild(c);
  });
}

// ── MEMORY ──
const MEM_PAIRS=[
  {icon:'🗡️',name:'Pedro de Valdivia',match:'Fundó Santiago 1541'},
  {icon:'🇨🇱',name:'Bernardo O\'Higgins',match:'Padre de la Patria'},
  {icon:'📝',name:'Pablo Neruda',match:'Nobel Literatura 1971'},
  {icon:'📖',name:'Gabriela Mistral',match:'Primera Nobel latina'},
  {icon:'🪶',name:'Pueblo Mapuche',match:'Nunca conquistados'},
  {icon:'⚽',name:'Alexis Sánchez',match:'Copa América 2015'}
];
let memCards=[],memFlipped=[],memMatched=0,memMoves=0,memLocked=false;

function initMemory(){
  memMatched=0;memMoves=0;memLocked=false;memFlipped=[];
  const mmEl=document.getElementById('memMoves');
  const mpEl=document.getElementById('memPairs');
  const mtEl=document.getElementById('memTotal');
  const msgEl=document.getElementById('memoryMsg');
  if(mmEl)mmEl.textContent='0';
  if(mpEl)mpEl.textContent='0';
  if(mtEl)mtEl.textContent=MEM_PAIRS.length;
  if(msgEl)msgEl.textContent='';
  const cards=[];
  MEM_PAIRS.forEach((p,i)=>{
    cards.push({id:i,type:'person',icon:p.icon,text:p.name,pid:i});
    cards.push({id:i,type:'fact',icon:'🏆',text:p.match,pid:i});
  });
  for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}
  memCards=cards;renderMem();
}

function renderMem(){
  const g=document.getElementById('memoryGrid');
  if(!g)return;
  g.innerHTML='';
  memCards.forEach((c,i)=>{
    const d=document.createElement('div');
    d.className='memory-card';
    if(c.matched)d.classList.add('matched');
    if(memFlipped.includes(i))d.classList.add('flipped');
    d.innerHTML='<div class="memory-card-inner"><div class="memory-back">🇨🇱</div><div class="memory-front"><span class="mf-icon">'+c.icon+'</span><span class="mf-text">'+c.text+'</span></div></div>';
    d.onclick=()=>flipCard(i);
    g.appendChild(d);
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
        memFlipped=[];memLocked=false;showFeedback('🎉');if(typeof SFX!=='undefined')SFX.correct();renderMem();
        if(memMatched===MEM_PAIRS.length){
          const msgEl=document.getElementById('memoryMsg');
          if(msgEl)msgEl.innerHTML='<span style="color:var(--green)">🏆 ¡Completado en '+memMoves+' movimientos!</span>';
          saveMemBest(memMoves);updateProgress();if(typeof SFX!=='undefined')SFX.cheer();
        }
      },600);
    }else{
      if(typeof SFX!=='undefined')SFX.wrong();
      setTimeout(()=>{memFlipped=[];memLocked=false;renderMem()},900);
    }
  }
}

// ── QUIZ ──
const QB={
  geography:[
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Qué río cruza la ciudad de Santiago?',a:'Río Mapocho',o:['Río Mapocho','Río Loa','Río Baker','Río Maule'], tier:'beginner'},
    {q:'¿Cómo se llama el estrecho en el extremo sur de Chile?',a:'Estrecho de Magallanes',o:['Estrecho de Magallanes','Estrecho de Bering','Canal de Panamá','Estrecho de Gibraltar'], tier:'intermediate'},
    {q:'¿Cuánto mide Chile de norte a sur?',a:'Más de 4.300 km',o:['Más de 4.300 km','Unos 1.000 km','Alrededor de 2.500 km','Menos de 500 km'], tier:'expert'},
    {q:'¿Qué desierto chileno es uno de los más secos?',a:'Atacama',o:['Atacama','Sahara','Gobi','Kalahari'], tier:'intermediate'},
    {q:'¿Qué montañas están en la frontera este?',a:'Los Andes',o:['Los Andes','Las Rocosas','Los Alpes','El Himalaya'], tier:'beginner'},
    {q:'¿Dónde está Torres del Paine?',a:'Patagonia',o:['Patagonia','Atacama','Santiago','Isla de Pascua'], tier:'intermediate'},
    {q:'¿Por qué la NASA prueba robots en Atacama?',a:'Suelo parecido a Marte',o:['Suelo parecido a Marte','Muchos cráteres','Mucho frío','No hay gravedad'], tier:'advanced'},
    {q:'¿Cuál es el océano que baña las costas de Chile?',a:'Océano Pacífico',o:['Océano Pacífico','Océano Atlántico','Océano Índico','Mar Caribe'], tier:'beginner'},
    {q:'¿En qué continente está Chile?',a:'América del Sur',o:['América del Sur','Europa','África','Oceanía'], tier:'beginner'},
    {q:'¿Qué volcán es uno de los más activos del sur?',a:'Villarrica',o:['Villarrica','Osorno','Llaima','Calbuco'], tier:'intermediate'},
    {q:'¿Cuál es el ancho promedio de Chile?',a:'177 km',o:['177 km','500 km','10 km','1.000 km'], tier:'expert'},
    {q:'¿Cuál es el archipiélago chileno famoso por sus iglesias de madera?',a:'Chiloé',o:['Chiloé','Juan Fernández','Galápagos','Malvinas'], tier:'advanced'},
    {q:'¿En qué zona de Chile están los salares y géiseres?',a:'Norte',o:['Norte','Centro','Sur','Patagonia'], tier:'intermediate'},
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Dónde se encuentran los glaciares milenarios como el Glaciar Grey?',a:'Patagonia',o:['Patagonia','Atacama','Valles Centrales','Isla de Pascua'], tier:'intermediate'},
    {q:'¿A qué distancia de la costa está aproximadamente Isla de Pascua?',a:'3.700 km',o:['3.700 km','500 km','1.000 km','10.000 km'], tier:'advanced'},
    // PRUNED [2026-04-12]: Removed to stay within MAX 20 limit

    {q:'¿Cuál es la capital de Chile?',a:'Santiago',o:['Santiago','Valparaíso','Concepción','Antofagasta'], tier:'beginner'},
    {q:'¿Qué país está al norte de Chile?',a:'Perú',o:['Perú','Argentina','Bolivia','Brasil'], tier:'intermediate'},
    {q:'¿Cuál es el lago más grande de Chile?',a:'Lago General Carrera',o:['Lago General Carrera','Lago Llanquihue','Lago Villarrica','Lago Ranco'], tier:'advanced'},
    {q:'¿Qué cordillera recorre la costa chilena?',a:'Cordillera de la Costa',o:['Cordillera de la Costa','Cordillera de los Andes','Cordillera Frontal','Cordillera Domeyko'], tier:'intermediate'},
    {q:'¿En qué región se encuentra el desierto de Atacama?',a:'Norte Grande',o:['Norte Grande','Zona Central','Patagonia','Sur'], tier:'beginner'}
  ],
  antartica:[
    {q:'¿Qué animal es común encontrar en la Antártica?',a:'Pingüino',o:['Pingüino','Oso Polar','León','Mono'], tier:'beginner'},
    {q:'¿Cómo se llama el poblado chileno en la Antártica que tiene una escuela?',a:'Villa Las Estrellas',o:['Villa Las Estrellas','Punta Arenas','Puerto Williams','Base Prat'], tier:'advanced'},
    {q:'¿Cuál es la característica principal del clima antártico?',a:'Frío y seco',o:['Frío y seco','Caluroso y húmedo','Lluvioso','Templado'], tier:'beginner'},
    {q:'¿Qué estudian principalmente los científicos en la Antártica?',a:'El clima y la fauna',o:['El clima y la fauna','La agricultura','Los bosques','La minería de oro'], tier:'intermediate'},
    {q:'¿Qué tratado regula la Antártica?',a:'Tratado Antártico',o:['Tratado Antártico','Tratado de Paz','Pacto del Sur','Acuerdo Polar'], tier:'advanced'},
    {q:'¿Hay osos polares en la Antártica?',a:'No',o:['No','Sí','Solo en invierno','Solo en verano'], tier:'beginner'},
    {q:'¿Qué porcentaje de agua dulce del mundo está en la Antártica?',a:'Alrededor del 70%',o:['Alrededor del 70%','El 10%','El 30%','El 90%'], tier:'expert'}
  ],
  indigenous:[
    {q:'¿Qué pueblo originario desarrolló la cerámica con diseños geométricos?',a:'Los Diaguitas',o:['Los Diaguitas','Los Mapuches','Los Chonos','Los Selknam'], tier:'advanced'},
    {q:'¿Cuándo celebran el Año Nuevo los Aymaras?',a:'Solsticio de invierno',o:['Solsticio de invierno','En Navidad','El 18 de septiembre','El 1 de enero'], tier:'intermediate'},
    {q:'¿Dónde habitan principalmente los Aymaras?',a:'En el altiplano',o:['En el altiplano','En los canales del sur','En Isla de Pascua','En Valparaíso'], tier:'intermediate'},
    {q:'¿Qué significa "Mapuche"?',a:'Gente de la tierra',o:['Gente de la tierra','Guerreros de montaña','Hijos del sol','Guardianes del bosque'], tier:'beginner'},
    {q:'¿Cómo se llaman las estatuas de Isla de Pascua?',a:'Moai',o:['Moai','Tótems','Obeliscos','Pilares'], tier:'beginner'},
    {q:'¿Cuánto resistieron los Mapuche?',a:'Más de 300 años',o:['Más de 300 años','50 años','10 años','1.000 años'], tier:'advanced'},
    {q:'¿Quiénes pastorean llamas en los Andes?',a:'Los Aymara',o:['Los Aymara','Los Mapuche','Los Rapa Nui','Los Inca'], tier:'intermediate'},
    {q:'¿A qué distancia está Isla de Pascua?',a:'3.700 km',o:['3.700 km','100 km','500 km','10.000 km'], tier:'expert'},
    {q:'¿Qué famoso baile chilote es originario del sur?',a:'La Trastrasera',o:['La Trastrasera','La Cueca','El Sau Sau','El Tango'], tier:'advanced'},
    {q:'¿Quiénes construyeron los Moai?',a:'Los Rapa Nui',o:['Los Rapa Nui','Los Mapuches','Los Incas','Los Diaguitas'], tier:'beginner'}
  ],
  history:[
    {q:'¿Quién fundó Santiago?',a:'Pedro de Valdivia',o:['Pedro de Valdivia','O\'Higgins','Colón','Bolívar'], tier:'intermediate'},
    {q:'¿Cuándo es Fiestas Patrias?',a:'18 de septiembre',o:['18 de septiembre','4 de julio','25 de diciembre','12 de febrero'], tier:'beginner'},
    {q:'¿Quién es el Padre de la Patria?',a:'Bernardo O\'Higgins',o:['Bernardo O\'Higgins','Pedro de Valdivia','Arturo Prat','Manuel Baquedano'], tier:'intermediate'},
    {q:'¿En qué año fue la independencia total?',a:'1818',o:['1818','1776','1910','1541'], tier:'expert'},
    {q:'¿De qué país era el padre de O\'Higgins?',a:'Irlanda',o:['Irlanda','España','Inglaterra','Francia'], tier:'advanced'},
    {q:'¿Qué pueblo originario resistió la conquista española?',a:'Mapuche',o:['Mapuche','Inca','Azteca','Maya'], tier:'beginner'},
    {q:'¿Junto a qué río se fundó Santiago?',a:'Mapocho',o:['Mapocho','Bío Bío','Loa','Maipo'], tier:'beginner'},
    {q:'¿Qué cerro está en el centro de Santiago donde se fundó la ciudad?',a:'Santa Lucía',o:['Santa Lucía','San Cristóbal','Aconcagua','Manquehue'], tier:'advanced'},
    {q:'¿En qué año se fundó Santiago?',a:'1541',o:['1541','1810','1492','1600'], tier:'intermediate'},
    {q:'¿En qué fecha ocurrió la Primera Junta de Gobierno?',a:'18 de septiembre de 1810',o:['18 de septiembre de 1810','12 de febrero de 1818','21 de mayo de 1879','1 de enero de 1800'], tier:'advanced'},
    {q:'¿Qué país gobernó Chile antes de su independencia?',a:'España',o:['España','Inglaterra','Francia','Portugal'], tier:'beginner'},
    {q:'¿Qué cordillera tuvo que cruzar el Ejército de los Andes?',a:'Cordillera de los Andes',o:['Cordillera de los Andes','Cordillera de la Costa','Los Alpes','Los Pirineos'], tier:'intermediate'},
    {q:'¿Qué héroe naval comandó la Esmeralda?',a:'Arturo Prat',o:['Arturo Prat','Manuel Baquedano','Bernardo O\'Higgins','José Miguel Carrera'], tier:'intermediate'},
    {q:'¿En qué ciudad ocurrió el Combate Naval el 21 de mayo?',a:'Iquique',o:['Iquique','Valparaíso','Antofagasta','Arica'], tier:'advanced'},
    {q:'¿Qué batalla selló la independencia de Chile en 1818?',a:'Batalla de Maipú',o:['Batalla de Maipú','Batalla de Chacabuco','Combate Naval de Iquique','Batalla de Rancagua'], tier:'expert'},
    {q:'¿Quién fue el primer Director Supremo de Chile?',a:'Bernardo O\'Higgins',o:['Bernardo O\'Higgins','José Miguel Carrera','Manuel Bulnes','Pedro de Valdivia'], tier:'intermediate'},
    {q:'¿En qué siglo se fundó la ciudad de Santiago?',a:'Siglo XVI (16)',o:['Siglo XVI (16)','Siglo XVIII (18)','Siglo XIX (19)','Siglo XV (15)'], tier:'advanced'}
  ],
  culture:[
    {q:'¿Qué lleva la empanada de pino?',a:'Carne, cebolla, huevo, aceitunas',o:['Carne, cebolla, huevo, aceitunas','Pollo con queso','Porotos con arroz','Pescado con limón'], tier:'beginner'},
    {q:'¿Qué animales representa la cueca?',a:'Gallo y gallina',o:['Gallo y gallina','Águila y cóndor','Gato y ratón','Caballo y yegua'], tier:'intermediate'},
    {q:'¿Qué es la "once"?',a:'Té de la tarde con comida',o:['Té de la tarde con comida','Un baile','Una jugada de fútbol','Un postre'], tier:'beginner'},
    {q:'¿Qué es un "completo"?',a:'Hot dog con palta',o:['Hot dog con palta','Desayuno completo','Torta','Torneo de fútbol'], tier:'beginner'},
    {q:'¿Cuándo se comen más empanadas?',a:'Fiestas Patrias',o:['Fiestas Patrias','Navidad','Semana Santa','Año Nuevo'], tier:'beginner'},
    {q:'¿Qué famoso sándwich lleva carne, porotos verdes, tomate y ají verde?',a:'Chacarero',o:['Chacarero','Barros Luco','Italiano','Chemilico'], tier:'intermediate'},
    {q:'¿En qué mes se celebran las Fiestas Patrias en Chile?',a:'Septiembre',o:['Septiembre','Diciembre','Julio','Octubre'], tier:'beginner'}
  ],
  nature:[
    {q:'¿Envergadura del cóndor andino?',a:'Más de 3 metros',o:['Más de 3 metros','1 metro','50 cm','10 metros'], tier:'advanced'},
    {q:'¿Edad de la especie araucaria?',a:'200+ millones de años',o:['200+ millones de años','1.000 años','50 años','1 millón de años'], tier:'expert'},
    {q:'¿Qué animales están en el escudo?',a:'Cóndor y huemul',o:['Cóndor y huemul','Puma y águila','Llama y cóndor','Pingüino y flamenco'], tier:'beginner'},
    {q:'¿Dónde hay pumas en Chile?',a:'Torres del Paine',o:['Torres del Paine','Atacama','Santiago','Isla de Pascua'], tier:'intermediate'},
    {q:'¿Qué corriente trae agua fría?',a:'Corriente de Humboldt',o:['Corriente de Humboldt','Corriente del Golfo','Anillo del Pacífico','Flujo chileno'], tier:'advanced'},
    {q:'¿Qué animal del sur es un ciervo pequeño?',a:'Pudú',o:['Pudú','Huemul','Guanaco','Zorro'], tier:'beginner'},
    {q:'¿En qué parte viven los pingüinos en Chile?',a:'En el sur',o:['En el sur','En el desierto','En Santiago','En Isla de Pascua'], tier:'intermediate'},
    {q:'¿Qué pájaro habita en los salares del norte?',a:'Flamenco',o:['Flamenco','Cóndor','Gaviota','Pelícano'], tier:'beginner'}
  ],
  famous:[
    {q:'¿Poeta chileno Nobel en 1971?',a:'Pablo Neruda',o:['Pablo Neruda','Gabriela Mistral','Isabel Allende','Huidobro'], tier:'intermediate'},
    {q:'¿Primera Nobel latina de Literatura?',a:'Gabriela Mistral',o:['Gabriela Mistral','Neruda','García Márquez','Vargas Llosa'], tier:'intermediate'},
    {q:'¿Futbolista chileno del Barcelona?',a:'Alexis Sánchez',o:['Alexis Sánchez','Arturo Vidal','Marcelo Ríos','Claudio Bravo'], tier:'beginner'},
    {q:'¿Cuándo ganó Chile la Copa América?',a:'2015',o:['2015','2000','1990','1970'], tier:'intermediate'},
    {q:'¿En qué billete está Gabriela Mistral?',a:'5.000 pesos',o:['5.000 pesos','1.000 pesos','10.000 pesos','20.000 pesos'], tier:'expert'},
    {q:'¿Qué deporte practicaba Marcelo Ríos?',a:'Tenis',o:['Tenis','Fútbol','Gimnasia','Natación'], tier:'beginner'},
    {q:'¿En qué año fue Marcelo Ríos número 1 del mundo?',a:'1998',o:['1998','2000','1995','2005'], tier:'advanced'}
  ],
  inventors:[
    {q:'¿Qué científico chileno ayudó a crear la vacuna de la hepatitis B?',a:'Pablo Valenzuela',o:['Pablo Valenzuela','Humberto Maturana','Francisco Varela','Ignacio Domeyko'], tier:'expert'},
    {q:'¿Qué es un atrapanieblas?',a:'Una malla para atrapar agua',o:['Una malla para atrapar agua','Un telescopio especial','Un tipo de tienda de campaña','Un barco de pesca'], tier:'advanced'},
    {q:'¿Qué fenómeno del norte aprovechan los atrapanieblas?',a:'La camanchaca',o:['La camanchaca','El viento puelche','La lluvia intensa','El sol del desierto'], tier:'advanced'},
    {q:'¿Cómo se llama el gran observatorio ubicado en el norte?',a:'ALMA',o:['ALMA','Hubble','James Webb','Paranal'], tier:'intermediate'},
    {q:'¿Qué virus ayudó a descubrir Pablo Valenzuela?',a:'Hepatitis C',o:['Hepatitis C','Gripe','Sarampión','Varicela'], tier:'advanced'},
    {q:'¿Cuál será el telescopio más grande del mundo en construcción en Chile?',a:'ELT',o:['ELT','VLT','ALMA','Hubble'], tier:'expert'}
  ],
  volcanes:[
    {q:'¿En qué "cinturón" de la Tierra está ubicado Chile?',a:'Cinturón de Fuego',o:['Cinturón de Fuego','Cinturón de Asteroides','Cinturón de Orión','Cinturón Ecuatorial'], tier:'advanced'},
    {q:'¿Aproximadamente cuántos volcanes hay en Chile?',a:'Más de 2.000',o:['Más de 2.000','Unos 100','Alrededor de 50','Menos de 10'], tier:'intermediate'},
    {q:'¿Cuántos volcanes activos tiene Chile aproximadamente?',a:'Unos 90',o:['Unos 90','1.000','5','Ninguno'], tier:'expert'},
    {q:'¿Cuál es el volcán más alto del mundo ubicado en Chile?',a:'Nevado Ojos del Salado',o:['Nevado Ojos del Salado','Villarrica','Osorno','Llaima'], tier:'expert'},
    {q:'¿Qué volcán es famoso por su forma de cono perfecto en el sur?',a:'Osorno',o:['Osorno','Llaima','Calbuco','Villarrica'], tier:'advanced'},
    {q:'¿En qué cordillera están los volcanes de Chile?',a:'Los Andes',o:['Los Andes','La Costa','Domeyko','Nahuelbuta'], tier:'beginner'}
  ],
  animales:[
    {q:'¿Qué tipo de animales son las vicuñas y guanacos?',a:'Camélidos sudamericanos',o:['Camélidos sudamericanos','Roedores grandes','Aves andinas','Reptiles de altura'], tier:'intermediate'},
    {q:'¿Dónde habita principalmente la vicuña?',a:'A gran altitud en los Andes',o:['A gran altitud en los Andes','En la costa del Pacífico','En los bosques del sur','En la selva lluviosa'], tier:'intermediate'},
    {q:'¿Qué animal tiene una de las lanas más finas y valiosas?',a:'La vicuña',o:['La vicuña','La oveja común','El guanaco','El zorro'], tier:'advanced'},
    {q:'¿A qué velocidad puede correr un guanaco?',a:'Casi 60 km/h',o:['Casi 60 km/h','Unos 10 km/h','Más de 100 km/h','30 km/h'], tier:'expert'},
    {q:'¿Qué animal es el pudú?',a:'Un pequeño ciervo',o:['Un pequeño ciervo','Un roedor','Un ave','Un tipo de zorro'], tier:'beginner'},
    {q:'¿Dónde vive principalmente el pudú?',a:'En el sur de Chile',o:['En el sur de Chile','En el desierto','En la Isla de Pascua','En Santiago'], tier:'intermediate'},
    {q:'¿Qué animal marino se puede ver en las costas chilenas?',a:'El lobo marino',o:['El lobo marino','El oso polar','La morsa','El manatí'], tier:'beginner'}
  ],
  volcanes_chile:[
    {q:'¿En qué región del Pacífico se encuentra Chile?',a:'Cinturón de Fuego',o:['Cinturón de Fuego','Anillo de Agua','Zona de Tormentas','Cordillera Central'], tier:'intermediate'},
    {q:'¿Aproximadamente cuántos volcanes hay en Chile?',a:'Más de 2.000',o:['Más de 2.000','Menos de 100','Alrededor de 500','Solo 10'], tier:'expert'},
    {q:'¿Cuál de estos volcanes tiene un lago de lava?',a:'Villarrica',o:['Villarrica','Osorno','Llaima','Calbuco'], tier:'advanced'},
    {q:'¿Qué expulsa un volcán cuando hace erupción?',a:'Lava y ceniza',o:['Lava y ceniza','Agua salada','Solo humo','Hielo'], tier:'beginner'},
    {q:'¿Qué instrumento se usa para medir los sismos cerca de un volcán?',a:'Sismógrafo',o:['Sismógrafo','Termómetro','Telescopio','Barómetro'], tier:'advanced'},
    {q:'¿Qué volcán hizo erupción en 2015 en la Región de Los Lagos?',a:'Calbuco',o:['Calbuco','Villarrica','Osorno','Llaima'], tier:'expert'}
  ],
  fiestas_patrias:[
    {q:'¿Qué fecha principal se celebra en las Fiestas Patrias?',a:'El 18 de septiembre',o:['El 18 de septiembre','El 21 de mayo','El 1 de enero','El 25 de diciembre'], tier:'beginner'},
    {q:'¿Qué baile tradicional se baila en las fondas?',a:'La Cueca',o:['La Cueca','La Cumbia','El Tango','El Reggaetón'], tier:'beginner'},
    {q:'¿En qué año se declaró a la Cueca como baile nacional?',a:'1979',o:['1979','1810','1990','2000'], tier:'expert'},
    {q:'¿Qué animal representa el cortejo de la Cueca?',a:'Gallo y gallina',o:['Gallo y gallina','Cóndor y águila','Puma y huemul','Caballo y yegua'], tier:'intermediate'},
    {q:'¿Qué juego típico se juega elevándolo con hilo al viento?',a:'El volantín',o:['El volantín','El trompo','El emboque','Las bolitas'], tier:'beginner'},
    {q:'¿Qué comida es tradicional en Fiestas Patrias?',a:'La empanada de pino',o:['La empanada de pino','El sushi','La pizza','Los tacos'], tier:'beginner'}
  ]
};

function renderQuizMenu(){
  const prog=getUserProgress();
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  let h='<p style="text-align:center;font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:12px">Elige un tema</p><div class="topic-select">';
  TOPICS.forEach(t=>{
    const done=prog[t.id]&&prog[t.id].bestStars>0;
    h+='<button class="topic-btn" onclick="startQuiz(\''+t.id+'\')">'+t.icon+' '+t.name+(done?' ⭐':'')+'</button>';
  });
  h+='</div>';
  qa.innerHTML=h;
}

function startQuiz(id) {
  qTopic = id;
  const user = getActiveUser();
  const tier = getAgeTier(user ? user.age : null);

  let qs = QB[id].slice();

  // Filter: include questions at or below the kid's tier
  const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
  const maxTierIdx = tierOrder.indexOf(tier);
  qs = qs.filter(q => {
    const qTierIdx = tierOrder.indexOf(q.tier || 'intermediate');
    return qTierIdx <= maxTierIdx;
  });

  // Cap question count by age
  if (tier === 'beginner') qs = qs.sort(() => Math.random() - 0.5).slice(0, 4);
  else if (tier === 'intermediate') qs = qs.sort(() => Math.random() - 0.5).slice(0, 6);
  // advanced/expert get all filtered questions

  qQs = qs;
  qIdx = 0;
  qScore = 0;
  showQ();
}


function showQ(){
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  if(qIdx>=qQs.length){finishQ();return}
  const q=qQs[qIdx];
  const sh=q.o.slice().sort(()=>Math.random()-0.5);
  let h='<div class="quiz-top"><div class="quiz-badge">Pregunta '+(qIdx+1)+'/'+qQs.length+'</div><div class="quiz-score">⭐ '+qScore+'</div></div>';
  h+='<div class="quiz-progress-wrap"><div class="quiz-progress-fill" style="width:'+(qIdx/qQs.length*100)+'%"></div></div>';
  h+='<div class="quiz-card" id="qC"><div class="quiz-q-text">'+q.q+'</div></div><div class="quiz-opts">';
  sh.forEach(o=>{h+='<button class="quiz-opt-btn" onclick="ans(this)">'+o+'</button>'});
  h+='</div>';
  qa.innerHTML=h;
}

function ans(btn){
  const q=qQs[qIdx];const sel=btn.textContent;const ok=sel===q.a;
  document.querySelectorAll('.quiz-opt-btn').forEach(b=>{
    b.classList.add('disabled');
    if(b.textContent===q.a)b.classList.add('reveal');
  });
  const qc=document.getElementById('qC');
  if(ok){qScore++;btn.classList.add('sel-correct');if(qc)qc.classList.add('correct');showFeedback('🎉');if(typeof SFX!=='undefined')SFX.correct()}
  else{btn.classList.add('sel-wrong');if(qc)qc.classList.add('wrong');showFeedback('🤔');if(typeof SFX!=='undefined')SFX.wrong()}
  setTimeout(()=>{qIdx++;showQ()},1200);
}

function finishQ(){
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  const pct=Math.round(qScore/qQs.length*100);
  const stars=pct>=90?3:pct>=60?2:1;
  if(typeof SFX!=='undefined'&&pct>=60)SFX.cheer();
  saveTopicProgress(qTopic,stars,pct);updateProgress();

  const showResults = () => {
    let e,t,s;
    if(pct>=90){e='🏆';t='¡Excelente!';s=qScore+' de '+qQs.length+' — ¡eres experto/a!'}
    else if(pct>=60){e='🌟';t='¡Muy bien!';s=qScore+' de '+qQs.length+' — ¡gran conocimiento!'}
    else{e='💪';t='¡Sigue intentando!';s=qScore+' de '+qQs.length+' — lee las historias y vuelve.'}
    let st='';for(let i=0;i<3;i++)st+='<span>'+(i<stars?'⭐':'☆')+'</span>';
    qa.innerHTML='<div class="results-box"><span class="r-emoji">'+e+'</span><div class="r-title">'+t+'</div><div class="r-sub">'+s+'</div><div class="r-stars">'+st+'</div><div style="display:flex;gap:10px;justify-content:center"><button class="btn-red" onclick="startQuiz(\''+qTopic+'\')">Reintentar 🔁</button><button class="btn-ghost" onclick="renderQuizMenu()">Otros temas 🇨🇱</button></div></div>';
  };

  if (typeof LearningCheck !== 'undefined') {
    LearningCheck.maybePrompt('history', showResults);
  } else {
    showResults();
  }
}

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
      if(!e.target.dataset||!e.target.dataset.tab)return;
      document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      const target=document.getElementById('tab-'+e.target.dataset.tab);
      if(target)target.classList.add('active');
      e.target.classList.add('active');
    });
  }

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

  curTopic=TOPICS[0].id;
  renderTopics();
  renderStories(curTopic);
  initMemory();
  renderQuizMenu();
  updateProgress();
}

document.addEventListener('DOMContentLoaded', dcInit);

// === NEW CONTENT ADDED 2026-03-23 by Content Guardian Agent ===
// Math Galaxy – 12 new problems added to generators
// Descubre Chile – 1 new topic + 10 new quiz questions
