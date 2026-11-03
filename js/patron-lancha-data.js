/* =====================================================================
   PATRÓN DE LANCHA DEPORTIVA — contenido (js/patron-lancha-data.js)
   Basado en el Manual del Curso Patrón Deportivo de Bahía (DIRECTEMAR)
   y en el temario oficial. Herramienta de apoyo al estudio.

   MODULES se copió tal cual de la versión anterior de patron-lancha.html
   (lecciones, preguntas, respuestas y explicaciones sin cambios de
   contenido). Los diagramas ya no son SVG en línea: cada ${DIAG.x} deja
   un marcador <div data-fig="x"> que js/patron-lancha-art.js dibuja.
   El id de cada pregunta es "<módulo>:<índice>" — NO reordenar las
   preguntas; las nuevas van al FINAL de su módulo.
   Expone: PL_MODULES, PL_FIGS.
   ===================================================================== */
var PL_MODULES = (function(){
  'use strict';
  function fig(id){ return '<div class="pl-fig" data-fig="' + id + '"></div>'; }
  /* Diagramas que ya estaban en el texto de las lecciones */
  const DIAG = { barco: fig('barco'), luces: fig('luces'), rosa: fig('rosa'), ripa: fig('ripa'), vela: fig('vela'), iala: fig('iala') };

  /* ---------------- MÓDULOS ---------------- */
  const MODULES = [
    /* ============================ 1. NÁUTICA Y MANIOBRAS ============================ */
    { id:'nautica', icon:'🧭', title:'Náutica y maniobras',
      sub:'Nomenclatura, estructura, nudos, fondeo y maniobras',
      lessons:[
        { h:'Dimensiones y partes', html:`
          <p>Toda comunicación a bordo empieza por nombrar bien las partes y direcciones de la embarcación.</p>
          ${DIAG.barco}
          <ul>
            <li><span class="term">Proa</span>: parte delantera. <span class="term">Popa</span>: parte trasera.</li>
            <li><span class="term">Estribor</span>: costado derecho mirando de popa a proa (color <b>verde</b>). <span class="term">Babor</span>: costado izquierdo (color <b>rojo</b>).</li>
            <li><span class="term">Eslora</span>: largo. <span class="term">Manga</span>: ancho máximo. <span class="term">Calado</span>: de la flotación a lo más bajo (quilla/orza). <span class="term">Puntal</span>: de la quilla a la cubierta. <span class="term">Guinda</span>: de la flotación al punto más alto del mástil.</li>
            <li><span class="term">Obra viva</span>: casco sumergido; <span class="term">obra muerta</span>: casco sobre el agua. Los separa la <span class="term">línea de flotación</span>.</li>
            <li><span class="term">Amura</span> (costado hacia proa, a 45°), <span class="term">través</span> (medio), <span class="term">aleta</span> (costado hacia popa, a 45°).</li>
            <li><span class="term">Desplazamiento</span>: peso del agua desalojada por la obra viva; por el principio de Arquímedes, igual al peso de la embarcación.</li>
          </ul>`},
        { h:'Estructura y cubierta', html:`
          <ul>
            <li><span class="term">Casco</span>: cuerpo de la nave. <span class="term">Quilla</span>: pieza inferior que corre de proa a popa. <span class="term">Roda</span>: pieza afilada de proa; <span class="term">codaste</span>: continuación de la quilla por popa.</li>
            <li><span class="term">Cuadernas</span>: "costillas"; <span class="term">baos</span>: piezas transversales que sostienen la cubierta; <span class="term">mamparos</span>: tabiques o paredes.</li>
            <li><span class="term">Orza / quillote</span>: pieza baja central que da estabilidad y frena la deriva.</li>
            <li><span class="term">Cornamusa</span> y <span class="term">bitas</span>: piezas para tomar vueltas y hacer firmes los cabos.</li>
            <li>Partes de un <span class="term">cabo</span>: <b>chicote</b> (extremo con que se trabaja), <b>seno</b> (parte intermedia) y <b>firme</b>. La <span class="term">mena</span> es su grosor (circunferencia, en pulgadas).</li>
          </ul>`},
        { h:'Nudos marineros', html:`
          <p>Los nudos son materia de examen. Debes conocer su nombre y para qué sirven:</p>
          <ul>
            <li><span class="term">As de guía</span>: forma una gaza (lazo) fija en el chicote que no se corre. Muy usado y seguro.</li>
            <li><span class="term">Ballestrinque</span>: sujeta un cabo a un poste o mástil; ideal para empezar y terminar un amarre (con tensión constante).</li>
            <li><span class="term">Nudo de ocho (lasca)</span>: nudo de tope en el chicote para que el cabo no se escape por un motón, guía u ollao.</li>
            <li><span class="term">Rizo o llano</span>: dos medios nudos; une dos cabos de igual mena y se usa para tomar rizos de las velas.</li>
            <li><span class="term">Vuelta de escota</span>: une el chicote de un cabo a una gaza.</li>
            <li><span class="term">Vuelta de boya</span>: asegura un cabo al arganeo de una boya o a una bita.</li>
          </ul>
          <div class="tip">🪢 Maniobras con cabos: <b>adujar</b> (ordenar en vueltas), <b>cobrar</b> (recoger lo flojo), <b>halar</b> (hacer fuerza), <b>tesar/templar</b> (dejar tirante), <b>hacer firme</b> y <b>tomar vueltas</b> en una cornamusa o bita.</div>`},
        { h:'Balance, cabeceo y maniobras', html:`
          <ul>
            <li><span class="term">Escora</span>: inclinación hacia una banda. <span class="term">Balance</span>: movimiento transversal (de banda a banda) por olas de costado. <span class="term">Cabeceo</span>: movimiento longitudinal (proa-popa) por olas de proa o popa. <span class="term">Adrizar</span>: enderezar la embarcación.</li>
            <li>Maniobra despacio en puerto: "no navegues más rápido de lo que estás dispuesto a chocar". Ten <b>defensas</b> y cabos listos.</li>
            <li>Atraca y desatraca <b>contra</b> el viento o la corriente (el más fuerte) para tener control.</li>
            <li><span class="term">Fondear</span>: dar ancla en buen tenedero (arena o fango). Fila 5 a 7 veces la profundidad y vigila que el ancla no <b>garree</b> (se arrastre).</li>
          </ul>`}
      ],
      questions:[
        {q:'¿Cuál es el costado derecho mirando de popa a proa?', o:['Babor','Estribor','Amura','Aleta'], a:1, e:'Estribor es el costado derecho (color verde). Babor es el izquierdo (color rojo).'},
        {q:'El "calado" es la distancia entre:', o:['La proa y la popa','La flotación y la parte más baja del casco (quilla/orza)','Los dos costados','La quilla y la cubierta'], a:1, e:'El calado va de la línea de flotación a lo más bajo (quilla u orza); define la profundidad mínima de agua que necesitas.'},
        {q:'La "eslora" es:', o:['El ancho máximo','El largo de la embarcación','La altura del mástil','La parte sumergida'], a:1, e:'Eslora = largo. Manga = ancho máximo. Puntal = de la quilla a la cubierta.'},
        {q:'¿Qué color se asocia a babor?', o:['Verde','Rojo','Blanco','Amarillo'], a:1, e:'Babor = rojo. Estribor = verde. Coincide con las luces de costado.'},
        {q:'La "obra viva" del casco es:', o:['La parte sobre el agua','La parte sumergida','La cubierta','El motor'], a:1, e:'Obra viva = casco bajo la flotación (sumergido). Obra muerta = sobre el agua.'},
        {q:'El "desplazamiento" de una embarcación es:', o:['Su velocidad máxima','El peso del agua que desaloja su obra viva','La distancia recorrida','El ancho del casco'], a:1, e:'Por el principio de Arquímedes, el peso del agua desalojada por la obra viva es igual al peso de la embarcación.'},
        {q:'El extremo de un cabo con el que se trabaja se llama:', o:['Seno','Firme','Chicote','Mena'], a:2, e:'Chicote = extremo de trabajo; seno = parte intermedia; firme = extremo fijo. La mena es el grosor del cabo.'},
        {q:'El nudo que forma una gaza (lazo) fija que no se corre es el:', o:['Ballestrinque','As de guía','Nudo llano','Vuelta de escota'], a:1, e:'El as de guía forma una gaza segura en el chicote; entre otros usos, para afirmar la driza al puño de la vela.'},
        {q:'El "ballestrinque" sirve principalmente para:', o:['Unir dos cabos de igual grosor','Sujetar un cabo a un poste o mástil','Hacer un tope en el chicote','Improvisar una gaza'], a:1, e:'El ballestrinque sujeta un cabo a un poste o mástil bajo tensión constante; es ideal para empezar y terminar un amarre.'},
        {q:'El movimiento transversal (de banda a banda) por olas de costado se llama:', o:['Cabeceo','Balance','Escora','Deriva'], a:1, e:'Balance = movimiento transversal por olas de costado. Cabeceo = movimiento longitudinal (proa-popa).'},
        {q:'Que el ancla "garree" significa que:', o:['Está bien agarrada','Se arrastra sin sujetar','Está a bordo','Se enredó en la hélice'], a:1, e:'Garrear es que el ancla no sujeta y se arrastra por el fondo; hay que vigilarlo y volver a fondear.'},
        {q:'Al atracar con viento y corriente conviene maniobrar:', o:['A favor del viento','En contra del elemento más fuerte','Con el motor apagado','Siempre por babor'], a:1, e:'Maniobrar contra el viento o la corriente más fuerte da control y evita ser empujado contra el muelle.'},
        {q:'"Adujar" un cabo significa:', o:['Cortarlo','Ordenarlo en vueltas sucesivas sobre cubierta','Mojarlo','Hacerle un nudo'], a:1, e:'Adujar es recoger y ordenar el cabo en vueltas; los cabos deben estar siempre adujados y limpios.'},
        {q:'Una regla práctica para el largo de fondeo es filar aproximadamente:', o:['La misma profundidad','5 a 7 veces la profundidad','20 veces la profundidad','El doble solamente'], a:1, e:'Filar unas 5 a 7 veces la profundidad da el ángulo adecuado para que el ancla agarre bien.'}
      ]
    },

    /* ============================ 2. REGLAMENTACIÓN ============================ */
    { id:'reglamentacion', icon:'📋', title:'Reglamentación marítima básica', official:true,
      sub:'Autoridad Marítima, licencias, matrícula, zarpe y áreas',
      lessons:[
        { h:'La Autoridad Marítima', html:`
          <ul>
            <li>La <span class="term">DGTM y MM</span> (Dirección General del Territorio Marítimo y de Marina Mercante, <b>DIRECTEMAR</b>), dependiente de la Armada, es la Autoridad Marítima en Chile.</li>
            <li>Vela por la <b>seguridad de la navegación y la protección de la vida humana en el mar</b>, atiende la señalización de las costas y otorga títulos, matrículas y licencias.</li>
            <li>La ejercen el Director General, los Gobernadores Marítimos, los <span class="term">Capitanes de Puerto</span> y los Alcaldes de Mar.</li>
          </ul>`},
        { h:'Licencias deportivas náuticas', html:`
          <p>El <span class="term">Reglamento General de Deportes Náuticos</span> define las licencias de navegación:</p>
          <ul>
            <li><span class="term">Patrón Deportivo de Bahía</span>: al mando en aguas protegidas (puertos, bahías, caletas, ríos y lagos). Edad mínima <b>14 años</b>.</li>
            <li><span class="term">Capitán Deportivo Costero</span>: navegación próxima a la costa; incluye bahía. Edad mínima <b>17 años</b>.</li>
            <li><span class="term">Capitán Deportivo de Alta Mar</span>: navegación oceánica; incluye costera y bahía. Edad mínima <b>18 años</b>.</li>
          </ul>
          <div class="tip">🪪 Los exámenes se rinden regularmente en la <b>primera quincena de marzo y octubre</b>. Los demás tripulantes no requieren licencia, pero están bajo la autoridad del patrón.</div>`},
        { h:'Matrícula, zarpe y responsabilidad', html:`
          <ul>
            <li>Las embarcaciones deportivas menores (<b>≤ 50 TRG</b>) se inscriben en el <span class="term">Registro de Matrícula de Naves Menores</span> a cargo del Capitán de Puerto; deben llevar su número de matrícula visible.</li>
            <li>El <span class="term">Certificado de Seguridad</span> certifica que la nave está "apta para navegar".</li>
            <li>Requieren <span class="term">autorización de zarpe</span> las navegaciones que exceden de <b>24 horas</b> con destino distinto al de zarpe. En los demás casos conviene igual informar el plan de navegación para búsqueda y salvamento.</li>
            <li>La <b>seguridad</b> de la embarcación y su tripulación es responsabilidad del <b>operador/patrón</b>, que debe conocer la reglamentación.</li>
          </ul>`},
        { h:'Áreas náutico-deportivas', html:`
          <p>Para separar bañistas de embarcaciones, desde la orilla hacia el agua:</p>
          <ul>
            <li><b>0 a 100 m</b>: área de <span class="term">bañistas</span>.</li>
            <li><b>100 a 200 m</b>: área de embarcaciones a <span class="term">remo y vela</span>.</li>
            <li><b>Más de 200 m</b>: área de embarcaciones a <span class="term">motor y vela</span>.</li>
          </ul>
          <p>El desplazamiento hacia y desde la playa se hace por canales delimitados y a <b>mínima velocidad</b>.</p>`}
      ],
      questions:[
        {q:'Indique la normativa que regula las actividades náuticas deportivas en Chile:', o:['Ley de Navegación','Reglamento sobre Formación, Titulación y Carrera Profesional del Personal Embarcado','Reglamento General de Orden, Seguridad y Disciplina en Naves y Litoral de la República','Reglamento General de Deportes Náuticos'], a:3, e:'El Reglamento General de Deportes Náuticos regula las actividades deportivas y recreativas náuticas en aguas de jurisdicción nacional.'},
        {q:'¿Cuáles son Autoridades Marítimas?', o:['El Director General del Territorio Marítimo y de Marina Mercante','Los Gobernadores Marítimos','Los Capitanes de Puerto','Todas las anteriores'], a:3, e:'Son Autoridad Marítima el Director General, los Gobernadores Marítimos, los Capitanes de Puerto y los Alcaldes de Mar.'},
        {q:'¿Qué se entiende por Embarcación Deportiva de Bahía?', o:['Aquella apta para dirigirse de un punto a otro del litoral','Aquella cuyo diseño la hace apta para navegar en aguas protegidas','Aquella que puede navegar hasta las 12 M.N.','Aquella sin restricciones de distancia'], a:1, e:'La embarcación deportiva de bahía es apta para navegar exclusivamente en aguas protegidas: puertos, bahías, caletas, ríos y lagos.'},
        {q:'¿Qué se entiende por Artefacto Náutico?', o:['Embarcación a propulsión mecánica','Embarcación menor propulsada a vela','Aparato no propulsado utilizado para la práctica de deportes náuticos','Embarcación propulsada a remo'], a:2, e:'Es un aparato para deportes náuticos cuyas características no permiten calificarlo como embarcación deportiva.'},
        {q:'¿Cuál de estas Licencias Deportivas Náuticas de navegación tiene el nombre correcto?', o:['Capitán Deportivo de Alta Mar','Patrón Deportivo Costero','Capitán Deportivo de Bahía','Todas son correctas'], a:0, e:'Las licencias de navegación son: Capitán Deportivo de Alta Mar, Capitán Deportivo Costero y Patrón Deportivo de Bahía.'},
        {q:'El Director General del Territorio Marítimo otorga por resolución la licencia de:', o:['Patrón Deportivo de Bahía','Buceador Deportivo Autónomo','Capitán Deportivo de Alta Mar','Todas las anteriores'], a:2, e:'La licencia de Capitán Deportivo de Alta Mar la otorga el Director General; las demás las otorga la Capitanía de Puerto.'},
        {q:'Las Licencias Deportivas Náuticas otorgadas por otros países:', o:['No serán reconocidas en Chile','Serán reconocidas con limitaciones','Sólo con convenios específicos suscritos','Serán reconocidas en Chile de acuerdo a su equivalencia'], a:3, e:'Se reconocen en Chile según su categoría/equivalencia.'},
        {q:'Indique el requisito de edad correcto:', o:['Patrón Deportivo de Bahía, 14 años','Capitán Deportivo Costero, 18 años','Capitán Deportivo de Alta Mar, 21 años','a y b son correctas'], a:0, e:'Patrón de Bahía: 14 años; Capitán Costero: 17 años; Capitán de Alta Mar: 18 años.'},
        {q:'El postulante a Patrón Deportivo de Bahía deberá:', o:['Rendir examen teórico y práctico de náutica y maniobra, navegación básica, reglamentación marítima básica y gobierno de una embarcación (examen práctico)','Sólo exámenes teóricos','Sólo examen práctico','Sólo operador de comunicaciones restringido'], a:0, e:'Debe aprobar náutica y maniobra, navegación básica, reglamentación marítima básica y el gobierno de la embarcación (examen práctico).'},
        {q:'Se entiende por Naves Menores:', o:['Mayor a 50 TRG','Igual o menor a 50 TRG','Todas las deportivas','Todas aquellas propulsadas a vela'], a:1, e:'Naves menores son las de 50 o menos toneladas de registro grueso (TRG).'},
        {q:'Las naves menores se registran (matriculan) en:', o:['Gobernaciones Marítimas','Dirección General del Territorio Marítimo y de Marina Mercante','Capitanías de Puerto','Cualquiera de las anteriores'], a:2, e:'Las naves menores se inscriben en el Registro de Matrícula de Naves Menores, a cargo de los Capitanes de Puerto.'},
        {q:'Las embarcaciones deportivas que naveguen menos de 24 horas y cuyo zarpe y recalada sea el mismo puerto:', o:['No requerirán permiso de zarpe','El permiso lo otorga la Capitanía de Puerto o Alcalde de Mar','Deberá ser con 24 horas de anticipación','Deberá ser por escrito o personalmente en la Capitanía'], a:0, e:'Si la navegación dura menos de 24 h y el destino es el mismo puerto de zarpe, no se requiere permiso de zarpe.'},
        {q:'Las embarcaciones de una vela y monotripuladas del tipo Optimist requerirán:', o:['Licencia Náutica de Patrón de Bahía','Permiso de zarpe','No tienen restricciones','Supervisión de un instructor con Licencia Deportiva Náutica'], a:3, e:'La navegación en embarcaciones de una vela monotripuladas se hace bajo supervisión de un instructor con Licencia Deportiva Náutica.'},
        {q:'Las embarcaciones a motor tipo motos de agua o jet ski:', o:['Requieren ser inscritas ante la Capitanía de Puerto','No tienen limitación de práctica desde la playa','La edad mínima son 14 años','a y c correctas'], a:3, e:'Deben inscribirse en la Capitanía de Puerto y la edad mínima del operador es 14 años.'},
        {q:'Indique el equipamiento mínimo de una embarcación deportiva de bahía:', o:['Chaleco salvavidas, pito y un achicador','Bengalas rojas y verdes','Equipo de comunicaciones VHF','Juego de banderas'], a:0, e:'El equipo mínimo en bahía es: chaleco salvavidas por persona, un pito y un achicador.'},
        {q:'El Certificado de Navegabilidad (Seguridad) tiene una vigencia de:', o:['1 año','4 años','6 años','8 años'], a:2, e:'El Certificado de Seguridad tiene una vigencia de 6 años, salvo cambio estructural o reparación mayor.'},
        {q:'La navegación en botes a motor bajo 10 HP:', o:['No requieren licencia deportiva','Requieren al menos Patrón Deportivo de Bahía','No tienen restricciones de navegación','No requieren equipamiento de seguridad alguno'], a:0, e:'La navegación en botes con motor de hasta 10 HP no requiere Licencia Deportiva Náutica, pero sí cumplir condiciones de seguridad.'},
        {q:'Los menores de edad para optar a la Licencia de Patrón Deportivo de Bahía:', o:['No podrán obtener licencia deportiva','Desde los 14 a los 18 años requieren autorización del padre o tutor','No requieren autorización del padre o tutor','Sólo pueden a partir de los 18 años'], a:1, e:'Entre los 14 y los 18 años (menores de edad) se requiere autorización notarial del padre, madre o guardador.'},
        {q:'Otros antecedentes que deberá presentar el postulante a Patrón Deportivo de Bahía:', o:['Certificado de antecedentes','Certificado médico que acredite las condiciones físicas','Cédula de identidad','b y c correctas'], a:3, e:'Debe presentar certificado médico de aptitud física y su cédula de identidad, entre otros documentos.'},
        {q:'La Autoridad Marítima, de acuerdo con los resultados de los exámenes o cursos de competencia, podrá:', o:['Otorgar Licencia Deportiva Náutica','No otorgar Licencia Deportiva Náutica','Repetir exámenes','Todas las anteriores'], a:3, e:'Según los resultados puede otorgar o no la licencia, o disponer que se repitan los exámenes.'},
        {q:'Equipamiento obligatorio para operar una moto de agua es:', o:['Casco','Traje de neopreno','Chaleco salvavidas','No requiere equipamiento'], a:2, e:'El equipamiento obligatorio del operador de una moto de agua es el chaleco salvavidas.'},
        {q:'La moto de agua debe:', o:['Matricularse en las Capitanías de Puerto','No requiere matrícula','Requiere licencia al operador','a y c correctas'], a:3, e:'La moto de agua debe matricularse en la Capitanía de Puerto y su operador requiere licencia.'},
        {q:'El sistema de propulsión de una moto de agua es:', o:['Sistema con hélice','Propulsión a chorro de agua','Motor fuera de borda','Sistema mixto'], a:1, e:'La moto de agua se propulsa por chorro de agua (waterjet), no por hélice expuesta.'},
        {q:'El sistema de seguridad de una moto de agua o lancha cumple el propósito de:', o:['Cortar el motor al ser accionado','Disminuir la velocidad al ser requerido','Se activa en las caídas al agua del operador','a y c correctas'], a:3, e:'El corta-corriente de hombre al agua (kill cord) corta el motor cuando el operador cae al agua.'},
        {q:'La distancia de costa reservada para bañistas es de:', o:['100 mts','Depende de la playa','200 mts','Depende de la profundidad'], a:0, e:'Desde la orilla hasta los 100 metros es área reservada para bañistas.'},
        {q:'Para acceder a una playa no demarcada con una embarcación a motor se debe:', o:['Hacerlo perpendicular a la línea de la playa','Navegar a baja velocidad','Verificar la existencia de bañistas','Todas correctas'], a:3, e:'Se accede perpendicular a la playa, a baja velocidad y verificando que no haya bañistas.'},
        {q:'Para pedir auxilio desde una moto de agua, la señal reconocida es:', o:['Agitar los brazos en alto (subiendo y bajando)','Nadar hacia la playa','Lanzar bengalas rojas','Llamar por canal 16'], a:0, e:'En una moto de agua (sin radio ni pirotecnia) la señal de socorro es mover los brazos extendidos, subiéndolos y bajándolos lentamente.'},
        {q:'Si hay otras embarcaciones navegando próximas a nuestra moto de agua:', o:['Debo mantenerme al menos 50 mts de distancia','Estar atento a las maniobras de las otras embarcaciones','Las demás embarcaciones deben maniobrar para alejarse','Ninguna de las anteriores'], a:1, e:'La moto de agua, muy maniobrable, debe estar atenta a las maniobras de las demás embarcaciones y mantenerse apartada.'}
      ]
    },

    /* ============================ 3. MOTORES ============================ */
    { id:'motores', icon:'⚙️', title:'Operación de motores marinos',
      sub:'2 y 4 tiempos, mezcla, refrigeración, arranque y fallas',
      lessons:[
        { h:'Motor de 4 y de 2 tiempos', html:`
          <ul>
            <li>El motor de <span class="term">4 tiempos</span> <b>no</b> necesita mezcla: el aceite va en un depósito y se autolubrica. Sus tiempos son: <b>admisión/aspiración → compresión → combustión (explosión) → escape</b>.</li>
            <li>El motor de <span class="term">2 tiempos</span> completa el ciclo en dos carreras (combustión-escape / aspiración-compresión). Se lubrica con el aceite mezclado en el combustible.</li>
            <li>La mezcla típica de 2 tiempos es <b>50:1</b> (1 litro de aceite por 50 de gasolina), con aceite para motor marino.</li>
          </ul>
          <div class="tip">⛽ Mezcla <b>muy rica</b> (mucho aceite): el motor pierde fuerza, funciona irregular y ensucia las bujías. Mezcla <b>muy pobre</b> (poco aceite): el motor se <b>sobrecalienta</b> y puede agarrotarse.</div>`},
        { h:'Refrigeración y protección', html:`
          <ul>
            <li>El fueraborda se refrigera con <b>agua de mar</b> impulsada por una bomba con <span class="term">rodete (rólete)</span> de goma.</li>
            <li>El <span class="term">chorro testigo</span> (agua que sale por la parte posterior) confirma que la bomba funciona. Si <b>deja de salir agua</b>, apaga el motor: se recalienta.</li>
            <li>El <span class="term">ánodo de zinc</span> ("ánodo de sacrificio") en la pata protege los metales de la corrosión galvánica.</li>
            <li>El <span class="term">cebador/ahogador</span> enriquece la mezcla (menos aire) para ayudar a la partida en frío.</li>
          </ul>`},
        { h:'Arranque, chequeos y fallas', html:`
          <ul>
            <li>Antes de arrancar: motor bien <b>trincado</b> al espejo con pernos y cuerda de seguridad, estanque con combustible y <b>respiradero abierto</b>, palanca de cambio en <b>neutro</b>.</li>
            <li>Arranque de 2 tiempos: cebar con la <b>pera</b>, cebar el carburador con el ahogador, poner en START, tirar de la piola; dejar calentar unos minutos y <b>verificar el chorro de agua</b>.</li>
            <li>Combustible: regla del tercio (⅓ ida, ⅓ vuelta, ⅓ reserva). Ventila antes de arrancar motores a gasolina.</li>
            <li>Fallas comunes: <b>bujía sucia</b> (exceso de aceite), <b>rodete roto o tapado</b> (falla de refrigeración), manguera estrangulada (no llega combustible), agua en el combustible.</li>
          </ul>`}
      ],
      questions:[
        {q:'El "chorro testigo" (pipí) de un fueraborda confirma que:', o:['Hay suficiente combustible','La bomba de refrigeración funciona','La batería está cargada','El motor está en neutro'], a:1, e:'Ese chorro indica que la bomba de agua circula el refrigerante. Si deja de salir, el motor se recalienta y hay que apagarlo.'},
        {q:'Si el motor se recalienta y no sale agua por el testigo, debes:', o:['Acelerar para enfriarlo','Detener el motor cuanto antes','Echarle más combustible','Seguir si suena bien'], a:1, e:'La falta de chorro indica fallo de refrigeración; hay que apagar el motor para evitar que se funda.'},
        {q:'La mezcla típica de combustible de un motor de 2 tiempos es:', o:['10:1','25:1','50:1','100:1'], a:2, e:'La proporción habitual es 50:1 (1 litro de aceite por 50 de gasolina), con aceite para motor marino de 2 tiempos.'},
        {q:'El motor de 4 tiempos se caracteriza por:', o:['Requerir mezcla de gasolina y aceite','No requerir mezcla; se autolubrica con aceite en su depósito','Funcionar con diésel siempre','No necesitar refrigeración'], a:1, e:'El 4 tiempos no necesita mezcla: el aceite va aparte en un depósito y el motor se autolubrica.'},
        {q:'La pieza de goma de la bomba de agua que se desgasta o rompe es el:', o:['Rodete (rólete)','Bujía','Carburador','Ánodo'], a:0, e:'El rodete o rólete impulsa el agua de refrigeración; se gasta o tapa y es una falla común de recalentamiento.'},
        {q:'El "ánodo de sacrificio" de zinc en la pata del motor sirve para:', o:['Aumentar la potencia','Proteger los metales de la corrosión galvánica','Enfriar el escape','Cargar la batería'], a:1, e:'El ánodo de zinc absorbe las corrientes galvánicas y se corroe en lugar de las piezas importantes del motor.'},
        {q:'Una mezcla de combustible "muy pobre" (poco aceite) provoca que el motor:', o:['Funcione mejor','Se sobrecaliente','Consuma menos sin riesgo','Arranque más fácil en frío'], a:1, e:'Con poco aceite falta lubricación: el motor se sobrecalienta y puede dañarse.'},
        {q:'El cebador o ahogador (choke) sirve para:', o:['Apagar el motor','Enriquecer la mezcla y facilitar la partida en frío','Refrigerar el bloque','Medir el combustible'], a:1, e:'El ahogador reduce el aire para enriquecer la mezcla aire-combustible, ayudando a arrancar el motor frío.'},
        {q:'Antes de arrancar, la palanca de cambios debe estar en:', o:['Avante','Neutro','Reversa','Cualquier posición'], a:1, e:'Se arranca en neutro (posición central) por seguridad, con el motor trincado y el respiradero del estanque abierto.'},
        {q:'La "regla del tercio" del combustible significa:', o:['Llenar solo un tercio','⅓ para ir, ⅓ para volver, ⅓ de reserva','Usar un tercio de aceite','Gastar todo menos un tercio de aceite'], a:1, e:'Reservar un tercio del combustible como margen ante viento, corriente o imprevistos.'}
      ]
    },

    /* ============================ 4. METEOROLOGÍA ============================ */
    { id:'meteo', icon:'🌦️', title:'Meteorología básica',
      sub:'Viento, presión, nubes, frentes, mareas, corrientes y olas',
      lessons:[
        { h:'Viento y presión', html:`
          <ul>
            <li>El viento nace de una <b>diferencia de presión</b> entre dos puntos (a su vez, por diferencia de temperatura).</li>
            <li>La presión se mide con el <span class="term">barómetro</span>. La presión media en las costas de Chile es de unos <b>766 mm</b>. Si la presión <b>baja</b> → viento del ecuador y mal tiempo; si <b>sube</b> → viento del polo, tiempo estable.</li>
            <li>La fuerza del viento se mide con el <span class="term">anemómetro</span> y se clasifica en la <span class="term">escala Beaufort</span> (0 = calma; 12 = huracán).</li>
            <li>Frente a Chile central está el <b>Anticiclón del Pacífico</b> (altas presiones). Vientos de la zona central: <b>enero a marzo</b> Sur/Suroeste (el "surazo"); abril a agosto calma o Norte de mal tiempo.</li>
          </ul>`},
        { h:'Brisas, nubes y frentes', html:`
          <ul>
            <li><span class="term">Virazón</span>: brisa del mar a la tierra durante el <b>día</b> (la tierra se calienta más rápido). <span class="term">Terral</span>: brisa de la tierra al mar por la <b>noche</b>.</li>
            <li>Nubes: <span class="term">cirrus</span> (altas, de hielo, filamentos), <span class="term">cúmulos</span> (algodón, blancas), <span class="term">estratus</span> (bajas, grises, como sábana) y <span class="term">nimbus</span> (grises/negras, dan lluvia).</li>
            <li><span class="term">Frente frío</span>: nubes de gran desarrollo vertical (cumuliformes), chubascos y rachas. <span class="term">Frente cálido</span>: primero cirrus, luego estratos y lluvia progresiva; la presión baja al acercarse.</li>
          </ul>
          <div class="tip">🌊 Respeta los avisos de <b>marejadas</b> de la Armada (mar de fondo con olas grandes aunque no haya viento local fuerte).</div>`},
        { h:'Mareas, corrientes y olas', html:`
          <ul>
            <li><span class="term">Mareas</span>: ascenso (pleamar) y descenso (bajamar) del mar por la atracción de la <b>Luna y el Sol</b>. En Chile son <b>mixtas</b>: 2 altas y 2 bajas al día. Consulta la <span class="term">tabla de mareas del SHOA</span>.</li>
            <li>La costa de Chile está recorrida por la <span class="term">corriente fría de Humboldt</span>.</li>
            <li><span class="term">Olas</span>: ondulaciones producidas por el viento; en ellas el agua <b>no se traslada</b>, solo oscila. Partes: cresta, seno, altura y longitud.</li>
          </ul>`}
      ],
      questions:[
        {q:'Si el barómetro baja rápidamente, lo más probable es que:', o:['Mejore el tiempo','Se aproxime mal tiempo','No cambie nada','Baje la marea'], a:1, e:'Una caída de presión anticipa mal tiempo (viento probable del ecuador). Presión que sube = tiempo estable.'},
        {q:'La escala Beaufort mide:', o:['La altura de la marea','La fuerza del viento','La profundidad','La temperatura del agua'], a:1, e:'Beaufort clasifica la fuerza del viento de 0 (calma) a 12 (huracán) por sus efectos en el mar.'},
        {q:'La "virazón" es la brisa que:', o:['Va de la tierra al mar de noche','Entra del mar a la tierra durante el día','Sopla solo en invierno','Viene de la cordillera'], a:1, e:'De día la tierra se calienta más y la brisa entra del mar (virazón). De noche se invierte: terral.'},
        {q:'Las nubes de gran desarrollo vertical asociadas a chubascos y rachas son típicas de un:', o:['Frente cálido','Frente frío','Anticiclón','Día de calma'], a:1, e:'El frente frío levanta bruscamente el aire cálido y forma nubes cumuliformes con lluvia y viento racheado.'},
        {q:'En Chile las mareas son de tipo:', o:['Diurnas (1 alta y 1 baja)','Mixtas (2 altas y 2 bajas al día)','Sin mareas','Solo de primavera'], a:1, e:'Las mareas en Chile son mixtas: se producen 2 pleamares y 2 bajamares en un día-marea.'},
        {q:'La corriente fría que recorre las costas de Chile es la de:', o:['El Niño','Humboldt','El Golfo','Kuroshio'], a:1, e:'La corriente fría de Humboldt recorre fundamentalmente las costas de Chile.'},
        {q:'En una ola, el agua:', o:['Se traslada con la ola hasta la costa','No se traslada; solo hace un movimiento oscilatorio','Gira en círculos hacia el fondo','Se evapora'], a:1, e:'En mar abierto el agua no se desplaza con la ola, solo oscila; un objeto flotante sube y baja sin avanzar.'},
        {q:'La presión atmosférica se mide con el:', o:['Anemómetro','Barómetro','Termómetro','Higrómetro'], a:1, e:'El barómetro mide la presión; el anemómetro mide la velocidad del viento y el termómetro la temperatura.'},
        {q:'La tabla de mareas y las cartas de Chile las publica principalmente el:', o:['Ministerio del Mar','SHOA (Servicio Hidrográfico y Oceanográfico de la Armada)','Club de yates','SERNAGEOMIN'], a:1, e:'El SHOA / Servicio Hidrográfico de la Armada edita las cartas, tablas de mareas y publicaciones náuticas.'}
      ]
    },

    /* ============================ 5. SEGURIDAD Y PRIMEROS AUXILIOS ============================ */
    { id:'seguridad', icon:'🦺', title:'Seguridad y primeros auxilios',
      sub:'Equipo, chalecos, hipotermia, hemorragias, quemaduras y RCP',
      lessons:[
        { h:'Equipo de seguridad', html:`
          <ul>
            <li><span class="term">Chaleco salvavidas</span> para <b>cada persona</b> a bordo. En bahía se usa el <b>tipo III "Aguas Interiores"</b> (IIIA para niños). Es el elemento más importante y debe usarse en todo momento.</li>
            <li>Equipo mínimo en bahía: <b>chalecos, un achicador y un pito</b>. Se recomienda VHF para enlace con el club o marina.</li>
            <li>En navegaciones mayores se suma: aros salvavidas, bengalas/cohetes, extintores, botiquín, bombas de achique, ancla y cabo, linterna, espejo de señales, balsa salvavidas, EPIRB, etc.</li>
          </ul>
          <div class="tip">🦺 El mejor chaleco es el que llevas <b>puesto</b>. Con niños, mal tiempo o de noche, úsalo siempre.</div>`},
        { h:'Mareo, hipotermia e insolación', html:`
          <ul>
            <li><span class="term">Mareo</span> (cinetosis): náuseas, palidez, sudor. Ayuda mirar el horizonte, tomar aire fresco, ir al centro de la nave y mantenerse ocupado. Un mareo persistente deshidrata.</li>
            <li><span class="term">Hipotermia</span>: temperatura corporal por debajo de lo normal (~26° o menos). En el agua fría <b>no nades</b>: adopta la <b>posición fetal</b> y protege cabeza, cuello, ingles y costados; en grupo, abrázense. Saca del agua en horizontal, quita la ropa mojada, abriga. <b>Nunca frotes</b> los miembros ni des <b>alcohol</b>.</li>
            <li><span class="term">Insolación</span>: piel seca, roja y caliente; confusión. Hay que <b>bajar la temperatura</b>: sombra, agua fría, paños mojados. Prevención: bloqueador, sombrero y ropa que cubra.</li>
          </ul>`},
        { h:'Hemorragias, quemaduras y fracturas', html:`
          <ul>
            <li><span class="term">Hemorragia</span>: aplicar <b>presión directa</b> con paño limpio durante al menos <b>10 minutos</b> hasta que coagule. La pérdida de más del 50% de la sangre es mortal.</li>
            <li><span class="term">Quemaduras</span>: enfriar con agua dulce ~15 min. Grados: 1° piel roja (sol); 2° ampollas; 3° piel blanquecina/negruzca (urgente). <b>No revientes las ampollas</b>. La palma de la mano ≈ 1% de la superficie corporal.</li>
            <li><span class="term">Fracturas</span>: simple (sin herida) o expuesta (con herida). <b>Inmovilizar</b> abarcando desde la articulación superior hasta la inferior; no traccionar fracturas abiertas; cubrir heridas y abrigar.</li>
          </ul>`},
        { h:'Urgencias cardio-respiratorias (RCP)', html:`
          <ul>
            <li>Evalúa la respiración: <b>mira, escucha, siente</b>. Si no respira, inicia respiración artificial en ambiente ventilado, con la vía aérea abierta (cabeza extendida).</li>
            <li>Si <b>no hay pulso</b> (carótida), inicia <span class="term">RCP</span>: masaje cardíaco en el esternón, comprimiendo hacia la columna. Ciclo: <b>30 compresiones y 2 ventilaciones</b>. Si hay pulso aunque sea débil, <b>no</b> se hace masaje.</li>
            <li>Una persona que no respira no está necesariamente muerta, pero está en peligro: actúa rápido.</li>
          </ul>`}
      ],
      questions:[
        {q:'¿Cuántos chalecos salvavidas debe haber a bordo?', o:['Uno por embarcación','Uno por cada persona a bordo','Uno cada dos personas','Solo para el patrón'], a:1, e:'Debe haber un chaleco por cada persona, del talle adecuado y accesible; es el elemento más importante de seguridad.'},
        {q:'El chaleco que se usa en embarcaciones deportivas de bahía es del:', o:['Tipo I Oceánico','Tipo III "Aguas Interiores"','Tipo SOLAS','No se exige chaleco'], a:1, e:'En bahía se usa el tipo III "Aguas Interiores" (IIIA para niños), apto para aguas calmas donde el rescate es rápido.'},
        {q:'El equipo mínimo de seguridad exigido en bahía incluye chalecos, y además:', o:['Un ancla y un radar','Un achicador y un pito','Dos extintores y una balsa','Un GPS y bengalas'], a:1, e:'Para bahía: chalecos, un achicador y un pito. El equipo más completo se exige en navegaciones costeras o de altura.'},
        {q:'En agua fría, esperando rescate y solo, lo recomendable es:', o:['Nadar lo más lejos posible','Quedarse quieto en posición fetal para conservar calor','Quitarse el chaleco','Bucear para calentarse'], a:1, e:'Moverse acelera la pérdida de calor. Con el chaleco puesto, la posición fetal conserva el calor corporal.'},
        {q:'A una persona con hipotermia NUNCA se le debe:', o:['Abrigar en seco','Dar alcohol ni frotar los miembros','Dar bebidas tibias si está consciente','Sacar la ropa mojada'], a:1, e:'El alcohol dilata los vasos y aumenta la pérdida de calor; frotar libera sangre fría al núcleo. Ambos son peligrosos.'},
        {q:'Ante una hemorragia externa, la primera medida es:', o:['Aplicar presión directa sobre la herida','Dar agua a la persona','Mover el miembro','Esperar a que pare sola'], a:0, e:'Presión directa con paño limpio durante al menos 10 minutos hasta que se forme el coágulo.'},
        {q:'En una quemadura con ampollas (segundo grado) se debe:', o:['Reventar las ampollas','Enfriar con agua y NO reventar las ampollas','Aplicar hielo directo','Frotar con sal'], a:1, e:'Se enfría con agua dulce ~15 min y no se revientan las ampollas; se cubre con apósito limpio.'},
        {q:'Al inmovilizar una fractura, el elemento rígido debe abarcar:', o:['Solo el punto del dolor','Desde la articulación superior hasta la inferior de la zona','Todo el cuerpo','Nada, mejor no tocar'], a:1, e:'La inmovilización debe abarcar la articulación por encima y por debajo de la fractura, sin traccionar fracturas abiertas.'},
        {q:'El ciclo de RCP recomendado es:', o:['15 compresiones y 1 ventilación','30 compresiones y 2 ventilaciones','5 compresiones y 5 ventilaciones','Solo ventilaciones'], a:1, e:'Se realizan 30 compresiones en el esternón seguidas de 2 ventilaciones, verificando el pulso periódicamente.'},
        {q:'El masaje cardíaco (compresiones) solo se hace si la persona:', o:['Tiene pulso débil','NO tiene pulso','Está consciente','Respira lento'], a:1, e:'Si hay pulso, aunque sea débil, NO se hace masaje. El masaje solo se aplica en ausencia de pulso.'},
        {q:'Contra el mareo (cinetosis) ayuda:', o:['Bajar a la cabina a leer','Mirar el horizonte, aire fresco e ir al centro de la nave','Beber alcohol','Cerrar los ojos acostado abajo'], a:1, e:'Fijar la vista en el horizonte y estar al aire libre en el centro de la nave, manteniéndose ocupado, reduce el mareo.'}
      ]
    },

    /* ============================ 6. NAVEGACIÓN ============================ */
    { id:'navegacion', icon:'🗺️', title:'Navegación básica',
      sub:'Cartas, coordenadas, rumbos, compás, instrumentos y balizamiento',
      lessons:[
        { h:'La Tierra y las cartas', html:`
          <ul>
            <li><span class="term">Ecuador</span>: círculo máximo que divide la Tierra en hemisferios N y S. <span class="term">Meridianos</span>: pasan por los polos (líneas verticales en la carta). <span class="term">Paralelos</span>: paralelos al ecuador (líneas horizontales).</li>
            <li><span class="term">Latitud</span>: del ecuador al lugar, N o S (0° a 90°). <span class="term">Longitud</span>: del meridiano de <b>Greenwich</b> al lugar, E u O (0° a 180°).</li>
            <li>La <span class="term">carta náutica</span> representa la costa y el mar a escala e incluye <b>sondas</b> (profundidades), naturaleza del fondo, faros, boyas, veriles y peligros. Las publica el <b>SHOA</b>, junto con derroteros, listas de faros y tablas de mareas.</li>
          </ul>
          ${DIAG.rosa}`},
        { h:'Medidas, rumbos y compás', html:`
          <ul>
            <li><span class="term">Milla náutica</span> = <b>1.852 m</b> (un minuto de arco de meridiano). 1 milla = 10 cables; 1 cable ≈ 185 m; 1 braza ≈ 1,83 m. El <span class="term">nudo</span> = 1 milla por hora.</li>
            <li>Para medir distancia en la carta se usa la <b>escala de latitudes</b> (a los costados): cada minuto = 1 milla.</li>
            <li><span class="term">Rumbo</span>: ángulo de la línea proa-popa con el norte, de <b>000° a 360°</b> en sentido horario. La <span class="term">rosa de los vientos</span> divide el horizonte en 32 partes.</li>
            <li>El <span class="term">compás magnético</span> apunta al norte magnético. La <span class="term">declinación magnética</span> (variación) es la diferencia con el norte geográfico; el <span class="term">desvío</span> lo causan los hierros de a bordo.</li>
          </ul>`},
        { h:'Instrumentos y comunicaciones', html:`
          <ul>
            <li><span class="term">GPS</span>: da posición por satélites (dónde estoy, hacia dónde voy y a qué velocidad). Lleva siempre carta y compás de respaldo.</li>
            <li><span class="term">Ecosonda</span>: mide la profundidad por eco acústico. <span class="term">Corredera</span>: mide la velocidad/distancia navegada.</li>
            <li><span class="term">VHF</span> (156–174 MHz): comunicaciones de corto alcance. <b>Escucha antes de transmitir</b>. Canal <b>16</b> = socorro y llamada.</li>
          </ul>`},
        { h:'Balizamiento IALA — Región B (Chile)', html:`
          <p>Chile pertenece a la <b>Región B</b>. Al <b>entrar</b> a puerto (regresando del mar):</p>
          ${DIAG.iala}
          <ul>
            <li>Marcas laterales de <span class="term">estribor</span>: <b>ROJAS</b> (cónicas). Regla: "<i>rojo a estribor al entrar</i>".</li>
            <li>Marcas laterales de <span class="term">babor</span>: <b>VERDES</b> (cilíndricas).</li>
            <li><span class="term">Cardinales</span> (N, S, E, O): indican por qué lado pasar un peligro. <span class="term">Aguas seguras</span>: franjas rojas y blancas verticales.</li>
          </ul>
          <div class="tip">🚨 En Europa (Región A) es al revés. Recuerda: en Chile, <b>rojo a estribor al entrar</b>.</div>`}
      ],
      questions:[
        {q:'Una milla náutica equivale a:', o:['1.000 m','1.609 m','1.852 m','2.000 m'], a:2, e:'La milla náutica son 1.852 m (un minuto de arco de meridiano). El nudo es 1 milla náutica por hora.'},
        {q:'Un "nudo" es una unidad de:', o:['Distancia','Velocidad','Profundidad','Presión'], a:1, e:'El nudo es velocidad: 1 milla náutica por hora.'},
        {q:'La longitud se mide a partir del:', o:['Ecuador','Meridiano de Greenwich','Polo magnético','Trópico de Capricornio'], a:1, e:'La longitud se cuenta desde el meridiano de Greenwich, E u O (0° a 180°). La latitud se cuenta desde el ecuador.'},
        {q:'En una carta náutica, las "sondas" indican:', o:['La altura de los faros','La profundidad del agua','La distancia a la costa','La fuerza del viento'], a:1, e:'Las sondas son las cifras de profundidad; una letra debajo indica la naturaleza del fondo (a=arena, f=fango, r=roca).'},
        {q:'Los rumbos se miden de:', o:['0° a 90°','000° a 360° en sentido horario desde el Norte','0° a 180°','1 a 32'], a:1, e:'El rumbo circular va de 000° a 360° en sentido de las agujas del reloj partiendo del Norte.'},
        {q:'La "declinación magnética" (variación) es:', o:['El error del GPS','La diferencia entre el norte magnético y el geográfico','La inclinación de la nave','La marea del día'], a:1, e:'Es el ángulo entre el norte al que apunta el compás (magnético) y el norte geográfico; varía según lugar y fecha.'},
        {q:'En el sistema IALA Región B (Chile), al entrar a puerto las boyas rojas se dejan a:', o:['Babor','Estribor','Ambos lados','No hay boyas rojas'], a:1, e:'Región B: "rojo a estribor al entrar". Las marcas rojas (cónicas) quedan a estribor y las verdes (cilíndricas) a babor.'},
        {q:'La distancia sobre la carta se mide usando la escala de:', o:['Longitudes (arriba y abajo)','Latitudes (a los costados): cada minuto = 1 milla','El título de la carta','La rosa náutica'], a:1, e:'Se usa la escala de latitudes de los márgenes izquierdo o derecho: cada minuto de latitud equivale a una milla náutica.'},
        {q:'El instrumento que mide la profundidad por eco acústico es la:', o:['Corredera','Ecosonda','Veleta','Corredera de barquilla'], a:1, e:'La ecosonda mide la profundidad emitiendo pulsos y midiendo el eco. La corredera mide velocidad/distancia.'},
        {q:'El canal VHF internacional de socorro y llamada es el:', o:['Canal 6','Canal 9','Canal 16','Canal 70'], a:2, e:'El canal 16 de VHF es el de socorro y llamada. El 70 se usa para la Llamada Selectiva Digital (LLSD/DSC).'},
        {q:'Aunque lleves GPS, siempre conviene tener a bordo:', o:['Solo el GPS','Carta náutica y compás de respaldo','Únicamente el celular','Nada más'], a:1, e:'La electrónica puede fallar o quedarse sin energía; carta y compás son el respaldo imprescindible.'}
      ]
    },

    /* ============================ 7. RIPA ============================ */
    { id:'ripa', icon:'🚦', title:'RIPA — Prevención de abordajes',
      sub:'Reglas de rumbo, luces, marcas, señales acústicas y de socorro',
      lessons:[
        { h:'Reglas de rumbo y gobierno', html:`
          <p>El <span class="term">RIPA</span> (Reglamento Internacional para Prevenir Abordajes) se aplica a los buques que se ven uno a otro.</p>
          ${DIAG.ripa}
          <ul>
            <li><b>Cruce (Regla 15)</b>: el buque que tiene al otro por su <b>estribor</b> maniobra (cede). Toca <b>1 pitada</b> ("caigo a estribor"). El otro mantiene rumbo y velocidad.</li>
            <li><b>Vuelta encontrada (Regla 14)</b>: de frente, ambos caen a <b>estribor</b> y se cruzan babor con babor. <i>"Si ambas luces de un vapor por la proa has avistado, has de caer a estribor…"</i></li>
            <li><b>Alcance (Regla 13)</b>: el que <b>alcanza</b> a otro por detrás se mantiene apartado y cede el paso.</li>
            <li>El que cede maniobra pronto y de forma clara (Regla 16); el que sigue mantiene rumbo y velocidad (Regla 17), pero actúa si el otro no maniobra.</li>
          </ul>`},
        { h:'Preferencias entre buques', html:`
          <p>Un buque de propulsión mecánica se mantiene apartado de (en este orden):</p>
          <ul>
            <li>1. Buque <b>sin gobierno</b>.</li>
            <li>2. Buque con <b>capacidad de maniobra restringida</b>.</li>
            <li>3. Buque <b>dedicado a la pesca</b>.</li>
            <li>4. Buque de <b>vela</b>.</li>
          </ul>
          <p>El velero también cede ante los sin gobierno, restringidos y pesqueros. Entre dos veleros: el que recibe el viento por <b>babor</b> cede; si es por la misma banda, cede el que está a <b>barlovento</b>.</p>
          <div class="tip">⛵ "Entre un vapor y un velero, gobierna siempre el primero": el buque a motor cede ante el velero.</div>`},
        { h:'Luces de navegación', html:`
          <p>Se llevan desde la puesta hasta la salida del sol y con visibilidad reducida.</p>
          ${DIAG.luces}
          <ul>
            <li><span class="term">Luz de tope</span>: blanca, 225°, hacia proa. <span class="term">Luces de costado</span>: verde a estribor y roja a babor, 112,5° c/u (en naves &lt; 20 m pueden ir combinadas en un farol).</li>
            <li><span class="term">Luz de alcance</span>: blanca a popa, 135°. <span class="term">Luz de remolque</span>: amarilla. <span class="term">Todo horizonte</span>: 360°.</li>
            <li>Un buque a motor navegando muestra tope, costados y alcance. Un velero a vela: solo costados y alcance (sin luz de tope de motor).</li>
          </ul>`},
        { h:'Marcas, señales acústicas y de socorro', html:`
          <ul>
            <li>Marcas de día: <b>1 esfera</b> = fondeado; <b>2 esferas</b> = sin gobierno; <b>3 esferas</b> = varado; <b>cono con vértice abajo</b> = velero a motor y vela; bola-rombo-bola = maniobra restringida.</li>
            <li>Señales acústicas (a la vista): <b>1 corta</b> = caigo a estribor; <b>2 cortas</b> = caigo a babor; <b>3 cortas</b> = doy atrás; <b>5 o más cortas</b> = duda/peligro.</li>
            <li>Niebla: buque a motor <b>navegando</b> = 1 sonido largo cada 2 min; <b>parado</b> = 2 largos. Vela/pesca/sin gobierno/restringido = 1 largo + 2 cortos.</li>
            <li>Señales de socorro: <b>Mayday</b> (radio), bengala/cohete de luz <b>roja</b>, humo <b>naranja</b>, SOS Morse, bandera con bola encima o debajo, brazos subiendo y bajando lentamente, señal "NC".</li>
          </ul>`}
      ],
      questions:[
        {q:'En un cruce, ¿quién cede el paso?', o:['El que ve al otro por su babor','El que ve al otro por su estribor','El más grande','El más rápido'], a:1, e:'El buque que tiene al otro por su estribor maniobra (cede) y toca una pitada corta. El otro mantiene rumbo y velocidad.'},
        {q:'Dos buques a motor de frente (vuelta encontrada) deben:', o:['Caer ambos a babor','Caer ambos a estribor y cruzarse babor con babor','Mantener rumbo','Detenerse los dos'], a:1, e:'En vuelta encontrada ambos caen a estribor y se cruzan babor con babor (rojo con rojo).'},
        {q:'Un buque que alcanza a otro por detrás:', o:['Tiene preferencia','Debe apartarse y ceder el paso','Debe acelerar para pasar','Toca 3 pitadas y sigue'], a:1, e:'El que alcanza se mantiene apartado del alcanzado, sea cual sea el tipo de buque.'},
        {q:'La luz de costado de estribor es de color:', o:['Roja','Verde','Blanca','Amarilla'], a:1, e:'Estribor = verde; babor = rojo. Cada luz de costado cubre 112,5°.'},
        {q:'¿Qué significan "2 pitadas cortas"?', o:['Caigo a estribor','Caigo a babor','Doy atrás','Peligro'], a:1, e:'1 corta = caigo a estribor; 2 cortas = caigo a babor; 3 cortas = máquina atrás; 5 o más = duda/peligro.'},
        {q:'Cinco o más pitadas cortas y seguidas indican:', o:['Saludo','Duda o peligro','Que va a fondear','Cambio de tripulación'], a:1, e:'Es la señal de duda o peligro: "no entiendo sus intenciones / gobierne para evitar la colisión".'},
        {q:'Un buque a motor debe apartarse de un buque:', o:['Más pequeño','De vela, de pesca o sin gobierno','Del mismo tamaño','Ninguno'], a:1, e:'El buque a motor, más maniobrable, cede ante sin gobierno, maniobra restringida, pesca y vela.'},
        {q:'Una sola esfera negra izada de día indica buque:', o:['Sin gobierno','Fondeado','Varado','Pescando'], a:1, e:'1 esfera = fondeado; 2 esferas = sin gobierno; 3 esferas = varado.'},
        {q:'Entre dos veleros con el viento por bandas distintas, cede el que:', o:['Recibe el viento por estribor','Recibe el viento por babor','Va más rápido','Es más grande'], a:1, e:'El velero que recibe el viento por babor cede al que lo recibe por estribor.'},
        {q:'Con niebla, un buque a motor navegando (con arrancada) emite:', o:['Silencio','1 sonido largo cada 2 minutos','3 cortos continuos','Una campana'], a:1, e:'Con visibilidad reducida, un buque de propulsión mecánica con arrancada da un sonido largo a intervalos no mayores de 2 minutos.'},
        {q:'Un cono negro con el vértice hacia abajo indica:', o:['Buque fondeado','Velero que además usa motor','Buque de pesca','Buque sin gobierno'], a:1, e:'El cono con vértice abajo señala un buque a vela que también propulsa con motor.'},
        {q:'El color de las bengalas de socorro es:', o:['Verde','Azul','Rojo','Blanco'], a:2, e:'Las bengalas y cohetes de socorro dan luz roja; de día también se usa humo naranja.'}
      ]
    },

    /* ============================ 8. EMERGENCIAS ============================ */
    { id:'emergencias', icon:'🆘', title:'Emergencias a bordo',
      sub:'Hombre al agua, incendio, vía de agua, VHF y socorro',
      lessons:[
        { h:'Hombre al agua', html:`
          <ul>
            <li>Grita "<b>¡Hombre al agua!</b>", lanza de inmediato un aro/objeto flotante y <b>no pierdas de vista</b> a la persona; designa a alguien que la señale con el brazo.</li>
            <li>Maniobra de regreso para acercarte por <b>sotavento</b>, con la nave frenada. Antes de virar, comprueba que no haya cabos en el agua que enreden la hélice.</li>
            <li><b>Cuidado con la hélice</b>: pon el motor en <b>neutro</b> al aproximarte a la persona. Lo importante es recogerla cuanto antes.</li>
          </ul>`},
        { h:'Incendio, vía de agua y varada', html:`
          <ul>
            <li><b>Incendio</b>: corta el combustible/energía de la zona, usa el <span class="term">extintor</span> apuntando a la <b>base</b> de las llamas (barriendo). En fuego de motor, no abras de golpe la tapa (entra oxígeno).</li>
            <li><b>Vía de agua</b>: localiza y tapona la brecha, achica con bomba o balde y navega al punto seguro más cercano; reparte el peso para no desestabilizar.</li>
            <li><b>Varada</b> (encallar): revisa si hay vía de agua y evalúa la marea; muchas veces conviene esperar la <b>pleamar</b> para reflotar sin dañar el casco.</li>
          </ul>`},
        { h:'Comunicaciones y señales de socorro', html:`
          <ul>
            <li>La <span class="term">VHF canal 16</span> es el canal internacional de socorro y llamada. La palabra de socorro es "<b>MAYDAY</b>" (del francés <i>m'aider</i>), transmitida <b>tres veces</b>.</li>
            <li>El mensaje incluye: MAYDAY x3, "AQUÍ" + nombre de la nave x3, <b>posición</b> (lat. y long.), naturaleza del peligro y auxilio solicitado, y personas a bordo.</li>
            <li><span class="term">PAN-PAN</span>: urgencia sin peligro inmediato de vida. <span class="term">SÉCURITÉ</span>: aviso de seguridad. La llamada de socorro tiene <b>prioridad absoluta</b>: todos callan y escuchan.</li>
            <li>Otras señales: cohetes/bengalas rojas, humo naranja, SOS Morse, EPIRB, disparos a intervalos de 1 min, brazos subiendo y bajando.</li>
          </ul>
          <div class="tip">📻 Memoriza: <b>canal 16 = socorro</b>. Da siempre tu <b>posición</b> primero; sin ella, el rescate es mucho más lento.</div>`}
      ],
      questions:[
        {q:'Lo PRIMERO al caer una persona al agua es:', o:['Bajar a buscar chalecos','Lanzar un flotador y no perderla de vista','Llamar a la familia','Anotar la hora'], a:1, e:'Se lanza de inmediato un objeto flotante, se grita "hombre al agua" y alguien la señala sin quitarle la vista.'},
        {q:'Al aproximarte para recoger a la persona, el motor debe estar:', o:['A toda potencia','En neutro para evitar la hélice','En marcha atrás fuerte','Siempre apagado'], a:1, e:'Poner el motor en neutro al acercarse evita que la hélice hiera a la persona. Se recoge por sotavento.'},
        {q:'Antes de virar hacia la persona en el agua, hay que comprobar que:', o:['El GPS funcione','No haya cabos en el agua que enreden la hélice','El ancla esté lista','Haya combustible de sobra'], a:1, e:'Cabos sueltos en el agua pueden enredarse en la hélice y dejar sin propulsión justo cuando más se necesita.'},
        {q:'¿Cuál es el canal internacional de socorro en VHF?', o:['Canal 6','Canal 9','Canal 16','Canal 72'], a:2, e:'El canal 16 de VHF es el canal internacional de socorro, urgencia y llamada.'},
        {q:'La palabra de socorro ante peligro de vida se transmite:', o:['Una vez','Dos veces','Tres veces (MAYDAY, MAYDAY, MAYDAY)','Cuatro veces'], a:2, e:'MAYDAY se transmite tres veces. Proviene de la expresión francesa «m’aider» (ayúdenme).'},
        {q:'En un mensaje de socorro, el dato MÁS importante es:', o:['El color de la nave','Tu posición','La marca del motor','La hora de zarpe'], a:1, e:'Sin la posición el rescate es lento. Se da nombre, posición, naturaleza de la emergencia y personas a bordo.'},
        {q:'Con un extintor se apunta a:', o:['La parte alta de las llamas','La base del fuego, barriendo','El humo','Las paredes'], a:1, e:'Se dirige el agente a la base de las llamas con movimiento de barrido, atacando el combustible que arde.'},
        {q:'Ante una vía de agua debes:', o:['Acelerar mar adentro','Taponar la brecha, achicar y ir al punto seguro más cercano','Ignorarla si es pequeña','Detener todo y esperar'], a:1, e:'Se localiza y tapona la entrada de agua, se achica con bomba o balde y se navega al lugar seguro más próximo.'},
        {q:'"PAN-PAN" en la radio indica:', o:['Peligro de vida inminente','Urgencia sin peligro inmediato de vida','Fin de comunicación','Prueba de radio'], a:1, e:'PAN-PAN señala urgencia (p. ej. una avería seria) sin peligro inmediato de vida; MAYDAY es peligro grave e inminente.'},
        {q:'Si encallas (varada) sin vía de agua, una opción prudente es:', o:['Acelerar fuerte siempre','Evaluar la marea y esperar la pleamar','Saltar todos al agua','Abandonar la nave'], a:1, e:'Primero se verifica que no haya vía de agua; a menudo conviene esperar que suba la marea para reflotar sin dañar el casco.'},
        {q:'La llamada de socorro por radio tiene:', o:['La misma prioridad que otras','Prioridad absoluta: las demás estaciones callan y escuchan','Prioridad solo de noche','Que esperar turno'], a:1, e:'La llamada de socorro tiene prioridad absoluta; todas las estaciones cesan transmisiones que puedan perturbarla.'}
      ]
    },

    /* ============================ 9. VELA (COMPLEMENTARIO) ============================ */
    { id:'vela', icon:'⛵', title:'Navegación a vela', complementary:true,
      sub:'Complementario · aparejo, rumbos al viento y maniobras',
      lessons:[
        { h:'Aparejo, velas y jarcias', html:`
          <p>El <b>patrón deportivo completo</b> incluye vela y motor. Este módulo es complementario y no entra en el examen simulado base.</p>
          <ul>
            <li><span class="term">Vela mayor</span>: vela principal, envergada en el palo mayor. <span class="term">Foque</span>: vela triangular de proa, envergada en el estay.</li>
            <li>Partes de una vela: <span class="term">grátil</span> (lado de proa/unión al palo), <span class="term">baluma</span> (lado de popa), <span class="term">pujamen</span> (lado inferior) y los <span class="term">puños</span> (driza, amura y escota).</li>
            <li><span class="term">Jarcia firme</span>: cables fijos que sostienen los palos (obenques, estayes). <span class="term">Jarcia de labor</span>: cabos para izar y orientar (drizas para izar, escotas para bracear las velas).</li>
            <li><span class="term">Barlovento</span>: de donde viene el viento; <span class="term">sotavento</span>: el lado opuesto.</li>
          </ul>`},
        { h:'Rumbos respecto al viento', html:`
          <p>Un velero no puede navegar directo contra el viento (hay una "zona muerta" de ~45° a cada lado):</p>
          ${DIAG.vela}
          <ul>
            <li><span class="term">Ceñir</span>: rumbo con el menor ángulo posible al viento (fuera de la zona muerta).</li>
            <li><span class="term">De través</span>: viento por el través (~90°).</li>
            <li><span class="term">A un largo</span>: viento por la aleta.</li>
            <li><span class="term">En popa (empopada)</span>: viento por la popa; se abren las velas a cada banda ("orejas de burro").</li>
          </ul>
          <div class="tip">💨 <b>Viento real</b>: el debido al desplazamiento de masas de aire. <b>Viento aparente</b>: combinación del real con el que produce el propio movimiento del barco — es el que "sienten" las velas.</div>`},
        { h:'Maniobras a vela', html:`
          <ul>
            <li><span class="term">Cazar</span>: cobrar la escota (la vela forma menor ángulo con la crujía). <span class="term">Lascar</span>: soltar la escota. <span class="term">Portar</span>: la vela bien orientada; <span class="term">flamear</span>: la vela ondea mal orientada.</li>
            <li><span class="term">Orzar</span>: acercar la proa al viento. <span class="term">Arribar/caer</span>: alejar la proa del viento.</li>
            <li><span class="term">Virar por avante</span>: la <b>proa</b> pasa por la línea del viento. <span class="term">Virar por redondo (trasluchar)</span>: la <b>popa</b> pasa por el viento (la botavara cambia de banda).</li>
            <li>Un velero <b>no se detiene bruscamente</b>: para frenar se orza proa al viento o se lascan escotas hasta que las velas flameen.</li>
          </ul>`}
      ],
      questions:[
        {q:'"Ceñir" significa navegar:', o:['Con el viento por la popa','Con el menor ángulo posible respecto al viento','Con las velas arriadas','A motor'], a:1, e:'Ceñir es navegar formando el menor ángulo posible con la dirección del viento, justo fuera de la zona muerta.'},
        {q:'La vela triangular de proa envergada en el estay es el:', o:['Mayor','Foque','Spinnaker','Tormentín'], a:1, e:'El foque es la vela triangular colocada a proa, envergada en el estay.'},
        {q:'Navegar "en popa" (empopada) es recibir el viento por:', o:['La proa','El través','La popa','La quilla'], a:2, e:'En popa el viento entra por detrás; se pueden abrir las velas a cada banda ("orejas de burro").'},
        {q:'"Cazar" una vela es:', o:['Soltar la escota','Cobrar la escota para reducir el ángulo con la crujía','Arriar la vela','Romper la vela'], a:1, e:'Cazar es cobrar (entrar) la escota; lascar es lo contrario, soltarla.'},
        {q:'La maniobra en que la PROA pasa por la línea del viento se llama:', o:['Virada por avante','Virada por redondo','Trasluchada','Arribada'], a:0, e:'En la virada por avante la proa cruza el viento; en la virada por redondo lo cruza la popa (trasluchar).'},
        {q:'El "viento aparente" es:', o:['El viento real sin cambios','La combinación del viento real con el movimiento del barco','El viento de tierra','El viento medido en puerto'], a:1, e:'El viento aparente es el que resulta de sumar el viento real y el generado por el propio desplazamiento del barco; es el que reciben las velas.'},
        {q:'"Barlovento" es la parte:', o:['Hacia donde va el viento','De donde viene el viento','Trasera del barco','Sumergida'], a:1, e:'Barlovento = de donde viene el viento; sotavento = el lado opuesto (protegido).'},
        {q:'La jarcia "de labor" está compuesta por los cabos que sirven para:', o:['Sostener fijos los palos','Izar y orientar las velas (drizas, escotas)','Fondear','Amarrar al muelle'], a:1, e:'La jarcia de labor (drizas, escotas) se usa para izar, orientar y arriar el aparejo; la jarcia firme sostiene los palos.'},
        {q:'Para detener un velero se puede:', o:['Frenar en seco con el timón','Orzar proa al viento o lascar escotas hasta que las velas flameen','Dar marcha atrás con las velas','Soltar el ancla a toda velocidad'], a:1, e:'Un velero no se detiene bruscamente: se orza proa al viento o se sueltan escotas para que las velas dejen de propulsar.'}
      ]
    }
  ];

  return MODULES;
})();

/* Diagramas adicionales que se agregan al final de una lección:
   PL_FIGS[moduleId][lessonIndex] = [figId, ...] */
var PL_FIGS = {
  nautica:      { 1: ['estructura', 'cabo'], 2: ['nudos'], 3: ['movimientos', 'fondeo'] },
  reglamentacion: { 3: ['playa'] },
  motores:      { 0: ['cuatro'], 1: ['fueraborda'], 2: ['tercio'] },
  meteo:        { 0: ['beaufort'], 1: ['brisas', 'nubes'], 2: ['ola', 'marea'] },
  seguridad:    { 0: ['equipo'] },
  navegacion:   { 0: ['coordenadas'], 1: ['carta'] },
  ripa:         { 1: ['preferencias'], 3: ['marcas', 'sonido'] },
  emergencias:  { 0: ['mob'], 2: ['mayday'] },
  vela:         { 0: ['velas'] }
};
