/* ================================================================
   DESCUBRE CHILE — Full Spanish App Engine
   Fixed: null-safe DOM access, DOMContentLoaded init
   ================================================================ */

function getUserKey(){const u=getActiveUser();return u?'zs_chile_'+u.name.toLowerCase().replace(/\s+/g,'_'):null}
function getUserProgress(){const k=getUserKey();if(!k)return{};try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}}
function saveTopicProgress(id,stars,pct){const k=getUserKey();if(!k)return;const p=getUserProgress();const prev=p[id]||{bestStars:0,bestPct:0};p[id]={bestStars:Math.max(prev.bestStars,stars),bestPct:Math.max(prev.bestPct,pct),lastPlayed:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(p))}
function saveVisited(id){const k=getUserKey();if(!k)return;const p=getUserProgress();if(!p.vr)p.vr=[];if(!p.vr.includes(id))p.vr.push(id);localStorage.setItem(k,JSON.stringify(p))}
function saveMemBest(m){const k=getUserKey();if(!k)return;const p=getUserProgress();if(!p.memBest||m<p.memBest)p.memBest=m;localStorage.setItem(k,JSON.stringify(p))}

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

// ── STORIES ──
const TOPICS=[
  {id:'geography',icon:'🏔️',name:'Geografía',stories:[
    {t:'🌎 La forma de Chile',p:'Chile se extiende por más de 4.300 km de norte a sur, pero en promedio solo tiene 177 km de ancho.',f:'Si pusieras a Chile sobre Europa, llegaría desde Noruega hasta el Sahara.'},
    {t:'🗻 Los Andes',p:'Los poderosos Andes recorren toda la frontera este. Algunos picos superan los 6.000 metros.',f:'Chile tiene más de 2.000 volcanes, ¡y unos 90 están activos!'}
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
  geography:[{q:'¿Cuánto mide Chile de norte a sur?',a:'Más de 4.300 km',o:['Más de 4.300 km','Unos 1.000 km','Alrededor de 2.500 km','Menos de 500 km']},{q:'¿Qué desierto chileno es uno de los más secos?',a:'Atacama',o:['Atacama','Sahara','Gobi','Kalahari']},{q:'¿Qué montañas están en la frontera este?',a:'Los Andes',o:['Los Andes','Las Rocosas','Los Alpes','El Himalaya']},{q:'¿Dónde está Torres del Paine?',a:'Patagonia',o:['Patagonia','Atacama','Santiago','Isla de Pascua']},{q:'¿Por qué la NASA prueba robots en Atacama?',a:'Suelo parecido a Marte',o:['Suelo parecido a Marte','Muchos cráteres','Mucho frío','No hay gravedad']},{q:'¿Cuál es el océano que baña las costas de Chile?',a:'Océano Pacífico',o:['Océano Pacífico','Océano Atlántico','Océano Índico','Mar Caribe']},{q:'¿En qué continente está Chile?',a:'América del Sur',o:['América del Sur','Europa','África','Oceanía']},{q:'¿Qué volcán es uno de los más activos del sur?',a:'Villarrica',o:['Villarrica','Osorno','Llaima','Calbuco']}],
  indigenous:[{q:'¿Qué significa "Mapuche"?',a:'Gente de la tierra',o:['Gente de la tierra','Guerreros de montaña','Hijos del sol','Guardianes del bosque']},{q:'¿Cómo se llaman las estatuas de Isla de Pascua?',a:'Moai',o:['Moai','Tótems','Obeliscos','Pilares']},{q:'¿Cuánto resistieron los Mapuche?',a:'Más de 300 años',o:['Más de 300 años','50 años','10 años','1.000 años']},{q:'¿Quiénes pastorean llamas en los Andes?',a:'Los Aymara',o:['Los Aymara','Los Mapuche','Los Rapa Nui','Los Inca']},{q:'¿A qué distancia está Isla de Pascua?',a:'3.700 km',o:['3.700 km','100 km','500 km','10.000 km']}],
  history:[{q:'¿Quién fundó Santiago?',a:'Pedro de Valdivia',o:['Pedro de Valdivia','O\'Higgins','Colón','Bolívar']},{q:'¿Cuándo es Fiestas Patrias?',a:'18 de septiembre',o:['18 de septiembre','4 de julio','25 de diciembre','12 de febrero']},{q:'¿Quién es el Padre de la Patria?',a:'Bernardo O\'Higgins',o:['Bernardo O\'Higgins','Pedro de Valdivia','Arturo Prat','Manuel Baquedano']},{q:'¿En qué año fue la independencia total?',a:'1818',o:['1818','1776','1910','1541']},{q:'¿De qué país era el padre de O\'Higgins?',a:'Irlanda',o:['Irlanda','España','Inglaterra','Francia']}],
  culture:[{q:'¿Qué lleva la empanada de pino?',a:'Carne, cebolla, huevo, aceitunas',o:['Carne, cebolla, huevo, aceitunas','Pollo con queso','Porotos con arroz','Pescado con limón']},{q:'¿Qué animales representa la cueca?',a:'Gallo y gallina',o:['Gallo y gallina','Águila y cóndor','Gato y ratón','Caballo y yegua']},{q:'¿Qué es la "once"?',a:'Té de la tarde con comida',o:['Té de la tarde con comida','Un baile','Una jugada de fútbol','Un postre']},{q:'¿Qué es un "completo"?',a:'Hot dog con palta',o:['Hot dog con palta','Desayuno completo','Torta','Torneo de fútbol']},{q:'¿Cuándo se comen más empanadas?',a:'Fiestas Patrias',o:['Fiestas Patrias','Navidad','Semana Santa','Año Nuevo']}],
  nature:[{q:'¿Envergadura del cóndor andino?',a:'Más de 3 metros',o:['Más de 3 metros','1 metro','50 cm','10 metros']},{q:'¿Edad de la especie araucaria?',a:'200+ millones de años',o:['200+ millones de años','1.000 años','50 años','1 millón de años']},{q:'¿Qué animales están en el escudo?',a:'Cóndor y huemul',o:['Cóndor y huemul','Puma y águila','Llama y cóndor','Pingüino y flamenco']},{q:'¿Dónde hay pumas en Chile?',a:'Torres del Paine',o:['Torres del Paine','Atacama','Santiago','Isla de Pascua']},{q:'¿Qué corriente trae agua fría?',a:'Corriente de Humboldt',o:['Corriente de Humboldt','Corriente del Golfo','Anillo del Pacífico','Flujo chileno']},{q:'¿Qué animal del sur es un ciervo pequeño?',a:'Pudú',o:['Pudú','Huemul','Guanaco','Zorro']},{q:'¿En qué parte viven los pingüinos en Chile?',a:'En el sur',o:['En el sur','En el desierto','En Santiago','En Isla de Pascua']},{q:'¿Qué pájaro habita en los salares del norte?',a:'Flamenco',o:['Flamenco','Cóndor','Gaviota','Pelícano']}],
  famous:[{q:'¿Poeta chileno Nobel en 1971?',a:'Pablo Neruda',o:['Pablo Neruda','Gabriela Mistral','Isabel Allende','Huidobro']},{q:'¿Primera Nobel latina de Literatura?',a:'Gabriela Mistral',o:['Gabriela Mistral','Neruda','García Márquez','Vargas Llosa']},{q:'¿Futbolista chileno del Barcelona?',a:'Alexis Sánchez',o:['Alexis Sánchez','Arturo Vidal','Marcelo Ríos','Claudio Bravo']},{q:'¿Cuándo ganó Chile la Copa América?',a:'2015',o:['2015','2000','1990','1970']},{q:'¿En qué billete está Gabriela Mistral?',a:'5.000 pesos',o:['5.000 pesos','1.000 pesos','10.000 pesos','20.000 pesos']}],
  inventors:[{q:'¿Qué científico chileno ayudó a crear la vacuna de la hepatitis B?',a:'Pablo Valenzuela',o:['Pablo Valenzuela','Humberto Maturana','Francisco Varela','Ignacio Domeyko']},{q:'¿Qué es un atrapanieblas?',a:'Una malla para atrapar agua',o:['Una malla para atrapar agua','Un telescopio especial','Un tipo de tienda de campaña','Un barco de pesca']},{q:'¿Qué fenómeno del norte aprovechan los atrapanieblas?',a:'La camanchaca',o:['La camanchaca','El viento puelche','La lluvia intensa','El sol del desierto']},{q:'¿Cómo se llama el gran observatorio ubicado en el norte?',a:'ALMA',o:['ALMA','Hubble','James Webb','Paranal']}]
};

let qTopic='',qQs=[],qIdx=0,qScore=0;

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

function startQuiz(id){
  qTopic=id;const u=getActiveUser();const age=u?u.age:null;
  let qs=[...QB[id]];
  if(age&&age<=6)qs=qs.sort(()=>Math.random()-0.5).slice(0,3);
  qQs=qs;qIdx=0;qScore=0;showQ();
}

function showQ(){
  const qa=document.getElementById('quizArea');
  if(!qa)return;
  if(qIdx>=qQs.length){finishQ();return}
  const q=qQs[qIdx];
  const sh=[...q.o].sort(()=>Math.random()-0.5);
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
  let e,t,s;
  if(pct>=90){e='🏆';t='¡Excelente!';s=qScore+' de '+qQs.length+' — ¡eres experto/a!'}
  else if(pct>=60){e='🌟';t='¡Muy bien!';s=qScore+' de '+qQs.length+' — ¡gran conocimiento!'}
  else{e='💪';t='¡Sigue intentando!';s=qScore+' de '+qQs.length+' — lee las historias y vuelve.'}
  let st='';for(let i=0;i<3;i++)st+='<span>'+(i<stars?'⭐':'☆')+'</span>';
  qa.innerHTML='<div class="results-box"><span class="r-emoji">'+e+'</span><div class="r-title">'+t+'</div><div class="r-sub">'+s+'</div><div class="r-stars">'+st+'</div><div style="display:flex;gap:10px;justify-content:center"><button class="btn-red" onclick="startQuiz(\''+qTopic+'\')">Reintentar 🔁</button><button class="btn-ghost" onclick="renderQuizMenu()">Otros temas 🇨🇱</button></div></div>';
}

// ── INIT (safe — runs after DOM ready) ──
function dcInit(){
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
// Descubre Chile – 1 new topic + 10 new quiz questions
