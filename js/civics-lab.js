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
      explain: { en: 'If no one wins more than half the vote, a runoff is held between the top two candidates.', es: 'Si nadie supera la mitad de los votos, hay una segunda vuelta entre los dos más votados.' } },
    { q: { en: 'How long is one term for the President of Chile?', es: '¿Cuánto dura un período del Presidente de Chile?' },
      options: { en: ['2 years','4 years','6 years','8 years'], es: ['2 años','4 años','6 años','8 años'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'The President of Chile serves a 4-year term.', es: 'El Presidente de Chile cumple un período de 4 años.' } },
    { q: { en: 'Can the President of Chile run again for the very next term?', es: '¿Puede el Presidente de Chile postular de inmediato al período siguiente?' },
      options: { en: ['Yes, with no limit','No, not for the next term','Only if Congress agrees','Only once every 2 years'], es: ['Sí, sin límite','No, no para el período siguiente','Sólo si el Congreso lo acepta','Sólo cada 2 años'] }, answer: 1, tier: 'expert',
      explain: { en: 'The Constitution does not allow the President to be reelected for the immediately following term.', es: 'La Constitución no permite que el Presidente sea reelegido para el período siguiente.' } },
    { q: { en: 'How many deputies sit in Chile\'s Chamber of Deputies?', es: '¿Cuántos diputados integran la Cámara de Diputados de Chile?' },
      options: { en: ['120','155','50','200'], es: ['120','155','50','200'] }, answer: 1, tier: 'advanced',
      explain: { en: 'The Chamber of Deputies has 155 members, elected in 28 districts.', es: 'La Cámara de Diputados tiene 155 miembros, elegidos en 28 distritos.' } },
    { q: { en: 'How long does a deputy serve in Chile?', es: '¿Cuánto dura el cargo de un diputado en Chile?' },
      options: { en: ['2 years','4 years','6 years','8 years'], es: ['2 años','4 años','6 años','8 años'] }, answer: 1, tier: 'advanced',
      explain: { en: 'Deputies are elected for 4 years.', es: 'Los diputados se eligen por 4 años.' } },
    { q: { en: 'How many senators does Chile have?', es: '¿Cuántos senadores tiene Chile?' },
      options: { en: ['38','43','50','155'], es: ['38','43','50','155'] }, answer: 2, tier: 'advanced',
      explain: { en: 'The Senate has 50 members. Each region is a senatorial district.', es: 'El Senado tiene 50 miembros. Cada región es una circunscripción senatorial.' } },
    { q: { en: 'How long does a senator serve in Chile?', es: '¿Cuánto dura el cargo de un senador en Chile?' },
      options: { en: ['4 years','6 years','8 years','12 years'], es: ['4 años','6 años','8 años','12 años'] }, answer: 2, tier: 'expert',
      explain: { en: 'Senators serve 8 years. Half the Senate is renewed every 4 years.', es: 'Los senadores duran 8 años. La mitad del Senado se renueva cada 4 años.' } },
    { q: { en: 'What is the minimum age to be elected a deputy in Chile?', es: '¿Cuál es la edad mínima para ser elegido diputado en Chile?' },
      options: { en: ['18','21','25','35'], es: ['18','21','25','35'] }, answer: 1, tier: 'expert',
      explain: { en: 'A deputy must be at least 21 on election day and have finished secondary school.', es: 'Un diputado debe tener al menos 21 años el día de la elección y haber cursado la enseñanza media.' } },
    { q: { en: 'In the United Kingdom, who leads the government day to day?', es: 'En el Reino Unido, ¿quién dirige el gobierno en el día a día?' },
      options: { en: ['The King','The Prime Minister','The Supreme Court','A directly elected president'], es: ['El Rey','El Primer Ministro','La Corte Suprema','Un presidente elegido directamente'] }, answer: 1, tier: 'intermediate',
      explain: { en: 'The United Kingdom is a parliamentary monarchy. The Prime Minister leads the government; the King is the ceremonial head of state.', es: 'El Reino Unido es una monarquía parlamentaria. El Primer Ministro dirige el gobierno; el Rey es el jefe de Estado ceremonial.' } }
  ];

  // ── v2 helpers: art, extra data, tiers ──────────────────────────
  const ART = (typeof CivicsArt !== 'undefined') ? CivicsArt : null;
  const DATA = (typeof CivicsData !== 'undefined') ? CivicsData : {
    CHECKS: [], POWERS: [], SORT_ROUND: {}, ORDER_ROUND: {}, OPTIONAL_STEPS: [],
    STEP_SHORT: {}, STEP_KID: {}, COUNTRIES: [], CAPTIONS: {}
  };
  const TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];
  const BRANCH_COLOR = { ejecutivo: '#2563EB', legislativo: '#B5452F', judicial: '#8A6D3B' };
  const BRANCH_SEAT  = { ejecutivo: 'moneda', legislativo: 'congreso', judicial: 'tribunales' };
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function _art(fn) {
    if (!ART) return '';
    try { return fn(ART) || ''; } catch (e) { return ''; }
  }
  function _tier() {
    const t = (typeof getAgeTier === 'function') ? getAgeTier() : 'expert';
    return TIERS.indexOf(t) === -1 ? 'expert' : t;
  }
  function _atOrBelow(item) {
    return TIERS.indexOf(item.tier || 'intermediate') <= TIERS.indexOf(_tier());
  }
  function _t(en, es) { return state.lang === 'es' ? es : en; }
  function _esc(s) {
    if (typeof escHtml === 'function') return escHtml(s);
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _branchById(id) { return BRANCHES.find(b => b.id === id); }
  function _stepName(step) {
    const full = _l(step.title);
    const i = full.indexOf(' · ');
    return i === -1 ? full : full.slice(i + 3);
  }
  function _sfx(name) {
    if (typeof SFX !== 'undefined' && SFX[name]) { try { SFX[name](); } catch (e) {} }
  }
  function _log(icon, text) {
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Civics Lab', icon, text);
  }
  function _toolbar(backCall, title, backLabel) {
    return '<div class="cv-toolbar">' +
      '<button type="button" class="cv-back-btn" onclick="' + backCall + '" aria-label="' +
        _esc(backLabel || _t('Back', 'Volver')) + '">←</button>' +
      '<h2 class="cv-section-title">' + title + '</h2></div>';
  }
  function _starsText(n, of) {
    let s = '';
    for (let i = 0; i < (of || 3); i++) s += i < n ? '★' : '☆';
    return s;
  }
  // A little burst of gold sparks over an element.
  function _burst(el) {
    if (!el || REDUCED) return;
    const r = el.getBoundingClientRect();
    const host = document.createElement('div');
    host.className = 'cv-burst';
    host.style.left = (r.left + r.width / 2) + 'px';
    host.style.top = (r.top + r.height / 2) + 'px';
    for (let i = 0; i < 10; i++) {
      const sp = document.createElement('span');
      const a = (i / 10) * Math.PI * 2;
      sp.style.setProperty('--dx', Math.round(Math.cos(a) * 60) + 'px');
      sp.style.setProperty('--dy', Math.round(Math.sin(a) * 60) + 'px');
      host.appendChild(sp);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 800);
  }
  function _today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ── State ──
  const state = {
    lang: 'en',
    mode: null,                // 'branches' | 'institutions' | 'law' | 'comparative' | 'compare' | 'sort' | 'order'
    activeBranchIdx: 0,
    activeInstIdx: 0,
    activeLawStep: 0,
    quizIdx: 0,
    quizCorrect: 0,
    quizPool: null,
    activeCheck: null,
    rerender: null
  };

  // ── Storage ──
  // Saved shape (all fields optional, never removed):
  //   branches: [branchId], institutions: [instId], lawCompleted: bool,
  //   comparativeBest: number          ← the star rule in auth.js reads these
  //   lang: 'en'|'es'                   ← added v2
  //   challenges: { sort: {best, plays, last}, order: {best, plays, last} } ← added v2
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(_storageKey()));
      return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
    } catch { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch {}
    }
  }
  function _saveChallenge(kind, stars) {
    const prog = _loadProgress();
    const ch = (prog.challenges && typeof prog.challenges === 'object') ? prog.challenges : {};
    const cur = ch[kind] || {};
    ch[kind] = { best: Math.max(cur.best || 0, stars), plays: (cur.plays || 0) + 1, last: _today() };
    prog.challenges = ch;
    _saveProgress(prog);
    return ch[kind];
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
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function _renderHome() {
    const prog = _loadProgress();
    const branchesDone = (prog.branches || []).length;
    const instsDone    = (prog.institutions || []).length;
    const lawDone      = prog.lawCompleted ? '✓' : '–';
    const compBest     = prog.comparativeBest || 0;
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('cv-branches-stat', branchesDone + '/' + BRANCHES.length);
    set('cv-institutions-stat', instsDone + '/' + INSTITUTIONS.length);
    set('cv-law-stat', lawDone);
    set('cv-comp-stat', compBest + ' ' + (state.lang === 'es' ? 'mejor' : 'best'));
    const ch = prog.challenges || {};
    set('cv-sort-stat', ch.sort ? _starsText(ch.sort.best) : '☆☆☆');
    set('cv-order-stat', ch.order ? _starsText(ch.order.best) : '☆☆☆');
    ['cv-branches-stat', 'cv-institutions-stat'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('cv-stat-full', id === 'cv-branches-stat' ? branchesDone >= BRANCHES.length : instsDone >= INSTITUTIONS.length);
    });

    // Text that follows the language toggle.
    document.querySelectorAll('[data-en]').forEach(el => {
      el.textContent = el.getAttribute(state.lang === 'es' ? 'data-es' : 'data-en');
    });
    set('cv-learn-label', _t('Learn', 'Aprende'));
    set('cv-challenge-label', _t('Challenges', 'Retos'));
    set('cv-hero-sub', _t('How Chile\'s government works, and how other countries organise theirs.',
                          'Cómo funciona el gobierno de Chile y cómo se organizan otros países.'));

    // Star meter: the same count the Explorer Rank uses.
    const max = BRANCHES.length + INSTITUTIONS.length + 2;
    let stars = branchesDone + instsDone + (prog.lawCompleted ? 1 : 0) + (compBest >= 8 ? 1 : 0);
    if (typeof getAppStars === 'function') stars = getAppStars('civics', prog);
    const hp = document.getElementById('cv-hero-progress');
    if (hp) {
      const pct = Math.min(100, Math.round(stars / max * 100));
      hp.innerHTML =
        '<div class="cv-meter-label"><span>★ ' + stars + ' / ' + max + '</span><span>' +
          _t('stars in Civics Lab', 'estrellas en Civics Lab') + '</span></div>' +
        '<div class="cv-meter"><div class="cv-meter-fill" style="width:' + pct + '%"></div></div>';
    }
    _showScreen('cv-screen-home');
  }

  // ── Branches mode: diagram + cards ──
  function openBranches() {
    state.mode = 'branches';
    state.rerender = _renderBranchList;
    if (!state.activeCheck) {
      const first = DATA.CHECKS.find(_atOrBelow);
      state.activeCheck = first ? first.id : null;
    }
    _renderBranchList();
    _showScreen('cv-screen-branches');
  }

  // Node centres in the diagram's 360×300 viewBox.
  const NODE = { ejecutivo: [80, 84], legislativo: [280, 84], judicial: [180, 252] };
  const NODE_R = 50;

  function _curve(fromId, toId) {
    const a = NODE[fromId], b = NODE[toId];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;                 // perpendicular (flips with direction)
    const bend = 34, gap = NODE_R + 7, side = 13;
    const sx = a[0] + ux * gap + px * side, sy = a[1] + uy * gap + py * side;
    const ex = b[0] - ux * (gap + 4) + px * side, ey = b[1] - uy * (gap + 4) + py * side;
    const cx = (a[0] + b[0]) / 2 + px * bend, cy = (a[1] + b[1]) / 2 + py * bend;
    return 'M' + sx.toFixed(1) + ',' + sy.toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1);
  }

  function _diagramSvg() {
    const prog = _loadProgress();
    const done = new Set(prog.branches || []);
    const checks = DATA.CHECKS.filter(_atOrBelow);
    const active = checks.find(c => c.id === state.activeCheck) || null;
    const pairs = {};
    checks.forEach(c => { pairs[c.from + '>' + c.to] = true; });
    const u = ART ? ART.uid('dg') : 'dg';
    let s = '<defs>' +
      '<filter id="' + u + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#1c1b29" flood-opacity=".22"/></filter>';
    Object.keys(BRANCH_COLOR).forEach(id => {
      s += '<marker id="' + u + 'ar-' + id + '" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z" fill="' + BRANCH_COLOR[id] + '"/></marker>';
      s += '<clipPath id="' + u + 'cl-' + id + '"><circle cx="' + NODE[id][0] + '" cy="' + NODE[id][1] + '" r="' + (NODE_R - 4) + '"/></clipPath>';
    });
    s += '<radialGradient id="' + u + 'bg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f3efe4"/></radialGradient>';
    s += '</defs>';
    s += '<rect x="0" y="0" width="360" height="330" rx="18" fill="url(#' + u + 'bg)"/>';

    // Curves
    Object.keys(pairs).forEach(k => {
      const [f, t] = k.split('>');
      const isOn = active && active.from === f && active.to === t;
      const pid = u + 'p-' + f + '-' + t;
      s += '<path id="' + pid + '" class="cv-arc' + (isOn ? ' on' : '') + '" d="' + _curve(f, t) + '" fill="none" stroke="' +
        BRANCH_COLOR[f] + '" stroke-width="' + (isOn ? 4 : 2) + '" stroke-linecap="round"' +
        (isOn ? '' : ' stroke-dasharray="2 6" opacity=".55"') + ' marker-end="url(#' + u + 'ar-' + f + ')"/>';
      if (!REDUCED) {
        s += '<circle r="' + (isOn ? 6 : 3) + '" fill="' + BRANCH_COLOR[f] + '"' + (isOn ? ' stroke="#fff" stroke-width="2"' : ' opacity=".6"') + '>' +
          '<animateMotion dur="' + (isOn ? '1.8s' : '4.5s') + '" repeatCount="indefinite" rotate="auto"><mpath href="#' + pid + '"/></animateMotion></circle>';
      }
    });

    // Centre: the Constitution all three must follow
    s += '<g transform="translate(180,166)">' +
      '<rect x="-30" y="-17" width="60" height="34" rx="4" fill="#fbf7ec" stroke="#cdbf9f" stroke-width="1.4"/>' +
      '<rect x="-34" y="-20" width="8" height="40" rx="4" fill="#e7dcc3" stroke="#cdbf9f"/>' +
      '<rect x="26" y="-20" width="8" height="40" rx="4" fill="#e7dcc3" stroke="#cdbf9f"/>' +
      '<text y="-3" text-anchor="middle" font-family="Georgia, serif" font-size="8.5" font-weight="bold" fill="#6b5a35">' + _t('CONSTITUTION', 'CONSTITUCIÓN') + '</text>' +
      '<rect x="-18" y="4" width="36" height="2" rx="1" fill="#cbbf9f"/><rect x="-14" y="9" width="28" height="2" rx="1" fill="#cbbf9f"/>' +
      '</g>';

    // Nodes
    BRANCHES.forEach(b => {
      const [x, y] = NODE[b.id];
      const lit = active && (active.from === b.id || active.to === b.id);
      s += '<g class="cv-node' + (lit ? ' lit' : '') + '" filter="url(#' + u + 'sh)">' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + NODE_R + '" fill="#fff" stroke="' + BRANCH_COLOR[b.id] + '" stroke-width="' + (lit ? 5 : 3) + '"/>' +
        '</g>';
      const pic = _art(A => A.building(BRANCH_SEAT[b.id], { par: 'xMidYMid slice' }));
      if (pic) {
        s += '<g clip-path="url(#' + u + 'cl-' + b.id + ')">' +
          pic.replace('<svg ', '<svg x="' + (x - NODE_R) + '" y="' + (y - NODE_R + 2) + '" width="' + (NODE_R * 2) + '" height="' + (NODE_R * 2) + '" ') + '</g>';
      }
      // name plate
      const name = _l(b.title);
      const w = Math.max(84, name.length * 6.6 + 18);
      s += '<g transform="translate(' + x + ',' + (y + NODE_R + 4) + ')">' +
        '<rect x="' + (-w / 2) + '" y="-11" width="' + w + '" height="22" rx="11" fill="' + BRANCH_COLOR[b.id] + '"/>' +
        '<text y="4.5" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11.5" font-weight="900" fill="#fff">' + _esc(name) + '</text></g>';
      if (done.has(b.id)) {
        s += '<g transform="translate(' + (x + NODE_R * 0.72) + ',' + (y - NODE_R * 0.72) + ')">' +
          '<circle r="11" fill="#f59e0b" stroke="#fff" stroke-width="2.5"/>' +
          '<text y="4.5" text-anchor="middle" font-size="12" fill="#fff" font-weight="900">★</text></g>';
      }
    });
    return '<svg viewBox="0 0 360 330" class="cv-diagram-svg" role="img" aria-label="' +
      _esc(_t('Diagram of the three branches and how they check each other', 'Diagrama de los tres poderes y cómo se controlan')) + '">' + s + '</svg>';
  }

  function _renderChecks() {
    const checks = DATA.CHECKS.filter(_atOrBelow);
    const box = document.getElementById('cv-checks');
    const info = document.getElementById('cv-check-info');
    const hint = document.getElementById('cv-diagram-hint');
    if (hint) hint.textContent = _t('Tap a check to watch how one branch limits another.',
                                    'Toca un control para ver cómo un poder limita a otro.');
    if (box) {
      box.setAttribute('aria-label', _t('Checks and balances', 'Controles entre poderes'));
      box.innerHTML = checks.map(c =>
        '<button type="button" class="cv-check-chip' + (c.id === state.activeCheck ? ' on' : '') + '" data-check="' + c.id + '" ' +
          'style="--c:' + BRANCH_COLOR[c.from] + '" aria-pressed="' + (c.id === state.activeCheck) + '">' +
          '<span class="cv-chip-dot"></span>' + _esc(_l(c.title)) + '</button>').join('');
      box.querySelectorAll('.cv-check-chip').forEach(btn => {
        btn.onclick = () => { state.activeCheck = btn.dataset.check; _sfx('click'); _renderBranchList(); };
      });
    }
    if (info) {
      const c = checks.find(x => x.id === state.activeCheck);
      if (!c) { info.innerHTML = ''; return; }
      const from = _branchById(c.from), to = _branchById(c.to);
      info.innerHTML =
        '<div class="cv-check-route"><span style="--c:' + BRANCH_COLOR[c.from] + '">' + _esc(_l(from.title)) + '</span>' +
        '<span class="cv-check-arrow" aria-hidden="true">→</span>' +
        '<span style="--c:' + BRANCH_COLOR[c.to] + '">' + _esc(_l(to.title)) + '</span></div>' +
        '<p>' + _esc(_l(c.text)) + '</p>';
    }
  }

  function _renderBranchList() {
    const dg = document.getElementById('cv-diagram');
    if (dg) dg.innerHTML = _diagramSvg();
    const ttl = document.getElementById('cv-branches-title');
    if (ttl) ttl.textContent = _t('The Three Branches', 'Los Tres Poderes');
    _renderChecks();
    const grid = document.getElementById('cv-branch-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = new Set(prog.branches || []);
    BRANCHES.forEach((b, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cv-card cv-branch-card' + (done.has(b.id) ? ' cv-done' : '');
      card.style.setProperty('--c', BRANCH_COLOR[b.id]);
      card.innerHTML =
        '<span class="cv-card-art">' + _art(A => A.building(BRANCH_SEAT[b.id], { par: 'xMidYMid slice' })) + '</span>' +
        '<span class="cv-card-body"><h3>' + _l(b.title) + '</h3>' +
        '<span class="cv-sub">' + _l(b.head) + '</span></span>' +
        (done.has(b.id) ? '<span class="cv-star" aria-label="' + _t('Quiz done', 'Cuestionario hecho') + '">★</span>' : '');
      card.onclick = () => _openBranch(idx);
      grid.appendChild(card);
    });
  }

  function _figure(artId, label) {
    const pic = _art(A => A.building(artId, { label: label }));
    const cap = DATA.CAPTIONS[artId];
    return '<figure class="cv-figure">' + pic + (cap ? '<figcaption>' + _esc(_l(cap)) + '</figcaption>' : '') + '</figure>';
  }

  function _openBranch(idx) {
    state.activeBranchIdx = idx;
    state.mode = 'branch';
    state.rerender = () => _openBranch(state.activeBranchIdx);
    const b = BRANCHES[idx];
    if (!b) return;
    const wrap = document.getElementById('cv-branch-detail');
    const checks = DATA.CHECKS.filter(_atOrBelow).filter(c => c.from === b.id || c.to === b.id);
    const done = (_loadProgress().branches || []).indexOf(b.id) !== -1;
    wrap.innerHTML =
      _toolbar('CivicsLab.backToBranchList()', _l(b.title)) +
      '<div class="cv-detail" style="--c:' + BRANCH_COLOR[b.id] + '">' +
      _figure(BRANCH_SEAT[b.id], _l(b.seat)) +
      '<div class="cv-meta-row">' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + _t('Head', 'Cabeza') + '</span><span class="cv-meta-value">' + _l(b.head) + '</span></div>' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + _t('Term', 'Duración') + '</span><span class="cv-meta-value">' + _l(b.term) + '</span></div>' +
        '<div class="cv-meta-cell"><span class="cv-meta-label">' + _t('Seat', 'Sede') + '</span><span class="cv-meta-value">' + _l(b.seat) + '</span></div>' +
      '</div>' +
      '<p class="cv-body-text">' + _l(b.role) + '</p>' +
      (checks.length ? '<div class="cv-mini-checks"><h3>' + _t('Checks and balances', 'Controles entre poderes') + '</h3><ul>' +
        checks.map(c => {
          const other = _branchById(c.from === b.id ? c.to : c.from);
          return '<li style="--c:' + BRANCH_COLOR[c.from] + '"><strong>' + _esc(_l(c.title)) + '</strong>' +
            '<span class="cv-mini-dir">' + (c.from === b.id ? '→ ' : '← ') + _esc(_l(other.title)) + '</span>' +
            '<span class="cv-mini-text">' + _esc(_l(c.text)) + '</span></li>';
        }).join('') + '</ul></div>' : '') +
      '<div class="cv-actions"><button type="button" class="cv-primary-btn" onclick="CivicsLab.startBranchQuiz()">' +
        (done ? _t('Play the quiz again', 'Repetir cuestionario') : _t('Take the quiz', 'Hacer el cuestionario')) + '</button></div>' +
      '</div>';
    _showScreen('cv-screen-branch-detail');
  }

  function backToBranchList() { openBranches(); }

  function startBranchQuiz() {
    const b = BRANCHES[state.activeBranchIdx];
    if (!b) return;
    state.quizPool = _filterByTier(b.quiz);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    state.quizTitle = b.title;
    state.quizBack = 'CivicsLab.backToBranchList()';
    _renderQuiz('branches', b.id, () => {
      const prog = _loadProgress();
      prog.branches = prog.branches || [];
      if (prog.branches.indexOf(b.id) === -1) prog.branches.push(b.id);
      _saveProgress(prog);
      _log('🏛️', (state.lang === 'es' ? 'Aprendió sobre ' : 'Learned about ') + _l(b.title));
    });
  }

  // ── Institutions mode ──
  function openInstitutions() {
    state.mode = 'institutions';
    state.rerender = _renderInstList;
    _renderInstList();
    _showScreen('cv-screen-institutions');
  }

  function _renderInstList() {
    const ttl = document.getElementById('cv-inst-title');
    if (ttl) ttl.textContent = _t('Institutions of Chile', 'Instituciones de Chile');
    const grid = document.getElementById('cv-institution-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = new Set(prog.institutions || []);
    INSTITUTIONS.forEach((inst, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cv-card cv-inst-card' + (done.has(inst.id) ? ' cv-done' : '');
      card.innerHTML =
        '<span class="cv-card-art">' + _art(A => A.building(inst.id, { par: 'xMidYMid slice' })) + '</span>' +
        '<span class="cv-card-body"><h3>' + _l(inst.title) + '</h3></span>' +
        (done.has(inst.id) ? '<span class="cv-star" aria-label="' + _t('Quiz done', 'Cuestionario hecho') + '">★</span>' : '');
      card.onclick = () => _openInstitution(idx);
      grid.appendChild(card);
    });
  }

  function _openInstitution(idx) {
    state.activeInstIdx = idx;
    state.mode = 'inst';
    state.rerender = () => _openInstitution(state.activeInstIdx);
    const inst = INSTITUTIONS[idx];
    if (!inst) return;
    const done = (_loadProgress().institutions || []).indexOf(inst.id) !== -1;
    const wrap = document.getElementById('cv-inst-detail');
    wrap.innerHTML =
      _toolbar('CivicsLab.backToInstitutionList()', _l(inst.title)) +
      '<div class="cv-detail">' +
      _figure(inst.id, _l(inst.title)) +
      '<p class="cv-body-text">' + _l(inst.summary) + '</p>' +
      '<div class="cv-actions"><button type="button" class="cv-primary-btn" onclick="CivicsLab.startInstitutionQuiz()">' +
        (done ? _t('Play the quiz again', 'Repetir cuestionario') : _t('Take the quiz', 'Hacer el cuestionario')) + '</button></div>' +
      '</div>';
    _showScreen('cv-screen-inst-detail');
  }

  function backToInstitutionList() { openInstitutions(); }

  function startInstitutionQuiz() {
    const inst = INSTITUTIONS[state.activeInstIdx];
    if (!inst) return;
    state.quizPool = _filterByTier(inst.quiz);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    state.quizTitle = inst.title;
    state.quizBack = 'CivicsLab.backToInstitutionList()';
    _renderQuiz('institutions', inst.id, () => {
      const prog = _loadProgress();
      prog.institutions = prog.institutions || [];
      if (prog.institutions.indexOf(inst.id) === -1) prog.institutions.push(inst.id);
      _saveProgress(prog);
      _log('🏢', (state.lang === 'es' ? 'Aprendió: ' : 'Learned: ') + _l(inst.title));
    });
  }

  // ── Board geometry (law walkthrough + "build the law") ──
  // n spaces plus a finish square along a two-row road.
  function _boardLayout(n) {
    const total = n + 1;
    const top = Math.ceil(total / 2), bottom = total - top;
    const x0 = 56, x1 = 318, yT = 76, yB = 196;
    const pts = [];
    const stepT = top > 1 ? (x1 - x0) / (top - 1) : 0;
    for (let i = 0; i < top; i++) pts.push([x0 + i * stepT, yT]);
    const stepB = bottom > 1 ? (x1 - x0) / (bottom - 1) : 0;
    for (let i = 0; i < bottom; i++) pts.push([bottom === 1 ? x0 : x1 - i * stepB, yB]);
    const road = 'M' + x0 + ',' + yT + ' H' + x1 + ' C' + (x1 + 62) + ',' + yT + ' ' + (x1 + 62) + ',' + yB + ' ' + x1 + ',' + yB + ' H' + x0;
    return { pts: pts, road: road };
  }

  function _boardSvg(steps, opts) {
    opts = opts || {};
    const lay = _boardLayout(steps.length);
    const u = ART ? ART.uid('bd') : 'bd';
    let s = '<defs>' +
      '<linearGradient id="' + u + 'felt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6b4f"/><stop offset="1" stop-color="#1f4d39"/></linearGradient>' +
      '<linearGradient id="' + u + 'wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5713f"/><stop offset="1" stop-color="#6e4422"/></linearGradient>' +
      '<radialGradient id="' + u + 'sp" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#efe7d4"/></radialGradient>' +
      '<linearGradient id="' + u + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#d4a017"/><stop offset="1" stop-color="#a16207"/></linearGradient>' +
      '<filter id="' + u + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".35"/></filter>' +
      '</defs>';
    s += '<rect x="2" y="2" width="396" height="258" rx="18" fill="url(#' + u + 'wood)"/>';
    s += '<rect x="12" y="12" width="376" height="238" rx="12" fill="url(#' + u + 'felt)"/>';
    // felt texture dots
    for (let i = 0; i < 40; i++) s += '<circle cx="' + (20 + (i * 97) % 360) + '" cy="' + (20 + (i * 53) % 210) + '" r=".9" fill="#fff" opacity=".06"/>';
    // the road
    s += '<path d="' + lay.road + '" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="40" stroke-linecap="round" transform="translate(0,3)"/>';
    s += '<path d="' + lay.road + '" fill="none" stroke="#e9dcc0" stroke-width="38" stroke-linecap="round"/>';
    s += '<path d="' + lay.road + '" fill="none" stroke="#d6c49d" stroke-width="2" stroke-dasharray="6 8"/>';
    // spaces
    steps.forEach((st, i) => {
      const [x, y] = lay.pts[i];
      const optional = DATA.OPTIONAL_STEPS.indexOf(st.id) !== -1;
      const cls = 'cv-space' + (opts.classFor ? ' ' + opts.classFor(st, i) : '');
      const show = opts.showIcon ? opts.showIcon(st, i) : true;
      s += '<g class="' + cls + '" data-i="' + i + '"' + (opts.interactive ? ' role="button" tabindex="0" aria-label="' + _esc((i + 1) + '. ' + (show ? _stepName(st) : '?')) + '"' : '') + '>';
      s += '<circle cx="' + x + '" cy="' + y + '" r="30" fill="url(#' + u + 'sp)" filter="url(#' + u + 'sh)"/>';
      s += '<circle class="cv-space-ring" cx="' + x + '" cy="' + y + '" r="30" fill="none" stroke="' + (optional && opts.markOptional !== false ? '#94a3b8' : '#b08a3e') + '" stroke-width="3"' +
        (optional && opts.markOptional !== false ? ' stroke-dasharray="5 4"' : '') + '/>';
      if (show) {
        s += _art(A => A.lawIcon(st.id)).replace('<svg ', '<svg x="' + (x - 21) + '" y="' + (y - 21) + '" width="42" height="42" ');
      } else {
        s += '<text x="' + x + '" y="' + (y + 8) + '" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-size="24" font-weight="800" fill="#c8b994">?</text>';
      }
      s += '<g transform="translate(' + (x - 22) + ',' + (y - 22) + ')"><circle r="10" fill="url(#' + u + 'gold)" stroke="#7c5a10" stroke-width="1"/>' +
        '<text y="4" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="900" fill="#3f2a05">' + (i + 1) + '</text></g>';
      s += '</g>';
    });
    // finish
    const f = lay.pts[steps.length];
    s += '<g class="cv-finish"><circle cx="' + f[0] + '" cy="' + f[1] + '" r="30" fill="url(#' + u + 'gold)" filter="url(#' + u + 'sh)"/>' +
      _art(A => A.lawIcon('ley')).replace('<svg ', '<svg x="' + (f[0] - 20) + '" y="' + (f[1] - 21) + '" width="40" height="40" ') + '</g>';
    // token: the bill as a pawn
    s += '<g class="cv-token" style="transform:translate(' + lay.pts[0][0] + 'px,' + lay.pts[0][1] + 'px)">' +
      '<g transform="translate(0,-36)"><ellipse cx="0" cy="18" rx="12" ry="4" fill="#000" opacity=".3"/>' +
      '<path d="M-9,16 L-6,-2 a6,6 0 0 1 12,0 L9,16Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.2"/>' +
      '<circle cx="0" cy="-8" r="7" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"/>' +
      '<path d="M-3,-11 a4,4 0 0 1 4,-2" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<rect x="-7" y="2" width="14" height="9" rx="1.5" fill="#fbf7ec" stroke="#cdbf9f" stroke-width=".8"/></g></g>';
    return { svg: '<svg viewBox="0 0 400 262" class="cv-board-svg">' + s + '</svg>', layout: lay };
  }

  function _moveToken(root, lay, i) {
    const tok = root.querySelector('.cv-token');
    const p = lay.pts[Math.min(i, lay.pts.length - 1)];
    if (tok) tok.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
  }

  // ── Law-making walkthrough mode ──
  function openLawMaking() {
    state.mode = 'law';
    state.activeLawStep = 0;
    state.rerender = _renderLawStep;
    _renderLawStep();
    _showScreen('cv-screen-law');
  }

  function _renderLawStep() {
    const wrap = document.getElementById('cv-law-wrap');
    const board = _boardSvg(LAW_STEPS, { interactive: true });
    state._lawLayout = board.layout;
    wrap.innerHTML =
      _toolbar('CivicsLab.goHome()', _t('How a law is made', '¿Cómo se hace una ley?'), _t('Back to home', 'Volver al inicio')) +
      '<div class="cv-board" id="cv-law-board">' + board.svg + '</div>' +
      '<p class="cv-board-legend"><span class="cv-legend-dash"></span>' + _t('Dashed spaces only happen in some cases.', 'Las casillas punteadas sólo ocurren en algunos casos.') + '</p>' +
      '<div class="cv-step-card" id="cv-step-card" aria-live="polite"></div>' +
      '<div class="cv-law-nav" id="cv-law-nav"></div>';
    wrap.querySelectorAll('.cv-space').forEach(g => {
      const go = () => { state.activeLawStep = +g.dataset.i; _updateLawStep(); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    _updateLawStep();
  }

  function _updateLawStep() {
    const i = state.activeLawStep;
    const step = LAW_STEPS[i];
    const isLast = i === LAW_STEPS.length - 1;
    const root = document.getElementById('cv-law-board');
    if (root) {
      _moveToken(root, state._lawLayout, i);
      root.querySelectorAll('.cv-space').forEach(g => {
        const k = +g.dataset.i;
        g.classList.toggle('current', k === i);
        g.classList.toggle('visited', k < i);
      });
    }
    const young = TIERS.indexOf(_tier()) <= 1;
    const kid = DATA.STEP_KID[step.id];
    const optional = DATA.OPTIONAL_STEPS.indexOf(step.id) !== -1;
    const card = document.getElementById('cv-step-card');
    if (card) {
      card.innerHTML =
        '<div class="cv-step-head"><span class="cv-step-icon">' + _art(A => A.lawIcon(step.id)) + '</span>' +
        '<div><div class="cv-step-num">' + _t('Step', 'Paso') + ' ' + (i + 1) + ' / ' + LAW_STEPS.length +
          (optional ? ' · <span class="cv-tag">' + _t('only sometimes', 'sólo a veces') + '</span>' : '') + '</div>' +
        '<h3>' + _esc(_stepName(step)) + '</h3></div></div>' +
        (kid && young ? '<p class="cv-step-kid">' + _esc(_l(kid)) + '</p>' : '') +
        (young ? '<details class="cv-more"><summary>' + _t('Read more', 'Leer más') + '</summary><p>' + _l(step.body) + '</p></details>'
               : '<p>' + _l(step.body) + '</p>');
    }
    const nav = document.getElementById('cv-law-nav');
    if (nav) {
      nav.innerHTML =
        (i > 0 ? '<button type="button" class="cv-secondary-btn" onclick="CivicsLab.lawPrev()">' + _t('← Previous', '← Anterior') + '</button>' : '<span></span>') +
        (isLast
          ? '<span class="cv-nav-end"><button type="button" class="cv-secondary-btn" onclick="CivicsLab.openOrder()">' + _t('Build the law', 'Arma la ley') + '</button>' +
            '<button type="button" class="cv-primary-btn" onclick="CivicsLab.startLawQuiz()">' + _t('Take the quiz', 'Hacer el cuestionario') + '</button></span>'
          : '<button type="button" class="cv-primary-btn" onclick="CivicsLab.lawNext()">' + _t('Move the bill →', 'Avanzar el proyecto →') + '</button>');
    }
  }

  function lawNext() {
    if (state.activeLawStep < LAW_STEPS.length - 1) {
      state.activeLawStep++;
      _sfx('click');
      _updateLawStep();
    }
  }
  function lawPrev() {
    if (state.activeLawStep > 0) {
      state.activeLawStep--;
      _updateLawStep();
    }
  }

  function startLawQuiz() {
    state.quizPool = _filterByTier(LAW_QUIZ);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    state.quizTitle = { en: 'How a law is made', es: '¿Cómo se hace una ley?' };
    state.quizBack = 'CivicsLab.openLawMaking()';
    _renderQuiz('law', null, () => {
      const prog = _loadProgress();
      prog.lawCompleted = true;
      _saveProgress(prog);
      _log('📜', state.lang === 'es' ? 'Aprendió cómo se hace una ley' : 'Learned how a law is made');
    });
  }

  // ── Compare: cards, then the comparative quiz ──
  function openCompare() {
    state.mode = 'compare';
    state.rerender = _renderCompare;
    _renderCompare();
    _showScreen('cv-screen-compare');
  }

  function _renderCompare() {
    const wrap = document.getElementById('cv-compare-wrap');
    const best = _loadProgress().comparativeBest || 0;
    const sysClass = c => /parliament/i.test(c.system.en) ? 'parl' : /semi/i.test(c.system.en) ? 'semi' : 'pres';
    wrap.innerHTML =
      _toolbar('CivicsLab.goHome()', _t('Compare', 'Compara'), _t('Back to home', 'Volver al inicio')) +
      '<p class="cv-intro">' + _t('Every country organises its government in its own way. Here is Chile next to five others.',
                                  'Cada país organiza su gobierno a su manera. Aquí está Chile junto a otros cinco.') + '</p>' +
      '<div class="cv-compare-grid">' +
      DATA.COUNTRIES.map(c =>
        '<article class="cv-country' + (c.id === 'cl' ? ' cv-home-country' : '') + '">' +
          '<header><span class="cv-country-flag">' + _art(A => A.flag(c.id, { label: _l(c.name) })) + '</span>' +
          '<div><h3>' + _esc(_l(c.name)) + '</h3><span class="cv-sys cv-sys-' + sysClass(c) + '">' + _esc(_l(c.system)) + '</span></div></header>' +
          '<dl>' +
            '<dt>' + _t('Who leads', 'Quién dirige') + '</dt><dd>' + _esc(_l(c.head)) + '</dd>' +
            '<dt>' + _t('Lawmakers', 'Legisladores') + '</dt><dd>' + _esc(_l(c.leg)) + '</dd>' +
            '<dt>' + _t('How the country is divided', 'Cómo se divide el país') + '</dt><dd>' + _esc(_l(c.shape)) + '</dd>' +
          '</dl></article>').join('') +
      '</div>' +
      '<div class="cv-actions cv-compare-actions">' +
        '<div class="cv-best">' + _t('Best score', 'Mejor puntaje') + ': <strong>' + best + ' / 10</strong>' +
          (best >= 8 ? ' ★' : ' · ' + _t('8 or more earns a star', '8 o más gana una estrella')) + '</div>' +
        '<button type="button" class="cv-primary-btn" onclick="CivicsLab.openComparative()">' + _t('Take the 10-question quiz', 'Hacer el cuestionario de 10 preguntas') + '</button>' +
      '</div>';
  }

  // ── Comparative civics quiz ──
  function openComparative() {
    state.mode = 'comparative';
    state.quizPool = _shuffle(_filterByTier(COMPARATIVE_QUIZ)).slice(0, 10);
    state.quizIdx = 0;
    state.quizCorrect = 0;
    state.quizTitle = { en: 'Compare', es: 'Compara' };
    state.quizBack = 'CivicsLab.openCompare()';
    _renderQuiz('comparative', null, () => {
      const prog = _loadProgress();
      prog.comparativeBest = Math.max(prog.comparativeBest || 0, state.quizCorrect);
      _saveProgress(prog);
      _log('🌍', (state.lang === 'es' ? 'Compara: ' : 'Compare: ') + state.quizCorrect + '/' + state.quizPool.length);
    });
  }

  // ── Challenge 1: sort the powers ──
  function openSort() {
    state.mode = 'sort';
    const tier = _tier();
    const n = DATA.SORT_ROUND[tier] || 6;
    const pool = DATA.POWERS.filter(_atOrBelow);
    const own = _shuffle(pool.filter(p => p.tier === tier));
    const rest = _shuffle(pool.filter(p => p.tier !== tier));
    let deck = own.slice(0, Math.ceil(n / 2));
    rest.concat(own.slice(Math.ceil(n / 2))).forEach(p => { if (deck.length < n) deck.push(p); });
    // every branch at least once
    BRANCHES.forEach(b => {
      if (!deck.some(p => p.branch === b.id)) {
        const extra = pool.find(p => p.branch === b.id && deck.indexOf(p) === -1);
        if (extra) deck[deck.length - 1 - BRANCHES.indexOf(b)] = extra;
      }
    });
    state.sort = { deck: _shuffle(deck), idx: 0, mistakes: 0, tries: 0, placed: { ejecutivo: 0, legislativo: 0, judicial: 0 }, msg: null };
    state.rerender = _renderSort;
    _renderSort();
    _showScreen('cv-screen-sort');
  }

  function _renderSort() {
    const S = state.sort;
    const wrap = document.getElementById('cv-sort-wrap');
    if (!S || !wrap) return;
    const card = S.deck[S.idx];
    wrap.innerHTML =
      _toolbar('CivicsLab.goHome()', _t('Sort the powers', 'Ordena los poderes'), _t('Back to home', 'Volver al inicio')) +
      '<div class="cv-sort-top"><div class="cv-progress-dots" aria-label="' + (S.idx + 1) + ' / ' + S.deck.length + '">' +
        S.deck.map((_, i) => '<span class="' + (i < S.idx ? 'done' : i === S.idx ? 'now' : '') + '"></span>').join('') + '</div>' +
      '<p class="cv-intro">' + _t('Drag the card to the branch that does it, or tap a branch.', 'Arrastra la tarjeta al poder que la realiza, o toca un poder.') + '</p></div>' +
      '<div class="cv-sort-stage">' +
        (card ? '<div class="cv-power-card" id="cv-power-card" tabindex="0" role="group" aria-label="' + _esc(_l(card.text)) + '">' +
          '<span class="cv-power-seal" aria-hidden="true">?</span><span class="cv-power-text">' + _esc(_l(card.text)) + '</span></div>' : '') +
        '<p class="cv-sort-msg" id="cv-sort-msg" aria-live="polite">' + (S.msg ? S.msg : '') + '</p>' +
      '</div>' +
      '<div class="cv-bins">' +
        BRANCHES.map(b =>
          '<button type="button" class="cv-bin" data-branch="' + b.id + '" style="--c:' + BRANCH_COLOR[b.id] + '" aria-label="' + _esc(_l(b.title)) + '">' +
            '<span class="cv-bin-art">' + _art(A => A.building(BRANCH_SEAT[b.id], { par: 'xMidYMid slice' })) + '</span>' +
            '<span class="cv-bin-name">' + _esc(_l(b.title)) + '</span>' +
            '<span class="cv-bin-count">' + S.placed[b.id] + '</span>' +
          '</button>').join('') +
      '</div>';
    wrap.querySelectorAll('.cv-bin').forEach(btn => { btn.onclick = () => _sortDrop(btn.dataset.branch, btn); });
    _wireDrag(document.getElementById('cv-power-card'));
  }

  // Pointer drag for the power card. A plain tap on a bin also works.
  function _wireDrag(el) {
    if (!el) return;
    let sx = 0, sy = 0, dragging = false, pid = null;
    const binAt = (x, y) => {
      el.style.pointerEvents = 'none';
      const hit = document.elementFromPoint(x, y);
      el.style.pointerEvents = '';
      return hit && hit.closest ? hit.closest('.cv-bin') : null;
    };
    el.addEventListener('pointerdown', e => {
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = true;
      try { el.setPointerCapture(pid); } catch (err) {}
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!dragging || e.pointerId !== pid) return;
      el.style.transform = 'translate(' + (e.clientX - sx) + 'px,' + (e.clientY - sy) + 'px) rotate(' + ((e.clientX - sx) / 30) + 'deg)';
      document.querySelectorAll('.cv-bin').forEach(b => b.classList.remove('hover'));
      const b = binAt(e.clientX, e.clientY);
      if (b) b.classList.add('hover');
    });
    const end = e => {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      el.classList.remove('dragging');
      const b = binAt(e.clientX, e.clientY);
      document.querySelectorAll('.cv-bin').forEach(x => x.classList.remove('hover'));
      el.style.transform = '';
      if (b && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) _sortDrop(b.dataset.branch, b);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function _sortDrop(branchId, binEl) {
    const S = state.sort;
    if (!S || S.busy) return;
    const card = S.deck[S.idx];
    if (!card) return;
    const cardEl = document.getElementById('cv-power-card');
    if (card.branch === branchId) {
      S.busy = true;
      _sfx('correct');
      S.placed[branchId]++;
      if (binEl) { binEl.classList.add('ok'); _burst(binEl); }
      if (cardEl) cardEl.classList.add('flying');
      S.msg = '<span class="ok">✓ ' + _esc(_l(_branchById(branchId).title)) + '</span>';
      setTimeout(() => {
        S.busy = false; S.idx++; S.tries = 0; S.msg = null;
        if (S.idx >= S.deck.length) return _finishSort();
        _renderSort();
      }, 650);
    } else {
      _sfx('wrong');
      S.mistakes++; S.tries++;
      if (binEl) { binEl.classList.remove('bad'); void binEl.offsetWidth; binEl.classList.add('bad'); }
      if (cardEl) { cardEl.classList.remove('shake'); void cardEl.offsetWidth; cardEl.classList.add('shake'); }
      const msgEl = document.getElementById('cv-sort-msg');
      if (S.tries >= 2) {
        // Show the answer, then move on.
        S.busy = true;
        const right = _branchById(card.branch);
        const rb = document.querySelector('.cv-bin[data-branch="' + card.branch + '"]');
        if (rb) rb.classList.add('reveal');
        if (msgEl) msgEl.innerHTML = '<span class="bad">' + _t('This one belongs to the ', 'Esta pertenece al ') + _esc(_l(right.title)) + '.</span>';
        setTimeout(() => {
          S.busy = false; S.placed[card.branch]++; S.idx++; S.tries = 0; S.msg = null;
          if (S.idx >= S.deck.length) return _finishSort();
          _renderSort();
        }, 1800);
      } else if (msgEl) {
        msgEl.innerHTML = '<span class="bad">' + _t('Not that one — try another branch.', 'Ese no — prueba otro poder.') + '</span>';
      }
    }
  }

  function _finishSort() {
    const S = state.sort;
    const stars = S.mistakes === 0 ? 3 : S.mistakes <= 2 ? 2 : 1;
    const rec = _saveChallenge('sort', stars);
    _log('🗂️', _t('Sorted the powers: ', 'Ordenó los poderes: ') + _starsText(stars));
    _showResult({
      stars: stars,
      title: _t('Sort the powers', 'Ordena los poderes'),
      line: (S.deck.length - Math.min(S.mistakes, S.deck.length)) + ' / ' + S.deck.length + ' ' + _t('on the first try', 'al primer intento') +
        ' · ' + _t('best', 'mejor') + ' ' + _starsText(rec.best),
      again: 'CivicsLab.openSort()'
    });
  }

  // ── Challenge 2: build the law (put the steps in order) ──
  function openOrder() {
    state.mode = 'order';
    const tier = _tier();
    const ids = DATA.ORDER_ROUND[tier] || LAW_STEPS.map(s => s.id);
    const steps = ids.map(id => LAW_STEPS.find(s => s.id === id)).filter(Boolean);
    let tray = _shuffle(steps);
    // never deal it already in order
    if (tray.every((s, i) => s === steps[i]) && tray.length > 1) tray = tray.slice(1).concat(tray[0]);
    state.order = { steps: steps, tray: tray, placed: 0, mistakes: 0, wrongStreak: 0, phase: 'order',
                    bonus: tier === 'expert', optPicked: [] };
    state.rerender = _renderOrder;
    _renderOrder();
    _showScreen('cv-screen-order');
  }

  function _renderOrder() {
    const O = state.order;
    const wrap = document.getElementById('cv-order-wrap');
    if (!O || !wrap) return;
    const board = _boardSvg(O.steps, {
      interactive: O.phase === 'optional',
      markOptional: O.phase === 'done',
      showIcon: (st, i) => i < O.placed,
      classFor: (st, i) => (i < O.placed ? 'filled' : i === O.placed ? 'current' : '') +
        (O.optPicked.indexOf(st.id) !== -1 ? ' picked' : '')
    });
    O._layout = board.layout;
    const young = TIERS.indexOf(_tier()) === 0;
    const prompt = O.phase === 'optional'
      ? _t('Bonus: tap the TWO steps that only happen in some cases.', 'Bonus: toca los DOS pasos que sólo ocurren en algunos casos.')
      : _t('Tap the step that comes next. Space ', 'Toca el paso que sigue. Casilla ') + (O.placed + 1) + ' / ' + O.steps.length;
    wrap.innerHTML =
      _toolbar('CivicsLab.goHome()', _t('Build the law', 'Arma la ley'), _t('Back to home', 'Volver al inicio')) +
      '<p class="cv-intro" id="cv-order-prompt">' + prompt + '</p>' +
      '<div class="cv-board" id="cv-order-board">' + board.svg + '</div>' +
      '<p class="cv-sort-msg" id="cv-order-msg" aria-live="polite"></p>' +
      (O.phase === 'order' ? '<div class="cv-tray">' +
        O.tray.map(st => {
          const hint = young && O.wrongStreak >= 2 && st === O.steps[O.placed];
          return '<button type="button" class="cv-tray-tile' + (hint ? ' hint' : '') + '" data-step="' + st.id + '">' +
            '<span class="cv-tray-icon">' + _art(A => A.lawIcon(st.id)) + '</span>' +
            '<span class="cv-tray-name">' + _esc(_l(DATA.STEP_SHORT[st.id]) || _stepName(st)) + '</span></button>';
        }).join('') + '</div>' : '');
    _moveToken(document.getElementById('cv-order-board'), O._layout, O.placed);
    wrap.querySelectorAll('.cv-tray-tile').forEach(btn => { btn.onclick = () => _orderPick(btn.dataset.step, btn); });
    if (O.phase === 'optional') {
      wrap.querySelectorAll('.cv-space').forEach(g => {
        const go = () => _optionalPick(+g.dataset.i, g);
        g.addEventListener('click', go);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    }
  }

  function _orderPick(stepId, btn) {
    const O = state.order;
    if (!O || O.busy) return;
    const want = O.steps[O.placed];
    const msg = document.getElementById('cv-order-msg');
    if (want && want.id === stepId) {
      O.busy = true;
      _sfx('correct');
      O.wrongStreak = 0;
      btn.classList.add('flying');
      _burst(btn);
      setTimeout(() => {
        O.busy = false;
        O.tray = O.tray.filter(s => s.id !== stepId);
        O.placed++;
        if (O.placed >= O.steps.length) {
          if (O.bonus) { O.phase = 'optional'; _renderOrder(); return; }
          return _finishOrder();
        }
        _renderOrder();
        const m = document.getElementById('cv-order-msg');
        if (m) m.innerHTML = '<span class="ok">✓ ' + _esc(_stepName(want)) + '</span>';
      }, 420);
    } else {
      _sfx('wrong');
      O.mistakes++; O.wrongStreak++;
      btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
      if (msg) msg.innerHTML = '<span class="bad">' + _t('Not yet! What has to happen before that?', '¡Todavía no! ¿Qué tiene que pasar antes?') + '</span>';
      if (O.wrongStreak === 2 && TIERS.indexOf(_tier()) === 0) _renderOrder();
    }
  }

  function _optionalPick(i, g) {
    const O = state.order;
    const st = O.steps[i];
    if (!st || O.optPicked.indexOf(st.id) !== -1) return;
    const msg = document.getElementById('cv-order-msg');
    if (DATA.OPTIONAL_STEPS.indexOf(st.id) !== -1) {
      _sfx('correct');
      O.optPicked.push(st.id);
      g.classList.add('picked');
      _burst(g);
      if (msg) msg.innerHTML = '<span class="ok">✓ ' + _esc(_stepName(st)) + '</span>';
      if (O.optPicked.length >= DATA.OPTIONAL_STEPS.length) setTimeout(_finishOrder, 700);
    } else {
      _sfx('wrong');
      O.mistakes++;
      g.classList.remove('nope'); void g.getBoundingClientRect(); g.classList.add('nope');
      if (msg) msg.innerHTML = '<span class="bad">' + _t('Every law goes through that step.', 'Toda ley pasa por ese paso.') + '</span>';
    }
  }

  function _finishOrder() {
    const O = state.order;
    O.phase = 'done';
    const stars = O.mistakes === 0 ? 3 : O.mistakes <= 2 ? 2 : 1;
    const rec = _saveChallenge('order', stars);
    _log('📜', _t('Built the law in order: ', 'Armó la ley en orden: ') + _starsText(stars));
    _showResult({
      stars: stars,
      title: _t('Build the law', 'Arma la ley'),
      line: (O.mistakes === 0 ? _t('No mistakes!', '¡Sin errores!') : O.mistakes + ' ' + _t(O.mistakes === 1 ? 'mistake' : 'mistakes', O.mistakes === 1 ? 'error' : 'errores')) +
        ' · ' + _t('best', 'mejor') + ' ' + _starsText(rec.best),
      again: 'CivicsLab.openOrder()'
    });
  }

  // ── Shared quiz renderer ──
  function _renderQuiz(modeId, subId, onFinishCallback) {
    state._quizFinish = onFinishCallback;
    state._answered = -1;
    state._lastCorrect = false;
    state.rerender = _renderQuizQuestion;
    _renderQuizQuestion();
    _showScreen('cv-screen-quiz');
  }

  function _renderQuizQuestion() {
    const wrap = document.getElementById('cv-quiz-wrap');
    const q = state.quizPool[state.quizIdx];
    if (!q) return _finishQuiz();
    const opts = q.options[state.lang] || q.options.en;
    const total = state.quizPool.length;
    wrap.innerHTML =
      _toolbar(state.quizBack || 'CivicsLab.goHome()', _l(state.quizTitle, _t('Quiz', 'Cuestionario'))) +
      '<div class="cv-quiz-card">' +
      '<div class="cv-quiz-counter"><span>' + _t('Question', 'Pregunta') + ' ' + (state.quizIdx + 1) + ' / ' + total + '</span>' +
        '<span class="cv-quiz-score">✓ ' + state.quizCorrect + '</span></div>' +
      '<div class="cv-meter"><div class="cv-meter-fill" style="width:' + Math.round(state.quizIdx / total * 100) + '%"></div></div>' +
      '<h2 class="cv-quiz-q">' + _l(q.q) + '</h2>' +
      '<div class="cv-quiz-options">' +
        opts.map((o, i) =>
          '<button type="button" class="cv-quiz-opt" data-i="' + i + '" data-correct="' + (i === q.answer ? '1' : '0') + '">' +
          '<span class="cv-opt-letter">' + 'ABCD'[i] + '</span><span>' + o + '</span></button>'
        ).join('') +
      '</div>' +
      '<div class="cv-quiz-after" id="cv-quiz-after" aria-live="polite"></div>' +
      '</div>';
    wrap.querySelectorAll('.cv-quiz-opt').forEach(btn => {
      btn.onclick = () => {
        if (state._answered === state.quizIdx) return;    // one answer per question
        state._answered = state.quizIdx;
        const correct = btn.dataset.correct === '1';
        wrap.querySelectorAll('.cv-quiz-opt').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === '1') b.classList.add('cv-correct');
        });
        if (!correct) btn.classList.add('cv-wrong');
        else _burst(btn);
        if (correct) state.quizCorrect++;
        state._lastCorrect = correct;
        _quizAfter(q, correct);
        _sfx(correct ? 'correct' : 'wrong');
      };
    });
    // Re-drawn after a language switch: keep the answer that was given.
    if (state._answered === state.quizIdx) _quizAfter(q, state._lastCorrect);
  }

  function _quizAfter(q, correct) {
    const wrap = document.getElementById('cv-quiz-wrap');
    const after = document.getElementById('cv-quiz-after');
    if (!after || !wrap) return;
    wrap.querySelectorAll('.cv-quiz-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === '1') b.classList.add('cv-correct');
    });
    const last = state.quizIdx + 1 >= state.quizPool.length;
    after.innerHTML =
      '<p class="cv-quiz-explain ' + (correct ? 'ok' : 'bad') + '"><strong>' + (correct ? _t('Correct!', '¡Correcto!') : _t('Not quite.', 'No exactamente.')) + '</strong> ' +
        (q.explain ? _esc(_l(q.explain)) : '') + '</p>' +
      '<button type="button" class="cv-primary-btn" id="cv-quiz-next">' + (last ? _t('See results', 'Ver resultado') : _t('Next →', 'Siguiente →')) + '</button>';
    const nx = document.getElementById('cv-quiz-next');
    if (nx) {
      nx.onclick = () => { state.quizIdx++; _renderQuizQuestion(); };
      try { nx.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function _finishQuiz() {
    const total = state.quizPool.length;
    const acc = total > 0 ? state.quizCorrect / total : 0;
    const stars = acc >= 0.95 ? 3 : acc >= 0.80 ? 2 : 1;
    if (typeof state._quizFinish === 'function') {
      try { state._quizFinish(); } catch (e) {}
      state._quizFinish = null;
    }
    let extra = '';
    if (state.mode === 'comparative') {
      extra = state.quizCorrect >= 8
        ? _t('8 or more: this round counts for a star!', '8 o más: ¡esta ronda cuenta para una estrella!')
        : _t('Score 8 or more to earn the Compare star.', 'Logra 8 o más para ganar la estrella de Compara.');
    }
    _showResult({
      stars: stars,
      title: _l(state.quizTitle, _t('Quiz', 'Cuestionario')),
      line: state.quizCorrect + ' / ' + total + ' ' + _t('correct', 'correctas'),
      extra: extra,
      back: state.quizBack
    });
  }

  function _showResult(r) {
    state.rerender = null;
    const el = document.getElementById('cv-quiz-result');
    el.innerHTML =
      '<div class="cv-result-card">' +
      '<div class="cv-result-title">' + _esc(r.title) + '</div>' +
      '<div class="cv-stars-big" role="img" aria-label="' + r.stars + ' / 3">' +
        [0, 1, 2].map(i => '<span style="animation-delay:' + (0.15 + i * 0.18) + 's">' + _art(A => A.bigStar(i < r.stars)) + '</span>').join('') + '</div>' +
      '<p class="cv-result-line">' + r.line + '</p>' +
      (r.extra ? '<p class="cv-result-extra">' + _esc(r.extra) + '</p>' : '') +
      '<div class="cv-actions">' +
        (r.again ? '<button type="button" class="cv-secondary-btn" onclick="' + r.again + '">' + _t('Play again', 'Jugar otra vez') + '</button>' : '') +
        (r.back ? '<button type="button" class="cv-secondary-btn" onclick="' + r.back + '">' + _t('← Back', '← Volver') + '</button>' : '') +
        '<button type="button" class="cv-primary-btn" onclick="CivicsLab.goHome()">' + _t('Home', 'Inicio') + '</button>' +
      '</div></div>';
    _showScreen('cv-screen-quiz-result');
    if (r.stars >= 3) _sfx('cheer'); else _sfx('star');
  }

  // ── Language toggle ──
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const prog = _loadProgress();
    prog.lang = state.lang;
    _saveProgress(prog);
    _applyLang();
    if (state.mode && typeof state.rerender === 'function') state.rerender();
    else _renderHome();
  }

  function _applyLang() {
    const lbl = document.getElementById('cv-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'Español · EN' : 'English · ES';
    document.documentElement.lang = state.lang;
    document.querySelectorAll('.cv-home-btn').forEach(b => b.setAttribute('aria-label', _t('Back to home', 'Volver al inicio')));
  }

  function goHome() {
    state.mode = null;
    state.rerender = null;
    _renderHome();
  }

  // ── Init ──
  function init() {
    const prog = _loadProgress();
    if (prog.lang === 'es' || prog.lang === 'en') state.lang = prog.lang;
    const hero = document.getElementById('cv-hero-art');
    if (hero) hero.innerHTML = _art(A => A.building('moneda', { label: 'Palacio de La Moneda', par: 'xMidYMid slice' }));
    document.querySelectorAll('.cv-tile-icon[data-icon]').forEach(el => {
      const k = el.getAttribute('data-icon');
      el.innerHTML = _art(A => k === 'congreso' ? A.building('congreso', { par: 'xMidYMid slice' }) : A.tileIcon(k));
    });
    document.getElementById('cv-tile-branches').onclick = openBranches;
    document.getElementById('cv-tile-institutions').onclick = openInstitutions;
    document.getElementById('cv-tile-law').onclick = openLawMaking;
    document.getElementById('cv-tile-comparative').onclick = openCompare;
    const ts = document.getElementById('cv-tile-sort'); if (ts) ts.onclick = openSort;
    const to = document.getElementById('cv-tile-order'); if (to) to.onclick = openOrder;
    document.getElementById('cv-lang-toggle').onclick = toggleLanguage;
    document.querySelectorAll('.cv-home-btn').forEach(b => { b.onclick = goHome; });
    _applyLang();
    _renderHome();
  }

  return {
    init, goHome,
    openBranches, openInstitutions, openLawMaking, openComparative, openCompare,
    openSort, openOrder,
    backToBranchList, backToInstitutionList,
    startBranchQuiz, startInstitutionQuiz, startLawQuiz,
    lawNext, lawPrev,
    toggleLanguage
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CivicsLab !== 'undefined') CivicsLab.init();
});
