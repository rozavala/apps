/* ================================================================
   CIVICS LAB — civics-lab-data.js
   Extra hand-written content for the v2 screens: checks and balances,
   the "sort the powers" challenge, the comparison cards and short
   captions for the drawn buildings. Facts only, no opinions, no
   parties, no current officeholders.

   Tiers: beginner (≤5), intermediate (6–8), advanced (9–11), expert (12+),
   matching getAgeTier() in auth.js. A kid sees their tier and below.
   ================================================================ */

var CivicsData = (function () {
  'use strict';

  // How each branch limits another. `from`/`to` are BRANCHES ids.
  var CHECKS = [
    { id: 'veto', from: 'ejecutivo', to: 'legislativo', tier: 'beginner',
      title: { en: 'Veto', es: 'Veto' },
      text: { en: 'The President can veto (refuse to sign) a bill that Congress has passed.',
              es: 'El Presidente puede vetar (no firmar) un proyecto que aprobó el Congreso.' } },
    { id: 'override', from: 'legislativo', to: 'ejecutivo', tier: 'intermediate',
      title: { en: 'Override a veto', es: 'Superar el veto' },
      text: { en: 'Congress can still pass a vetoed bill if both chambers approve the original text again by two-thirds.',
              es: 'El Congreso puede aprobar igual un proyecto vetado si ambas cámaras reaprueban el texto original por dos tercios.' } },
    { id: 'propose', from: 'ejecutivo', to: 'judicial', tier: 'intermediate',
      title: { en: 'Proposes justices', es: 'Propone ministros' },
      text: { en: 'The President proposes each new Supreme Court justice, choosing from a list of 5 made by the Court itself.',
              es: 'El Presidente propone a cada nuevo ministro de la Corte Suprema, eligiendo de una lista de 5 que hace la propia Corte.' } },
    { id: 'ratify', from: 'legislativo', to: 'judicial', tier: 'beginner',
      title: { en: 'Approves justices', es: 'Ratifica ministros' },
      text: { en: 'The Senate must approve (ratify) each new Supreme Court justice.',
              es: 'El Senado debe aprobar (ratificar) a cada nuevo ministro de la Corte Suprema.' } },
    { id: 'courts', from: 'judicial', to: 'ejecutivo', tier: 'beginner',
      title: { en: 'Decides cases', es: 'Resuelve casos' },
      text: { en: 'Judges decide disputes using the law, including cases about decisions of public authorities.',
              es: 'Los jueces resuelven conflictos aplicando la ley, también casos sobre decisiones de las autoridades.' } },
    { id: 'urgencia', from: 'ejecutivo', to: 'legislativo', tier: 'advanced',
      title: { en: 'Urgencia', es: 'Urgencia' },
      text: { en: 'The President can give a bill an "urgencia", setting a deadline for Congress to vote on it.',
              es: 'El Presidente puede dar "urgencia" a un proyecto, fijando un plazo para que el Congreso lo vote.' } },
    { id: 'acusacion', from: 'legislativo', to: 'ejecutivo', tier: 'advanced',
      title: { en: 'Constitutional accusation', es: 'Acusación constitucional' },
      text: { en: 'The Chamber of Deputies can bring a constitutional accusation against the President or a minister; the Senate then decides it.',
              es: 'La Cámara de Diputados puede presentar una acusación constitucional contra el Presidente o un ministro; luego el Senado la resuelve.' } },
    { id: 'treaties', from: 'legislativo', to: 'ejecutivo', tier: 'expert',
      title: { en: 'Approves treaties', es: 'Aprueba tratados' },
      text: { en: 'Congress approves or rejects the international treaties the President presents before they are ratified.',
              es: 'El Congreso aprueba o rechaza los tratados internacionales que le presenta el Presidente antes de su ratificación.' } },
    { id: 'heard', from: 'judicial', to: 'legislativo', tier: 'expert',
      title: { en: 'Must be heard', es: 'Debe ser oída' },
      text: { en: 'Before Congress changes the law on how the courts are organised, it must first hear the opinion of the Supreme Court.',
              es: 'Antes de cambiar la ley sobre la organización de los tribunales, el Congreso debe oír primero a la Corte Suprema.' } }
  ];

  // "Sort the powers" cards. `branch` is a BRANCHES id.
  var POWERS = [
    { id: 'p_laws',      branch: 'legislativo', tier: 'beginner', text: { en: 'Votes on new laws', es: 'Vota las leyes nuevas' } },
    { id: 'p_leads',     branch: 'ejecutivo',   tier: 'beginner', text: { en: 'Leads the country and names ministers', es: 'Dirige el país y nombra ministros' } },
    { id: 'p_disputes',  branch: 'judicial',    tier: 'beginner', text: { en: 'Decides disputes using the law', es: 'Resuelve conflictos con la ley' } },
    { id: 'p_moneda',    branch: 'ejecutivo',   tier: 'beginner', text: { en: 'Works in La Moneda', es: 'Trabaja en La Moneda' } },
    { id: 'p_valpo',     branch: 'legislativo', tier: 'beginner', text: { en: 'Meets in Valparaíso', es: 'Sesiona en Valparaíso' } },
    { id: 'p_supreme',   branch: 'judicial',    tier: 'beginner', text: { en: 'Led by the Supreme Court', es: 'Lo encabeza la Corte Suprema' } },

    { id: 'p_veto',      branch: 'ejecutivo',   tier: 'intermediate', text: { en: 'Can veto a bill', es: 'Puede vetar un proyecto' } },
    { id: 'p_members',   branch: 'legislativo', tier: 'intermediate', text: { en: 'Has 155 deputies and 50 senators', es: 'Tiene 155 diputados y 50 senadores' } },
    { id: 'p_75',        branch: 'judicial',    tier: 'intermediate', text: { en: 'Its justices serve until age 75', es: 'Sus ministros sirven hasta los 75 años' } },
    { id: 'p_abroad',    branch: 'ejecutivo',   tier: 'intermediate', text: { en: 'Represents Chile abroad', es: 'Representa a Chile en el extranjero' } },
    { id: 'p_committee', branch: 'legislativo', tier: 'intermediate', text: { en: 'Studies bills in committees', es: 'Estudia proyectos en comisiones' } },
    { id: 'p_interpret', branch: 'judicial',    tier: 'intermediate', text: { en: 'Interprets the law in a case', es: 'Interpreta la ley en un caso' } },

    { id: 'p_override',  branch: 'legislativo', tier: 'advanced', text: { en: 'Overrides a veto by two-thirds', es: 'Supera un veto por dos tercios' } },
    { id: 'p_ratify',    branch: 'legislativo', tier: 'advanced', text: { en: 'Ratifies Supreme Court justices (Senate)', es: 'Ratifica ministros de la Corte Suprema (Senado)' } },
    { id: 'p_propose',   branch: 'ejecutivo',   tier: 'advanced', text: { en: 'Proposes Supreme Court justices', es: 'Propone ministros de la Corte Suprema' } },
    { id: 'p_decreto',   branch: 'ejecutivo',   tier: 'advanced', text: { en: 'Issues "decretos supremos"', es: 'Dicta "decretos supremos"' } },
    { id: 'p_acusacion', branch: 'legislativo', tier: 'advanced', text: { en: 'Brings a constitutional accusation (Chamber of Deputies)', es: 'Presenta una acusación constitucional (Cámara de Diputados)' } },
    { id: 'p_quina',     branch: 'judicial',    tier: 'advanced', text: { en: 'Draws up the list of 5 for a new justice', es: 'Elabora la lista de 5 (quina) para un nuevo ministro' } },

    { id: 'p_treaties',  branch: 'legislativo', tier: 'expert', text: { en: 'Approves treaties before they are ratified', es: 'Aprueba tratados antes de su ratificación' } },
    { id: 'p_urgencia',  branch: 'ejecutivo',   tier: 'expert', text: { en: 'Sets "urgencias" on bills', es: 'Fija "urgencias" a los proyectos' } },
    { id: 'p_heard',     branch: 'judicial',    tier: 'expert', text: { en: 'Is heard before the law on courts changes', es: 'Es oída antes de cambiar la ley de tribunales' } },
    { id: 'p_mixta',     branch: 'legislativo', tier: 'expert', text: { en: 'Forms a Comisión Mixta', es: 'Forma una Comisión Mixta' } }
  ];

  // How many cards a round deals, by tier.
  var SORT_ROUND = { beginner: 4, intermediate: 6, advanced: 8, expert: 10 };

  // Law-order rounds: which LAW_STEPS ids are dealt, by tier (kept in
  // the real order — the kid has to rebuild it).
  var ORDER_ROUND = {
    beginner:     ['iniciativa', 'origen', 'presidente', 'publicacion'],
    intermediate: ['iniciativa', 'origen', 'revisora', 'presidente', 'publicacion'],
    advanced:     ['iniciativa', 'origen', 'revisora', 'comision_mixta', 'presidente', 'tc_revision', 'publicacion'],
    expert:       ['iniciativa', 'origen', 'revisora', 'comision_mixta', 'presidente', 'tc_revision', 'publicacion']
  };
  // Steps that only happen in some cases (asked as a bonus at expert).
  var OPTIONAL_STEPS = ['comision_mixta', 'tc_revision'];

  // Short labels for the board spaces.
  var STEP_SHORT = {
    iniciativa:     { en: 'Bill',            es: 'Proyecto' },
    origen:         { en: 'First chamber',   es: 'Cámara de origen' },
    revisora:       { en: 'Second chamber',  es: 'Cámara revisora' },
    comision_mixta: { en: 'Comisión Mixta',  es: 'Comisión Mixta' },
    presidente:     { en: 'President',       es: 'Presidente' },
    tc_revision:    { en: 'Const. review',   es: 'Revisión TC' },
    publicacion:    { en: 'Diario Oficial',  es: 'Diario Oficial' }
  };

  // One plain sentence per step for younger kids (shown above the full text).
  var STEP_KID = {
    iniciativa:     { en: 'Someone writes down an idea for a new law. It is called a bill: "proyecto de ley".',
                      es: 'Alguien escribe una idea para una ley nueva. Se llama "proyecto de ley".' },
    origen:         { en: 'One chamber of Congress studies the bill in a committee, then everyone votes.',
                      es: 'Una cámara del Congreso estudia el proyecto en una comisión y luego todos votan.' },
    revisora:       { en: 'The other chamber studies it and votes on it too.',
                      es: 'La otra cámara también lo estudia y lo vota.' },
    comision_mixta: { en: 'If the two chambers do not agree, a team from both writes a shared text.',
                      es: 'Si las dos cámaras no están de acuerdo, un equipo de ambas escribe un texto común.' },
    presidente:     { en: 'The President signs it into law, or can say no with a veto.',
                      es: 'El Presidente lo firma y se vuelve ley, o puede decir que no con un veto.' },
    tc_revision:    { en: 'Some laws are checked by the Constitutional Tribunal against the Constitution.',
                      es: 'Algunas leyes las revisa el Tribunal Constitucional para ver si respetan la Constitución.' },
    publicacion:    { en: 'It is printed in the Diario Oficial. Now everyone must follow it.',
                      es: 'Se publica en el Diario Oficial. Desde entonces todos deben cumplirla.' }
  };

  // Comparison cards. Kept to structure, not to who governs.
  var COUNTRIES = [
    { id: 'cl', name: { en: 'Chile', es: 'Chile' },
      system: { en: 'Presidential republic', es: 'República presidencial' },
      head:   { en: 'The President is head of state and of government (4-year term).', es: 'El Presidente es jefe de Estado y de gobierno (período de 4 años).' },
      leg:    { en: 'National Congress: Chamber of Deputies (155) + Senate (50)', es: 'Congreso Nacional: Cámara de Diputados (155) + Senado (50)' },
      shape:  { en: 'Unitary — 16 regions', es: 'Unitario — 16 regiones' }, kind: 'unitary' },
    { id: 'us', name: { en: 'United States', es: 'Estados Unidos' },
      system: { en: 'Presidential republic', es: 'República presidencial' },
      head:   { en: 'The President is head of state and of government (4-year term).', es: 'El Presidente es jefe de Estado y de gobierno (período de 4 años).' },
      leg:    { en: 'Congress: House of Representatives (435) + Senate (100)', es: 'Congreso: Cámara de Representantes (435) + Senado (100)' },
      shape:  { en: 'Federal — 50 states', es: 'Federal — 50 estados' }, kind: 'federal' },
    { id: 'gb', name: { en: 'United Kingdom', es: 'Reino Unido' },
      system: { en: 'Parliamentary monarchy', es: 'Monarquía parlamentaria' },
      head:   { en: 'The King is head of state; the Prime Minister leads the government.', es: 'El Rey es jefe de Estado; el Primer Ministro dirige el gobierno.' },
      leg:    { en: 'Parliament: House of Commons (650) + House of Lords', es: 'Parlamento: Cámara de los Comunes (650) + Cámara de los Lores' },
      shape:  { en: 'Unitary — England, Scotland, Wales, Northern Ireland', es: 'Unitario — Inglaterra, Escocia, Gales, Irlanda del Norte' }, kind: 'unitary' },
    { id: 'es', name: { en: 'Spain', es: 'España' },
      system: { en: 'Parliamentary monarchy', es: 'Monarquía parlamentaria' },
      head:   { en: 'The King is head of state; the President of the Government leads it.', es: 'El Rey es jefe de Estado; el Presidente del Gobierno lo dirige.' },
      leg:    { en: 'Cortes Generales: Congress of Deputies (350) + Senate', es: 'Cortes Generales: Congreso de los Diputados (350) + Senado' },
      shape:  { en: '17 autonomous communities', es: '17 comunidades autónomas' }, kind: 'other' },
    { id: 'fr', name: { en: 'France', es: 'Francia' },
      system: { en: 'Semi-presidential republic', es: 'República semipresidencial' },
      head:   { en: 'The President (5-year term) is head of state and names the Prime Minister.', es: 'El Presidente (período de 5 años) es jefe de Estado y nombra al Primer Ministro.' },
      leg:    { en: 'Parliament: National Assembly (577) + Senate', es: 'Parlamento: Asamblea Nacional (577) + Senado' },
      shape:  { en: 'Unitary', es: 'Unitario' }, kind: 'unitary' },
    { id: 'de', name: { en: 'Germany', es: 'Alemania' },
      system: { en: 'Parliamentary republic', es: 'República parlamentaria' },
      head:   { en: 'The Federal President is head of state; the Chancellor, elected by the Bundestag, leads the government.', es: 'El Presidente Federal es jefe de Estado; el Canciller, elegido por el Bundestag, dirige el gobierno.' },
      leg:    { en: 'Bundestag, with the Bundesrat representing the states', es: 'Bundestag, con el Bundesrat que representa a los estados' },
      shape:  { en: 'Federal — 16 states', es: 'Federal — 16 estados' }, kind: 'federal' }
  ];

  // Captions under the big drawings.
  var CAPTIONS = {
    moneda:     { en: 'Palacio de La Moneda, Santiago — designed by Joaquín Toesca, finished in 1805. Seat of the President since 1845.',
                  es: 'Palacio de La Moneda, Santiago — diseñado por Joaquín Toesca, terminado en 1805. Sede del Presidente desde 1845.' },
    congreso:   { en: 'National Congress building, Valparaíso — opened in 1990.',
                  es: 'Edificio del Congreso Nacional, Valparaíso — inaugurado en 1990.' },
    tribunales: { en: 'Palacio de los Tribunales, Santiago — seat of the Supreme Court.',
                  es: 'Palacio de los Tribunales, Santiago — sede de la Corte Suprema.' },
    tribunal_constitucional: { en: 'The Tribunal weighs laws against the Constitution.', es: 'El Tribunal compara las leyes con la Constitución.' },
    contraloria:  { en: 'The Contraloría checks how public money is spent.', es: 'La Contraloría revisa cómo se gasta el dinero público.' },
    banco_central:{ en: 'The Central Bank looks after the value of the peso.', es: 'El Banco Central cuida el valor del peso.' }
  };

  return {
    CHECKS: CHECKS, POWERS: POWERS, SORT_ROUND: SORT_ROUND, ORDER_ROUND: ORDER_ROUND,
    OPTIONAL_STEPS: OPTIONAL_STEPS, STEP_SHORT: STEP_SHORT, STEP_KID: STEP_KID, COUNTRIES: COUNTRIES, CAPTIONS: CAPTIONS
  };
})();
