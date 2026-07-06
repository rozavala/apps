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
  {icon:'⚽',name:'Alexis Sánchez',match:'Copa América 2015'},
  {icon:'🎵',name:'Violeta Parra',match:'Compuso Gracias a la vida'},
  {icon:'🎹',name:'Claudio Arrau',match:'Pianista de fama mundial'},
  {icon:'🌊',name:'Terremoto de Valdivia',match:'Magnitud 9,5 en 1960'},
  {icon:'🔭',name:'Observatorio ALMA',match:'Radiotelescopio en Atacama'}
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
    {q:'¿Qué porcentaje de agua dulce del mundo está en la Antártica?',a:'Alrededor del 70%',o:['Alrededor del 70%','El 10%','El 30%','El 90%'], tier:'expert', explain:'Cerca del 70% del agua dulce del planeta está congelada en el hielo de la Antártica.'}
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
    {q:'¿Quién fundó Santiago?',a:'Pedro de Valdivia',o:['Pedro de Valdivia','O\'Higgins','Colón','Bolívar',
    {q:'¿En qué año se fundó la ciudad de Santiago?',a:'1541',o:['1541','1810','1492','1900'], tier:'intermediate'},
    {q:'¿Quién fue el primer presidente de Chile?',a:'Manuel Blanco Encalada',o:['Manuel Blanco Encalada','Bernardo O\'Higgins','Arturo Prat','José Miguel Carrera'], tier:'advanced'},
    {q:'¿Qué combate naval ocurrió el 21 de mayo?',a:'Combate Naval de Iquique',o:['Combate Naval de Iquique','Batalla de Maipú','Desastre de Rancagua','Batalla de Chacabuco'], tier:'beginner'}
  ], tier:'intermediate'},
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
    {q:'¿Qué árbol nativo chileno puede vivir miles de años?',a:'Alerce',o:['Alerce','Pino','Eucalipto','Roble',
    {q:'¿Cuál es la flor nacional de Chile?',a:'Copihue',o:['Copihue','Rosa','Margarita','Girasol'], tier:'beginner', explain:'El copihue es la flor nacional de Chile y crece en los bosques húmedos del sur.'},
    {q:'¿Qué árbol nativo chileno puede vivir miles de años?',a:'Alerce',o:['Alerce','Pino','Eucalipto','Roble'], tier:'advanced'},
    {q:'¿Qué animal nativo es un pequeño ciervo?',a:'Pudú',o:['Pudú','Huemul','Zorro','Guanaco'], tier:'intermediate'}
  ], tier:'advanced'},
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
    {q:'¿En qué cerro del norte se construye el Telescopio Extremadamente Grande (ELT)?',a:'Cerro Armazones',o:['Cerro Armazones','Cerro Paranal','Cerro Tololo','Cerro La Silla'], tier:'expert', explain:'El ELT se construye en la cima del Cerro Armazones, en pleno desierto de Atacama.'}
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
    {q:'¿Cuál es el felino más grande que habita en Chile?',a:'El puma',o:['El puma','El gato colocolo','El jaguar','El güiña'], tier:'intermediate'}
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
    {q:'¿Qué gran ola provocó el terremoto de Valdivia de 1960 que cruzó el Pacífico?',a:'Un tsunami',o:['Un tsunami','Una marejada leve','Una nevada','Una sequía'], tier:'expert', explain:'El terremoto de Valdivia generó un enorme tsunami que cruzó el Pacífico y llegó hasta Japón y Hawái.'}
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

  if (!QB[id] || !Array.isArray(QB[id]) || !QB[id].length) {
    console.warn('[Descubre Chile] No quiz bank for id:', id);
    if (typeof showScreen === 'function') showScreen('menu');
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
  if(qc&&q.explain&&!qc.querySelector('.dc-explain')){const ex=document.createElement('div');ex.className='dc-explain';ex.textContent=q.explain;qc.appendChild(ex)}
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

// ── MAP DRAG QUIZ ──
let dragTimer=null, dragTime=60, dragScore=0;
const dragRegions = [
  {id:'norte', name:'Norte', color:'#E87040'},
  {id:'centro', name:'Centro', color:'#D93636'},
  {id:'sur', name:'Sur', color:'#2CB5A0'},
  {id:'patagonia', name:'Patagonia', color:'#0039A6'},
  {id:'pascua', name:'Rapa Nui', color:'#E8A838'}
];
let activeDragEl=null, offsetX=0, offsetY=0;

function initDragQuiz(){
  clearInterval(dragTimer);
  dragTime=60; dragScore=0;
  document.getElementById('dragTime').textContent=dragTime;
  document.getElementById('dragScore').textContent='0';
  document.getElementById('dragStartBtn').style.display='none';

  const container = document.getElementById('dragTokens');
  container.innerHTML='';
  // reset zones
  document.querySelectorAll('.drop-zone').forEach(z => {
    z.classList.remove('filled');
    z.style.fill='';
  });

  // Create tokens
  const shuffled = dragRegions.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach(r => {
    const t = document.createElement('div');
    t.className='drag-token';
    t.textContent=r.name;
    t.dataset.id=r.id;
    t.dataset.color=r.color;
    container.appendChild(t);

    // Pointer events for drag
    t.addEventListener('pointerdown', e => {
      activeDragEl=t;
      t.classList.add('dragging');
      t.style.width = t.offsetWidth+'px';
      const rect = t.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      t.style.left = (e.clientX - offsetX)+'px';
      t.style.top = (e.clientY - offsetY)+'px';
      t.setPointerCapture(e.pointerId);
    });
    t.addEventListener('pointermove', e => {
      if(activeDragEl!==t) return;
      t.style.left = (e.clientX - offsetX)+'px';
      t.style.top = (e.clientY - offsetY)+'px';
      // hit test
      document.querySelectorAll('.drop-zone').forEach(z=>z.classList.remove('active-target'));
      t.hidden = true;
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      t.hidden = false;
      if(elemBelow && elemBelow.classList.contains('drop-zone') && !elemBelow.classList.contains('filled')){
        elemBelow.classList.add('active-target');
      }
    });
    t.addEventListener('pointerup', e => {
      if(activeDragEl!==t) return;
      activeDragEl=null;
      t.classList.remove('dragging');
      t.releasePointerCapture(e.pointerId);
      t.hidden = true;
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      t.hidden = false;

      document.querySelectorAll('.drop-zone').forEach(z=>z.classList.remove('active-target'));

      if(elemBelow && elemBelow.classList.contains('drop-zone') && elemBelow.dataset.id === t.dataset.id){
        elemBelow.classList.add('filled');
        elemBelow.style.fill = t.dataset.color;
        t.classList.add('placed');
        if(typeof playSound==='function') playSound('click');
        dragScore++;
        document.getElementById('dragScore').textContent=dragScore;

        if(dragScore===dragRegions.length){
          clearInterval(dragTimer);
          showFeedback('🏆');
          if(typeof playSound==='function') playSound('success');
          saveTopicProgress('dragquiz', 3, 100);
          document.getElementById('dragStartBtn').style.display='inline-block';
          document.getElementById('dragStartBtn').textContent='Jugar de nuevo';
          if(typeof ActivityLog!=='undefined') ActivityLog.log('Descubre Chile','📍','Completó el Reto de Ubicación');
        }
      } else {
        t.style.left=''; t.style.top=''; t.style.width='';
        if(typeof playSound==='function') playSound('error');
      }
    });
  });

  dragTimer = setInterval(()=>{
    dragTime--;
    document.getElementById('dragTime').textContent=dragTime;
    if(dragTime<=0){
      clearInterval(dragTimer);
      document.getElementById('dragStartBtn').style.display='inline-block';
      document.getElementById('dragStartBtn').textContent='Intentar de nuevo';
      container.innerHTML=''; // clear tokens
      if(typeof playSound==='function') playSound('error');
    }
  }, 1000);
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

      if(e.target.dataset.tab === 'mapa-drag' && document.getElementById('dragScore').textContent === '0') {
        // Ready to start
      }
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
