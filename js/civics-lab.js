/* ================================================================
   CIVICS LAB — civics-lab.js
   Factual, non-partisan civics: Chilean government structure +
   comparative civics. Hand-authored content, no external APIs.

   Strict content rules (per issue #166):
   - Mechanics over personalities — *how* government works
   - Historical foundational facts only (dates, founding figures)
   - No current parties, politicians, or political commentary
   - No social-issue framing — clears the suite's grep hook

   Requires: auth.js, sounds.js, activity-log.js, zs-diag.js
   ================================================================ */

const CivicsLab = (() => {
  'use strict';

  const STORE_PREFIX = 'zs_civics_';

  // ── Three Branches of the Chilean government ─────────────────────
  const BRANCHES = [
    {
      id: 'ejecutivo',
      icon: '🏛️',
      title: { en: 'Executive Branch', es: 'Poder Ejecutivo' },
      head:  { en: 'President of the Republic', es: 'Presidente/a de la República' },
      term:  { en: '4 years (no immediate re-election)', es: '4 años (sin reelección inmediata)' },
      seat:  { en: 'La Moneda Palace, Santiago', es: 'Palacio de La Moneda, Santiago' },
      role: {
        en: 'Carries out laws, leads the country, names ministers, and represents Chile abroad. Heads the armed forces and signs international treaties.',
        es: 'Aplica las leyes, dirige el país, nombra a los ministros y representa a Chile en el extranjero. Encabeza las Fuerzas Armadas y firma tratados internacionales.'
      },
      quiz: [
        { q: { en: 'How long is the President\'s term in Chile?', es: '¿Cuánto dura el mandato del Presidente en Chile?' },
          options: { en: ['2 years','4 years','6 years','8 years'], es: ['2 años','4 años','6 años','8 años'] }, answer: 1, tier: 'beginner',
          explain: { en: 'The President of Chile serves a fixed 4-year term.', es: 'El Presidente de Chile cumple un mandato fijo de 4 años.' } },
        { q: { en: 'Where does the Chilean President work?', es: '¿Dónde trabaja el Presidente de Chile?' },
          options: { en: ['The Congress','The Supreme Court','La Moneda','The Stock Exchange'], es: ['El Congreso','La Corte Suprema','La Moneda','La Bolsa'] }, answer: 2, tier: 'beginner',
          explain: { en: 'La Moneda Palace in Santiago is the seat of the executive branch.', es: 'El Palacio de La Moneda, en Santiago, es la sede del poder ejecutivo.' } },
        { q: { en: 'Can a Chilean President be re-elected immediately?', es: '¿Puede el Presidente chileno ser reelegido inmediatamente?' },
          options: { en: ['Yes, twice','Yes, once','No','Only with Congress approval'], es: ['Sí, dos veces','Sí, una vez','No','Sólo con aprobación del Congreso'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'The Constitution bars immediate re-election; a former President may run again later.', es: 'La Constitución prohíbe la reelección inmediata; un ex Presidente puede postular de nuevo más adelante.' } },
        { q: { en: 'If the President vetoes a bill, how can Congress still pass it?', es: 'Si el Presidente veta un proyecto, ¿cómo puede el Congreso aprobarlo igual?' },
          options: { en: ['Simple majority','A two-thirds vote in both chambers','A Supreme Court order','It cannot be passed'], es: ['Mayoría simple','Dos tercios en ambas cámaras','Una orden de la Corte Suprema','No puede aprobarse'] }, answer: 1, tier: 'advanced',
          explain: { en: 'A presidential veto is overridden only if both chambers re-approve the original text by two-thirds.', es: 'Un veto presidencial se supera sólo si ambas cámaras reaprueban el texto original por dos tercios.' } },
        { q: { en: 'What is a "decreto supremo"?', es: '¿Qué es un "decreto supremo"?' },
          options: { en: ['A law passed by Congress','An order issued by the President to carry out the law','A ruling of the Supreme Court','A treaty with another country'], es: ['Una ley aprobada por el Congreso','Una orden del Presidente para ejecutar la ley','Un fallo de la Corte Suprema','Un tratado con otro país'] }, answer: 1, tier: 'advanced',
          explain: { en: 'A "decreto supremo" is an executive order the President uses to apply the law.', es: 'Un "decreto supremo" es una orden del Ejecutivo que el Presidente usa para aplicar la ley.' } },
        { q: { en: 'Who formally appoints government ministers in Chile?', es: '¿Quién nombra formalmente a los ministros de Estado en Chile?' },
          options: { en: ['The Senate','The President','The Supreme Court','The voters'], es: ['El Senado','El Presidente','La Corte Suprema','Los votantes'] }, answer: 1, tier: 'intermediate',
          explain: { en: 'Ministers are appointed and removed freely by the President.', es: 'Los ministros son nombrados y removidos libremente por el Presidente.' } }
      ]
    },
    {
      id: 'legislativo',
      icon: '📜',
      title: { en: 'Legislative Branch', es: 'Poder Legislativo' },
      head:  { en: 'National Congress (bicameral)', es: 'Congreso Nacional (bicameral)' },
      term:  { en: 'Deputies: 4 years · Senators: 8 years', es: 'Diputados/as: 4 años · Senadores/as: 8 años' },
      seat:  { en: 'Congress building, Valparaíso', es: 'Edificio del Congreso, Valparaíso' },
      role: {
        en: 'Writes, debates, and approves laws. The Chamber of Deputies has 155 members and the Senate has 50. Both chambers must agree on a bill for it to become law.',
        es: 'Redacta, debate y aprueba leyes. La Cámara de Diputados/as tiene 155 miembros y el Senado tiene 50. Ambas cámaras deben acordar un proyecto para que se convierta en ley.'
      },
      quiz: [
        { q: { en: 'How many chambers does the Chilean Congress have?', es: '¿Cuántas cámaras tiene el Congreso chileno?' },
          options: { en: ['One','Two','Three','Four'], es: ['Una','Dos','Tres','Cuatro'] }, answer: 1, tier: 'beginner',
          explain: { en: 'Chile has a bicameral Congress: the Chamber of Deputies and the Senate.', es: 'Chile tiene un Congreso bicameral: la Cámara de Diputados y el Senado.' } },
        { q: { en: 'In which city does the Chilean Congress sit?', es: '¿En qué ciudad se reúne el Congreso de Chile?' },
          options: { en: ['Santiago','Concepción','Valparaíso','La Serena'], es: ['Santiago','Concepción','Valparaíso','La Serena'] }, answer: 2, tier: 'beginner',
          explain: { en: 'The National Congress has sat in Valparaíso since 1990.', es: 'El Congreso Nacional sesiona en Valparaíso desde 1990.' } },
        { q: { en: 'How many senators serve in Chile?', es: '¿Cuántos senadores hay en Chile?' },
          options: { en: ['30','50','100','155'], es: ['30','50','100','155'] }, answer: 1, tier: 'intermediate',
          explain: { en: 'The Senate has 50 members; the Chamber of Deputies has 155.', es: 'El Senado tiene 50 miembros; la Cámara de Diputados tiene 155.' } },
        { q: { en: 'How much of the Senate is renewed at each election?', es: '¿Qué parte del Senado se renueva en cada elección?' },
          options: { en: ['All of it','One half','One third','One quarter'], es: ['Todo el Senado','La mitad','Un tercio','Un cuarto'] }, answer: 1, tier: 'advanced',
          explain: { en: 'Senators serve 8 years and the chamber is renewed by halves every 4 years.', es: 'Los senadores duran 8 años y la cámara se renueva por mitades cada 4 años.' } },
        { q: { en: 'What vote is generally needed to approve a "ley orgánica constitucional"?', es: '¿Qué votación se necesita en general para aprobar una "ley orgánica constitucional"?' },
          options: { en: ['Simple majority','Four-sevenths of sitting members','Two-thirds','Unanimity'], es: ['Mayoría simple','Cuatro séptimos de los miembros en ejercicio','Dos tercios','Unanimidad'] }, answer: 1, tier: 'expert',
          explain: { en: 'A "ley orgánica constitucional" needs four-sevenths of the members in office.', es: 'Una "ley orgánica constitucional" requiere cuatro séptimos de los miembros en ejercicio.' } },
        { q: { en: 'Before a full vote, where is a bill first studied in detail?', es: 'Antes de la votación en sala, ¿dónde se estudia primero un proyecto en detalle?' },
          options: { en: ['In a specialised committee','In the Supreme Court','In La Moneda','In the Central Bank'], es: ['En una comisión especializada','En la Corte Suprema','En La Moneda','En el Banco Central'] }, answer: 0, tier: 'advanced',
          explain: { en: 'Bills are first examined by a specialised committee before the floor vote.', es: 'Los proyectos se estudian primero en una comisión especializada antes de votarse en sala.' } }
      ]
    },
    {
      id: 'judicial',
      icon: '⚖️',
      title: { en: 'Judicial Branch', es: 'Poder Judicial' },
      head:  { en: 'Supreme Court of Justice', es: 'Corte Suprema de Justicia' },
      term:  { en: 'Justices serve until age 75', es: 'Los/as ministros/as sirven hasta los 75 años' },
      seat:  { en: 'Palacio de Tribunales, Santiago', es: 'Palacio de Tribunales, Santiago' },
      role: {
        en: 'Applies and interprets the law in disputes. The Supreme Court has 21 justices proposed by the President from a list of 5 selected by the court itself, and must be ratified by the Senate.',
        es: 'Aplica e interpreta la ley en los conflictos. La Corte Suprema tiene 21 ministros propuestos por el Presidente desde una lista de 5 elaborada por la propia corte, y deben ser ratificados por el Senado.'
      },
      quiz: [
        { q: { en: 'What is the highest court in Chile?', es: '¿Cuál es el tribunal más alto en Chile?' },
          options: { en: ['Constitutional Tribunal','Supreme Court','Court of Appeals','Contraloría'], es: ['Tribunal Constitucional','Corte Suprema','Corte de Apelaciones','Contraloría'] }, answer: 1, tier: 'beginner',
          explain: { en: 'The Supreme Court is the highest court in the ordinary judicial system.', es: 'La Corte Suprema es el tribunal más alto del sistema judicial ordinario.' } },
        { q: { en: 'At what age must Chilean Supreme Court justices retire?', es: '¿A qué edad deben jubilarse los ministros de la Corte Suprema?' },
          options: { en: ['65','70','75','80'], es: ['65','70','75','80'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'Justices leave office at age 75.', es: 'Los ministros cesan en el cargo a los 75 años.' } },
        { q: { en: 'Who must ratify the Supreme Court justices?', es: '¿Quién debe ratificar a los ministros de la Corte Suprema?' },
          options: { en: ['The Chamber of Deputies','The President alone','The Senate','The Constitutional Tribunal'], es: ['La Cámara de Diputados','El Presidente solo','El Senado','El Tribunal Constitucional'] }, answer: 2, tier: 'advanced',
          explain: { en: 'The President proposes each justice, and the Senate must ratify the appointment.', es: 'El Presidente propone a cada ministro y el Senado debe ratificar el nombramiento.' } },
        { q: { en: 'How many justices serve on the Chilean Supreme Court?', es: '¿Cuántos ministros tiene la Corte Suprema de Chile?' },
          options: { en: ['7','11','21','50'], es: ['7','11','21','50'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'The Supreme Court is composed of 21 justices.', es: 'La Corte Suprema está compuesta por 21 ministros.' } },
        { q: { en: 'From whose list does the President propose a Supreme Court justice?', es: '¿De qué lista propone el Presidente a un ministro de la Corte Suprema?' },
          options: { en: ['A list of 5 made by the Court itself','A list made by the Senate','A list made by voters','A list made by the Contraloría'], es: ['Una lista de 5 hecha por la propia Corte','Una lista hecha por el Senado','Una lista hecha por los votantes','Una lista hecha por la Contraloría'] }, answer: 0, tier: 'expert',
          explain: { en: 'The Court itself draws up a list of 5 (a "quina"), from which the President picks one for Senate ratification.', es: 'La propia Corte elabora una lista de 5 (una "quina"), de la que el Presidente elige a uno para ratificación del Senado.' } },
        { q: { en: 'What does the judicial branch mainly do?', es: '¿Qué hace principalmente el Poder Judicial?' },
          options: { en: ['Write new laws','Apply and interpret the law in disputes','Collect taxes','Command the armed forces'], es: ['Redactar nuevas leyes','Aplicar e interpretar la ley en los conflictos','Recaudar impuestos','Comandar las Fuerzas Armadas'] }, answer: 1, tier: 'beginner',
          explain: { en: 'The judicial branch applies and interprets the law to resolve disputes.', es: 'El Poder Judicial aplica e interpreta la ley para resolver conflictos.' } }
      ]
    }
  ];

  // ── Key Chilean institutions ─────────────────────────────────────
  const INSTITUTIONS = [
    {
      id: 'moneda',
      icon: '🏛️',
      title: { en: 'La Moneda', es: 'La Moneda' },
      summary: {
        en: 'The Presidential Palace in downtown Santiago — the seat of the executive branch. Originally a mint (where coins were made), which is why it is called "the Coin". Open for public tours when government is not in session.',
        es: 'El Palacio Presidencial en el centro de Santiago — sede del poder ejecutivo. Originalmente fue una casa de moneda, por eso se llama "La Moneda". Abierto al público en visitas guiadas cuando no hay actividad oficial.'
      },
      quiz: [
        { q: { en: 'What was La Moneda originally?', es: '¿Qué era originalmente La Moneda?' },
          options: { en: ['A bank','A coin mint','A hospital','A school'], es: ['Un banco','Una casa de moneda','Un hospital','Una escuela'] }, answer: 1, tier: 'beginner',
          explain: { en: 'It was built as the royal mint, which is why it is called "La Moneda".', es: 'Fue construida como la casa de moneda, por eso se llama "La Moneda".' } },
        { q: { en: 'Which branch of government uses La Moneda?', es: '¿Qué poder del Estado ocupa La Moneda?' },
          options: { en: ['Legislative','Judicial','Executive','Electoral'], es: ['Legislativo','Judicial','Ejecutivo','Electoral'] }, answer: 2, tier: 'beginner',
          explain: { en: 'La Moneda is the seat of the executive branch and the President.', es: 'La Moneda es la sede del poder ejecutivo y del Presidente.' } },
        { q: { en: 'In which city is La Moneda located?', es: '¿En qué ciudad está La Moneda?' },
          options: { en: ['Valparaíso','Santiago','Concepción','La Serena'], es: ['Valparaíso','Santiago','Concepción','La Serena'] }, answer: 1, tier: 'beginner' },
        { q: { en: 'The name "La Moneda" refers to its original use as a place that…', es: 'El nombre "La Moneda" viene de su uso original como un lugar donde se…' },
          options: { en: ['Stored grain','Made coins','Printed newspapers','Trained soldiers'], es: ['Guardaba grano','Acuñaban monedas','Imprimían periódicos','Entrenaban soldados'] }, answer: 1, tier: 'intermediate',
          explain: { en: 'The building minted (made) coins before becoming the presidential palace.', es: 'El edificio acuñaba monedas antes de convertirse en el palacio presidencial.' } }
      ]
    },
    {
      id: 'congreso',
      icon: '📜',
      title: { en: 'National Congress', es: 'Congreso Nacional' },
      summary: {
        en: 'Houses both the Chamber of Deputies (155 members elected every 4 years) and the Senate (50 senators elected every 8 years, half renewed every 4). The Congress building stands in Valparaíso since 1990.',
        es: 'Alberga tanto a la Cámara de Diputados/as (155 miembros elegidos cada 4 años) como al Senado (50 senadores/as elegidos cada 8 años, renovados por mitades cada 4). El edificio del Congreso está en Valparaíso desde 1990.'
      },
      quiz: [
        { q: { en: 'How often is the entire Chamber of Deputies elected?', es: '¿Cada cuántos años se elige toda la Cámara de Diputados?' },
          options: { en: ['Every 2 years','Every 4 years','Every 6 years','Every 8 years'], es: ['Cada 2 años','Cada 4 años','Cada 6 años','Cada 8 años'] }, answer: 1, tier: 'beginner',
          explain: { en: 'All 155 deputies are elected at once every 4 years.', es: 'Los 155 diputados se eligen en su totalidad cada 4 años.' } },
        { q: { en: 'In what year did Congress move to Valparaíso?', es: '¿En qué año se mudó el Congreso a Valparaíso?' },
          options: { en: ['1973','1980','1990','2005'], es: ['1973','1980','1990','2005'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'The current Congress building opened in Valparaíso in 1990.', es: 'El actual edificio del Congreso se inauguró en Valparaíso en 1990.' } },
        { q: { en: 'Why are senators elected for 8 years but deputies for 4?', es: '¿Por qué los senadores se eligen por 8 años y los diputados por 4?' },
          options: { en: ['Senators are older','To give the Senate longer, staggered terms','To save money','It is random'], es: ['Los senadores son mayores','Para dar al Senado mandatos más largos y escalonados','Para ahorrar dinero','Es al azar'] }, answer: 1, tier: 'advanced',
          explain: { en: 'Longer, staggered Senate terms give the upper chamber more continuity.', es: 'Los mandatos más largos y escalonados dan al Senado mayor continuidad.' } },
        { q: { en: 'A legislature with two chambers is described as…', es: 'Una legislatura con dos cámaras se describe como…' },
          options: { en: ['Unicameral','Bicameral','Tricameral','Multicameral'], es: ['Unicameral','Bicameral','Tricameral','Multicameral'] }, answer: 1, tier: 'intermediate',
          explain: { en: '"Bicameral" means two chambers; Chile has the Chamber of Deputies and the Senate.', es: '"Bicameral" significa dos cámaras; Chile tiene la Cámara de Diputados y el Senado.' } }
      ]
    },
    {
      id: 'tribunal_constitucional',
      icon: '⚖️',
      title: { en: 'Constitutional Tribunal', es: 'Tribunal Constitucional' },
      summary: {
        en: 'Reviews whether laws and presidential decrees agree with the Constitution. Its 10 ministers are picked across the three branches of government and serve 9-year terms. Its decisions on the constitutionality of a law cannot be appealed.',
        es: 'Revisa si las leyes y decretos presidenciales concuerdan con la Constitución. Sus 10 ministros son elegidos por los tres poderes del Estado y duran 9 años en su cargo. Sus fallos sobre la constitucionalidad de una ley no se pueden apelar.'
      },
      quiz: [
        { q: { en: 'How many ministers serve on the Constitutional Tribunal?', es: '¿Cuántos ministros tiene el Tribunal Constitucional?' },
          options: { en: ['5','7','10','15'], es: ['5','7','10','15'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'The Constitutional Tribunal has 10 ministers chosen across the three branches.', es: 'El Tribunal Constitucional tiene 10 ministros elegidos por los tres poderes.' } },
        { q: { en: 'What does the Constitutional Tribunal review?', es: '¿Qué revisa el Tribunal Constitucional?' },
          options: { en: ['Sports rules','Tax returns','Whether laws agree with the Constitution','School curricula'], es: ['Reglas deportivas','Declaraciones de impuestos','Si las leyes concuerdan con la Constitución','Planes escolares'] }, answer: 2, tier: 'beginner',
          explain: { en: 'It checks whether laws and decrees agree with the Constitution.', es: 'Revisa si las leyes y decretos concuerdan con la Constitución.' } },
        { q: { en: 'How long is a Constitutional Tribunal minister\'s term?', es: '¿Cuánto dura el cargo de un ministro del Tribunal Constitucional?' },
          options: { en: ['4 years','6 years','9 years','For life'], es: ['4 años','6 años','9 años','De por vida'] }, answer: 2, tier: 'advanced',
          explain: { en: 'Ministers serve a single 9-year term.', es: 'Los ministros duran un único período de 9 años.' } },
        { q: { en: 'Can a Constitutional Tribunal ruling on a law\'s constitutionality be appealed?', es: '¿Se puede apelar un fallo del Tribunal Constitucional sobre la constitucionalidad de una ley?' },
          options: { en: ['Yes, to the Supreme Court','Yes, to the Senate','No, it is final','Yes, to the President'], es: ['Sí, a la Corte Suprema','Sí, al Senado','No, es definitivo','Sí, al Presidente'] }, answer: 2, tier: 'expert',
          explain: { en: 'Its rulings on the constitutionality of a law are final and cannot be appealed.', es: 'Sus fallos sobre la constitucionalidad de una ley son definitivos y no se pueden apelar.' } }
      ]
    },
    {
      id: 'contraloria',
      icon: '🔍',
      title: { en: 'Contraloría General', es: 'Contraloría General de la República' },
      summary: {
        en: 'Audits public spending and checks the legality of government acts. Its Contralor serves one 8-year, non-renewable term. The Contraloría can require government bodies to fix illegal decisions before they take effect.',
        es: 'Audita el gasto público y revisa la legalidad de los actos del gobierno. Su Contralor o Contralora dura 8 años en el cargo, sin posibilidad de reelección. La Contraloría puede exigir a los órganos del Estado corregir decisiones ilegales antes de que se apliquen.'
      },
      quiz: [
        { q: { en: 'What does the Contraloría mainly do?', es: '¿Qué hace principalmente la Contraloría?' },
          options: { en: ['Audit public spending and legality','Print money','Build roads','Set tax rates'], es: ['Auditar el gasto público y la legalidad','Imprimir dinero','Construir carreteras','Fijar impuestos'] }, answer: 0, tier: 'beginner',
          explain: { en: 'The Contraloría audits public spending and reviews the legality of government acts.', es: 'La Contraloría audita el gasto público y revisa la legalidad de los actos del gobierno.' } },
        { q: { en: 'How long does the Contralor serve?', es: '¿Cuánto dura el Contralor en el cargo?' },
          options: { en: ['4 years','6 years','8 years','10 years'], es: ['4 años','6 años','8 años','10 años'] }, answer: 2, tier: 'intermediate',
          explain: { en: 'The Contralor serves a single 8-year, non-renewable term.', es: 'El Contralor dura un único período de 8 años, no renovable.' } },
        { q: { en: 'What is the process called when the Contraloría checks a decree\'s legality before it takes effect?', es: '¿Cómo se llama el control de legalidad que hace la Contraloría a un decreto antes de que rija?' },
          options: { en: ['Promulgación','Toma de razón','Sufragio','Moción'], es: ['Promulgación','Toma de razón','Sufragio','Moción'] }, answer: 1, tier: 'expert',
          explain: { en: 'The "toma de razón" is the prior legality check the Contraloría applies to decrees.', es: 'La "toma de razón" es el control previo de legalidad que la Contraloría aplica a los decretos.' } },
        { q: { en: 'Can the Contralor be re-appointed for a second term?', es: '¿Puede el Contralor ser reelegido para un segundo período?' },
          options: { en: ['Yes, once','Yes, twice','No, the term is non-renewable','Only with Senate approval'], es: ['Sí, una vez','Sí, dos veces','No, el cargo no es renovable','Sólo con aprobación del Senado'] }, answer: 2, tier: 'advanced',
          explain: { en: 'The 8-year term is non-renewable to protect the office\'s independence.', es: 'El período de 8 años no es renovable para proteger la independencia del cargo.' } }
      ]
    },
    {
      id: 'banco_central',
      icon: '🏦',
      title: { en: 'Central Bank', es: 'Banco Central' },
      summary: {
        en: 'An independent autonomous body that manages monetary policy, the value of the Chilean peso, and inflation. Its 5-member council is appointed by the President and ratified by the Senate, serving 10-year terms — designed to outlast any single government.',
        es: 'Organismo autónomo independiente que gestiona la política monetaria, el valor del peso chileno y la inflación. Su consejo de 5 miembros es nombrado por el Presidente y ratificado por el Senado, con mandatos de 10 años — diseñado para durar más que cualquier gobierno individual.'
      },
      quiz: [
        { q: { en: 'What is the main job of the Central Bank?', es: '¿Cuál es la principal tarea del Banco Central?' },
          options: { en: ['Run hospitals','Manage monetary policy and inflation','Set the speed limit','Pick the president'], es: ['Administrar hospitales','Gestionar la política monetaria y la inflación','Fijar el límite de velocidad','Elegir al presidente'] }, answer: 1, tier: 'beginner',
          explain: { en: 'The Central Bank manages monetary policy, the peso and inflation.', es: 'El Banco Central gestiona la política monetaria, el peso y la inflación.' } },
        { q: { en: 'Why are Central Bank terms 10 years long?', es: '¿Por qué los cargos del Banco Central duran 10 años?' },
          options: { en: ['To match the president','For tradition','So they outlast any single government','To save money'], es: ['Para coincidir con el presidente','Por tradición','Para que duren más que cualquier gobierno','Para ahorrar dinero'] }, answer: 2, tier: 'advanced',
          explain: { en: 'Ten-year terms are designed to outlast any single government, protecting the bank\'s independence.', es: 'Los períodos de 10 años buscan durar más que cualquier gobierno, protegiendo la independencia del banco.' } },
        { q: { en: 'How many members sit on the Central Bank council?', es: '¿Cuántos miembros tiene el consejo del Banco Central?' },
          options: { en: ['3','5','7','10'], es: ['3','5','7','10'] }, answer: 1, tier: 'intermediate',
          explain: { en: 'The council has 5 members, appointed by the President and ratified by the Senate.', es: 'El consejo tiene 5 miembros, nombrados por el Presidente y ratificados por el Senado.' } },
        { q: { en: 'What word describes the Central Bank\'s status within the State?', es: '¿Qué palabra describe la condición del Banco Central dentro del Estado?' },
          options: { en: ['A ministry','Autonomous','A court','A committee'], es: ['Un ministerio','Autónomo','Un tribunal','Una comisión'] }, answer: 1, tier: 'advanced',
          explain: { en: 'The Central Bank is an autonomous body, independent of the government of the day.', es: 'El Banco Central es un organismo autónomo, independiente del gobierno de turno.' } }
      ]
    }
  ];

  // ── How a Chilean law is made — step by step ─────────────────────
  const LAW_STEPS = [
    {
      id: 'iniciativa',
      icon: '✍️',
      title: { en: 'Step 1 · Initiative', es: 'Paso 1 · Iniciativa' },
      body: {
        en: 'Every law starts as an idea, called a "proyecto de ley". The President can send a "mensaje" or a member of Congress can send a "moción" signed by up to 10 deputies or 5 senators. Some matters (taxes, the budget, social security) can only start as a presidential "mensaje".',
        es: 'Toda ley empieza como una idea, llamada "proyecto de ley". El Presidente puede enviar un "mensaje" o un miembro del Congreso puede presentar una "moción" firmada por hasta 10 diputados o 5 senadores. Algunas materias (impuestos, presupuesto, seguridad social) sólo pueden iniciarse por "mensaje" presidencial.'
      }
    },
    {
      id: 'origen',
      icon: '🏛️',
      title: { en: 'Step 2 · Originating Chamber', es: 'Paso 2 · Cámara de Origen' },
      body: {
        en: 'The bill enters one chamber — Chamber of Deputies or Senate, depending on the subject. It is first studied by a specialised committee (Hacienda, Educación, etc.), then debated and voted on the chamber floor.',
        es: 'El proyecto entra a una cámara — la de Diputados o la del Senado, según la materia. Primero lo estudia una comisión especializada (Hacienda, Educación, etc.), después se debate y vota en la sala.'
      }
    },
    {
      id: 'revisora',
      icon: '🔁',
      title: { en: 'Step 3 · Reviewing Chamber', es: 'Paso 3 · Cámara Revisora' },
      body: {
        en: 'If approved, the bill moves to the other chamber, which repeats the process: committee, then floor vote. The revising chamber can approve, reject, or amend the bill.',
        es: 'Si se aprueba, el proyecto pasa a la otra cámara, que repite el proceso: comisión y luego votación en sala. La cámara revisora puede aprobar, rechazar o modificar el proyecto.'
      }
    },
    {
      id: 'comision_mixta',
      icon: '🤝',
      title: { en: 'Step 4 · Resolving Disagreements', es: 'Paso 4 · Resolver Desacuerdos' },
      body: {
        en: 'If the two chambers disagree on the wording, a "Comisión Mixta" — 5 deputies + 5 senators — meets to write a compromise text. Both chambers then vote on that compromise.',
        es: 'Si las cámaras no se ponen de acuerdo, una "Comisión Mixta" — 5 diputados/as + 5 senadores/as — se reúne para redactar un texto de consenso. Ambas cámaras votan luego ese consenso.'
      }
    },
    {
      id: 'presidente',
      icon: '✒️',
      title: { en: 'Step 5 · Presidential Decision', es: 'Paso 5 · Decisión Presidencial' },
      body: {
        en: 'The bill goes to the President, who can either sign and promulgate it (turning it into law) or veto it. A presidential veto can be overridden if both chambers re-approve the original text by a two-thirds majority.',
        es: 'El proyecto va al Presidente, quien puede firmarlo y promulgarlo (convirtiéndolo en ley) o vetarlo. Un veto presidencial puede ser superado si ambas cámaras vuelven a aprobar el texto original por dos tercios.'
      }
    },
    {
      id: 'tc_revision',
      icon: '⚖️',
      title: { en: 'Step 6 · Constitutional Review (optional)', es: 'Paso 6 · Revisión Constitucional (opcional)' },
      body: {
        en: 'Some laws — especially "leyes orgánicas constitucionales" — must be reviewed by the Constitutional Tribunal before they can be published. The Tribunal checks that the law agrees with the Constitution.',
        es: 'Algunas leyes — especialmente las "leyes orgánicas constitucionales" — deben ser revisadas por el Tribunal Constitucional antes de publicarse. El Tribunal verifica que la ley concuerde con la Constitución.'
      }
    },
    {
      id: 'publicacion',
      icon: '📰',
      title: { en: 'Step 7 · Publication', es: 'Paso 7 · Publicación' },
      body: {
        en: 'Once signed and reviewed, the law is published in the Diario Oficial — the government\'s daily gazette. It becomes binding on the date written in the law itself, or 1 day after publication if no date is given.',
        es: 'Una vez firmada y revisada, la ley se publica en el Diario Oficial — el periódico oficial del Estado. Empieza a regir en la fecha que la propia ley señala, o 1 día después de publicarse si no se indica fecha.'
      }
    }
  ];

  const LAW_QUIZ = [
    { q: { en: 'What is the official name for a bill in Chile?', es: '¿Cómo se llama oficialmente un proyecto en Chile?' },
      options: { en: ['Idea de ley','Proyecto de ley','Carta de ley','Sugerencia'], es: ['Idea de ley','Proyecto de ley','Carta de ley','Sugerencia'] }, answer: 1, tier: 'beginner',
      explain: { en: 'A bill is officially called a "proyecto de ley".', es: 'Un proyecto se llama oficialmente "proyecto de ley".' } },
    { q: { en: 'What is the document called when a member of Congress starts a bill?', es: '¿Cómo se llama el documento cuando un congresista inicia un proyecto?' },
      options: { en: ['Mensaje','Moción','Decreto','Memorando'], es: ['Mensaje','Moción','Decreto','Memorando'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'A "moción" is started by members of Congress; a "mensaje" is sent by the President.', es: 'Una "moción" la inician congresistas; un "mensaje" lo envía el Presidente.' } },
    { q: { en: 'Who can start a bill about taxes in Chile?', es: '¿Quién puede iniciar un proyecto sobre impuestos en Chile?' },
      options: { en: ['Any deputy','Any senator','Only the President','Any citizen'], es: ['Cualquier diputado','Cualquier senador','Sólo el Presidente','Cualquier ciudadano'] }, answer: 2, tier: 'advanced',
      explain: { en: 'Tax bills are an exclusive initiative of the President.', es: 'Los proyectos sobre impuestos son de iniciativa exclusiva del Presidente.' } },
    { q: { en: 'How is a presidential veto overridden in Chile?', es: '¿Cómo se supera un veto presidencial en Chile?' },
      options: { en: ['Simple majority','Two-thirds in both chambers','Half plus one','Supreme Court order'], es: ['Mayoría simple','Dos tercios en ambas cámaras','La mitad más uno','Orden de la Corte Suprema'] }, answer: 1, tier: 'advanced',
      explain: { en: 'Both chambers must re-approve the original text by two-thirds to override the veto.', es: 'Ambas cámaras deben reaprobar el texto original por dos tercios para superar el veto.' } },
    { q: { en: 'In which publication is a new law published?', es: '¿En qué publicación se publica una ley nueva?' },
      options: { en: ['El Mercurio','Diario Oficial','La Tercera','Boletín Constitucional'], es: ['El Mercurio','Diario Oficial','La Tercera','Boletín Constitucional'] }, answer: 1, tier: 'beginner',
      explain: { en: 'Laws take effect after being published in the Diario Oficial.', es: 'Las leyes rigen tras publicarse en el Diario Oficial.' } },
    { q: { en: 'What does the President use to set how urgent a bill is?', es: '¿Qué usa el Presidente para fijar qué tan urgente es un proyecto?' },
      options: { en: ['Una "urgencia"','Una multa','Un veto','Una toma de razón'], es: ['Una "urgencia"','Una multa','Un veto','Una toma de razón'] }, answer: 0, tier: 'advanced',
      explain: { en: 'An "urgencia" lets the President set deadlines for Congress to vote a bill.', es: 'Una "urgencia" permite al Presidente fijar plazos para que el Congreso vote un proyecto.' } },
    { q: { en: 'Which of these matters can ONLY begin as a presidential "mensaje"?', es: '¿Cuál de estas materias SÓLO puede iniciarse por "mensaje" presidencial?' },
      options: { en: ['Renaming a street','The national budget','A holiday tradition','A school motto'], es: ['Renombrar una calle','El presupuesto nacional','Una tradición festiva','Un lema escolar'] }, answer: 1, tier: 'expert',
      explain: { en: 'The national budget is an exclusive presidential initiative each year.', es: 'El presupuesto nacional es de iniciativa exclusiva del Presidente cada año.' } },
    { q: { en: 'When the two chambers disagree on a bill\'s wording, what group is formed?', es: 'Cuando las dos cámaras no concuerdan en el texto, ¿qué grupo se forma?' },
      options: { en: ['Comisión Mixta','Corte Suprema','Banco Central','Contraloría'], es: ['Comisión Mixta','Corte Suprema','Banco Central','Contraloría'] }, answer: 0, tier: 'intermediate',
      explain: { en: 'A "Comisión Mixta" of deputies and senators drafts a compromise text.', es: 'Una "Comisión Mixta" de diputados y senadores redacta un texto de consenso.' } },
    { q: { en: 'How many members make up a Comisión Mixta?', es: '¿Por cuántos miembros se forma una Comisión Mixta?' },
      options: { en: ['5 deputies + 5 senators','3 deputies + 3 senators','10 senators only','21 justices'], es: ['5 diputados + 5 senadores','3 diputados + 3 senadores','Sólo 10 senadores','21 ministros'] }, answer: 0, tier: 'expert',
      explain: { en: 'A Comisión Mixta is made of 5 deputies and 5 senators.', es: 'Una Comisión Mixta se forma con 5 diputados y 5 senadores.' } },
    { q: { en: 'What is the difference between promulgación and publicación?', es: '¿Cuál es la diferencia entre promulgación y publicación?' },
      options: { en: ['They are the same','Promulgación is the President\'s formal sign-off; publicación makes it public in the Diario Oficial','Publicación happens first','Promulgación is done by Congress'], es: ['Son lo mismo','La promulgación es la firma formal del Presidente; la publicación la hace pública en el Diario Oficial','La publicación ocurre primero','La promulgación la hace el Congreso'] }, answer: 1, tier: 'expert',
      explain: { en: 'Promulgación is the President\'s formal sign-off; publicación then prints it in the Diario Oficial.', es: 'La promulgación es la firma formal del Presidente; la publicación luego la imprime en el Diario Oficial.' } },
    { q: { en: 'What vote do "leyes orgánicas constitucionales" generally require?', es: '¿Qué votación requieren en general las "leyes orgánicas constitucionales"?' },
      options: { en: ['Simple majority','Four-sevenths of sitting members','One third','Just the President'], es: ['Mayoría simple','Cuatro séptimos de los miembros en ejercicio','Un tercio','Sólo el Presidente'] }, answer: 1, tier: 'expert',
      explain: { en: 'These laws need a four-sevenths majority of the members in office.', es: 'Estas leyes requieren una mayoría de cuatro séptimos de los miembros en ejercicio.' } }
  ];

  // ── Comparative civics — quiz pool ───────────────────────────────
  const COMPARATIVE_QUIZ = [
    { q: { en: 'What kind of government system does Chile have?', es: '¿Qué tipo de sistema de gobierno tiene Chile?' },
      options: { en: ['Parliamentary','Presidential','Absolute monarchy','Direct democracy'], es: ['Parlamentario','Presidencial','Monarquía absoluta','Democracia directa'] }, answer: 1, tier: 'beginner',
      explain: { en: 'Chile is a presidential republic: voters elect the President directly.', es: 'Chile es una república presidencial: los votantes eligen al Presidente directamente.' } },
    { q: { en: 'A presidential system means the head of state and head of government are…', es: 'En un sistema presidencial, el jefe de Estado y de gobierno son…' },
      options: { en: ['Different people','The same person','Chosen by Congress','Hereditary'], es: ['Personas distintas','La misma persona','Elegidos por el Congreso','Hereditarios'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'In a presidential system one elected person is both head of state and head of government.', es: 'En un sistema presidencial una misma persona elegida es jefe de Estado y de gobierno.' } },
    { q: { en: 'A parliamentary system means the head of government is…', es: 'En un sistema parlamentario, el jefe de gobierno es…' },
      options: { en: ['Directly elected by voters','Chosen by parliament','Appointed by judges','The richest citizen'], es: ['Elegido directamente por los votantes','Elegido por el parlamento','Designado por jueces','El ciudadano más rico'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'In a parliamentary system the legislature chooses the head of government.', es: 'En un sistema parlamentario el parlamento elige al jefe de gobierno.' } },
    { q: { en: 'In a federal system, power is divided between…', es: 'En un sistema federal, el poder se divide entre…' },
      options: { en: ['Capital and provinces','Central government and states','Two parliaments','Two presidents'], es: ['Capital y provincias','Gobierno central y estados','Dos parlamentos','Dos presidentes'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'Federalism splits power between a central government and member states.', es: 'El federalismo divide el poder entre un gobierno central y los estados miembros.' } },
    { q: { en: 'Is Chile a federal or unitary state?', es: '¿Chile es un Estado federal o unitario?' },
      options: { en: ['Federal','Unitary','Confederation','Empire'], es: ['Federal','Unitario','Confederación','Imperio'] }, answer: 1, tier: 'beginner',
      explain: { en: 'Chile is a unitary state; its regions get authority from the central government.', es: 'Chile es un Estado unitario; sus regiones reciben autoridad del gobierno central.' } },
    { q: { en: 'At what age can citizens vote in Chile?', es: '¿A qué edad pueden votar los ciudadanos en Chile?' },
      options: { en: ['16','18','21','25'], es: ['16','18','21','25'] }, answer: 1, tier: 'beginner',
      explain: { en: 'Chileans may vote from age 18.', es: 'Los chilenos pueden votar desde los 18 años.' } },
    { q: { en: 'Which country is a parliamentary monarchy?', es: '¿Cuál de estos países es una monarquía parlamentaria?' },
      options: { en: ['Chile','United States','Spain','France'], es: ['Chile','Estados Unidos','España','Francia'] }, answer: 2, tier: 'intermediate',
      explain: { en: 'Spain is a parliamentary monarchy, with a king as ceremonial head of state.', es: 'España es una monarquía parlamentaria, con un rey como jefe de Estado ceremonial.' } },
    { q: { en: 'Which country has a federal system?', es: '¿Cuál de estos países tiene un sistema federal?' },
      options: { en: ['Chile','United States','France','Japan'], es: ['Chile','Estados Unidos','Francia','Japón'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'The United States is federal, dividing power between the nation and the states.', es: 'Estados Unidos es federal, dividiendo el poder entre la nación y los estados.' } },
    { q: { en: 'How long is the US President\'s term?', es: '¿Cuánto dura el mandato del Presidente de Estados Unidos?' },
      options: { en: ['2 years','4 years','5 years','6 years'], es: ['2 años','4 años','5 años','6 años'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'The US President serves a 4-year term, like Chile\'s.', es: 'El Presidente de EE.UU. cumple un mandato de 4 años, igual que en Chile.' } },
    { q: { en: 'In Chile, what document is the highest law of the country?', es: 'En Chile, ¿qué documento es la ley más alta del país?' },
      options: { en: ['Civil Code','Constitution','Bible','Penal Code'], es: ['Código Civil','Constitución','Biblia','Código Penal'] }, answer: 1, tier: 'beginner',
      explain: { en: 'The Constitution is the supreme law; all other laws must respect it.', es: 'La Constitución es la ley suprema; todas las demás leyes deben respetarla.' } },
    { q: { en: 'Suffrage means…', es: 'Sufragio significa…' },
      options: { en: ['Right to vote','Right to drive','Right to own land','Right to travel'], es: ['Derecho a votar','Derecho a conducir','Derecho a tener tierra','Derecho a viajar'] }, answer: 0, tier: 'beginner',
      explain: { en: 'Suffrage is the right to vote in elections.', es: 'El sufragio es el derecho a votar en las elecciones.' } },
    { q: { en: 'A bicameral legislature has…', es: 'Una legislatura bicameral tiene…' },
      options: { en: ['One chamber','Two chambers','Three chambers','No chambers'], es: ['Una cámara','Dos cámaras','Tres cámaras','Ninguna cámara'] }, answer: 1, tier: 'beginner',
      explain: { en: '"Bicameral" means two chambers.', es: '"Bicameral" significa dos cámaras.' } },
    { q: { en: 'In a parliamentary system, the government can be removed by…', es: 'En un sistema parlamentario, el gobierno puede ser removido por…' },
      options: { en: ['A vote of no confidence in parliament','A court ruling','The voters at any time','The army'], es: ['Un voto de censura en el parlamento','Un fallo judicial','Los votantes en cualquier momento','El ejército'] }, answer: 0, tier: 'advanced',
      explain: { en: 'A no-confidence vote in parliament can bring down the government.', es: 'Un voto de censura en el parlamento puede hacer caer al gobierno.' } },
    { q: { en: 'In a constitutional monarchy, the monarch is mainly…', es: 'En una monarquía constitucional, el monarca es principalmente…' },
      options: { en: ['An absolute ruler','A ceremonial head of state under the constitution','The head of the courts','Elected each year'], es: ['Un gobernante absoluto','Un jefe de Estado ceremonial bajo la constitución','El jefe de los tribunales','Elegido cada año'] }, answer: 1, tier: 'advanced',
      explain: { en: 'A constitutional monarch is a ceremonial head of state bound by the constitution.', es: 'Un monarca constitucional es un jefe de Estado ceremonial sujeto a la constitución.' } },
    { q: { en: 'Which pair are both constitutional monarchies?', es: '¿Cuál par está formado por dos monarquías constitucionales?' },
      options: { en: ['United States and France','Spain and the United Kingdom','Chile and Brazil','Germany and Italy'], es: ['Estados Unidos y Francia','España y el Reino Unido','Chile y Brasil','Alemania e Italia'] }, answer: 1, tier: 'advanced',
      explain: { en: 'Spain and the United Kingdom are both constitutional monarchies.', es: 'España y el Reino Unido son ambas monarquías constitucionales.' } },
    { q: { en: 'What is "judicial review"?', es: '¿Qué es el "control de constitucionalidad" (judicial review)?' },
      options: { en: ['Courts checking whether laws agree with the constitution','Judges writing new laws','Voters reviewing judges','Parliament reviewing the budget'], es: ['Los tribunales revisan si las leyes concuerdan con la constitución','Los jueces escriben nuevas leyes','Los votantes evalúan a los jueces','El parlamento revisa el presupuesto'] }, answer: 0, tier: 'advanced',
      explain: { en: 'Judicial review lets courts check whether laws comply with the constitution.', es: 'El control de constitucionalidad permite a los tribunales verificar que las leyes cumplan la constitución.' } },
    { q: { en: 'In the United States, who has the power to ratify treaties?', es: 'En Estados Unidos, ¿quién tiene la facultad de ratificar tratados?' },
      options: { en: ['The President alone','The Senate','The Supreme Court','State governors'], es: ['Sólo el Presidente','El Senado','La Corte Suprema','Los gobernadores estatales'] }, answer: 1, tier: 'expert',
      explain: { en: 'In the US the Senate ratifies treaties, by a two-thirds vote.', es: 'En EE.UU. el Senado ratifica los tratados, por dos tercios.' } },
    { q: { en: 'A unicameral legislature is found in which kind of arrangement?', es: 'Una legislatura unicameral se encuentra en qué tipo de arreglo?' },
      options: { en: ['One single chamber makes the laws','Two chambers share power','Three chambers vote','No chamber exists'], es: ['Una sola cámara hace las leyes','Dos cámaras comparten el poder','Tres cámaras votan','No existe cámara'] }, answer: 0, tier: 'intermediate',
      explain: { en: 'A unicameral legislature has a single law-making chamber.', es: 'Una legislatura unicameral tiene una sola cámara que hace las leyes.' } },
    { q: { en: 'In a federal state, sub-national units (states or provinces) usually have…', es: 'En un Estado federal, las unidades (estados o provincias) suelen tener…' },
      options: { en: ['No powers of their own','Their own constitutions and laws','Only one shared parliament','A single national mayor'], es: ['Ningún poder propio','Sus propias constituciones y leyes','Sólo un parlamento compartido','Un único alcalde nacional'] }, answer: 1, tier: 'advanced',
      explain: { en: 'In federal states, member units often have their own constitutions and laws.', es: 'En los Estados federales, las unidades suelen tener sus propias constituciones y leyes.' } },
    { q: { en: 'In a unitary state like Chile, regions get their authority from…', es: 'En un Estado unitario como Chile, las regiones obtienen su autoridad de…' },
      options: { en: ['Their own constitutions','The central government','Foreign treaties','The Central Bank'], es: ['Sus propias constituciones','El gobierno central','Tratados extranjeros','El Banco Central'] }, answer: 1, tier: 'advanced',
      explain: { en: 'In a unitary state, regional powers are granted by the central government.', es: 'En un Estado unitario, los poderes regionales los otorga el gobierno central.' } },
    // ── Elections & local government in Chile (advanced/expert) ──
    { q: { en: 'Which body organises and administers elections in Chile?', es: '¿Qué organismo organiza y administra las elecciones en Chile?' },
      options: { en: ['SERVEL (Servicio Electoral)','The Central Bank','The Supreme Court','The Contraloría'], es: ['SERVEL (Servicio Electoral)','El Banco Central','La Corte Suprema','La Contraloría'] }, answer: 0, tier: 'advanced',
      explain: { en: 'SERVEL, the Servicio Electoral, runs the electoral roll and administers elections.', es: 'El SERVEL, Servicio Electoral, lleva el padrón y administra las elecciones.' } },
    { q: { en: 'Into how many regiones is Chile divided?', es: '¿En cuántas regiones se divide Chile?' },
      options: { en: ['12','14','16','21'], es: ['12','14','16','21'] }, answer: 2, tier: 'advanced',
      explain: { en: 'Chile is divided into 16 regiones for administration.', es: 'Chile se divide en 16 regiones para su administración.' } },
    { q: { en: 'Who leads the government of a Chilean comuna (municipality)?', es: '¿Quién dirige el gobierno de una comuna en Chile?' },
      options: { en: ['A senator','An alcalde (mayor)','A regional judge','The President'], es: ['Un senador','Un alcalde','Un juez regional','El Presidente'] }, answer: 1, tier: 'advanced',
      explain: { en: 'Each comuna is led by an alcalde (mayor), supported by an elected concejo.', es: 'Cada comuna la dirige un alcalde, apoyado por un concejo elegido.' } },
    { q: { en: 'How are alcaldes and concejales chosen in Chile?', es: '¿Cómo se eligen los alcaldes y concejales en Chile?' },
      options: { en: ['Appointed by the President','Elected by local voters','Chosen by Congress','Named by the courts'], es: ['Designados por el Presidente','Elegidos por los votantes locales','Elegidos por el Congreso','Nombrados por los tribunales'] }, answer: 1, tier: 'advanced',
      explain: { en: 'Alcaldes and concejales are elected directly by the voters of each comuna.', es: 'Los alcaldes y concejales son elegidos directamente por los votantes de cada comuna.' } },
    { q: { en: 'How does a voter join Chile\'s electoral roll today?', es: '¿Cómo se inscribe hoy un votante en el padrón electoral de Chile?' },
      options: { en: ['By paying a fee','Automatically at age 18','By asking a deputy','Only by mail'], es: ['Pagando una cuota','Automáticamente a los 18 años','Pidiéndolo a un diputado','Sólo por correo'] }, answer: 1, tier: 'expert',
      explain: { en: 'Enrolment is automatic: citizens are added to the roll when they turn 18.', es: 'La inscripción es automática: los ciudadanos entran al padrón al cumplir 18 años.' } },
    { q: { en: 'How is the President of Chile elected if no candidate wins a majority?', es: '¿Cómo se elige al Presidente de Chile si ningún candidato logra mayoría?' },
      options: { en: ['Congress decides','A runoff between the top two candidates','The oldest candidate wins','By lottery'], es: ['Decide el Congreso','Una segunda vuelta entre los dos más votados','Gana el candidato de más edad','Por sorteo'] }, answer: 1, tier: 'expert',
      explain: { en: 'If no one wins more than half the vote, a runoff is held between the top two candidates.', es: 'Si nadie supera la mitad de los votos, hay una segunda vuelta entre los dos más votados.' } }
  ];

  // ── State ──
  const state = {
    lang: 'en',
    mode: null,                // 'branches' | 'institutions' | 'law' | 'comparative'
    activeBranchIdx: 0,
    activeInstIdx: 0,
    activeLawStep: 0,
    quizIdx: 0,
    quizCorrect: 0,
    quizPool: null
  };

  // ── Storage ──
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try { return JSON.parse(localStorage.getItem(_storageKey())) || {}; }
    catch { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch {}
    }
  }

  function _l(obj, fallback) {
    if (!obj) return fallback || '';
    if (typeof obj === 'string') return obj;
    return obj[state.lang] || obj.en || fallback || '';
  }

  // Filter a quiz pool to questions at or below the active child's age tier.
  // Defensive: if filtering empties the pool, return the original pool so a
  // quiz is never empty.
  function _filterByTier(pool) {
    if (!Array.isArray(pool) || !pool.length) return pool;
    var tier = (typeof getAgeTier === 'function') ? getAgeTier() : 'expert';
    var order = ['beginner', 'intermediate', 'advanced', 'expert'];
    var maxIdx = order.indexOf(tier);
    if (maxIdx === -1) maxIdx = order.length - 1;
    var filtered = pool.filter(function (q) {
      return order.indexOf(q.tier || 'intermediate') <= maxIdx;
    });
    return filtered.length ? filtered : pool;
  }

  function _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // ── Screens ──
  function _showScreen(id) {
    document.querySelectorAll('.cv-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function _renderHome() {
    const prog = _loadProgress();
    const branchesDone = (prog.branches || []).length;
    const instsDone    = (prog.institutions || []).length;
    const lawDone      = prog.lawCompleted ? '✓' : '–';
    const compBest     = prog.comparativeBest || 0;
    const elB = document.getElementById('cv-branches-stat');
    const elI = document.getElementById('cv-institutions-stat');
    const elL = document.getElementById('cv-law-stat');
    const elC = document.getElementById('cv-comp-stat');
    if (elB) elB.textContent = branchesDone + '/' + BRANCHES.length;
    if (elI) elI.textContent = instsDone + '/' + INSTITUTIONS.length;
    if (elL) elL.textContent = lawDone;
    if (elC) elC.textContent = compBest + ' ' + (state.lang === 'es' ? 'mejor' : 'best');
    _showScreen('cv-screen-home');
  }

  // ── Branches mode ──
  function openBranches() {
    state.mode = 'branches';
    _renderBranchList();
    _showScreen('cv-screen-branches');
  }

  function _renderBranchList() {
    const grid = document.getElementById('cv-branch-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = new Set(prog.branches || []);
    BRANCHES.forEach((b, idx) => {
      const card = document.createElement('button');
      card.className = 'cv-card cv-branch-card' + (done.has(b.id) ? ' cv-done' : '');
      card.innerHTML =
        '<span class="cv-icon">' + b.icon + '</span>' +
        '<h3>' + _l(b.title) + '</h3>' +
        '<div class="cv-sub">' + _l(b.head) + '</div>' +
        (done.has(b.id) ? '<span class="cv-star">⭐</span>' : '');
      card.onclick = () => _openBranch(idx);
      grid.appendChild(card);
    });
  }

  function _openBranch(idx) {
    state.activeBranchIdx = idx;
    const b = BRANCHES[idx];
    if (!b) return;
    const wrap = document.getElementById('cv-branch-detail');
    wrap.innerHTML =
      '<button class="cv-back-btn" onclick="CivicsLab.backToBranchList()">←</button>' +
      '<div class="cv-detail-header">' +
        '<span class="cv-detail-icon">' + b.icon + '</span>' +
        '<h2>' + _l(b.title) + '</h2>' +
      '</div>' +
      '<div class="cv-meta-row">' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + (state.lang === 'es' ? 'Cabeza' : 'Head') + '</span><span class="cv-meta-value">' + _l(b.head) + '</span></div>' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + (state.lang === 'es' ? 'Duración' : 'Term') + '</span><span class="cv-meta-value">' + _l(b.term) + '</span></div>' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + (state.lang === 'es' ? 'Sede' : 'Seat') + '</span><span class="cv-meta-value">' + _l(b.seat) + '</span></div>' +
      '</div>' +
      '<p class="cv-body-text">' + _l(b.role) + '</p>' +
      '<button class="cv-primary-btn" onclick="CivicsLab.startBranchQuiz()">' +
        (state.lang === 'es' ? '🎯 Cuestionario' : '🎯 Take the Quiz') + '</button>';
    _showScreen('cv-screen-branch-detail');
  }

  function backToBranchList() { _showScreen('cv-screen-branches'); }

  function startBranchQuiz() {
    const b = BRANCHES[state.activeBranchIdx];
    if (!b) return;
    state.quizPool = _filterByTier(b.quiz);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    _renderQuiz('branches', b.id, () => {
      const prog = _loadProgress();
      prog.branches = prog.branches || [];
      if (prog.branches.indexOf(b.id) === -1) prog.branches.push(b.id);
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Civics Lab', '🏛️',
          (state.lang === 'es' ? 'Aprendió sobre ' : 'Learned about ') + _l(b.title));
      }
    });
  }

  // ── Institutions mode ──
  function openInstitutions() {
    state.mode = 'institutions';
    _renderInstList();
    _showScreen('cv-screen-institutions');
  }

  function _renderInstList() {
    const grid = document.getElementById('cv-institution-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = new Set(prog.institutions || []);
    INSTITUTIONS.forEach((inst, idx) => {
      const card = document.createElement('button');
      card.className = 'cv-card cv-inst-card' + (done.has(inst.id) ? ' cv-done' : '');
      card.innerHTML =
        '<span class="cv-icon">' + inst.icon + '</span>' +
        '<h3>' + _l(inst.title) + '</h3>' +
        (done.has(inst.id) ? '<span class="cv-star">⭐</span>' : '');
      card.onclick = () => _openInstitution(idx);
      grid.appendChild(card);
    });
  }

  function _openInstitution(idx) {
    state.activeInstIdx = idx;
    const inst = INSTITUTIONS[idx];
    if (!inst) return;
    const wrap = document.getElementById('cv-inst-detail');
    wrap.innerHTML =
      '<button class="cv-back-btn" onclick="CivicsLab.backToInstitutionList()">←</button>' +
      '<div class="cv-detail-header">' +
        '<span class="cv-detail-icon">' + inst.icon + '</span>' +
        '<h2>' + _l(inst.title) + '</h2>' +
      '</div>' +
      '<p class="cv-body-text">' + _l(inst.summary) + '</p>' +
      '<button class="cv-primary-btn" onclick="CivicsLab.startInstitutionQuiz()">' +
        (state.lang === 'es' ? '🎯 Cuestionario' : '🎯 Take the Quiz') + '</button>';
    _showScreen('cv-screen-inst-detail');
  }

  function backToInstitutionList() { _showScreen('cv-screen-institutions'); }

  function startInstitutionQuiz() {
    const inst = INSTITUTIONS[state.activeInstIdx];
    if (!inst) return;
    state.quizPool = _filterByTier(inst.quiz);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    _renderQuiz('institutions', inst.id, () => {
      const prog = _loadProgress();
      prog.institutions = prog.institutions || [];
      if (prog.institutions.indexOf(inst.id) === -1) prog.institutions.push(inst.id);
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Civics Lab', '🏢',
          (state.lang === 'es' ? 'Aprendió: ' : 'Learned: ') + _l(inst.title));
      }
    });
  }

  // ── Law-making walkthrough mode ──
  function openLawMaking() {
    state.mode = 'law';
    state.activeLawStep = 0;
    _renderLawStep();
    _showScreen('cv-screen-law');
  }

  function _renderLawStep() {
    const step = LAW_STEPS[state.activeLawStep];
    const wrap = document.getElementById('cv-law-wrap');
    const isLast = state.activeLawStep === LAW_STEPS.length - 1;
    wrap.innerHTML =
      '<button class="cv-back-btn" onclick="CivicsLab.goHome()">←</button>' +
      '<div class="cv-law-progress">' + (state.activeLawStep + 1) + ' / ' + LAW_STEPS.length + '</div>' +
      '<div class="cv-detail-header">' +
        '<span class="cv-detail-icon">' + step.icon + '</span>' +
        '<h2>' + _l(step.title) + '</h2>' +
      '</div>' +
      '<p class="cv-body-text">' + _l(step.body) + '</p>' +
      '<div class="cv-law-nav">' +
        (state.activeLawStep > 0
          ? '<button class="cv-secondary-btn" onclick="CivicsLab.lawPrev()">' + (state.lang === 'es' ? '← Anterior' : '← Previous') + '</button>'
          : '') +
        (isLast
          ? '<button class="cv-primary-btn" onclick="CivicsLab.startLawQuiz()">🎯 ' + (state.lang === 'es' ? 'Cuestionario' : 'Take the Quiz') + '</button>'
          : '<button class="cv-primary-btn" onclick="CivicsLab.lawNext()">' + (state.lang === 'es' ? 'Siguiente →' : 'Next →') + '</button>') +
      '</div>';
  }

  function lawNext() {
    if (state.activeLawStep < LAW_STEPS.length - 1) {
      state.activeLawStep++;
      _renderLawStep();
    }
  }
  function lawPrev() {
    if (state.activeLawStep > 0) {
      state.activeLawStep--;
      _renderLawStep();
    }
  }

  function startLawQuiz() {
    state.quizPool = _filterByTier(LAW_QUIZ);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    _renderQuiz('law', null, () => {
      const prog = _loadProgress();
      prog.lawCompleted = true;
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Civics Lab', '📜',
          state.lang === 'es' ? 'Aprendió cómo se hace una ley' : 'Learned how a law is made');
      }
    });
  }

  // ── Comparative civics mode ──
  function openComparative() {
    state.mode = 'comparative';
    state.quizPool = _shuffle(_filterByTier(COMPARATIVE_QUIZ)).slice(0, 10);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    _renderQuiz('comparative', null, () => {
      const prog = _loadProgress();
      prog.comparativeBest = Math.max(prog.comparativeBest || 0, state.quizCorrect);
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Civics Lab', '🌍',
          (state.lang === 'es' ? 'Compara: ' : 'Compare: ') +
          state.quizCorrect + '/' + state.quizPool.length);
      }
    });
  }

  // ── Shared quiz renderer ──
  function _renderQuiz(modeId, subId, onFinishCallback) {
    state._quizFinish = onFinishCallback;
    _renderQuizQuestion();
    _showScreen('cv-screen-quiz');
  }

  function _renderQuizQuestion() {
    const wrap = document.getElementById('cv-quiz-wrap');
    const q = state.quizPool[state.quizIdx];
    if (!q) return _finishQuiz();
    const opts = q.options[state.lang] || q.options.en;
    wrap.innerHTML =
      '<button class="cv-back-btn" onclick="CivicsLab.goHome()">←</button>' +
      '<div class="cv-quiz-counter">' + (state.quizIdx + 1) + ' / ' + state.quizPool.length + '</div>' +
      '<h2 class="cv-quiz-q">' + _l(q.q) + '</h2>' +
      '<div class="cv-quiz-options">' +
        opts.map((o, i) =>
          '<button class="cv-quiz-opt" data-correct="' + (i === q.answer ? '1' : '0') + '">' + o + '</button>'
        ).join('') +
      '</div>';
    wrap.querySelectorAll('.cv-quiz-opt').forEach(btn => {
      btn.onclick = () => {
        const correct = btn.dataset.correct === '1';
        btn.classList.add(correct ? 'cv-correct' : 'cv-wrong');
        if (correct) state.quizCorrect++;
        // Optional factual explanation, shown after the answer is chosen.
        if (q.explain && !wrap.querySelector('.cv-quiz-explain')) {
          const exp = document.createElement('p');
          exp.className = 'cv-quiz-explain';
          exp.textContent = _l(q.explain);
          const optsBox = wrap.querySelector('.cv-quiz-options');
          if (optsBox) optsBox.insertAdjacentElement('afterend', exp);
          else wrap.appendChild(exp);
        }
        if (typeof SFX !== 'undefined') {
          (correct && SFX.correct) ? SFX.correct() : (SFX.wrong && SFX.wrong());
        }
        setTimeout(() => {
          state.quizIdx++;
          _renderQuizQuestion();
        }, 750);
      };
    });
  }

  function _finishQuiz() {
    const total = state.quizPool.length;
    const acc = total > 0 ? state.quizCorrect / total : 0;
    const stars = acc >= 0.95 ? 3 : acc >= 0.80 ? 2 : 1;
    document.getElementById('cv-quiz-result').innerHTML =
      '<div class="cv-stars-big">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' +
      '<p>' + state.quizCorrect + ' / ' + total + ' ' + (state.lang === 'es' ? 'correctas' : 'correct') + '</p>' +
      '<button class="cv-primary-btn" onclick="CivicsLab.goHome()">' +
        (state.lang === 'es' ? '← Inicio' : '← Home') + '</button>';
    if (typeof state._quizFinish === 'function') {
      try { state._quizFinish(); } catch (e) {}
      state._quizFinish = null;
    }
    _showScreen('cv-screen-quiz-result');
  }

  // ── Language toggle ──
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const lbl = document.getElementById('cv-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';
    if (state.mode === 'branches') _renderBranchList();
    else if (state.mode === 'institutions') _renderInstList();
    else if (state.mode === 'law') _renderLawStep();
    _renderHome();
  }

  function goHome() {
    state.mode = null;
    _renderHome();
  }

  // ── Init ──
  function init() {
    document.getElementById('cv-tile-branches').onclick = openBranches;
    document.getElementById('cv-tile-institutions').onclick = openInstitutions;
    document.getElementById('cv-tile-law').onclick = openLawMaking;
    document.getElementById('cv-tile-comparative').onclick = openComparative;
    document.getElementById('cv-lang-toggle').onclick = toggleLanguage;
    document.querySelectorAll('.cv-home-btn').forEach(b => { b.onclick = goHome; });
    _renderHome();
  }

  return {
    init, goHome,
    openBranches, openInstitutions, openLawMaking, openComparative,
    backToBranchList, backToInstitutionList,
    startBranchQuiz, startInstitutionQuiz, startLawQuiz,
    lawNext, lawPrev,
    toggleLanguage
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CivicsLab !== 'undefined') CivicsLab.init();
});
