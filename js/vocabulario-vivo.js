/* ================================================================
   VOCABULARIO VIVO — vocabulario-vivo.js
   Vocabulary through Latin/Greek roots, prefixes, suffixes.
   Hand-authored bilingual content. No external APIs.

   Requires: auth.js, sounds.js, activity-log.js, zs-diag.js
   ================================================================ */

const VocabularioVivo = (() => {
  'use strict';

  const STORE_PREFIX = 'zs_vocab_';

  // ── 72 Latin/Greek roots ─────────────────────────────────────────
  // tier: 1 = beginner (6-7), 2 = intermediate (8-9), 3 = advanced (10+)
  const ROOTS = [
    // ── Latin ──
    { id: 'aqua', origin: 'L', tier: 1,
      meaning: { en: 'water', es: 'agua' },
      words: [
        { en: 'aquarium',  es: 'acuario' },
        { en: 'aquatic',   es: 'acuático' },
        { en: 'aqueduct',  es: 'acueducto' },
        { en: 'aquamarine',es: 'aguamarina' }
      ] },
    { id: 'terra', origin: 'L', tier: 1,
      meaning: { en: 'earth, land', es: 'tierra' },
      words: [
        { en: 'terrain',     es: 'terreno' },
        { en: 'territory',   es: 'territorio' },
        { en: 'terrestrial', es: 'terrestre' },
        { en: 'extraterrestrial', es: 'extraterrestre' }
      ] },
    { id: 'bene', origin: 'L', tier: 2,
      meaning: { en: 'good, well', es: 'bueno, bien' },
      words: [
        { en: 'benefit',     es: 'beneficio' },
        { en: 'benevolent',  es: 'benévolo' },
        { en: 'benediction', es: 'bendición' },
        { en: 'beneficial',  es: 'benéfico' }
      ] },
    { id: 'mal', origin: 'L', tier: 2,
      meaning: { en: 'bad, evil', es: 'malo, mal' },
      words: [
        { en: 'malign',     es: 'maligno' },
        { en: 'malevolent', es: 'malévolo' },
        { en: 'malady',     es: 'malestar' },
        { en: 'malicious',  es: 'malicioso' }
      ] },
    { id: 'scrib', origin: 'L', tier: 2,
      meaning: { en: 'write', es: 'escribir' },
      words: [
        { en: 'scribe',     es: 'escriba' },
        { en: 'describe',   es: 'describir' },
        { en: 'inscription',es: 'inscripción' },
        { en: 'manuscript', es: 'manuscrito' }
      ] },
    { id: 'port', origin: 'L', tier: 1,
      meaning: { en: 'carry', es: 'llevar' },
      words: [
        { en: 'transport',  es: 'transporte' },
        { en: 'portable',   es: 'portátil' },
        { en: 'import',     es: 'importar' },
        { en: 'export',     es: 'exportar' }
      ] },
    { id: 'dict', origin: 'L', tier: 2,
      meaning: { en: 'say, speak', es: 'decir' },
      words: [
        { en: 'dictate',    es: 'dictar' },
        { en: 'predict',    es: 'predecir' },
        { en: 'contradict', es: 'contradecir' },
        { en: 'dictionary', es: 'diccionario' }
      ] },
    { id: 'spect', origin: 'L', tier: 2,
      meaning: { en: 'look at, watch', es: 'mirar' },
      words: [
        { en: 'inspector',   es: 'inspector' },
        { en: 'spectator',   es: 'espectador' },
        { en: 'perspective', es: 'perspectiva' },
        { en: 'spectacular', es: 'espectacular' }
      ] },
    { id: 'vid', origin: 'L', tier: 1,
      meaning: { en: 'see', es: 'ver' },
      words: [
        { en: 'video',   es: 'video' },
        { en: 'vision',  es: 'visión' },
        { en: 'visible', es: 'visible' },
        { en: 'evident', es: 'evidente' }
      ] },
    { id: 'aud', origin: 'L', tier: 1,
      meaning: { en: 'hear', es: 'oír' },
      words: [
        { en: 'audio',      es: 'audio' },
        { en: 'audience',   es: 'audiencia' },
        { en: 'auditorium', es: 'auditorio' },
        { en: 'audible',    es: 'audible' }
      ] },
    { id: 'cred', origin: 'L', tier: 3,
      meaning: { en: 'believe, trust', es: 'creer, confiar' },
      words: [
        { en: 'credit',    es: 'crédito' },
        { en: 'credible',  es: 'creíble' },
        { en: 'incredible',es: 'increíble' },
        { en: 'credo',     es: 'credo' }
      ] },
    { id: 'cent', origin: 'L', tier: 2,
      meaning: { en: 'hundred', es: 'cien' },
      words: [
        { en: 'century',    es: 'siglo' },
        { en: 'percent',    es: 'por ciento' },
        { en: 'centennial', es: 'centenario' },
        { en: 'centimeter', es: 'centímetro' }
      ] },
    { id: 'mille', origin: 'L', tier: 2,
      meaning: { en: 'thousand', es: 'mil' },
      words: [
        { en: 'million',    es: 'millón' },
        { en: 'millennium', es: 'milenio' },
        { en: 'millimeter', es: 'milímetro' },
        { en: 'millipede',  es: 'milpiés' }
      ] },
    { id: 'mort', origin: 'L', tier: 3,
      meaning: { en: 'death', es: 'muerte' },
      words: [
        { en: 'mortal',   es: 'mortal' },
        { en: 'immortal', es: 'inmortal' },
        { en: 'mortuary', es: 'mortuorio' },
        { en: 'mortify',  es: 'mortificar' }
      ] },
    { id: 'viv', origin: 'L', tier: 2,
      meaning: { en: 'life, live', es: 'vida, vivir' },
      words: [
        { en: 'vivid',    es: 'vívido' },
        { en: 'survive',  es: 'sobrevivir' },
        { en: 'revive',   es: 'revivir' },
        { en: 'vivarium', es: 'vivario' }
      ] },
    { id: 'ped', origin: 'L', tier: 2,
      meaning: { en: 'foot', es: 'pie' },
      words: [
        { en: 'pedal',      es: 'pedal' },
        { en: 'pedestrian', es: 'peatón' },
        { en: 'pedestal',   es: 'pedestal' },
        { en: 'biped',      es: 'bípedo' }
      ] },
    { id: 'man', origin: 'L', tier: 1,
      meaning: { en: 'hand', es: 'mano' },
      words: [
        { en: 'manual',     es: 'manual' },
        { en: 'manipulate', es: 'manipular' },
        { en: 'manuscript', es: 'manuscrito' },
        { en: 'manufacture',es: 'manufactura' }
      ] },
    { id: 'luc', origin: 'L', tier: 3,
      meaning: { en: 'light, clear', es: 'luz, claro' },
      words: [
        { en: 'lucid',       es: 'lúcido' },
        { en: 'translucent', es: 'translúcido' },
        { en: 'illuminate',  es: 'iluminar' },
        { en: 'elucidate',   es: 'elucidar' }
      ] },
    { id: 'sol', origin: 'L', tier: 1,
      meaning: { en: 'sun', es: 'sol' },
      words: [
        { en: 'solar',     es: 'solar' },
        { en: 'solstice',  es: 'solsticio' },
        { en: 'parasol',   es: 'parasol' },
        { en: 'solarium',  es: 'solario' }
      ] },
    { id: 'luna', origin: 'L', tier: 2,
      meaning: { en: 'moon', es: 'luna' },
      words: [
        { en: 'lunar',     es: 'lunar' },
        { en: 'lunatic',   es: 'lunático' },
        { en: 'lunation',  es: 'lunación' },
        { en: 'sublunar',  es: 'sublunar' }
      ] },

    // ── Greek ──
    { id: 'bio', origin: 'G', tier: 1,
      meaning: { en: 'life', es: 'vida' },
      words: [
        { en: 'biology',    es: 'biología' },
        { en: 'biography',  es: 'biografía' },
        { en: 'biosphere',  es: 'biosfera' },
        { en: 'antibiotic', es: 'antibiótico' }
      ] },
    { id: 'geo', origin: 'G', tier: 1,
      meaning: { en: 'earth', es: 'tierra' },
      words: [
        { en: 'geography', es: 'geografía' },
        { en: 'geology',   es: 'geología' },
        { en: 'geometry',  es: 'geometría' },
        { en: 'geothermal',es: 'geotérmico' }
      ] },
    { id: 'hydro', origin: 'G', tier: 2,
      meaning: { en: 'water', es: 'agua' },
      words: [
        { en: 'hydraulic',  es: 'hidráulico' },
        { en: 'hydrogen',   es: 'hidrógeno' },
        { en: 'dehydrate',  es: 'deshidratar' },
        { en: 'hydroplane', es: 'hidroavión' }
      ] },
    { id: 'tele', origin: 'G', tier: 1,
      meaning: { en: 'far, distant', es: 'lejos, distancia' },
      words: [
        { en: 'telephone',  es: 'teléfono' },
        { en: 'television', es: 'televisión' },
        { en: 'telescope',  es: 'telescopio' },
        { en: 'telepathy',  es: 'telepatía' }
      ] },
    { id: 'micro', origin: 'G', tier: 1,
      meaning: { en: 'small', es: 'pequeño' },
      words: [
        { en: 'microscope', es: 'microscopio' },
        { en: 'microwave',  es: 'microondas' },
        { en: 'microbe',    es: 'microbio' },
        { en: 'microbiology', es: 'microbiología' }
      ] },
    { id: 'macro', origin: 'G', tier: 3,
      meaning: { en: 'large, long', es: 'grande, largo' },
      words: [
        { en: 'macroscopic', es: 'macroscópico' },
        { en: 'macrobiotic', es: 'macrobiótico' },
        { en: 'macrocosm',   es: 'macrocosmos' },
        { en: 'macroeconomics', es: 'macroeconomía' }
      ] },
    { id: 'chrono', origin: 'G', tier: 3,
      meaning: { en: 'time', es: 'tiempo' },
      words: [
        { en: 'chronology', es: 'cronología' },
        { en: 'chronic',    es: 'crónico' },
        { en: 'anachronism',es: 'anacronismo' },
        { en: 'synchronise',es: 'sincronizar' }
      ] },
    { id: 'photo', origin: 'G', tier: 2,
      meaning: { en: 'light', es: 'luz' },
      words: [
        { en: 'photograph',    es: 'fotografía' },
        { en: 'photosynthesis',es: 'fotosíntesis' },
        { en: 'photon',        es: 'fotón' },
        { en: 'telephoto',     es: 'telefoto' }
      ] },
    { id: 'astro', origin: 'G', tier: 1,
      meaning: { en: 'star', es: 'estrella' },
      words: [
        { en: 'astronaut', es: 'astronauta' },
        { en: 'astronomy', es: 'astronomía' },
        { en: 'asteroid',  es: 'asteroide' },
        { en: 'astrology', es: 'astrología' }
      ] },
    { id: 'graph', origin: 'G', tier: 2,
      meaning: { en: 'write, draw', es: 'escribir, dibujar' },
      words: [
        { en: 'graphic',   es: 'gráfico' },
        { en: 'autograph', es: 'autógrafo' },
        { en: 'paragraph', es: 'párrafo' },
        { en: 'biography', es: 'biografía' }
      ] },

    // ── v2 additions: 20 more roots (15 Latin, 5 Greek) ──────────────
    // ── Latin ──
    { id: 'flect', origin: 'L', tier: 2,
      meaning: { en: 'bend', es: 'doblar' },
      words: [
        { en: 'reflect',  es: 'reflejar' },
        { en: 'flexible', es: 'flexible' },
        { en: 'deflect',  es: 'desviar' },
        { en: 'inflexible', es: 'inflexible' }
      ] },
    { id: 'rupt', origin: 'L', tier: 2,
      meaning: { en: 'break', es: 'romper' },
      words: [
        { en: 'interrupt', es: 'interrumpir' },
        { en: 'rupture',   es: 'ruptura' },
        { en: 'disrupt',   es: 'interrumpir' },
        { en: 'abrupt',    es: 'abrupto' }
      ] },
    { id: 'struct', origin: 'L', tier: 2,
      meaning: { en: 'build', es: 'construir' },
      words: [
        { en: 'construct',   es: 'construir' },
        { en: 'structure',   es: 'estructura' },
        { en: 'destruction', es: 'destrucción' },
        { en: 'instruction', es: 'instrucción' }
      ] },
    { id: 'tract', origin: 'L', tier: 2,
      meaning: { en: 'pull, drag', es: 'tirar, arrastrar' },
      words: [
        { en: 'attract', es: 'atraer' },
        { en: 'tractor', es: 'tractor' },
        { en: 'extract', es: 'extraer' },
        { en: 'subtract',es: 'sustraer' }
      ] },
    { id: 'vent', origin: 'L', tier: 2,
      meaning: { en: 'come', es: 'venir' },
      words: [
        { en: 'invent',     es: 'inventar' },
        { en: 'prevent',    es: 'prevenir' },
        { en: 'convention', es: 'convención' },
        { en: 'adventure',  es: 'aventura' }
      ] },
    { id: 'miss', origin: 'L', tier: 3,
      meaning: { en: 'send', es: 'enviar' },
      words: [
        { en: 'submit',   es: 'someter' },
        { en: 'mission',  es: 'misión' },
        { en: 'transmit', es: 'transmitir' },
        { en: 'emit',     es: 'emitir' }
      ] },
    { id: 'sent', origin: 'L', tier: 2,
      meaning: { en: 'feel', es: 'sentir' },
      words: [
        { en: 'sentiment', es: 'sentimiento' },
        { en: 'consent',   es: 'consentir' },
        { en: 'sensitive', es: 'sensible' },
        { en: 'sensation', es: 'sensación' }
      ] },
    { id: 'pos', origin: 'L', tier: 2,
      meaning: { en: 'place, put', es: 'colocar, poner' },
      words: [
        { en: 'position', es: 'posición' },
        { en: 'postpone', es: 'posponer' },
        { en: 'compose',  es: 'componer' },
        { en: 'deposit',  es: 'depósito' }
      ] },
    { id: 'jur', origin: 'L', tier: 3,
      meaning: { en: 'law, oath', es: 'ley, juramento' },
      words: [
        { en: 'jury',     es: 'jurado' },
        { en: 'justice',  es: 'justicia' },
        { en: 'perjury',  es: 'perjurio' },
        { en: 'jurist',   es: 'jurista' }
      ] },
    { id: 'urb', origin: 'L', tier: 2,
      meaning: { en: 'city', es: 'ciudad' },
      words: [
        { en: 'urban',    es: 'urbano' },
        { en: 'suburb',   es: 'suburbio' },
        { en: 'urbanize', es: 'urbanizar' },
        { en: 'urbane',   es: 'urbano (cortés)' }
      ] },
    { id: 'nav', origin: 'L', tier: 1,
      meaning: { en: 'ship', es: 'barco, nave' },
      words: [
        { en: 'naval',    es: 'naval' },
        { en: 'navigate', es: 'navegar' },
        { en: 'navy',     es: 'marina' },
        { en: 'navigator',es: 'navegante' }
      ] },
    { id: 'dom', origin: 'L', tier: 2,
      meaning: { en: 'house, master', es: 'casa, dueño' },
      words: [
        { en: 'domestic', es: 'doméstico' },
        { en: 'domain',   es: 'dominio' },
        { en: 'dominate', es: 'dominar' },
        { en: 'dome',     es: 'cúpula' }
      ] },
    { id: 'reg', origin: 'L', tier: 2,
      meaning: { en: 'rule, king', es: 'gobernar, rey' },
      words: [
        { en: 'regal',    es: 'real' },
        { en: 'region',   es: 'región' },
        { en: 'regulate', es: 'regular' },
        { en: 'regiment', es: 'regimiento' }
      ] },
    { id: 'sol_alone', origin: 'L', tier: 3,
      meaning: { en: 'alone', es: 'solo' },
      words: [
        { en: 'solo',     es: 'solo' },
        { en: 'solitude', es: 'soledad' },
        { en: 'solitary', es: 'solitario' },
        { en: 'desolate', es: 'desolado' }
      ] },
    { id: 'cap', origin: 'L', tier: 2,
      meaning: { en: 'take, seize', es: 'tomar, capturar' },
      words: [
        { en: 'capture',  es: 'capturar' },
        { en: 'accept',   es: 'aceptar' },
        { en: 'capable',  es: 'capaz' },
        { en: 'reception',es: 'recepción' }
      ] },

    // ── Greek ──
    { id: 'phon', origin: 'G', tier: 1,
      meaning: { en: 'sound', es: 'sonido' },
      words: [
        { en: 'telephone',es: 'teléfono' },
        { en: 'symphony', es: 'sinfonía' },
        { en: 'megaphone',es: 'megáfono' },
        { en: 'phonetic', es: 'fonético' }
      ] },
    { id: 'therm', origin: 'G', tier: 2,
      meaning: { en: 'heat', es: 'calor' },
      words: [
        { en: 'thermometer',es: 'termómetro' },
        { en: 'thermal',    es: 'térmico' },
        { en: 'thermos',    es: 'termo' },
        { en: 'isotherm',   es: 'isoterma' }
      ] },
    { id: 'psych', origin: 'G', tier: 3,
      meaning: { en: 'mind, soul', es: 'mente, alma' },
      words: [
        { en: 'psychology',es: 'psicología' },
        { en: 'psychic',   es: 'psíquico' },
        { en: 'psyche',    es: 'psique' },
        { en: 'psychiatry',es: 'psiquiatría' }
      ] },
    { id: 'philo', origin: 'G', tier: 3,
      meaning: { en: 'love of', es: 'amor por' },
      words: [
        { en: 'philosophy',  es: 'filosofía' },
        { en: 'philanthropy',es: 'filantropía' },
        { en: 'bibliophile', es: 'bibliófilo' },
        { en: 'philharmonic',es: 'filarmónico' }
      ] },
    { id: 'poly', origin: 'G', tier: 2,
      meaning: { en: 'many', es: 'muchos' },
      words: [
        { en: 'polygon',  es: 'polígono' },
        { en: 'polyglot', es: 'políglota' },
        { en: 'polyhedron',es: 'poliedro' },
        { en: 'polygamy', es: 'poligamia' }
      ] },
    // ── Advanced additions (tier 3) ──
    { id: 'anim', origin: 'L', tier: 3,
      meaning: { en: 'soul, life, spirit', es: 'alma, vida, espíritu' },
      words: [
        { en: 'animal',    es: 'animal' },
        { en: 'animate',   es: 'animar' },
        { en: 'animation', es: 'animación' },
        { en: 'unanimous', es: 'unánime' }
      ] },
    { id: 'ver', origin: 'L', tier: 3,
      meaning: { en: 'truth', es: 'verdad' },
      words: [
        { en: 'verify',  es: 'verificar' },
        { en: 'verdict', es: 'veredicto' },
        { en: 'veracity',es: 'veracidad' },
        { en: 'verity',  es: 'verdad' }
      ] },
    { id: 'fer', origin: 'L', tier: 3,
      meaning: { en: 'carry, bear', es: 'llevar, portar' },
      words: [
        { en: 'transfer',es: 'transferir' },
        { en: 'refer',   es: 'referir' },
        { en: 'fertile', es: 'fértil' },
        { en: 'conifer', es: 'conífera' }
      ] },
    { id: 'vor', origin: 'L', tier: 3,
      meaning: { en: 'eat, devour', es: 'comer, devorar' },
      words: [
        { en: 'carnivore', es: 'carnívoro' },
        { en: 'herbivore', es: 'herbívoro' },
        { en: 'omnivore',  es: 'omnívoro' },
        { en: 'voracious', es: 'voraz' }
      ] },
    { id: 'ten', origin: 'L', tier: 3,
      meaning: { en: 'hold, keep', es: 'sostener, mantener' },
      words: [
        { en: 'retain',  es: 'retener' },
        { en: 'tenant',  es: 'inquilino' },
        { en: 'tenacious',es: 'tenaz' },
        { en: 'sustain', es: 'sostener' }
      ] },
    { id: 'fort', origin: 'L', tier: 3,
      meaning: { en: 'strong', es: 'fuerte' },
      words: [
        { en: 'fortify',   es: 'fortificar' },
        { en: 'fortress',  es: 'fortaleza' },
        { en: 'fortitude', es: 'fortaleza' },
        { en: 'comfort',   es: 'confortar' }
      ] },
    { id: 'leg', origin: 'L', tier: 3,
      meaning: { en: 'law, read', es: 'ley, leer' },
      words: [
        { en: 'legal',     es: 'legal' },
        { en: 'legislate', es: 'legislar' },
        { en: 'legible',   es: 'legible' },
        { en: 'legend',    es: 'leyenda' }
      ] },
    { id: 'vis', origin: 'L', tier: 3,
      meaning: { en: 'see, sight', es: 'ver, vista' },
      words: [
        { en: 'visible', es: 'visible' },
        { en: 'vision',  es: 'visión' },
        { en: 'visual',  es: 'visual' },
        { en: 'revise',  es: 'revisar' }
      ] },
    // ── Greek ──
    { id: 'morph', origin: 'G', tier: 3,
      meaning: { en: 'shape, form', es: 'forma' },
      words: [
        { en: 'metamorphosis',es: 'metamorfosis' },
        { en: 'morphology',   es: 'morfología' },
        { en: 'amorphous',    es: 'amorfo' },
        { en: 'morpheme',     es: 'morfema' }
      ] },
    { id: 'path', origin: 'G', tier: 3,
      meaning: { en: 'feeling, suffering', es: 'sentimiento, sufrimiento' },
      words: [
        { en: 'sympathy', es: 'simpatía' },
        { en: 'empathy',  es: 'empatía' },
        { en: 'apathy',   es: 'apatía' },
        { en: 'pathology',es: 'patología' }
      ] },
    { id: 'crat', origin: 'G', tier: 3,
      meaning: { en: 'rule, power', es: 'gobierno, poder' },
      words: [
        { en: 'democrat',   es: 'demócrata' },
        { en: 'aristocrat', es: 'aristócrata' },
        { en: 'autocrat',   es: 'autócrata' },
        { en: 'bureaucrat', es: 'burócrata' }
      ] },
    { id: 'arch', origin: 'G', tier: 3,
      meaning: { en: 'rule, ancient, chief', es: 'gobierno, antiguo, principal' },
      words: [
        { en: 'monarch',  es: 'monarca' },
        { en: 'archaic',  es: 'arcaico' },
        { en: 'archive',  es: 'archivo' },
        { en: 'anarchy',  es: 'anarquía' }
      ] },
    { id: 'scope', origin: 'G', tier: 3,
      meaning: { en: 'look at, examine', es: 'mirar, examinar' },
      words: [
        { en: 'telescope',  es: 'telescopio' },
        { en: 'periscope',  es: 'periscopio' },
        { en: 'stethoscope',es: 'estetoscopio' },
        { en: 'horoscope',  es: 'horóscopo' }
      ] },
    { id: 'derm', origin: 'G', tier: 3,
      meaning: { en: 'skin', es: 'piel' },
      words: [
        { en: 'epidermis',   es: 'epidermis' },
        { en: 'dermatology', es: 'dermatología' },
        { en: 'pachyderm',   es: 'paquidermo' },
        { en: 'taxidermy',   es: 'taxidermia' }
      ] },
    { id: 'cycl', origin: 'G', tier: 3,
      meaning: { en: 'circle, wheel', es: 'círculo, rueda' },
      words: [
        { en: 'bicycle',     es: 'bicicleta' },
        { en: 'cyclone',     es: 'ciclón' },
        { en: 'cycle',       es: 'ciclo' },
        { en: 'encyclopedia',es: 'enciclopedia' }
      ] },
    { id: 'polis', origin: 'G', tier: 3,
      meaning: { en: 'city', es: 'ciudad' },
      words: [
        { en: 'metropolis', es: 'metrópolis' },
        { en: 'police',     es: 'policía' },
        { en: 'politics',   es: 'política' },
        { en: 'megalopolis',es: 'megalópolis' }
      ] },
    { id: 'form', origin: 'L', tier: 2,
      meaning: { en: 'shape', es: 'forma' },
      words: [
        { en: 'form',      es: 'forma' },
        { en: 'format',    es: 'formato' },
        { en: 'transform', es: 'transformar' },
        { en: 'uniform',   es: 'uniforme' }
      ] },
    { id: 'uni', origin: 'L', tier: 1,
      meaning: { en: 'one', es: 'uno' },
      words: [
        { en: 'unit',     es: 'unidad' },
        { en: 'unique',   es: 'único' },
        { en: 'unicorn',  es: 'unicornio' },
        { en: 'universe', es: 'universo' }
      ] },
    { id: 'ann', origin: 'L', tier: 2,
      meaning: { en: 'year', es: 'año' },
      words: [
        { en: 'annual',      es: 'anual' },
        { en: 'anniversary', es: 'aniversario' },
        { en: 'annals',      es: 'anales' },
        { en: 'semiannual',  es: 'semianual' }
      ] },
    { id: 'ject', origin: 'L', tier: 2,
      meaning: { en: 'throw', es: 'lanzar' },
      words: [
        { en: 'project', es: 'proyecto' },
        { en: 'reject',  es: 'rechazar' },
        { en: 'inject',  es: 'inyectar' },
        { en: 'eject',   es: 'eyectar' }
      ] },
    { id: 'meter', origin: 'G', tier: 2,
      meaning: { en: 'measure', es: 'medida' },
      words: [
        { en: 'meter',     es: 'metro' },
        { en: 'diameter',  es: 'diámetro' },
        { en: 'perimeter', es: 'perímetro' },
        { en: 'metric',    es: 'métrico' }
      ] },
    { id: 'log', origin: 'G', tier: 2,
      meaning: { en: 'word, reason', es: 'palabra, razón' },
      words: [
        { en: 'logic',     es: 'lógica' },
        { en: 'dialogue',  es: 'diálogo' },
        { en: 'catalog',   es: 'catálogo' },
        { en: 'monologue', es: 'monólogo' }
      ] }
  ];

  // ── 32 build tasks: meaning + parts → assembled word ─────────────
  // tier matches the root's tier roughly. Pieces appear shuffled with
  // 2-3 decoys at runtime.
  const BUILDS = [
    { tier: 1, prefix: '',      root: 'aqua',   suffix: 'rium',
      en: { meaning: 'a tank for water creatures', word: 'aquarium' },
      es: { meaning: 'un tanque para criaturas de agua', word: 'acuario' } },
    { tier: 1, prefix: '',      root: 'aqua',   suffix: 'duct',
      en: { meaning: 'a channel that carries water', word: 'aqueduct' },
      es: { meaning: 'un canal que lleva agua', word: 'acueducto' } },
    { tier: 1, prefix: 'trans', root: 'port',   suffix: '',
      en: { meaning: 'to carry across (places or things)', word: 'transport' },
      es: { meaning: 'llevar de un lugar a otro', word: 'transporte' } },
    { tier: 1, prefix: '',      root: 'tele',   suffix: 'phone',
      en: { meaning: 'a device for far-sound', word: 'telephone' },
      es: { meaning: 'un aparato de sonido a distancia', word: 'teléfono' } },
    { tier: 1, prefix: '',      root: 'micro',  suffix: 'scope',
      en: { meaning: 'a tool to look at small things', word: 'microscope' },
      es: { meaning: 'instrumento para mirar cosas pequeñas', word: 'microscopio' } },
    { tier: 1, prefix: '',      root: 'astro',  suffix: 'naut',
      en: { meaning: 'a star-sailor (space traveller)', word: 'astronaut' },
      es: { meaning: 'navegante de las estrellas', word: 'astronauta' } },
    { tier: 1, prefix: '',      root: 'bio',    suffix: 'logy',
      en: { meaning: 'the study of life', word: 'biology' },
      es: { meaning: 'el estudio de la vida', word: 'biología' } },
    { tier: 1, prefix: '',      root: 'geo',    suffix: 'graphy',
      en: { meaning: 'writing about the earth', word: 'geography' },
      es: { meaning: 'descripción de la tierra', word: 'geografía' } },
    { tier: 2, prefix: 'pre',   root: 'dict',   suffix: '',
      en: { meaning: 'to say something before it happens', word: 'predict' },
      es: { meaning: 'decir antes de que ocurra', word: 'predecir' } },
    { tier: 2, prefix: 'in',    root: 'spect',  suffix: 'or',
      en: { meaning: 'someone who looks into things', word: 'inspector' },
      es: { meaning: 'alguien que mira con atención', word: 'inspector' } },
    { tier: 2, prefix: 'in',    root: 'cred',   suffix: 'ible',
      en: { meaning: 'not believable; amazing', word: 'incredible' },
      es: { meaning: 'que no se puede creer; asombroso', word: 'increíble' } },
    { tier: 2, prefix: '',      root: 'man',    suffix: 'ual',
      en: { meaning: 'done by hand; an instruction book', word: 'manual' },
      es: { meaning: 'hecho a mano; libro de instrucciones', word: 'manual' } },
    { tier: 2, prefix: 'sur',   root: 'viv',    suffix: 'e',
      en: { meaning: 'to continue living through hardship', word: 'survive' },
      es: { meaning: 'seguir viviendo a pesar de las dificultades', word: 'sobrevivir' } },
    { tier: 2, prefix: '',      root: 'photo',  suffix: 'graph',
      en: { meaning: 'a picture written with light', word: 'photograph' },
      es: { meaning: 'una imagen escrita con luz', word: 'fotografía' } },
    { tier: 2, prefix: 'auto',  root: 'graph',  suffix: '',
      en: { meaning: 'a self-written signature', word: 'autograph' },
      es: { meaning: 'una firma escrita por uno mismo', word: 'autógrafo' } },
    { tier: 3, prefix: 'in',    root: 'scrib',  suffix: 'e',
      en: { meaning: 'to write on a surface', word: 'inscribe' },
      es: { meaning: 'escribir sobre una superficie', word: 'inscribir' } },
    { tier: 3, prefix: 'im',    root: 'mort',   suffix: 'al',
      en: { meaning: 'never-dying', word: 'immortal' },
      es: { meaning: 'que nunca muere', word: 'inmortal' } },
    { tier: 3, prefix: 'trans', root: 'luc',    suffix: 'ent',
      en: { meaning: 'letting light through partially', word: 'translucent' },
      es: { meaning: 'que deja pasar la luz parcialmente', word: 'translúcido' } },
    { tier: 3, prefix: 'syn',   root: 'chrono', suffix: 'us',
      en: { meaning: 'happening at the same time', word: 'synchronous' },
      es: { meaning: 'que ocurre al mismo tiempo', word: 'sincrónico' } },
    { tier: 3, prefix: 'de',    root: 'hydro',  suffix: 'ate',
      en: { meaning: 'to remove water from', word: 'dehydrate' },
      es: { meaning: 'quitarle el agua a algo', word: 'deshidratar' } },
    { tier: 3, prefix: 'trans', root: 'fer',    suffix: '',
      en: { meaning: 'to carry from one place to another', word: 'transfer' },
      es: { meaning: 'llevar de un lugar a otro', word: 'transferir' } },
    { tier: 3, prefix: 're',    root: 'vis',    suffix: 'e',
      en: { meaning: 'to look at again to correct', word: 'revise' },
      es: { meaning: 'mirar de nuevo para corregir', word: 'revisar' } },
    { tier: 3, prefix: '',      root: 'morph',  suffix: 'ology',
      en: { meaning: 'the study of shape and form', word: 'morphology' },
      es: { meaning: 'el estudio de la forma', word: 'morfología' } },
    { tier: 3, prefix: '',      root: 'tele',   suffix: 'scope',
      en: { meaning: 'a tool to look at far things', word: 'telescope' },
      es: { meaning: 'instrumento para mirar cosas lejanas', word: 'telescopio' } },
    { tier: 3, prefix: 'sym',   root: 'path',   suffix: 'y',
      en: { meaning: 'a feeling shared with another', word: 'sympathy' },
      es: { meaning: 'un sentimiento compartido con otro', word: 'simpatía' } },
    { tier: 3, prefix: 'demo',  root: 'crat',   suffix: '',
      en: { meaning: 'one who supports rule by the people', word: 'democrat' },
      es: { meaning: 'quien apoya el gobierno del pueblo', word: 'demócrata' } },
    { tier: 1, prefix: '',      root: 'uni',    suffix: 'verse',
      en: { meaning: 'everything taken as one whole', word: 'universe' },
      es: { meaning: 'todo tomado como un solo conjunto', word: 'universo' } },
    { tier: 2, prefix: 'trans', root: 'form',   suffix: '',
      en: { meaning: 'to change the shape of something', word: 'transform' },
      es: { meaning: 'cambiar la forma de algo', word: 'transformar' } },
    { tier: 2, prefix: '',      root: 'ann',    suffix: 'ual',
      en: { meaning: 'happening once each year', word: 'annual' },
      es: { meaning: 'que ocurre una vez al año', word: 'anual' } },
    { tier: 2, prefix: 're',    root: 'ject',   suffix: '',
      en: { meaning: 'to throw something back', word: 'reject' },
      es: { meaning: 'lanzar algo de vuelta', word: 'rechazar' } },
    { tier: 2, prefix: 'dia',   root: 'meter',  suffix: '',
      en: { meaning: 'the measure straight across a circle', word: 'diameter' },
      es: { meaning: 'la medida que cruza un círculo', word: 'diámetro' } },
    { tier: 2, prefix: '',      root: 'log',    suffix: 'ic',
      en: { meaning: 'reasoning from words and ideas', word: 'logic' },
      es: { meaning: 'razonamiento a partir de palabras e ideas', word: 'lógica' } },
    // ── v2 additions (appended: saved progress stores BUILDS indices,
    //    so existing entries must never move) ──
    { tier: 1, prefix: '',      root: 'geo',    suffix: 'logy',
      en: { meaning: 'the study of the earth and its rocks', word: 'geology' },
      es: { meaning: 'el estudio de la tierra y sus rocas', word: 'geología' } },
    { tier: 1, prefix: '',      root: 'bio',    suffix: 'graphy',
      en: { meaning: 'the written story of a life', word: 'biography' },
      es: { meaning: 'la historia escrita de una vida', word: 'biografía' } },
    { tier: 1, prefix: '',      root: 'aud',    suffix: 'ience',
      en: { meaning: 'the people who listen to a show', word: 'audience' },
      es: { meaning: 'las personas que escuchan un espectáculo', word: 'audiencia' } },
    { tier: 1, prefix: '',      root: 'sol',    suffix: 'ar',
      en: { meaning: 'having to do with the sun', word: 'solar' },
      es: { meaning: 'relacionado con el sol', word: 'solar' } },
    { tier: 2, prefix: 'ex',    root: 'port',   suffix: '',
      en: { meaning: 'to carry goods out of a country', word: 'export' },
      es: { meaning: 'llevar productos fuera del país', word: 'exportar' } },
    { tier: 2, prefix: 'inter', root: 'rupt',   suffix: '',
      en: { meaning: 'to break in while someone is talking', word: 'interrupt' },
      es: { meaning: 'cortar a alguien mientras habla', word: 'interrumpir' } },
    { tier: 2, prefix: 'con',   root: 'struct', suffix: '',
      en: { meaning: 'to put something together, piece by piece', word: 'construct' },
      es: { meaning: 'levantar algo pieza por pieza', word: 'construir' } },
    { tier: 2, prefix: 'at',    root: 'tract',  suffix: '',
      en: { meaning: 'to pull something toward you', word: 'attract' },
      es: { meaning: 'tirar algo hacia uno', word: 'atraer' } },
    { tier: 2, prefix: 'in',    root: 'vent',   suffix: '',
      en: { meaning: 'to come up with something new', word: 'invent' },
      es: { meaning: 'crear algo nuevo', word: 'inventar' } },
    { tier: 2, prefix: '',      root: 'therm',  suffix: 'al',
      en: { meaning: 'having to do with heat', word: 'thermal' },
      es: { meaning: 'relacionado con el calor', word: 'térmico' } },
    { tier: 2, prefix: '',      root: 'poly',   suffix: 'gon',
      en: { meaning: 'a flat shape with many sides', word: 'polygon' },
      es: { meaning: 'una figura plana de muchos lados', word: 'polígono' } },
    { tier: 2, prefix: 'tele',  root: 'vis',    suffix: 'ion',
      en: { meaning: 'a screen for seeing pictures sent from far away', word: 'television' },
      es: { meaning: 'una pantalla para ver imágenes enviadas desde lejos', word: 'televisión' } },
    { tier: 3, prefix: '',      root: 'cycl',   suffix: 'one',
      en: { meaning: 'a storm that spins around in a circle', word: 'cyclone' },
      es: { meaning: 'una tormenta que gira en círculo', word: 'ciclón' } },
    { tier: 3, prefix: 'epi',   root: 'derm',   suffix: 'is',
      en: { meaning: 'the outer layer of the skin', word: 'epidermis' },
      es: { meaning: 'la capa exterior de la piel', word: 'epidermis' } },
    { tier: 3, prefix: '',      root: 'chrono', suffix: 'logy',
      en: { meaning: 'the order in which events happened', word: 'chronology' },
      es: { meaning: 'el orden en que ocurrieron los hechos', word: 'cronología' } },
    { tier: 3, prefix: 'peri',  root: 'scope',  suffix: '',
      en: { meaning: 'a tube for looking over the top of things, used on submarines', word: 'periscope' },
      es: { meaning: 'un tubo para mirar por encima, usado en submarinos', word: 'periscopio' } }
  ];

  // ── 45 dictation pairs: definition → word ────────────────────────
  // Bilingual: each entry has en/es defintion + word. The accent-
  // insensitive _normaliseWord helper means a kid typing "biologia"
  // is marked correct even without the í.
  const DICTATIONS = [
    { tier: 1, en: { def: 'study of life',                     word: 'biology' },
                es: { def: 'el estudio de la vida',            word: 'biología' } },
    { tier: 1, en: { def: 'writing about the earth',           word: 'geography' },
                es: { def: 'descripción de la tierra',         word: 'geografía' } },
    { tier: 1, en: { def: 'a far-sound device',                word: 'telephone' },
                es: { def: 'un aparato de sonido a distancia', word: 'teléfono' } },
    { tier: 1, en: { def: 'a tool to look at small things',    word: 'microscope' },
                es: { def: 'instrumento para mirar cosas pequeñas', word: 'microscopio' } },
    { tier: 1, en: { def: 'a star-sailor (space traveller)',   word: 'astronaut' },
                es: { def: 'navegante de las estrellas',       word: 'astronauta' } },
    { tier: 1, en: { def: 'a tank where water creatures live', word: 'aquarium' },
                es: { def: 'tanque donde viven criaturas de agua', word: 'acuario' } },
    { tier: 1, en: { def: 'a channel that carries water',      word: 'aqueduct' },
                es: { def: 'canal que lleva agua',             word: 'acueducto' } },
    { tier: 1, en: { def: 'to carry across places',            word: 'transport' },
                es: { def: 'llevar de un lugar a otro',        word: 'transporte' } },
    { tier: 1, en: { def: 'an instrument that measures heat',  word: 'thermometer' },
                es: { def: 'instrumento que mide el calor',    word: 'termómetro' } },
    { tier: 1, en: { def: 'to move a ship across water',       word: 'navigate' },
                es: { def: 'mover un barco por el agua',       word: 'navegar' } },
    { tier: 2, en: { def: 'a picture written with light',      word: 'photograph' },
                es: { def: 'imagen escrita con luz',           word: 'fotografía' } },
    { tier: 2, en: { def: 'a self-written signature',          word: 'autograph' },
                es: { def: 'firma escrita por uno mismo',      word: 'autógrafo' } },
    { tier: 2, en: { def: 'to say something before it happens',word: 'predict' },
                es: { def: 'decir algo antes de que ocurra',   word: 'predecir' } },
    { tier: 2, en: { def: 'someone who looks into things',     word: 'inspector' },
                es: { def: 'alguien que mira con atención',    word: 'inspector' } },
    { tier: 2, en: { def: 'done by hand or an instruction book', word: 'manual' },
                es: { def: 'hecho a mano o libro de instrucciones', word: 'manual' } },
    { tier: 2, en: { def: 'something that has not been done before', word: 'invent' },
                es: { def: 'crear algo que no se había hecho antes', word: 'inventar' } },
    { tier: 2, en: { def: 'to stop something from happening',  word: 'prevent' },
                es: { def: 'evitar que algo ocurra',           word: 'prevenir' } },
    { tier: 2, en: { def: 'a many-sided flat shape',           word: 'polygon' },
                es: { def: 'figura plana de muchos lados',     word: 'polígono' } },
    { tier: 2, en: { def: 'a person who speaks many languages',word: 'polyglot' },
                es: { def: 'persona que habla muchos idiomas', word: 'políglota' } },
    { tier: 2, en: { def: 'shape, framework, way something is built', word: 'structure' },
                es: { def: 'forma, armazón o modo en que algo se construye', word: 'estructura' } },
    { tier: 3, en: { def: 'to continue living through hardship', word: 'survive' },
                es: { def: 'seguir viviendo a pesar de dificultades', word: 'sobrevivir' } },
    { tier: 3, en: { def: 'not believable; amazing',           word: 'incredible' },
                es: { def: 'que no se puede creer; asombroso', word: 'increíble' } },
    { tier: 3, en: { def: 'never dying',                       word: 'immortal' },
                es: { def: 'que nunca muere',                  word: 'inmortal' } },
    { tier: 3, en: { def: 'letting light through partially',   word: 'translucent' },
                es: { def: 'que deja pasar la luz parcialmente', word: 'translúcido' } },
    { tier: 3, en: { def: 'to remove water from',              word: 'dehydrate' },
                es: { def: 'quitarle el agua a algo',          word: 'deshidratar' } },
    { tier: 3, en: { def: 'happening at the same time',        word: 'synchronous' },
                es: { def: 'que ocurre al mismo tiempo',       word: 'sincrónico' } },
    { tier: 3, en: { def: 'the love of wisdom (study of)',     word: 'philosophy' },
                es: { def: 'el amor por la sabiduría (estudio de)', word: 'filosofía' } },
    { tier: 3, en: { def: 'the study of the mind',             word: 'psychology' },
                es: { def: 'el estudio de la mente',           word: 'psicología' } },
    { tier: 3, en: { def: 'sudden, without warning',           word: 'abrupt' },
                es: { def: 'repentino, sin aviso',             word: 'abrupto' } },
    { tier: 3, en: { def: 'something out of its time',         word: 'anachronism' },
                es: { def: 'algo fuera de su tiempo',          word: 'anacronismo' } },
    { tier: 3, en: { def: 'an animal that eats only meat',     word: 'carnivore' },
                es: { def: 'animal que solo come carne',       word: 'carnívoro' } },
    { tier: 3, en: { def: 'an animal that eats only plants',   word: 'herbivore' },
                es: { def: 'animal que solo come plantas',     word: 'herbívoro' } },
    { tier: 3, en: { def: 'a complete change of form',         word: 'metamorphosis' },
                es: { def: 'un cambio completo de forma',      word: 'metamorfosis' } },
    { tier: 3, en: { def: 'the ability to be seen',            word: 'visible' },
                es: { def: 'que se puede ver',                 word: 'visible' } },
    { tier: 3, en: { def: 'to check that something is true',   word: 'verify' },
                es: { def: 'comprobar que algo es verdad',     word: 'verificar' } },
    { tier: 3, en: { def: 'a single ruler of a kingdom',       word: 'monarch' },
                es: { def: 'gobernante único de un reino',     word: 'monarca' } },
    { tier: 3, en: { def: 'the feeling of sharing another\'s emotion', word: 'empathy' },
                es: { def: 'capacidad de sentir lo que otro siente', word: 'empatía' } },
    { tier: 3, en: { def: 'a tool to look at distant objects', word: 'telescope' },
                es: { def: 'instrumento para mirar objetos lejanos', word: 'telescopio' } },
    { tier: 3, en: { def: 'the outer layer of the skin',       word: 'epidermis' },
                es: { def: 'la capa exterior de la piel',      word: 'epidermis' } },
    { tier: 1, en: { def: 'a single whole counted as one',     word: 'unit' },
                es: { def: 'un todo contado como uno',         word: 'unidad' } },
    { tier: 2, en: { def: 'happening once each year',          word: 'annual' },
                es: { def: 'que ocurre una vez al año',        word: 'anual' } },
    { tier: 2, en: { def: 'to throw something back',           word: 'reject' },
                es: { def: 'lanzar algo de vuelta',            word: 'rechazar' } },
    { tier: 2, en: { def: 'the measure straight across a circle', word: 'diameter' },
                es: { def: 'la medida que cruza un círculo',   word: 'diámetro' } },
    { tier: 2, en: { def: 'reasoning from words and ideas',    word: 'logic' },
                es: { def: 'razonamiento a partir de ideas',   word: 'lógica' } },
    { tier: 2, en: { def: 'to change the shape of something',  word: 'transform' },
                es: { def: 'cambiar la forma de algo',         word: 'transformar' } }
  ];


  // ── State ──
  const state = {
    lang: 'en',
    mode: null,
    rootList: 'all',  // 'all' | tier number
    matchSession: null,
    buildIdx: 0,
    dictation: null,  // { idx, correct, queue }
    spot: null,       // { idx, correct, queue, step }
    cog: null,        // { tasks, idx, correct, total }
    rootId: null
  };

  const D = typeof VocabularioVivoData !== 'undefined' ? VocabularioVivoData : null;
  const A = typeof VocabularioVivoArt !== 'undefined' ? VocabularioVivoArt : null;

  // ── Storage ──
  // Saved shape (zs_vocab_<user>):
  //   seenRoots[], matchBest, matchStars, builds[] (BUILDS indices),
  //   dictationBest, dictationStars            — original fields
  //   spotBest, spotStars, cogBestPct, cogStars — added in v2
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
  function _T(en, es) { return state.lang === 'es' ? es : en; }
  function _esc(s) {
    return typeof escHtml === 'function' ? escHtml(s)
      : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // ── Age scaling ──
  function _ageTier() { return typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate'; }
  function _maxTier() {
    const t = _ageTier();
    return t === 'beginner' ? 1 : t === 'intermediate' ? 2 : 3;
  }
  function _rootById(id) { return ROOTS.find(r => r.id === id); }
  function _origin(r) { return r.origin === 'L' ? _T('Latin', 'Latín') : _T('Greek', 'Griego'); }

  // ── Small render helpers ──
  function _art(rootId, size) { return A ? A.rootArt(rootId, size) : ''; }
  function _mark(word, rootId, cls) {
    const p = D ? D.split(word, rootId) : null;
    if (!p) return _esc(word);
    return _esc(p.pre) + '<mark class="' + (cls || 'vv-mark') + '">' + _esc(p.mid) + '</mark>' + _esc(p.post);
  }
  function _stars(n, size) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      out += '<svg viewBox="0 0 24 24" width="' + (size || 40) + '" height="' + (size || 40) + '" class="vv-star' + (i < n ? ' vv-star-on' : '') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's" aria-hidden="true">' +
        '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="' + (i < n ? '#fbbf24' : '#e5e3ee') + '" stroke="' + (i < n ? '#b45309' : '#c9c5d8') + '" stroke-width="1.3" stroke-linejoin="round"/></svg>';
    }
    return '<div class="vv-stars" role="img" aria-label="' + n + ' / 3">' + out + '</div>';
  }
  function _starsFor(correct, total) {
    const acc = total > 0 ? correct / total : 0;
    return acc >= 0.95 ? 3 : acc >= 0.80 ? 2 : 1;
  }
  function _speak(text, lng) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (lng || state.lang) === 'es' ? 'es-CL' : 'en-US';
      u.rate = 0.92;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function _speakBtn(id) {
    return '<button type="button" class="vv-speak" id="' + id + '" aria-label="' + _T('Read aloud', 'Leer en voz alta') + '">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>';
  }
  function _progressDots(idx, total, results) {
    let out = '<div class="vv-dots" aria-label="' + (idx + 1) + ' / ' + total + '">';
    for (let i = 0; i < total; i++) {
      const r = results && results[i];
      out += '<span class="vv-dot' + (i === idx ? ' vv-dot-now' : '') + (r === true ? ' vv-dot-ok' : r === false ? ' vv-dot-bad' : '') + '"></span>';
    }
    return out + '</div>';
  }
  function _woodTile(text, kind, opts) {
    opts = opts || {};
    const sp = opts.species || (kind === 'prefix' ? 'maple' : kind === 'root' ? 'walnut' : kind === 'suffix' ? 'cherry' : 'maple');
    const shown = opts.hyphen
      ? (kind === 'prefix' ? text + '-' : kind === 'suffix' ? '-' + text : text)
      : text;
    const tag = opts.tag ? '<span class="vv-wtile-tag">' + (kind === 'prefix' ? _T('prefix', 'prefijo') : kind === 'root' ? _T('root', 'raíz') : _T('suffix', 'sufijo')) + '</span>' : '';
    return '<span class="vv-wtile vv-wood-' + sp + '"' + (opts.attrs || '') + '><span class="vv-wtile-txt">' + _esc(shown) + '</span>' + tag + '</span>';
  }

  // ── Screens ──
  function _showScreen(id) {
    document.querySelectorAll('.vv-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  function _rootOfDay() {
    const pool = ROOTS.filter(r => r.tier <= _maxTier());
    const day = Math.floor(Date.now() / 86400000);
    return pool[day % pool.length];
  }

  function _renderHome() {
    const prog = _loadProgress();
    const seenRoots = (prog.seenRoots || []).length;
    const matchScore = prog.matchBest || 0;
    const buildsDone = (prog.builds || []).length;
    const dictBest   = prog.dictationBest || 0;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setText('vv-roots-stat', seenRoots + '/' + ROOTS.length);
    setText('vv-match-stat', matchScore + ' ' + _T('best', 'mejor'));
    setText('vv-build-stat', buildsDone + '/' + BUILDS.length);
    setText('vv-dictation-stat', dictBest + ' ' + _T('best', 'mejor'));
    setText('vv-spot-stat', (prog.spotBest || 0) + ' ' + _T('best', 'mejor'));
    setText('vv-cog-stat', (prog.cogBestPct || 0) + '% ' + _T('best', 'mejor'));

    setText('vv-sub', _T('English and Spanish through their Latin and Greek roots.', 'Inglés y español a través de sus raíces latinas y griegas.'));
    const desc = {
      'vv-desc-roots': _T('Grow a word tree from each root', 'Haz crecer un árbol de palabras'),
      'vv-desc-match': _T('Which root is in the word?', '¿Qué raíz tiene la palabra?'),
      'vv-desc-build': _T('Snap wood tiles into a word', 'Une piezas de madera'),
      'vv-desc-dictation': _T('Read the meaning, spell the word', 'Lee el significado, escribe la palabra'),
      'vv-desc-spot': _T('Find the root in a sentence', 'Encuentra la raíz en una frase'),
      'vv-desc-cog': _T('Pair English and Spanish twins', 'Une gemelos en inglés y español')
    };
    Object.keys(desc).forEach(k => setText(k, desc[k]));
    if (A) {
      [['roots', 'vv-ic-roots'], ['match', 'vv-ic-match'], ['build', 'vv-ic-build'], ['dictation', 'vv-ic-dictation'], ['spot', 'vv-ic-spot'], ['cognates', 'vv-ic-cog']]
        .forEach(([k, id]) => setHtml(id, A.modeIcon(k, 54)));
    }
    const pm = { 'vv-tile-match': prog.matchStars || 0, 'vv-tile-dictation': prog.dictationStars || 0, 'vv-tile-spot': prog.spotStars || 0, 'vv-tile-cog': prog.cogStars || 0 };
    Object.keys(pm).forEach(id => {
      const el = document.querySelector('#' + id + ' .vv-tile-stars');
      if (el) el.innerHTML = pm[id] ? _stars(pm[id], 16) : '';
    });

    // Root of the day
    const r = _rootOfDay();
    const e = D && D.ETYMA[r.id];
    setHtml('vv-daily',
      '<button type="button" class="vv-daily-card" id="vv-daily-btn">' +
        '<span class="vv-daily-art">' + _art(r.id, 72) + '</span>' +
        '<span class="vv-daily-body">' +
          '<span class="vv-daily-kicker">' + _T('Root of the day', 'Raíz del día') + ' · ' + _origin(r) + '</span>' +
          '<span class="vv-daily-root">' + _esc(r.id.replace('_alone', '')) + '-</span>' +
          '<span class="vv-daily-mean">' + _esc(_l(r.meaning)) + (e ? ' · <i>' + _esc(e.orig) + '</i>' : '') + '</span>' +
          '<span class="vv-daily-words">' + r.words.slice(0, 3).map(w => _mark(state.lang === 'es' ? w.es : w.en, r.id)).join(' · ') + '</span>' +
        '</span>' +
        '<span class="vv-daily-go" aria-hidden="true">➜</span>' +
      '</button>');
    const db = document.getElementById('vv-daily-btn');
    if (db) db.onclick = () => _openRoot(r.id);
    _showScreen('vv-screen-home');
  }

  // ── Roots browser ──
  function openRoots() {
    state.mode = 'roots';
    _renderRootList();
    _showScreen('vv-screen-roots');
  }

  function _renderRootList() {
    const grid = document.getElementById('vv-root-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const seen = new Set(prog.seenRoots || []);
    const filter = state.rootList;
    const filtered = ROOTS.filter(r => filter === 'all' || r.tier === Number(filter));
    filtered.forEach(r => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'vv-root-card vv-tier-' + r.tier + (seen.has(r.id) ? ' vv-seen' : '');
      card.innerHTML =
        '<span class="vv-root-art">' + _art(r.id, 46) + '</span>' +
        '<span class="vv-root-id">' + _esc(r.id.replace('_alone', '')) + '-</span>' +
        '<span class="vv-root-origin vv-origin-' + r.origin + '">' + _origin(r) + '</span>' +
        '<span class="vv-root-meaning">' + _esc(_l(r.meaning)) + '</span>' +
        '<span class="vv-root-tier" aria-label="' + _T('level', 'nivel') + ' ' + r.tier + '">' +
          '<i class="on"></i>' + '<i' + (r.tier >= 2 ? ' class="on"' : '') + '></i>' + '<i' + (r.tier >= 3 ? ' class="on"' : '') + '></i>' +
        '</span>' +
        (seen.has(r.id) ? '<span class="vv-root-seen" aria-label="' + _T('seen', 'vista') + '">✓</span>' : '');
      card.onclick = () => _openRoot(r.id);
      grid.appendChild(card);
    });
    document.querySelectorAll('.vv-tier-filter').forEach(b => {
      b.classList.toggle('vv-active', b.dataset.tier === String(state.rootList));
    });
    const t = document.getElementById('vv-roots-title');
    if (t) t.textContent = _T('Roots', 'Raíces');
  }

  function _openRoot(id) {
    const r = ROOTS.find(x => x.id === id);
    if (!r) return;
    state.rootId = r.id;
    state.mode = 'root';
    const prog = _loadProgress();
    prog.seenRoots = prog.seenRoots || [];
    if (prog.seenRoots.indexOf(r.id) === -1) {
      prog.seenRoots.push(r.id);
      _saveProgress(prog);
    }
    const e = D && D.ETYMA[r.id];
    const buildIdx = BUILDS.findIndex(b => b.root === r.id);
    const label = r.id.replace('_alone', '') + '-';
    const wrap = document.getElementById('vv-root-detail');
    const list = ROOTS.filter(x => state.rootList === 'all' || x.tier === Number(state.rootList));
    const pos = list.findIndex(x => x.id === r.id);
    const next = list[(pos + 1) % list.length] || ROOTS[(ROOTS.indexOf(r) + 1) % ROOTS.length];
    wrap.innerHTML =
      '<button type="button" class="vv-back-btn" aria-label="' + _T('Back to roots', 'Volver a raíces') + '" onclick="VocabularioVivo.backToRootList()">←</button>' +
      '<div class="vv-rd">' +
        '<div class="vv-rd-side">' +
          '<div class="vv-ety">' +
            '<div class="vv-ety-art">' + _art(r.id, 96) + '</div>' +
            '<div class="vv-ety-stamp vv-origin-' + r.origin + '">' + (r.origin === 'L' ? 'LATINA' : 'ΕΛΛΗΝΙΚΑ · GRIEGA') + '</div>' +
            '<div class="vv-root-big-id">' + _esc(label) + '</div>' +
            (e && e.orig !== r.id ? '<div class="vv-ety-orig">' + _esc(e.orig) + (e.tr ? ' <span>(' + _esc(e.tr) + ')</span>' : '') + '</div>' : '') +
            '<div class="vv-ety-gloss">' + (e ? '“' + _esc(_l(e.g)) + '”' : _esc(_l(r.meaning))) + '</div>' +
            '<p class="vv-ety-note">' + _T(
              'In ' + _origin(r) + ', ' + (e ? '<i>' + _esc(e.orig.split(/[,·]/)[0].trim()) + '</i>' : 'this') + ' means “' + _esc(r.meaning.en) + '”. English and Spanish both grew words from it.',
              'En ' + _origin(r).toLowerCase() + ', ' + (e ? '<i>' + _esc(e.orig.split(/[,·]/)[0].trim()) + '</i>' : 'esto') + ' significa “' + _esc(r.meaning.es) + '”. El inglés y el español formaron palabras con esta raíz.') + '</p>' +
          '</div>' +
          '<div class="vv-rd-actions">' +
            '<button type="button" class="vv-secondary-btn" id="vv-rd-speak">🔊 ' + _T('Hear the words', 'Escuchar') + '</button>' +
            (buildIdx >= 0 ? '<button type="button" class="vv-primary-btn" id="vv-rd-build">' + _T('Build a word', 'Construir una palabra') + '</button>' : '') +
            (next && next.id !== r.id ? '<button type="button" class="vv-secondary-btn" id="vv-rd-next">' + _T('Next root', 'Siguiente raíz') + ' →</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="vv-rd-tree">' +
          '<h3 class="vv-words-title">' + _T('Word tree', 'Árbol de palabras') + '</h3>' +
          (A ? A.wordTree(label, r.words, { split: w => D && D.split(w, r.id), seed: r.id.length * 7, aria: _T('Word tree for ', 'Árbol de palabras de ') + label }) : '') +
          '<div class="vv-words">' +
            r.words.map(w =>
              '<div class="vv-word-pair">' +
                '<span class="vv-word-en">' + _mark(w.en, r.id) + '</span>' +
                '<span class="vv-word-arrow">↔</span>' +
                '<span class="vv-word-es">' + _mark(w.es, r.id, 'vv-mark vv-mark-es') + '</span>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    const sp = document.getElementById('vv-rd-speak');
    if (sp) sp.onclick = () => _speak(r.words.map(w => state.lang === 'es' ? w.es : w.en).join(', '));
    const bb = document.getElementById('vv-rd-build');
    if (bb) bb.onclick = () => { state.mode = 'build'; state.buildIdx = buildIdx; _renderBuild(); _showScreen('vv-screen-build'); };
    const nb = document.getElementById('vv-rd-next');
    if (nb) nb.onclick = () => _openRoot(next.id);
    _showScreen('vv-screen-root-detail');
  }

  function backToRootList() { state.mode = 'roots'; _renderRootList(); _showScreen('vv-screen-roots'); }

  function filterRoots(tier) {
    state.rootList = tier;
    _renderRootList();
  }

  // ── Match mode ──
  // For each puzzle: pick a word from a root at the kid's level, ask
  // which root it comes from. Always 10 puzzles, so matchBest keeps
  // meaning "best score out of 10".
  const MATCH_TARGET = 10;
  // Roots with the same meaning — the expert round uses them as decoys.
  const TWINS = [['aqua', 'hydro'], ['terra', 'geo'], ['luc', 'photo'], ['urb', 'polis'], ['vid', 'vis', 'spect', 'scope'],
    ['port', 'fer'], ['scrib', 'graph'], ['bio', 'viv', 'anim'], ['form', 'morph'], ['reg', 'crat', 'arch'], ['jur', 'leg']];

  function openMatch() {
    state.mode = 'match';
    state.matchSession = {
      idx: 0,
      correct: 0,
      total: MATCH_TARGET,
      results: [],
      queue: _buildMatchQueue(MATCH_TARGET)
    };
    _renderMatchQuestion();
    _showScreen('vv-screen-match');
  }

  function _buildMatchQueue(n) {
    const pool = ROOTS.filter(r => r.tier <= _maxTier());
    const seen = new Set();
    const out = [];
    let safety = 400;
    while (out.length < n && safety-- > 0) {
      const root = pool[Math.floor(Math.random() * pool.length)];
      if (!root.words || !root.words.length) continue;
      const w = root.words[Math.floor(Math.random() * root.words.length)];
      const key = root.id + '|' + w.en;
      if (seen.has(key) || seen.has('root|' + root.id) && out.length < pool.length) continue;
      seen.add(key); seen.add('root|' + root.id);
      out.push({ rootId: root.id, word: w });
    }
    return out;
  }

  function _matchOptions(root, word) {
    const tier = _ageTier();
    const nOpt = tier === 'beginner' ? 3 : 4;
    let decoys = [];
    if (tier === 'expert') {
      const twins = TWINS.find(t => t.indexOf(root.id) !== -1);
      if (twins) decoys = twins.filter(id => id !== root.id && !(D && (D.split(word.en, id) || D.split(word.es, id)))).map(_rootById).filter(Boolean).slice(0, 1);
    }
    // A decoy must not also be inside the word (telescope = tele + scope).
    const pool = ROOTS.filter(r => r.id !== root.id && decoys.indexOf(r) === -1 && r.tier <= _maxTier() &&
      !(D && (D.split(word.en, r.id) || D.split(word.es, r.id))));
    decoys = decoys.concat(_shuffle(pool).slice(0, nOpt - 1 - decoys.length));
    return _shuffle([root].concat(decoys));
  }

  function _renderMatchQuestion() {
    const sess = state.matchSession;
    const item = sess.queue[sess.idx];
    if (!item) return _finishMatch();
    const root = ROOTS.find(r => r.id === item.rootId);
    const wrap = document.getElementById('vv-match-wrap');
    const word = state.lang === 'es' ? item.word.es : item.word.en;
    if (!sess.options || sess.optionsFor !== sess.idx) { sess.options = _matchOptions(root, item.word); sess.optionsFor = sess.idx; }
    const options = sess.options;
    wrap.innerHTML =
      '<div class="vv-match-meta">' + _progressDots(sess.idx, sess.total, sess.results) + '<span>✓ ' + sess.correct + '</span></div>' +
      '<h2 class="vv-match-q">' + _T('Which root is in this word?', '¿Qué raíz tiene esta palabra?') + '</h2>' +
      '<div class="vv-plank"><span class="vv-match-word" id="vv-match-word">' + _esc(word) + '</span>' + _speakBtn('vv-match-speak') + '</div>' +
      '<div class="vv-match-options vv-n' + options.length + '">' +
        options.map(opt =>
          '<button type="button" class="vv-match-opt" data-root="' + opt.id + '">' +
            '<span class="vv-opt-art">' + _art(opt.id, 52) + '</span>' +
            '<span class="vv-opt-id">' + _esc(opt.id.replace('_alone', '')) + '-</span>' +
            '<span class="vv-opt-meaning">' + _esc(_l(opt.meaning)) + '</span>' +
          '</button>'
        ).join('') +
      '</div>' +
      '<div class="vv-match-fb" id="vv-match-fb" aria-live="polite"></div>';

    document.getElementById('vv-match-speak').onclick = () => _speak(word);
    let answered = false;
    wrap.querySelectorAll('.vv-match-opt').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const chose = btn.dataset.root;
        const correct = chose === root.id;
        btn.classList.add(correct ? 'vv-correct' : 'vv-wrong');
        sess.results[sess.idx] = correct;
        if (correct) sess.correct++;
        else {
          const actual = wrap.querySelector('[data-root="' + root.id + '"]');
          if (actual) actual.classList.add('vv-actual');
        }
        wrap.querySelectorAll('.vv-match-opt').forEach(b => { b.disabled = true; });
        document.getElementById('vv-match-word').innerHTML = _mark(word, root.id);
        document.getElementById('vv-match-fb').innerHTML = (correct ? '✨ ' : '') +
          '<b>' + _esc(root.id.replace('_alone', '')) + '-</b> = ' + _esc(_l(root.meaning)) + ' · ' + _origin(root);
        if (typeof SFX !== 'undefined') {
          (correct && SFX.correct) ? SFX.correct() : (SFX.wrong && SFX.wrong());
        }
        setTimeout(() => {
          sess.idx++;
          _renderMatchQuestion();
        }, correct ? 1100 : 1800);
      };
    });
  }

  function _finishMatch() {
    const sess = state.matchSession;
    state.mode = 'done';
    const stars = _starsFor(sess.correct, sess.total);

    const prog = _loadProgress();
    prog.matchBest = Math.max(prog.matchBest || 0, sess.correct);
    prog.matchStars = Math.max(prog.matchStars || 0, stars);
    _saveProgress(prog);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🎯',
        (state.lang === 'es' ? 'Empareja: ' : 'Match: ') +
        sess.correct + '/' + sess.total + ' ⭐'.repeat(stars));
    }
    if (stars === 3 && typeof SFX !== 'undefined' && SFX.cheer) SFX.cheer();

    document.getElementById('vv-match-result').innerHTML = _resultCard(stars, sess.correct, sess.total, 'VocabularioVivo.openMatch()');
    _showScreen('vv-screen-match-result');
  }

  function _resultCard(stars, correct, total, again, extra) {
    return '<div class="vv-result">' +
      _stars(stars, 52) +
      '<div class="vv-result-title">' + (stars === 3 ? _T('Excellent!', '¡Excelente!') : stars === 2 ? _T('Well done!', '¡Bien hecho!') : _T('Good practice!', '¡Buena práctica!')) + '</div>' +
      '<p>' + correct + ' / ' + total + ' ' + _T('correct', 'correctas') + '</p>' +
      (extra || '') +
      '<div class="vv-result-actions">' +
        '<button type="button" class="vv-primary-btn" onclick="' + again + '">' + _T('↺ Play again', '↺ Otra vez') + '</button>' +
        '<button type="button" class="vv-secondary-btn" onclick="VocabularioVivo.goHome()">' + _T('← Home', '← Inicio') + '</button>' +
      '</div>' +
    '</div>';
  }

  // ── Build mode: drag wood tiles into the rack ──
  function _nextBuildIdx(after) {
    const done = new Set(_loadProgress().builds || []);
    const max = _maxTier();
    const n = BUILDS.length;
    for (let k = 1; k <= n; k++) {
      const i = (after + k) % n;
      if (!done.has(i) && BUILDS[i].tier <= max) return i;
    }
    for (let k = 1; k <= n; k++) {
      const i = (after + k) % n;
      if (!done.has(i)) return i;
    }
    return -1;
  }

  function openBuild() {
    state.mode = 'build';
    let idx = _nextBuildIdx(-1);
    if (idx < 0) idx = 0;
    state.buildIdx = idx;
    _renderBuild();
    _showScreen('vv-screen-build');
  }

  function _buildConfig() {
    const t = _ageTier();
    return {
      decoys: t === 'beginner' ? 1 : t === 'intermediate' ? 2 : t === 'advanced' ? 3 : 4,
      hints: t === 'beginner' || t === 'intermediate',   // coloured wood + hyphens
      tags: t === 'beginner',                              // "prefix / root / suffix" labels
      exactSlots: t === 'beginner' || t === 'intermediate'
    };
  }

  function _renderBuild() {
    const b = BUILDS[state.buildIdx];
    if (!b) return _finishBuild();
    const cfg = _buildConfig();
    const wrap = document.getElementById('vv-build-wrap');
    const meaning = state.lang === 'es' ? b.es.meaning : b.en.meaning;
    const answer  = state.lang === 'es' ? b.es.word    : b.en.word;
    const prog = _loadProgress();
    const done = new Set(prog.builds || []);

    const real = [];
    if (b.prefix) real.push({ text: b.prefix, kind: 'prefix' });
    real.push({ text: b.root, kind: 'root' });
    if (b.suffix) real.push({ text: b.suffix, kind: 'suffix' });
    const decoys = _pickDecoyAffixes(b, cfg.decoys);
    const tiles = _shuffle(real.concat(decoys)).map((p, i) => Object.assign({ id: i }, p));
    const nSlots = cfg.exactSlots ? real.length : 3;

    let slots = '';
    for (let i = 0; i < nSlots; i++) slots += '<div class="vv-slot" data-slot="' + i + '"></div>';

    wrap.innerHTML =
      '<div class="vv-build-meta">' +
        '<span>' + (state.buildIdx + 1) + ' / ' + BUILDS.length + '</span>' +
        '<span class="vv-build-done">' + done.size + ' ' + _T('built', 'construidas') + '</span>' +
      '</div>' +
      '<div class="vv-target">' +
        '<span class="vv-target-kicker">' + _T('Build the word that means…', 'Construye la palabra que significa…') + '</span>' +
        '<h2 class="vv-build-meaning">' + _esc(meaning) + '</h2>' + _speakBtn('vv-build-speak') +
      '</div>' +
      '<div class="vv-rack" id="vv-build-slots">' + slots + '</div>' +
      '<p class="vv-build-help">' + _T('Drag the tiles onto the rack, or tap them.', 'Arrastra las piezas al riel, o tócalas.') + '</p>' +
      '<div class="vv-tray" id="vv-build-tiles">' +
        tiles.map(t => '<span class="vv-tile-home" data-home="' + t.id + '">' +
          '<button type="button" class="vv-build-tile" data-text="' + _esc(t.text) + '" data-id="' + t.id + '" aria-label="' + _esc(t.text) + '">' +
            _woodTile(t.text, t.kind, { hyphen: cfg.hints, tag: cfg.tags, species: cfg.hints ? null : 'maple' }) +
          '</button></span>').join('') +
      '</div>' +
      '<div class="vv-build-actions">' +
        '<button type="button" class="vv-secondary-btn" id="vv-build-clear">' + _T('↺ Clear', '↺ Limpiar') + '</button>' +
        '<button type="button" class="vv-primary-btn" id="vv-build-check">' + _T('✓ Check', '✓ Comprobar') + '</button>' +
        '<button type="button" class="vv-ghost-btn" id="vv-build-skip">' + _T('Skip →', 'Saltar →') + '</button>' +
      '</div>' +
      '<div class="vv-build-feedback" id="vv-build-feedback" aria-live="polite"></div>';

    document.getElementById('vv-build-speak').onclick = () => _speak(meaning);
    _wireDrag(wrap);
    document.getElementById('vv-build-clear').onclick = () => _renderBuild();
    document.getElementById('vv-build-check').onclick = () => _checkBuild(b, answer);
    document.getElementById('vv-build-skip').onclick = () => {
      const nx = (state.buildIdx + 1) % BUILDS.length;
      state.buildIdx = nx;
      _renderBuild();
    };
  }

  // Pointer-driven drag with tap fallback. A tile lives either in its
  // home spot in the tray or inside a rack slot.
  function _wireDrag(wrap) {
    const slots = Array.from(wrap.querySelectorAll('.vv-slot'));
    const homeOf = t => wrap.querySelector('.vv-tile-home[data-home="' + t.dataset.id + '"]');
    function slotAt(x, y) {
      let best = null, bd = 1e9;
      slots.forEach(s => {
        const r = s.getBoundingClientRect();
        const cx = Math.max(r.left, Math.min(x, r.right)), cy = Math.max(r.top, Math.min(y, r.bottom));
        const d = Math.hypot(x - cx, y - cy);
        if (d < bd) { bd = d; best = s; }
      });
      return bd < 48 ? best : null;
    }
    function sendHome(tile) {
      const h = homeOf(tile);
      if (h) h.appendChild(tile);
      tile.classList.remove('vv-in-slot');
    }
    function place(tile, slot) {
      const cur = slot.querySelector('.vv-build-tile');
      if (cur && cur !== tile) sendHome(cur);
      slot.appendChild(tile);
      tile.classList.add('vv-in-slot');
      if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
      _clearBuildFeedback();
    }
    function tap(tile) {
      if (tile.classList.contains('vv-in-slot')) { sendHome(tile); _clearBuildFeedback(); return; }
      const empty = slots.find(s => !s.querySelector('.vv-build-tile'));
      if (empty) place(tile, empty);
    }
    wrap.querySelectorAll('.vv-build-tile').forEach(tile => {
      let sx = 0, sy = 0, drag = false, pid = null;
      tile.addEventListener('pointerdown', e => {
        if (wrap.classList.contains('vv-locked')) return;
        pid = e.pointerId; sx = e.clientX; sy = e.clientY; drag = false;
        try { tile.setPointerCapture(pid); } catch (err) {}
      });
      tile.addEventListener('pointermove', e => {
        if (pid !== e.pointerId) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!drag && Math.hypot(dx, dy) > 6) { drag = true; tile.classList.add('vv-dragging'); }
        if (drag) {
          tile.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(-3deg) scale(1.06)';
          const s = slotAt(e.clientX, e.clientY);
          slots.forEach(x => x.classList.toggle('vv-slot-hover', x === s));
        }
      });
      const end = e => {
        if (pid !== e.pointerId) return;
        pid = null;
        slots.forEach(x => x.classList.remove('vv-slot-hover'));
        tile.style.transform = '';
        tile.classList.remove('vv-dragging');
        if (wrap.classList.contains('vv-locked')) return;
        if (drag) {
          const s = e.type === 'pointerup' ? slotAt(e.clientX, e.clientY) : null;
          if (s) place(tile, s);
          else if (tile.classList.contains('vv-in-slot')) sendHome(tile);
        } else if (e.type === 'pointerup') {
          tap(tile);
        }
        tile._skipClick = true;
        setTimeout(() => { tile._skipClick = false; }, 0);
      };
      tile.addEventListener('pointerup', end);
      tile.addEventListener('pointercancel', end);
      // Keyboard (Enter / Space) arrives as a click with no pointer.
      tile.addEventListener('click', e => {
        if (tile._skipClick || e.detail !== 0) return;
        if (!wrap.classList.contains('vv-locked')) tap(tile);
      });
    });
  }
  function _clearBuildFeedback() {
    const fb = document.getElementById('vv-build-feedback');
    if (fb && fb.classList.contains('vv-feedback-bad')) { fb.className = 'vv-build-feedback'; fb.textContent = ''; }
    const rack = document.getElementById('vv-build-slots');
    if (rack) rack.classList.remove('vv-shake');
  }

  function _pickDecoyAffixes(target, n) {
    const realSet = new Set([target.prefix, target.root, target.suffix].filter(Boolean));
    const seen = new Set();
    const pool = [];
    BUILDS.forEach(b => {
      if (b === target) return;
      if (b.prefix && !realSet.has(b.prefix) && !seen.has(b.prefix)) { seen.add(b.prefix); pool.push({ text: b.prefix, kind: 'prefix' }); }
      if (b.suffix && !realSet.has(b.suffix) && !seen.has(b.suffix)) { seen.add(b.suffix); pool.push({ text: b.suffix, kind: 'suffix' }); }
    });
    return _shuffle(pool).slice(0, n);
  }

  function _checkBuild(b, answer) {
    const wrap = document.getElementById('vv-build-wrap');
    const slots = document.querySelectorAll('#vv-build-slots .vv-slot');
    const parts = [];
    slots.forEach(s => { const t = s.querySelector('.vv-build-tile'); if (t) parts.push(t.dataset.text); });
    const expectedParts = [b.prefix, b.root, b.suffix].filter(Boolean);
    const fb = document.getElementById('vv-build-feedback');

    // Compare assembled parts in order to expected parts.
    const ok = parts.length === expectedParts.length &&
               parts.every((p, i) => p === expectedParts[i]);

    if (ok) {
      const prog = _loadProgress();
      prog.builds = prog.builds || [];
      if (prog.builds.indexOf(state.buildIdx) === -1) prog.builds.push(state.buildIdx);
      _saveProgress(prog);
      if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
      wrap.classList.add('vv-locked');
      const rack = document.getElementById('vv-build-slots');
      rack.classList.add('vv-joined');
      slots.forEach(s => { if (!s.querySelector('.vv-build-tile')) s.classList.add('vv-slot-empty'); });
      const r = _rootById(b.root);
      const e = D && D.ETYMA[b.root];
      fb.className = 'vv-build-feedback vv-feedback-good';
      fb.innerHTML =
        '<div class="vv-built">' +
          '<div class="vv-built-word">' + _mark(answer, b.root) + '</div>' +
          '<div class="vv-built-ety">' + _art(b.root, 44) +
            '<span>' + (r ? '<b>' + _esc(b.root) + '</b> ' + (e ? '(<i>' + _esc(e.orig) + '</i>) ' : '') + '= ' + _esc(_l(r.meaning)) + ' · ' + _origin(r) : '') + '</span></div>' +
          '<div class="vv-built-other">' + _T('In Spanish: ', 'En inglés: ') + '<b>' + _esc(state.lang === 'es' ? b.en.word : b.es.word) + '</b></div>' +
          '<button type="button" class="vv-primary-btn vv-next-btn" id="vv-build-next">' + _T('Next →', 'Siguiente →') + '</button>' +
        '</div>';
      document.getElementById('vv-build-next').onclick = () => {
        const nx = _nextBuildIdx(state.buildIdx);
        if (nx < 0) return _finishBuild();
        state.buildIdx = nx;
        _renderBuild();
      };
      _speak(answer);

      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Vocabulario Vivo', '🔨',
          (state.lang === 'es' ? 'Construyó "' : 'Built "') + answer + '"');
      }
    } else {
      if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      const rack = document.getElementById('vv-build-slots');
      rack.classList.remove('vv-shake'); void rack.offsetWidth; rack.classList.add('vv-shake');
      fb.className = 'vv-build-feedback vv-feedback-bad';
      const hasRoot = parts.indexOf(b.root) !== -1;
      fb.textContent = !parts.length
        ? _T('Put some tiles on the rack first.', 'Primero pon piezas en el riel.')
        : !hasRoot
          ? _T('Not quite. Which tile carries the meaning? Look for the root.', 'Aún no. ¿Qué pieza lleva el significado? Busca la raíz.')
          : _T('Not quite. Check the pieces and their order.', 'Aún no. Revisa las piezas y su orden.');
    }
  }

  function _finishBuild() {
    state.buildIdx = 0;
    document.getElementById('vv-build-wrap').innerHTML =
      '<div class="vv-result">' + _stars(3, 52) +
      '<p>' + _T('You finished every build!', '¡Completaste todas las construcciones!') + '</p>' +
      '<div class="vv-result-actions">' +
        '<button type="button" class="vv-primary-btn" onclick="VocabularioVivo.practiceBuilds()">' + _T('↺ Practice again', '↺ Practicar otra vez') + '</button>' +
        '<button type="button" class="vv-secondary-btn" onclick="VocabularioVivo.goHome()">' + _T('← Home', '← Inicio') + '</button>' +
      '</div></div>';
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🏆',
        (state.lang === 'es' ? 'Terminó todas las construcciones' : 'Finished every build'));
    }
  }
  function practiceBuilds() { state.mode = 'build'; state.buildIdx = 0; _renderBuild(); }

  // ── Dictation mode: definition → type the word ───────────────────
  // 10 items per session at the kid's level. Accent-insensitive
  // comparison so kids aren't dinged for missing an í.
  const DICTATION_SESSION = 10;

  function openDictation() {
    state.mode = 'dictation';
    const max = _maxTier();
    let pool = _shuffle(DICTATIONS.filter(d => d.tier <= max));
    if (pool.length < DICTATION_SESSION) pool = pool.concat(_shuffle(DICTATIONS.filter(d => d.tier > max)));
    state.dictation = {
      idx: 0,
      correct: 0,
      total: DICTATION_SESSION,
      results: [],
      queue: pool.slice(0, DICTATION_SESSION)
    };
    _renderDictationQuestion();
    _showScreen('vv-screen-dictation');
  }

  function _rootOfWord(enWord) {
    let r = ROOTS.find(x => x.words.some(w => w.en === enWord));
    if (!r) {
      const b = BUILDS.find(x => x.en.word === enWord);
      if (b) r = _rootById(b.root);
    }
    return r || null;
  }

  function _renderDictationQuestion() {
    const s = state.dictation;
    const item = s.queue[s.idx];
    if (!item) return _finishDictation();
    const langPair = state.lang === 'es' ? item.es : item.en;
    const tier = _ageTier();
    const expected = langPair.word;
    const boxes = tier === 'beginner' || tier === 'intermediate';
    const root = _rootOfWord(item.en.word);
    const wrap = document.getElementById('vv-dictation-wrap');
    wrap.innerHTML =
      '<div class="vv-dict-meta">' + _progressDots(s.idx, s.total, s.results) + '<span>✓ ' + s.correct + '</span></div>' +
      '<div class="vv-paper">' +
        '<h2 class="vv-dict-prompt">' + _T('Definition', 'Definición') + '</h2>' +
        '<p class="vv-dict-def">' + _esc(langPair.def) + '</p>' + _speakBtn('vv-dict-speak') +
        (boxes ? '<div class="vv-letter-boxes" id="vv-boxes" aria-hidden="true">' + Array.from(expected).map((ch, i) =>
          '<span class="vv-lbox' + (ch === ' ' ? ' vv-lgap' : '') + '">' + (tier === 'beginner' && i === 0 ? _esc(ch) : '') + '</span>').join('') + '</div>'
          : tier === 'advanced' ? '<div class="vv-dict-len">' + Array.from(expected).length + ' ' + _T('letters', 'letras') + '</div>' : '') +
        '<div class="vv-dict-hint" id="vv-dict-hint"></div>' +
      '</div>' +
      '<div class="vv-dict-input-row">' +
        '<label class="vv-sr" for="vv-dict-input">' + _T('Your answer', 'Tu respuesta') + '</label>' +
        '<input class="vv-dict-input" id="vv-dict-input" type="text" ' +
          'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
          'placeholder="' + _T('type the word…', 'escribe la palabra…') + '">' +
        '<button type="button" class="vv-primary-btn" id="vv-dict-check">' + _T('✓ Check', '✓ Comprobar') + '</button>' +
      '</div>' +
      '<div class="vv-dict-actions">' +
        (root ? '<button type="button" class="vv-secondary-btn" id="vv-dict-root">' + _T('Show the root', 'Ver la raíz') + '</button>' : '') +
        '<button type="button" class="vv-secondary-btn" id="vv-dict-skip">' + _T('↷ Skip', '↷ Saltar') + '</button>' +
      '</div>' +
      '<div class="vv-dict-feedback" id="vv-dict-feedback" aria-live="polite"></div>';

    const inp = document.getElementById('vv-dict-input');
    const check = () => _checkDictation(item);
    document.getElementById('vv-dict-check').onclick = check;
    document.getElementById('vv-dict-skip').onclick = () => _skipDictation(item);
    document.getElementById('vv-dict-speak').onclick = () => _speak(langPair.def);
    const rb = document.getElementById('vv-dict-root');
    if (rb) rb.onclick = () => {
      document.getElementById('vv-dict-hint').innerHTML = _art(root.id, 40) + _woodTile(root.id.replace('_alone', ''), 'root', { species: 'walnut' }) +
        '<span>= ' + _esc(_l(root.meaning)) + '</span>';
      rb.disabled = true;
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    if (boxes) inp.addEventListener('input', () => {
      const chars = Array.from(inp.value);
      document.querySelectorAll('#vv-boxes .vv-lbox').forEach((b, i) => {
        b.textContent = chars[i] || (tier === 'beginner' && i === 0 ? Array.from(expected)[0] : '');
        b.classList.toggle('vv-lfill', !!chars[i]);
      });
    });
    setTimeout(() => inp.focus(), 50);
  }

  function _checkDictation(item) {
    const inp = document.getElementById('vv-dict-input');
    const fb  = document.getElementById('vv-dict-feedback');
    const btn = document.getElementById('vv-dict-check');
    if (!inp || btn.disabled) return;
    const expected = state.lang === 'es' ? item.es.word : item.en.word;
    const got = inp.value.trim();
    if (!got) { inp.focus(); return; }
    const ok = _normaliseWord(got) === _normaliseWord(expected);
    const root = _rootOfWord(item.en.word);
    state.dictation.results[state.dictation.idx] = ok;
    if (ok) {
      state.dictation.correct++;
      inp.classList.add('vv-dict-correct');
      fb.className = 'vv-dict-feedback vv-feedback-good';
      fb.innerHTML = '✨ ' + _T('Well done!', '¡Bien hecho!') + ' <strong>' + (root ? _mark(expected, root.id) : _esc(expected)) + '</strong>';
      if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
    } else {
      inp.classList.add('vv-dict-wrong');
      fb.className = 'vv-dict-feedback vv-feedback-bad';
      fb.innerHTML = _T('It was: ', 'Era: ') + '<strong>' + (root ? _mark(expected, root.id) : _esc(expected)) + '</strong>';
      if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
    }
    btn.disabled = true;
    inp.readOnly = true;
    setTimeout(() => {
      state.dictation.idx++;
      _renderDictationQuestion();
    }, ok ? 1300 : 2200);
  }

  function _skipDictation(item) {
    const fb = document.getElementById('vv-dict-feedback');
    const btn = document.getElementById('vv-dict-check');
    if (btn && btn.disabled) return;
    if (btn) btn.disabled = true;
    const expected = state.lang === 'es' ? item.es.word : item.en.word;
    state.dictation.results[state.dictation.idx] = false;
    fb.className = 'vv-dict-feedback vv-feedback-bad';
    fb.innerHTML = _T('It was: ', 'Era: ') + '<strong>' + _esc(expected) + '</strong>';
    if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
    setTimeout(() => {
      state.dictation.idx++;
      _renderDictationQuestion();
    }, 1600);
  }

  function _normaliseWord(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics
      .replace(/[^a-z0-9]/gi, '');
  }

  function _finishDictation() {
    const s = state.dictation;
    state.mode = 'done';
    const stars = _starsFor(s.correct, s.total);
    const prog = _loadProgress();
    prog.dictationBest = Math.max(prog.dictationBest || 0, s.correct);
    prog.dictationStars = Math.max(prog.dictationStars || 0, stars);
    _saveProgress(prog);
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '📝',
        (state.lang === 'es' ? 'Dictado: ' : 'Dictation: ') +
        s.correct + '/' + s.total + ' ⭐'.repeat(stars));
    }
    if (stars === 3 && typeof SFX !== 'undefined' && SFX.cheer) SFX.cheer();
    document.getElementById('vv-dictation-result').innerHTML = _resultCard(stars, s.correct, s.total, 'VocabularioVivo.openDictation()');
    _showScreen('vv-screen-dictation-result');
  }

  // ── Detective: spot the root in a sentence ───────────────────────
  const SPOT_SESSION = 8;

  function openSpot() {
    if (!D) return;
    state.mode = 'spot';
    const max = _maxTier();
    const ok = s => { const r = _rootById(s.root); return r && r.tier <= max; };
    let pool = _shuffle(D.SENTENCES.filter(ok));
    if (pool.length < SPOT_SESSION) pool = pool.concat(_shuffle(D.SENTENCES.filter(s => !ok(s))));
    state.spot = { idx: 0, correct: 0, total: SPOT_SESSION, results: [], queue: pool.slice(0, SPOT_SESSION), step: 1, missed: false };
    _renderSpot();
    _showScreen('vv-screen-spot');
  }

  function _tokens(sentence) {
    // Words (with the *target* marker) and the spaces/punctuation between.
    const out = [];
    const re = /(\*[^*]+\*)|([A-Za-zÀ-ÿ'’]+)|([^A-Za-zÀ-ÿ*'’]+)/g;
    let m;
    while ((m = re.exec(sentence))) {
      if (m[1]) out.push({ w: m[1].slice(1, -1), target: true });
      else if (m[2]) out.push({ w: m[2] });
      else out.push({ sep: m[3] });
    }
    return out;
  }
  function _spotAccepts(word, rootId) {
    // A second word that clearly carries the same root (or a root with
    // the same meaning) also counts, e.g. "agua" next to "hidrógeno".
    if (!D || word.length < 4) return false;
    const r = _rootById(rootId);
    const same = ROOTS.filter(x => x.id === rootId || (r && x.meaning.en === r.meaning.en));
    return same.some(x => (D.STEMS[x.id] || []).some(st => st.length >= 3 && D.plain(word).indexOf(st) !== -1) && D.split(word, x.id));
  }

  function _renderSpot() {
    const s = state.spot;
    const item = s.queue[s.idx];
    if (!item) return _finishSpot();
    const r = _rootById(item.root);
    const tier = _ageTier();
    const meaningOnly = tier === 'advanced' || tier === 'expert';
    const sentence = state.lang === 'es' ? item.es : item.en;
    const toks = _tokens(sentence);
    const wrap = document.getElementById('vv-spot-wrap');
    const prompt = meaningOnly
      ? _T('Tap the word whose root means', 'Toca la palabra cuya raíz significa') + ' <b class="vv-q-mean">“' + _esc(_l(r.meaning)) + '”</b>'
      : _T('Tap the word with the root', 'Toca la palabra con la raíz') + ' ' + _woodTile(r.id.replace('_alone', ''), 'root', { species: 'walnut' }) +
        ' <span class="vv-q-mean">(' + _esc(_l(r.meaning)) + ')</span>';
    wrap.innerHTML =
      '<div class="vv-match-meta">' + _progressDots(s.idx, s.total, s.results) + '<span>✓ ' + s.correct + '</span></div>' +
      '<div class="vv-spot-prompt">' + (meaningOnly ? '' : '<span class="vv-spot-art">' + _art(r.id, 48) + '</span>') + '<span>' + prompt + '</span></div>' +
      '<div class="vv-page"><p class="vv-sentence" id="vv-sentence">' +
        toks.map((t, i) => t.sep !== undefined ? _esc(t.sep)
          : '<button type="button" class="vv-word-btn" data-i="' + i + '"' + (t.target ? ' data-target="1"' : '') + '>' + _esc(t.w) + '</button>').join('') +
      '</p>' + _speakBtn('vv-spot-speak') + '</div>' +
      '<div class="vv-spot-fb" id="vv-spot-fb" aria-live="polite"></div>';
    document.getElementById('vv-spot-speak').onclick = () => _speak(sentence.replace(/\*/g, ''));
    s.step = 1; s.missed = false;
    wrap.querySelectorAll('.vv-word-btn').forEach(btn => {
      btn.onclick = () => {
        if (s.step !== 1) return;
        const t = toks[Number(btn.dataset.i)];
        const hit = t.target || _spotAccepts(t.w, r.id);
        if (hit) {
          btn.classList.add('vv-word-hit');
          btn.innerHTML = _mark(t.w, r.id);
          if (!t.target) { const tg = wrap.querySelector('[data-target]'); if (tg) { tg.classList.add('vv-word-hit'); tg.innerHTML = _mark(tg.textContent, r.id); } }
          if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
          if (tier === 'expert') return _spotOrigin(r);
          _spotDone(!s.missed, r);
        } else {
          s.missed = true;
          btn.classList.add('vv-word-miss');
          if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
          if (wrap.querySelectorAll('.vv-word-miss').length >= 2) {
            const tg = wrap.querySelector('[data-target]');
            if (tg) { tg.classList.add('vv-word-show'); tg.innerHTML = _mark(tg.textContent, r.id); }
            _spotDone(false, r);
          }
        }
      };
    });
  }
  function _spotOrigin(r) {
    const s = state.spot;
    s.step = 2;
    const fb = document.getElementById('vv-spot-fb');
    fb.innerHTML = '<div class="vv-spot-q2">' + _T('Is this root Latin or Greek?', '¿Esta raíz es latina o griega?') + '</div>' +
      '<div class="vv-spot-origin">' +
        '<button type="button" class="vv-secondary-btn" data-o="L">' + _T('Latin', 'Latina') + '</button>' +
        '<button type="button" class="vv-secondary-btn" data-o="G">' + _T('Greek', 'Griega') + '</button></div>';
    fb.querySelectorAll('[data-o]').forEach(b => {
      b.onclick = () => {
        const ok = b.dataset.o === r.origin;
        if (typeof SFX !== 'undefined') (ok ? SFX.correct : SFX.wrong) && (ok ? SFX.correct() : SFX.wrong());
        _spotDone(ok && !s.missed, r);
      };
    });
  }
  function _spotDone(ok, r) {
    const s = state.spot;
    s.step = 3;
    s.results[s.idx] = ok;
    if (ok) s.correct++;
    const e = D && D.ETYMA[r.id];
    document.getElementById('vv-spot-fb').innerHTML =
      '<div class="vv-spot-card ' + (ok ? 'vv-feedback-good' : 'vv-feedback-bad') + '">' + _art(r.id, 44) +
        '<span><b>' + _esc(r.id.replace('_alone', '')) + '-</b> ' + (e ? '(<i>' + _esc(e.orig) + '</i>) ' : '') + '= ' + _esc(_l(r.meaning)) + ' · ' + _origin(r) + '</span>' +
        '<button type="button" class="vv-primary-btn" id="vv-spot-next">' + _T('Next →', 'Siguiente →') + '</button></div>';
    document.getElementById('vv-spot-next').onclick = () => { s.idx++; _renderSpot(); };
    const nb = document.getElementById('vv-spot-next');
    if (nb) nb.focus({ preventScroll: true });
  }
  function _finishSpot() {
    const s = state.spot;
    state.mode = 'done';
    const stars = _starsFor(s.correct, s.total);
    const prog = _loadProgress();
    prog.spotBest = Math.max(prog.spotBest || 0, s.correct);
    prog.spotStars = Math.max(prog.spotStars || 0, stars);
    _saveProgress(prog);
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🔎', _T('Detective: ', 'Detective: ') + s.correct + '/' + s.total + ' ⭐'.repeat(stars));
    }
    if (stars === 3 && typeof SFX !== 'undefined' && SFX.cheer) SFX.cheer();
    document.getElementById('vv-result').innerHTML = _resultCard(stars, s.correct, s.total, 'VocabularioVivo.openSpot()');
    _showScreen('vv-screen-result');
  }

  // ── Cognados: pair English and Spanish twins ─────────────────────
  const COG_CONFIG = {
    beginner:     { boards: 2, pairs: 3, ff: 0 },
    intermediate: { boards: 2, pairs: 4, ff: 0 },
    advanced:     { boards: 2, pairs: 4, ff: 2 },
    expert:       { boards: 2, pairs: 5, ff: 3 }
  };
  const NOT_COGNATE = ['malady'];

  function _cognatePool() {
    const max = _maxTier();
    const out = [];
    ROOTS.filter(r => r.tier <= max).forEach(r => r.words.forEach(w => {
      if (!D) return;
      if (/[\s(]/.test(w.es) || /[\s(]/.test(w.en)) return;
      if (D.plain(w.en) === D.plain(w.es)) return;
      if (NOT_COGNATE.indexOf(w.en) !== -1) return;
      if (!D.split(w.en, r.id) || !D.split(w.es, r.id)) return;
      out.push({ en: w.en, es: w.es, root: r.id });
    }));
    return _shuffle(out);
  }

  function openCognates() {
    if (!D) return;
    state.mode = 'cognates';
    const cfg = COG_CONFIG[_ageTier()] || COG_CONFIG.intermediate;
    const pool = _cognatePool();
    const usedEn = new Set(), usedEs = new Set();
    const tasks = [];
    let p = 0;
    for (let b = 0; b < cfg.boards; b++) {
      const pairs = [];
      while (pairs.length < cfg.pairs && p < pool.length) {
        const c = pool[p++];
        if (usedEn.has(c.en) || usedEs.has(c.es)) continue;
        usedEn.add(c.en); usedEs.add(c.es);
        pairs.push(c);
      }
      if (pairs.length) tasks.push({ kind: 'board', pairs: pairs });
    }
    const falseOnes = _shuffle(D.FRIENDS.filter(f => !f.same));
    const trueOnes = _shuffle(D.FRIENDS.filter(f => f.same));
    for (let i = 0; i < cfg.ff; i++) {
      const f = (i % 2 === 0 ? falseOnes : trueOnes).shift() || falseOnes.shift();
      if (f) tasks.push({ kind: 'ff', f: f });
    }
    const total = tasks.reduce((n, t) => n + (t.kind === 'board' ? t.pairs.length : 1), 0);
    state.cog = { tasks: tasks, idx: 0, correct: 0, total: total, board: null };
    _renderCog();
    _showScreen('vv-screen-cognates');
  }

  function _renderCog() {
    const c = state.cog;
    const task = c.tasks[c.idx];
    if (!task) return _finishCog();
    const wrap = document.getElementById('vv-cog-wrap');
    const steps = c.tasks.map((t, i) => '<span class="vv-dot' + (i === c.idx ? ' vv-dot-now' : i < c.idx ? ' vv-dot-ok' : '') + '"></span>').join('');
    if (task.kind === 'board') {
      if (!c.board || c.board.task !== task) {
        c.board = { task: task, en: _shuffle(task.pairs), es: _shuffle(task.pairs), matched: new Set(), missed: new Set(), pick: null };
      }
      const bd = c.board;
      wrap.innerHTML =
        '<div class="vv-match-meta"><div class="vv-dots">' + steps + '</div><span>✓ ' + c.correct + ' / ' + c.total + '</span></div>' +
        '<h2 class="vv-match-q">' + _T('Pair each English word with its Spanish twin', 'Une cada palabra en inglés con su gemela en español') + '</h2>' +
        '<div class="vv-cog-board">' +
          '<div class="vv-cog-col"><div class="vv-cog-head vv-cog-en">English</div>' +
            bd.en.map(p => bd.matched.has(p.en) ? '' : '<button type="button" class="vv-cog-card vv-cog-card-en" data-side="en" data-key="' + _esc(p.en) + '">' + _esc(p.en) + '</button>').join('') + '</div>' +
          '<div class="vv-cog-col"><div class="vv-cog-head vv-cog-es">Español</div>' +
            bd.es.map(p => bd.matched.has(p.en) ? '' : '<button type="button" class="vv-cog-card vv-cog-card-es" data-side="es" data-key="' + _esc(p.en) + '">' + _esc(p.es) + '</button>').join('') + '</div>' +
        '</div>' +
        '<div class="vv-cog-done">' + task.pairs.filter(p => bd.matched.has(p.en)).map(p =>
          '<div class="vv-cog-pair">' + _art(p.root, 34) +
            '<span class="vv-cog-joined"><span class="vv-cj-en">' + _mark(p.en, p.root) + '</span><span class="vv-cj-es">' + _mark(p.es, p.root, 'vv-mark vv-mark-es') + '</span></span>' +
            '<span class="vv-cog-root">' + _esc(p.root.replace('_alone', '')) + '-</span></div>').join('') + '</div>';
      wrap.querySelectorAll('.vv-cog-card').forEach(btn => {
        btn.onclick = () => _cogPick(btn);
      });
      if (bd.pick) {
        const sel = wrap.querySelector('.vv-cog-card[data-side="' + bd.pick.side + '"][data-key="' + CSS.escape(bd.pick.key) + '"]');
        if (sel) sel.classList.add('vv-cog-sel');
      }
    } else {
      const f = task.f;
      wrap.innerHTML =
        '<div class="vv-match-meta"><div class="vv-dots">' + steps + '</div><span>✓ ' + c.correct + ' / ' + c.total + '</span></div>' +
        '<h2 class="vv-match-q">' + _T('True friends or false friends?', '¿Amigos verdaderos o falsos amigos?') + '</h2>' +
        '<p class="vv-ff-help">' + _T('They look alike. Do they mean the same thing?', 'Se parecen. ¿Significan lo mismo?') + '</p>' +
        '<div class="vv-ff-pair"><span class="vv-cog-card vv-cog-card-en vv-static">' + _esc(f.en) + '</span><span class="vv-ff-vs">?</span><span class="vv-cog-card vv-cog-card-es vv-static">' + _esc(f.es) + '</span></div>' +
        '<div class="vv-ff-actions">' +
          '<button type="button" class="vv-secondary-btn vv-ff-btn" data-same="1">🤝 ' + _T('Same meaning', 'Mismo significado') + '</button>' +
          '<button type="button" class="vv-secondary-btn vv-ff-btn" data-same="0">🎭 ' + _T('False friends', 'Falsos amigos') + '</button>' +
        '</div><div class="vv-spot-fb" id="vv-ff-fb" aria-live="polite"></div>';
      wrap.querySelectorAll('.vv-ff-btn').forEach(b => {
        b.onclick = () => {
          wrap.querySelectorAll('.vv-ff-btn').forEach(x => { x.disabled = true; });
          const ok = (b.dataset.same === '1') === f.same;
          if (ok) c.correct++;
          b.classList.add(ok ? 'vv-correct' : 'vv-wrong');
          if (typeof SFX !== 'undefined') ok ? (SFX.correct && SFX.correct()) : (SFX.wrong && SFX.wrong());
          document.getElementById('vv-ff-fb').innerHTML = '<div class="vv-spot-card ' + (ok ? 'vv-feedback-good' : 'vv-feedback-bad') + '"><span>' +
            (ok ? '✨ ' : '') + _esc(_l(f.why)) + '</span><button type="button" class="vv-primary-btn" id="vv-ff-next">' + _T('Next →', 'Siguiente →') + '</button></div>';
          document.getElementById('vv-ff-next').onclick = () => { c.idx++; _renderCog(); };
        };
      });
    }
  }

  function _cogPick(btn) {
    const c = state.cog, bd = c.board;
    const side = btn.dataset.side, key = btn.dataset.key;
    if (!bd.pick || bd.pick.side === side) {
      bd.pick = { side: side, key: key };
      document.querySelectorAll('.vv-cog-card').forEach(b => b.classList.toggle('vv-cog-sel', b === btn));
      _speak(btn.textContent, side);
      return;
    }
    const enKey = side === 'en' ? key : bd.pick.key;
    const esKey = side === 'es' ? key : bd.pick.key;
    if (enKey === esKey) {
      bd.matched.add(enKey);
      if (!bd.missed.has(enKey)) c.correct++;
      bd.pick = null;
      if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
      if (bd.matched.size === bd.task.pairs.length) {
        _renderCog();
        setTimeout(() => { c.idx++; c.board = null; _renderCog(); }, 1500);
        return;
      }
      _renderCog();
    } else {
      bd.missed.add(enKey);
      bd.pick = null;
      if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      const other = document.querySelector('.vv-cog-sel');
      [btn, other].forEach(b => { if (b) { b.classList.remove('vv-cog-sel'); b.classList.remove('vv-shake'); void b.offsetWidth; b.classList.add('vv-shake'); } });
    }
  }

  function _finishCog() {
    const c = state.cog;
    state.mode = 'done';
    const stars = _starsFor(c.correct, c.total);
    const pct = c.total ? Math.round(c.correct / c.total * 100) : 0;
    const prog = _loadProgress();
    prog.cogBestPct = Math.max(prog.cogBestPct || 0, pct);
    prog.cogStars = Math.max(prog.cogStars || 0, stars);
    _saveProgress(prog);
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🤝', _T('Cognates: ', 'Cognados: ') + c.correct + '/' + c.total + ' ⭐'.repeat(stars));
    }
    if (stars === 3 && typeof SFX !== 'undefined' && SFX.cheer) SFX.cheer();
    document.getElementById('vv-result').innerHTML = _resultCard(stars, c.correct, c.total, 'VocabularioVivo.openCognates()');
    _showScreen('vv-screen-result');
  }

  // ── Language toggle + nav ──
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const lbl = document.getElementById('vv-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';
    document.documentElement.lang = state.lang;
    const mode = state.mode;
    _renderHome();
    if (mode === 'roots') { _renderRootList(); _showScreen('vv-screen-roots'); }
    else if (mode === 'root' && state.rootId) _openRoot(state.rootId);
    else if (mode === 'match' && state.matchSession) { _renderMatchQuestion(); _showScreen('vv-screen-match'); }
    else if (mode === 'build') { _renderBuild(); _showScreen('vv-screen-build'); }
    else if (mode === 'dictation' && state.dictation) { _renderDictationQuestion(); _showScreen('vv-screen-dictation'); }
    else if (mode === 'spot' && state.spot) { _renderSpot(); _showScreen('vv-screen-spot'); }
    else if (mode === 'cognates' && state.cog) { _renderCog(); _showScreen('vv-screen-cognates'); }
    state.mode = mode;
  }

  function goHome() {
    state.mode = null;
    _renderHome();
  }

  // ── Init ──
  function init() {
    if (A) A.installWood();
    document.getElementById('vv-tile-roots').onclick = openRoots;
    document.getElementById('vv-tile-match').onclick = openMatch;
    document.getElementById('vv-tile-build').onclick = openBuild;
    const dictBtn = document.getElementById('vv-tile-dictation');
    if (dictBtn) dictBtn.onclick = openDictation;
    const spotBtn = document.getElementById('vv-tile-spot');
    if (spotBtn) spotBtn.onclick = openSpot;
    const cogBtn = document.getElementById('vv-tile-cog');
    if (cogBtn) cogBtn.onclick = openCognates;
    document.getElementById('vv-lang-toggle').onclick = toggleLanguage;
    document.querySelectorAll('.vv-home-btn').forEach(b => { b.onclick = goHome; });
    document.querySelectorAll('.vv-tier-filter').forEach(b => {
      b.onclick = () => filterRoots(b.dataset.tier);
    });
    _renderHome();
  }

  return {
    init, goHome,
    openRoots, openMatch, openBuild, openDictation, openSpot, openCognates, practiceBuilds,
    openRoot: _openRoot,
    backToRootList, filterRoots,
    toggleLanguage
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof VocabularioVivo !== 'undefined') VocabularioVivo.init();
});
