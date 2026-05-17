/* ================================================================
   WORLD CUP 2026 — app logic & data
   USA · CANADA · MEXICO  |  June 11 – July 19, 2026
   48 teams · 16 venues · 104 matches
   ================================================================ */
(function () {
  'use strict';

  const STORE_KEY = 'wc2026.v1';
  const TOURNAMENT_START = '2026-06-11T20:00:00-05:00';
  const TOURNAMENT_END   = '2026-07-19T15:00:00-04:00';

  /* ----------------------------------------------------------------
     VENUES — 16 host stadiums across 3 countries
     ---------------------------------------------------------------- */
  const VENUES = [
    { id:'azt', name:'Estadio Azteca (Banorte)', city:'Mexico City', country:'Mexico',
      cap:87000, opened:1966,
      notes:'Hosts the tournament opener on June 11. The only stadium ever to host two World Cup finals (1970, 1986). At 2,200m altitude, the air is thin.' },
    { id:'akr', name:'Estadio Akron',           city:'Guadalajara',  country:'Mexico',
      cap:49000, opened:2010,
      notes:'Home of Chivas. Its volcano-shaped exterior is wrapped in a green mesh that lights up at night.' },
    { id:'bbva', name:'Estadio BBVA',           city:'Monterrey',    country:'Mexico',
      cap:53500, opened:2015,
      notes:'Nicknamed "El Gigante de Acero" (the Steel Giant). Backed by views of the Cerro de la Silla mountain.' },
    { id:'met', name:'MetLife Stadium',          city:'East Rutherford, NJ', country:'United States',
      cap:82500, opened:2010,
      notes:'Hosts the World Cup Final on July 19. Shared by the NY Giants and NY Jets.' },
    { id:'sofi',name:'SoFi Stadium',             city:'Inglewood, CA',       country:'United States',
      cap:70000, opened:2020,
      notes:'A translucent canopy of ETFE plastic covers the field. Home of the LA Rams and Chargers.' },
    { id:'lev', name:'Levi\'s Stadium',          city:'Santa Clara, CA',     country:'United States',
      cap:68500, opened:2014,
      notes:'Silicon Valley\'s 49ers stadium, packed with tech. A green-roof terrace overlooks the field.' },
    { id:'lum', name:'Lumen Field',              city:'Seattle, WA',         country:'United States',
      cap:69000, opened:2002,
      notes:'Home of the Seahawks and Sounders. Famously the loudest stadium in the NFL.' },
    { id:'mer', name:'Mercedes-Benz Stadium',    city:'Atlanta, GA',         country:'United States',
      cap:71000, opened:2017,
      notes:'A retractable "pinwheel" roof petals open in 8 segments. Home of Atlanta United.' },
    { id:'hrs', name:'Hard Rock Stadium',        city:'Miami Gardens, FL',   country:'United States',
      cap:65000, opened:1987,
      notes:'Home of the Miami Dolphins and the Miami Open tennis. Hosts the 3rd-place match.' },
    { id:'nrg', name:'NRG Stadium',              city:'Houston, TX',         country:'United States',
      cap:72000, opened:2002,
      notes:'NFL\'s first retractable-roof stadium. Home of the Houston Texans.' },
    { id:'att', name:'AT&T Stadium',             city:'Arlington, TX',       country:'United States',
      cap:80000, opened:2009,
      notes:'"Jerry World" — Dallas Cowboys home with a colossal center-hung video board.' },
    { id:'arr', name:'Arrowhead Stadium',        city:'Kansas City, MO',     country:'United States',
      cap:76000, opened:1972,
      notes:'Kansas City Chiefs. NFL record for crowd noise — 142.2 dB.' },
    { id:'gil', name:'Gillette Stadium',         city:'Foxborough, MA',      country:'United States',
      cap:65000, opened:2002,
      notes:'Home of the New England Patriots and Revolution.' },
    { id:'lin', name:'Lincoln Financial Field',  city:'Philadelphia, PA',    country:'United States',
      cap:69000, opened:2003,
      notes:'"The Linc" — Philadelphia Eagles home with a notorious home crowd.' },
    { id:'bmo', name:'BMO Field',                city:'Toronto, ON',         country:'Canada',
      cap:45000, opened:2007,
      notes:'Home of Toronto FC, expanded with temporary seating for 2026.' },
    { id:'bc',  name:'BC Place',                 city:'Vancouver, BC',       country:'Canada',
      cap:54500, opened:1983,
      notes:'A retractable-roof stadium on the Vancouver waterfront, home of the Whitecaps.' },
  ];

  /* ----------------------------------------------------------------
     COUNTRIES — 48 teams.
     Group letters A–L below are EDITABLE TEMPLATES (the official 2026
     draw fills these in). The family can update groups in setup.
     ---------------------------------------------------------------- */
  const COUNTRIES = [
    /* --- CONCACAF hosts --- */
    { code:'CAN', name:'Canada',  flag:'🇨🇦', group:'A', pot:1,
      capital:'Ottawa', population:'40M', area:'9.98M km²', languages:'English, French', currency:'Canadian dollar (CAD)',
      geography:'The world\'s second-largest country by area, stretching from the Atlantic to the Pacific to the Arctic. Home to the Rockies, the Great Lakes, and vast boreal forests.',
      history:'Confederated in 1867, Canada grew from French and British colonies into a bilingual federation. It became fully sovereign with the Constitution Act of 1982.',
      funFacts:['Has more lakes than the rest of the world combined','The longest coastline of any country (>200,000 km)','Hockey, lacrosse, and curling are deeply ingrained in culture'],
      wc:{ appearances:2, best:'Group stage (1986, 2022)', titles:0 },
      stars:[
        { name:'Alphonso Davies',     pos:'LB',  club:'Bayern Munich',     age:25, note:'Born in a Ghanaian refugee camp; one of the fastest players in world football.' },
        { name:'Jonathan David',      pos:'ST',  club:'Juventus',          age:26, note:'Canada\'s record scorer, clinical in front of goal.' },
        { name:'Stephen Eustáquio',   pos:'CM',  club:'FC Porto',          age:29, note:'Metronomic Portuguese-born midfielder.' },
        { name:'Tajon Buchanan',      pos:'RW',  club:'Inter Milan',       age:27, note:'Pacey wide attacker.' },
        { name:'Cyle Larin',          pos:'ST',  club:'Mallorca',          age:31, note:'Aerial threat and second-top scorer in Canada history.' },
      ]
    },
    { code:'MEX', name:'Mexico',  flag:'🇲🇽', group:'A', pot:1,
      capital:'Mexico City', population:'129M', area:'1.96M km²', languages:'Spanish (plus 68 indigenous)', currency:'Mexican peso (MXN)',
      geography:'A bridge between North and Central America, with deserts in the north, jungles in the south, and the Sierra Madre running down both sides. Two long coastlines.',
      history:'Home to the Maya and Aztec civilizations; conquered by Spain in 1521, independent in 1821. The 1910 Revolution shaped its modern identity.',
      funFacts:['Hosts more World Cup matches in history than any country','Mexico City sits at 2,240 m altitude','Chocolate, vanilla, corn, and tomato all originated here'],
      wc:{ appearances:17, best:'Quarterfinals (1970, 1986)', titles:0 },
      stars:[
        { name:'Hirving "Chucky" Lozano', pos:'LW', club:'San Diego FC',   age:30, note:'Quick, direct winger and tournament veteran.' },
        { name:'Edson Álvarez',           pos:'CDM',club:'West Ham',       age:28, note:'Ball-winning captain in midfield.' },
        { name:'Santiago Giménez',        pos:'ST', club:'AC Milan',       age:25, note:'Inheritor of the Mexican #9 shirt.' },
        { name:'Guillermo Ochoa',         pos:'GK', club:'AVS',            age:40, note:'Legendary 6-time World Cup goalkeeper.' },
        { name:'César Montes',            pos:'CB', club:'Lokomotiv',      age:28, note:'Towering centre-back.' },
        { name:'Luis Chávez',             pos:'CM', club:'Dynamo Moscow',  age:30, note:'Scored a 30-yard free kick at Qatar 2022.' },
      ]
    },
    { code:'USA', name:'United States', flag:'🇺🇸', group:'D', pot:1,
      capital:'Washington, D.C.', population:'335M', area:'9.83M km²', languages:'English (de facto)', currency:'US dollar (USD)',
      geography:'A continental country with mountains, plains, deserts, swamps, and two ocean coasts. From Death Valley to Mt. McKinley/Denali, the geographic variety is enormous.',
      history:'Declared independence from Britain in 1776. A constitutional federal republic shaped by westward expansion, civil war, and immigration.',
      funFacts:['Co-hosting its second World Cup (after 1994)','Has 63 national parks','English-football MLS now has 30 teams'],
      wc:{ appearances:11, best:'3rd place (1930)', titles:0 },
      stars:[
        { name:'Christian Pulisic', pos:'AM', club:'AC Milan',        age:27, note:'"Captain America" — creative talisman.' },
        { name:'Weston McKennie',   pos:'CM', club:'Juventus',        age:27, note:'Box-to-box engine.' },
        { name:'Tyler Adams',       pos:'CDM',club:'Bournemouth',     age:27, note:'Composed defensive midfielder, USMNT captain.' },
        { name:'Gio Reyna',         pos:'AM', club:'Borussia M\'gladbach', age:23, note:'Technically gifted #10 in the prime of his career.' },
        { name:'Folarin Balogun',   pos:'ST', club:'Monaco',          age:24, note:'Switched from England to lead the line.' },
        { name:'Matt Turner',       pos:'GK', club:'Crystal Palace',  age:31, note:'Late-blooming No.1.' },
      ]
    },

    /* --- CONMEBOL --- */
    { code:'ARG', name:'Argentina', flag:'🇦🇷', group:'B', pot:1,
      capital:'Buenos Aires', population:'46M', area:'2.78M km²', languages:'Spanish', currency:'Argentine peso (ARS)',
      geography:'From subtropical Iguazú falls to Patagonian glaciers, Argentina covers nearly the whole length of South America. The Pampas grasslands feed millions of cattle.',
      history:'Independent from Spain in 1816, shaped by waves of European immigration. Tango was born in the ports of Buenos Aires.',
      funFacts:['Defending world champions (Qatar 2022)','Birthplace of Maradona and Messi','Eats the most beef per capita in the world'],
      wc:{ appearances:18, best:'Champions (1978, 1986, 2022)', titles:3 },
      stars:[
        { name:'Lionel Messi',       pos:'RW/AM', club:'Inter Miami',  age:38, note:'Eight Ballons d\'Or, the 2022 champion, and likely his last World Cup.' },
        { name:'Lautaro Martínez',   pos:'ST',    club:'Inter Milan',  age:28, note:'Captain-in-waiting and prolific finisher.' },
        { name:'Julián Álvarez',     pos:'ST',    club:'Atlético Madrid', age:26, note:'Quick, intelligent forward.' },
        { name:'Enzo Fernández',     pos:'CM',    club:'Chelsea',      age:25, note:'2022 Young Player of the Tournament.' },
        { name:'Cristian Romero',    pos:'CB',    club:'Tottenham',    age:28, note:'"Cuti" — fearsome, ball-playing defender.' },
        { name:'Emiliano Martínez',  pos:'GK',    club:'Aston Villa',  age:33, note:'Penalty-shootout specialist nicknamed "Dibu".' },
      ]
    },
    { code:'BRA', name:'Brazil', flag:'🇧🇷', group:'C', pot:1,
      capital:'Brasília', population:'215M', area:'8.51M km²', languages:'Portuguese', currency:'Brazilian real (BRL)',
      geography:'The largest country in South America, holding most of the Amazon rainforest. Long Atlantic coastline; the Iguaçu Falls; vast cerrado savannah.',
      history:'A Portuguese colony from 1500, independent in 1822, a republic since 1889. Slavery left a deep mark; Afro-Brazilian culture defines its music and food.',
      funFacts:['Five-time world champion — more than any country','Football born in São Paulo in 1894 thanks to Charles Miller','The Amazon produces 20% of the world\'s oxygen'],
      wc:{ appearances:22, best:'Champions ×5 (1958, 62, 70, 94, 02)', titles:5 },
      stars:[
        { name:'Vinícius Júnior', pos:'LW', club:'Real Madrid', age:25, note:'Electric left winger, two-footed nightmare.' },
        { name:'Rodrygo',         pos:'RW', club:'Real Madrid', age:25, note:'Calm finisher in big moments.' },
        { name:'Endrick',         pos:'ST', club:'Real Madrid', age:19, note:'The teenage No.9 of Brazil\'s future.' },
        { name:'Bruno Guimarães', pos:'CM', club:'Newcastle',   age:28, note:'All-action midfield engine.' },
        { name:'Marquinhos',      pos:'CB', club:'PSG',         age:31, note:'Captain and rock at the back.' },
        { name:'Alisson Becker',  pos:'GK', club:'Liverpool',   age:33, note:'Among the world\'s best goalkeepers.' },
      ]
    },
    { code:'URU', name:'Uruguay', flag:'🇺🇾', group:'E', pot:2,
      capital:'Montevideo', population:'3.5M', area:'176,000 km²', languages:'Spanish', currency:'Uruguayan peso (UYU)',
      geography:'Small, flat, and Atlantic-facing. Rolling pampas, sandy beaches, and the wide Río de la Plata estuary.',
      history:'Independent in 1825, sandwiched between Brazil and Argentina. Famous for an early progressive welfare state and a deep football tradition.',
      funFacts:['Hosted and won the first World Cup in 1930','For its size, no country has produced more football per capita','Beef and yerba mate are national obsessions'],
      wc:{ appearances:14, best:'Champions (1930, 1950)', titles:2 },
      stars:[
        { name:'Federico Valverde', pos:'CM', club:'Real Madrid',   age:27, note:'Rampaging midfielder with a missile of a shot.' },
        { name:'Darwin Núñez',      pos:'ST', club:'Al-Hilal',      age:26, note:'Powerful, direct centre-forward.' },
        { name:'Ronald Araújo',     pos:'CB', club:'Barcelona',     age:27, note:'Imposing modern centre-back.' },
        { name:'Manuel Ugarte',     pos:'CDM',club:'Manchester Utd',age:24, note:'Combative ball-winner.' },
        { name:'Maximiliano Araújo',pos:'LW', club:'Sporting CP',   age:25, note:'Bursting on the scene as a creator.' },
      ]
    },
    { code:'COL', name:'Colombia', flag:'🇨🇴', group:'F', pot:2,
      capital:'Bogotá', population:'52M', area:'1.14M km²', languages:'Spanish', currency:'Colombian peso (COP)',
      geography:'The only South American country with both Atlantic (Caribbean) and Pacific coasts. The Andes split into three ranges here; the Amazon stretches south.',
      history:'Independent from Spain in 1810. Coffee, emeralds, and a long post-conflict recovery shape the modern republic.',
      funFacts:['World\'s 2nd most biodiverse country','Produces some of the world\'s finest coffee','Cumbia and salsa are national rhythms'],
      wc:{ appearances:6, best:'Quarterfinals (2014)', titles:0 },
      stars:[
        { name:'Luis Díaz',          pos:'LW', club:'Bayern Munich', age:28, note:'Direct, hard-running left winger.' },
        { name:'James Rodríguez',    pos:'AM', club:'Club León',     age:34, note:'The Golden-Boot winner of 2014, still pulling strings.' },
        { name:'Richard Ríos',       pos:'CM', club:'Benfica',       age:25, note:'Tough, technical midfielder.' },
        { name:'Jhon Durán',         pos:'ST', club:'Al-Nassr',      age:22, note:'Explosive young striker.' },
        { name:'Daniel Muñoz',       pos:'RB', club:'Crystal Palace',age:29, note:'Marauding right-back.' },
      ]
    },
    { code:'ECU', name:'Ecuador', flag:'🇪🇨', group:'G', pot:3,
      capital:'Quito', population:'18M', area:'283,000 km²', languages:'Spanish, Kichwa', currency:'US dollar (USD)',
      geography:'Straddles the equator (the country\'s name). From Andes peaks and Amazon jungle to the Galápagos Islands.',
      history:'Independent in 1822 as part of Gran Colombia; a separate republic from 1830. Adopted the US dollar in 2000.',
      funFacts:['The Galápagos inspired Darwin\'s theory of evolution','Quito is the highest capital city near the equator','Cacao originated in the Ecuadorian Amazon'],
      wc:{ appearances:4, best:'Round of 16 (2006)', titles:0 },
      stars:[
        { name:'Moisés Caicedo',  pos:'CDM',club:'Chelsea',     age:24, note:'Dominant ball-winning midfielder.' },
        { name:'Pervis Estupiñán',pos:'LB', club:'AC Milan',    age:27, note:'Attacking, set-piece-skilled fullback.' },
        { name:'Piero Hincapié', pos:'CB', club:'Arsenal',      age:24, note:'Left-footed defender, calm on the ball.' },
        { name:'Kendry Páez',    pos:'AM', club:'Chelsea',      age:19, note:'Teenage creator labelled the next big star.' },
      ]
    },
    { code:'PAR', name:'Paraguay', flag:'🇵🇾', group:'H', pot:3,
      capital:'Asunción', population:'7M', area:'407,000 km²', languages:'Spanish, Guaraní', currency:'Guaraní (PYG)',
      geography:'Landlocked in the heart of South America. The Paraguay river splits Chaco scrubland from greener eastern hills.',
      history:'Independent in 1811. Endured the brutal 1864–70 War of the Triple Alliance and a long 20th-century dictatorship.',
      funFacts:['One of the few officially bilingual countries (Spanish + Guaraní)','Itaipú is one of the world\'s largest hydro dams','Tereré (cold mate) is the national drink'],
      wc:{ appearances:9, best:'Quarterfinals (2010)', titles:0 },
      stars:[
        { name:'Miguel Almirón',     pos:'AM', club:'Atlanta United', age:31, note:'Quick, hard-running playmaker.' },
        { name:'Diego Gómez',        pos:'CM', club:'Brighton',       age:23, note:'Box-to-box runner.' },
        { name:'Antonio Sanabria',   pos:'ST', club:'Torino',         age:29, note:'Experienced striker.' },
        { name:'Gustavo Gómez',      pos:'CB', club:'Palmeiras',      age:32, note:'Captain at the back.' },
      ]
    },
    { code:'BOL', name:'Bolivia', flag:'🇧🇴', group:'I', pot:4,
      capital:'Sucre / La Paz', population:'12M', area:'1.10M km²', languages:'Spanish, Quechua, Aymara', currency:'Boliviano (BOB)',
      geography:'High-altitude Andes give way to Amazon lowlands. La Paz is the world\'s highest administrative capital at 3,640 m.',
      history:'Independent in 1825, named after Simón Bolívar. Rich in lithium, tin, and silver — Potosí once funded Spain\'s empire.',
      funFacts:['Lake Titicaca, the highest large navigable lake in the world','Salar de Uyuni: the world\'s largest salt flat','Three official capitals depending on how you count'],
      wc:{ appearances:3, best:'Group stage', titles:0 },
      stars:[
        { name:'Marcelo Moreno Martins', pos:'ST', club:'Always Ready',    age:38, note:'Veteran top scorer in national history.' },
        { name:'Miguel Terceros',        pos:'AM', club:'Santos',          age:21, note:'Young attacking talent.' },
        { name:'Roberto Carlos Fernández', pos:'GK', club:'Bolívar',       age:27, note:'Reliable national keeper.' },
      ]
    },

    /* --- UEFA (Europe) --- */
    { code:'FRA', name:'France', flag:'🇫🇷', group:'B', pot:1,
      capital:'Paris', population:'68M', area:'544,000 km²', languages:'French', currency:'Euro (EUR)',
      geography:'From Mediterranean beaches to Alpine peaks, from Atlantic surf to wine-country plains. Six neighbours.',
      history:'A republic since the 1789 Revolution. The Fifth Republic, founded by de Gaulle in 1958, governs today.',
      funFacts:['World\'s most-visited country','Two-time recent finalist (Champions 2018, runners-up 2022)','Home of the metric system'],
      wc:{ appearances:17, best:'Champions (1998, 2018)', titles:2 },
      stars:[
        { name:'Kylian Mbappé',    pos:'ST/LW', club:'Real Madrid',   age:27, note:'Sensational pace; already has 3 World Cup final goals.' },
        { name:'Aurélien Tchouaméni', pos:'CDM', club:'Real Madrid',  age:26, note:'Anchor of midfield.' },
        { name:'Antoine Griezmann',pos:'AM',    club:'Atlético Madrid', age:35, note:'France\'s most-capped attacker in the modern era.' },
        { name:'William Saliba',   pos:'CB',    club:'Arsenal',       age:25, note:'Cool, modern centre-back.' },
        { name:'Theo Hernández',   pos:'LB',    club:'Al-Hilal',      age:28, note:'Powerful overlapping fullback.' },
      ]
    },
    { code:'ENG', name:'England', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', group:'C', pot:1,
      capital:'London', population:'56M (England) / 67M (UK)', area:'130,000 km² (England)', languages:'English', currency:'Pound sterling (GBP)',
      geography:'Rolling chalk downs, moors, and a long coastline. Highest point Scafell Pike (978m). Crossed by the Thames, Severn, and Mersey.',
      history:'United with Wales in 1536, with Scotland in 1707. Birthplace of modern football — codified at the Football Association in 1863.',
      funFacts:['Invented modern football','Wembley Stadium has hosted 7 European finals','The Premier League is the world\'s richest league'],
      wc:{ appearances:16, best:'Champions (1966)', titles:1 },
      stars:[
        { name:'Jude Bellingham', pos:'AM', club:'Real Madrid',    age:22, note:'Modern complete midfielder.' },
        { name:'Harry Kane',      pos:'ST', club:'Bayern Munich',  age:32, note:'England\'s all-time top scorer.' },
        { name:'Bukayo Saka',     pos:'RW', club:'Arsenal',        age:24, note:'Direct, creative wide forward.' },
        { name:'Phil Foden',      pos:'AM', club:'Man City',       age:25, note:'Two-footed playmaker.' },
        { name:'Declan Rice',     pos:'CM', club:'Arsenal',        age:27, note:'England\'s midfield captain.' },
        { name:'Cole Palmer',     pos:'AM', club:'Chelsea',        age:23, note:'Ice-cold finisher and creator.' },
      ]
    },
    { code:'ESP', name:'Spain', flag:'🇪🇸', group:'D', pot:1,
      capital:'Madrid', population:'48M', area:'506,000 km²', languages:'Spanish (Castilian), Catalan, Galician, Basque', currency:'Euro (EUR)',
      geography:'Iberian Peninsula plus the Canary and Balearic islands. The Meseta plateau dominates the interior; mountains in north and south.',
      history:'A union of Castile and Aragon in 1469; explorers crossed the Atlantic. Modern democracy since 1978.',
      funFacts:['Reigning European champions (2024) and 2010 world champions','Has 49 UNESCO World Heritage Sites','Siesta and tapas are real cultural staples'],
      wc:{ appearances:16, best:'Champions (2010)', titles:1 },
      stars:[
        { name:'Lamine Yamal',      pos:'RW', club:'Barcelona',   age:18, note:'A generational left-footed winger.' },
        { name:'Rodri',             pos:'CDM',club:'Man City',    age:29, note:'Ballon d\'Or winner; controls every game he plays.' },
        { name:'Nico Williams',     pos:'LW', club:'Barcelona',   age:23, note:'Pacey, fearless on the dribble.' },
        { name:'Pedri',             pos:'CM', club:'Barcelona',   age:23, note:'Press-resistant midfielder.' },
        { name:'Álvaro Morata',     pos:'ST', club:'Galatasaray', age:33, note:'Veteran captain in attack.' },
      ]
    },
    { code:'GER', name:'Germany', flag:'🇩🇪', group:'E', pot:1,
      capital:'Berlin', population:'84M', area:'358,000 km²', languages:'German', currency:'Euro (EUR)',
      geography:'Bordered by 9 countries. Alps in the south, North Sea and Baltic coasts up top, the Rhine and Danube cutting across.',
      history:'Unified in 1871; divided 1949–1990; reunified after the fall of the Berlin Wall. Powerhouse of the European Union.',
      funFacts:['Most successful European nation at the World Cup (4 titles)','Invented the printing press (Gutenberg)','Home of the Autobahn — sections still have no speed limit'],
      wc:{ appearances:21, best:'Champions ×4 (1954, 74, 90, 2014)', titles:4 },
      stars:[
        { name:'Florian Wirtz',     pos:'AM', club:'Liverpool',     age:23, note:'Silky creator at the top of midfield.' },
        { name:'Jamal Musiala',     pos:'AM', club:'Bayern Munich', age:23, note:'Mesmeric dribbler.' },
        { name:'Kai Havertz',       pos:'ST', club:'Arsenal',       age:27, note:'Versatile forward.' },
        { name:'Joshua Kimmich',    pos:'CM/RB', club:'Bayern Munich', age:31, note:'Captain, leader, every-position player.' },
        { name:'Antonio Rüdiger',   pos:'CB', club:'Real Madrid',   age:33, note:'Aggressive, vocal defender.' },
      ]
    },
    { code:'POR', name:'Portugal', flag:'🇵🇹', group:'F', pot:1,
      capital:'Lisbon', population:'10M', area:'92,000 km²', languages:'Portuguese', currency:'Euro (EUR)',
      geography:'Westernmost European country, a long Atlantic coastline, plus the Azores and Madeira islands.',
      history:'A continuous nation since 1143. Led the Age of Discoveries — first to round Africa and reach India and Brazil.',
      funFacts:['Oldest borders in Europe (since 1297)','Fado music is UNESCO heritage','Portuguese is spoken by ~260M people worldwide'],
      wc:{ appearances:9, best:'3rd place (1966)', titles:0 },
      stars:[
        { name:'Cristiano Ronaldo', pos:'ST', club:'Al-Nassr',      age:41, note:'All-time top international scorer; record sixth World Cup.' },
        { name:'Bruno Fernandes',   pos:'AM', club:'Manchester Utd', age:31, note:'Captain and creative engine.' },
        { name:'Bernardo Silva',    pos:'AM', club:'Man City',      age:31, note:'Technically gifted glue player.' },
        { name:'Rúben Dias',        pos:'CB', club:'Man City',      age:28, note:'Defensive leader.' },
        { name:'Vitinha',           pos:'CM', club:'PSG',           age:26, note:'Press-resistant orchestrator.' },
        { name:'Rafael Leão',       pos:'LW', club:'AC Milan',      age:26, note:'Direct, devastating in transition.' },
      ]
    },
    { code:'NED', name:'Netherlands', flag:'🇳🇱', group:'G', pot:1,
      capital:'Amsterdam', population:'17.9M', area:'42,000 km²', languages:'Dutch', currency:'Euro (EUR)',
      geography:'Mostly below sea level, defended by dikes and reclaimed polders. The Rhine, Meuse, and Scheldt rivers fan out to the sea.',
      history:'Independent from Spain in 1648, a global trading power in the 17th century. A constitutional monarchy today.',
      funFacts:['"Total Football" revolutionised the sport in the 1970s','More bicycles than people','One third of the country is below sea level'],
      wc:{ appearances:11, best:'Runners-up (1974, 78, 2010)', titles:0 },
      stars:[
        { name:'Virgil van Dijk',     pos:'CB', club:'Liverpool',     age:34, note:'Captain and defensive leader.' },
        { name:'Cody Gakpo',          pos:'LW/ST', club:'Liverpool',  age:26, note:'Powerful left-footed forward.' },
        { name:'Memphis Depay',       pos:'ST', club:'Corinthians',   age:32, note:'Veteran goal-scorer.' },
        { name:'Frenkie de Jong',     pos:'CM', club:'Barcelona',     age:28, note:'Press-breaking midfielder.' },
        { name:'Xavi Simons',         pos:'AM', club:'Tottenham',     age:22, note:'Creative young attacker.' },
      ]
    },
    { code:'BEL', name:'Belgium', flag:'🇧🇪', group:'H', pot:1,
      capital:'Brussels', population:'11.6M', area:'30,500 km²', languages:'Dutch, French, German', currency:'Euro (EUR)',
      geography:'Tiny, dense, and flat to gently rolling. Split between Flemish north and French-speaking Wallonia.',
      history:'Independent in 1830. Brussels hosts the European Union and NATO.',
      funFacts:['Invented French fries (the Belgians insist)','World capital of comic books — Tintin, Smurfs','Has more castles per km² than any country'],
      wc:{ appearances:14, best:'3rd place (2018)', titles:0 },
      stars:[
        { name:'Kevin De Bruyne',  pos:'AM', club:'Napoli',         age:34, note:'World-class playmaker.' },
        { name:'Romelu Lukaku',    pos:'ST', club:'Napoli',         age:32, note:'Belgium\'s all-time top scorer.' },
        { name:'Jérémy Doku',      pos:'LW', club:'Man City',       age:23, note:'Devastating one-v-one dribbler.' },
        { name:'Amadou Onana',     pos:'CM', club:'Aston Villa',    age:24, note:'Tall, athletic midfielder.' },
        { name:'Thibaut Courtois', pos:'GK', club:'Real Madrid',    age:33, note:'Among the world\'s best keepers.' },
      ]
    },
    { code:'ITA', name:'Italy', flag:'🇮🇹', group:'I', pot:2,
      capital:'Rome', population:'59M', area:'301,000 km²', languages:'Italian', currency:'Euro (EUR)',
      geography:'A boot-shaped peninsula plus Sicily and Sardinia. Alps in the north, the Apennines down the spine, three seas around it.',
      history:'Unified in 1861. A republic since 1946. Cradle of the Roman Empire and the Renaissance.',
      funFacts:['Four-time world champion','Has more UNESCO sites than any country','Espresso, pizza, and opera all originated here'],
      wc:{ appearances:18, best:'Champions ×4 (1934, 38, 82, 2006)', titles:4 },
      stars:[
        { name:'Nicolò Barella',   pos:'CM', club:'Inter Milan',  age:29, note:'Energetic complete midfielder.' },
        { name:'Federico Chiesa',  pos:'RW', club:'Liverpool',    age:28, note:'Pacey, two-footed forward.' },
        { name:'Gianluigi Donnarumma', pos:'GK', club:'Man City', age:27, note:'Towering keeper.' },
        { name:'Alessandro Bastoni', pos:'CB', club:'Inter Milan', age:26, note:'Left-footed ball-playing defender.' },
        { name:'Mateo Retegui',    pos:'ST', club:'Atalanta',     age:26, note:'Argentine-born goal-scorer.' },
      ]
    },
    { code:'CRO', name:'Croatia', flag:'🇭🇷', group:'J', pot:2,
      capital:'Zagreb', population:'3.9M', area:'56,000 km²', languages:'Croatian', currency:'Euro (EUR)',
      geography:'Crescent-shaped along the Adriatic with more than 1,000 islands. The Dinaric Alps rise just inland.',
      history:'Part of Yugoslavia until 1991; independent after a four-year war. Joined the EU in 2013.',
      funFacts:['The necktie ("cravat") was invented here','Beat Argentina to reach the 2018 final','Stunning UNESCO old towns: Dubrovnik, Split'],
      wc:{ appearances:6, best:'Runners-up (2018), 3rd (2022)', titles:0 },
      stars:[
        { name:'Luka Modrić',     pos:'CM', club:'AC Milan',  age:40, note:'2018 Ballon d\'Or; midfield maestro.' },
        { name:'Joško Gvardiol',  pos:'CB/LB', club:'Man City', age:24, note:'Modern attacking defender.' },
        { name:'Mateo Kovačić',   pos:'CM', club:'Man City',  age:31, note:'Glue midfielder.' },
        { name:'Andrej Kramarić', pos:'ST', club:'Hoffenheim', age:34, note:'Veteran goal-scorer.' },
      ]
    },
    { code:'SUI', name:'Switzerland', flag:'🇨🇭', group:'K', pot:2,
      capital:'Bern', population:'8.8M', area:'41,000 km²', languages:'German, French, Italian, Romansh', currency:'Swiss franc (CHF)',
      geography:'Alpine heart of Europe. The Rhine and Rhône rivers both start here.',
      history:'A confederation since 1291 — one of the oldest in the world. Famously neutral.',
      funFacts:['Four official languages','Direct democracy by national referendum','Birthplace of FIFA (1904, Zürich)'],
      wc:{ appearances:12, best:'Quarterfinals (1934, 38, 54)', titles:0 },
      stars:[
        { name:'Granit Xhaka',     pos:'CM', club:'Bayer Leverkusen', age:33, note:'Captain and midfield leader.' },
        { name:'Manuel Akanji',    pos:'CB', club:'Man City',         age:30, note:'Calm modern centre-back.' },
        { name:'Breel Embolo',     pos:'ST', club:'Monaco',           age:28, note:'Physical forward.' },
        { name:'Yann Sommer',      pos:'GK', club:'Inter Milan',      age:37, note:'Reflex shot-stopper.' },
      ]
    },
    { code:'DEN', name:'Denmark', flag:'🇩🇰', group:'L', pot:2,
      capital:'Copenhagen', population:'5.9M', area:'43,000 km²', languages:'Danish', currency:'Danish krone (DKK)',
      geography:'A peninsula plus 400+ islands between the North and Baltic seas. Flat, with the highest point under 200m.',
      history:'The world\'s oldest continuously running monarchy. Vikings sailed from here a millennium ago.',
      funFacts:['"Hygge" is the famous cozy lifestyle word','LEGO was invented in Billund','Has the oldest national flag in the world (Dannebrog)'],
      wc:{ appearances:6, best:'Quarterfinals (1998)', titles:0 },
      stars:[
        { name:'Christian Eriksen', pos:'AM', club:'Wolfsburg',       age:34, note:'Free-kick specialist and captain.' },
        { name:'Rasmus Højlund',    pos:'ST', club:'Napoli',          age:23, note:'Powerful young centre-forward.' },
        { name:'Andreas Christensen', pos:'CB', club:'Bayer Leverkusen', age:30, note:'Ball-playing defender.' },
        { name:'Pierre-Emile Højbjerg', pos:'CM', club:'Marseille',   age:30, note:'Combative midfielder.' },
      ]
    },
    { code:'AUT', name:'Austria', flag:'🇦🇹', group:'A', pot:2,
      capital:'Vienna', population:'9.1M', area:'84,000 km²', languages:'German', currency:'Euro (EUR)',
      geography:'Alpine, landlocked, drained by the Danube. Six of seven federal-state capitals lie along it.',
      history:'Heart of the Habsburg Empire until 1918. A federal republic and EU member.',
      funFacts:['Birthplace of Mozart, Freud, and the Sound of Music','Vienna often tops "most liveable city" rankings','Strudel and schnitzel are national dishes'],
      wc:{ appearances:8, best:'3rd place (1954)', titles:0 },
      stars:[
        { name:'David Alaba',      pos:'CB/LB', club:'Real Madrid',  age:33, note:'Versatile, classy leader.' },
        { name:'Marcel Sabitzer',  pos:'CM', club:'Borussia Dortmund', age:32, note:'Long-range threat.' },
        { name:'Marko Arnautović', pos:'ST', club:'Inter Milan',    age:37, note:'Veteran forward.' },
        { name:'Konrad Laimer',    pos:'CM', club:'Bayern Munich',  age:28, note:'Ball-winning runner.' },
      ]
    },
    { code:'POL', name:'Poland', flag:'🇵🇱', group:'B', pot:2,
      capital:'Warsaw', population:'37M', area:'313,000 km²', languages:'Polish', currency:'Złoty (PLN)',
      geography:'Wide central-European plain, Baltic coastline to the north, Tatra Mountains to the south.',
      history:'Once Europe\'s largest country in the 1600s. Erased from the map 1795–1918. Joined the EU in 2004.',
      funFacts:['Marie Curie was born in Warsaw','Has 23 national parks','Pierogi: 200+ recognised varieties'],
      wc:{ appearances:9, best:'3rd place (1974, 1982)', titles:0 },
      stars:[
        { name:'Robert Lewandowski', pos:'ST', club:'Barcelona',    age:37, note:'One of the great strikers of his era.' },
        { name:'Piotr Zieliński',    pos:'CM', club:'Inter Milan',  age:31, note:'Technical midfielder.' },
        { name:'Nicola Zalewski',    pos:'LW', club:'Inter Milan',  age:24, note:'Two-footed wide player.' },
        { name:'Wojciech Szczęsny',  pos:'GK', club:'Barcelona',    age:35, note:'Experienced No.1.' },
      ]
    },
    { code:'TUR', name:'Türkiye (Turkey)', flag:'🇹🇷', group:'C', pot:2,
      capital:'Ankara', population:'85M', area:'784,000 km²', languages:'Turkish', currency:'Turkish lira (TRY)',
      geography:'Bridges Europe and Asia across the Bosphorus. Black Sea, Aegean, Mediterranean coasts; the Anatolian plateau in between.',
      history:'Founded as a republic in 1923 by Atatürk from the ruins of the Ottoman Empire.',
      funFacts:['Istanbul is the only city on two continents','Hagia Sophia is 1,500 years old','Turkish coffee is UNESCO heritage'],
      wc:{ appearances:2, best:'3rd place (2002)', titles:0 },
      stars:[
        { name:'Hakan Çalhanoğlu',  pos:'CM', club:'Inter Milan',  age:32, note:'Set-piece magician.' },
        { name:'Arda Güler',        pos:'AM', club:'Real Madrid',  age:21, note:'Silky left-footed creator.' },
        { name:'Kenan Yıldız',      pos:'AM', club:'Juventus',     age:21, note:'Two-footed playmaker.' },
        { name:'Merih Demiral',     pos:'CB', club:'Al-Ahli',      age:28, note:'Aggressive defender.' },
      ]
    },
    { code:'HUN', name:'Hungary', flag:'🇭🇺', group:'D', pot:3,
      capital:'Budapest', population:'9.6M', area:'93,000 km²', languages:'Hungarian', currency:'Forint (HUF)',
      geography:'A landlocked Carpathian-basin country crossed by the Danube and Tisza. Lake Balaton is central Europe\'s biggest lake.',
      history:'A magyar kingdom since the year 1000; an EU member since 2004.',
      funFacts:['The "Mighty Magyars" thrashed England 6-3 at Wembley in 1953','Rubik\'s Cube invented here in 1974','Goulash and paprika are national symbols'],
      wc:{ appearances:9, best:'Runners-up (1938, 1954)', titles:0 },
      stars:[
        { name:'Dominik Szoboszlai', pos:'AM', club:'Liverpool',   age:25, note:'Captain and creative leader.' },
        { name:'Milos Kerkez',       pos:'LB', club:'Liverpool',   age:22, note:'Energetic young fullback.' },
        { name:'Roland Sallai',      pos:'RW', club:'Galatasaray', age:28, note:'Direct winger.' },
      ]
    },
    { code:'SRB', name:'Serbia', flag:'🇷🇸', group:'E', pot:3,
      capital:'Belgrade', population:'6.7M', area:'77,000 km²', languages:'Serbian', currency:'Serbian dinar (RSD)',
      geography:'Landlocked Balkans, divided by the Danube. Fertile Vojvodina plains in the north; mountains in the south.',
      history:'A medieval kingdom; led Yugoslavia until its 1990s breakup. Independent (with Montenegro) in 2006.',
      funFacts:['Birthplace of Nikola Tesla (born in modern Croatia, Serb father)','Belgrade sits at the confluence of two great rivers','Rakija is the national spirit'],
      wc:{ appearances:13, best:'4th place (1930, 62 as Yugoslavia)', titles:0 },
      stars:[
        { name:'Aleksandar Mitrović', pos:'ST', club:'Al-Hilal',   age:31, note:'Powerful goal-scorer.' },
        { name:'Dušan Vlahović',      pos:'ST', club:'Juventus',   age:26, note:'Tall, physical striker.' },
        { name:'Dušan Tadić',         pos:'AM', club:'Al-Wahda',   age:37, note:'Veteran captain.' },
        { name:'Sergej Milinković-Savić', pos:'CM', club:'Al-Hilal', age:31, note:'Towering midfielder.' },
      ]
    },
    { code:'NOR', name:'Norway', flag:'🇳🇴', group:'F', pot:3,
      capital:'Oslo', population:'5.5M', area:'385,000 km²', languages:'Norwegian', currency:'Norwegian krone (NOK)',
      geography:'Long, narrow, fjord-carved Atlantic coast. The northernmost mainland in Europe; the midnight sun shines all summer above the Arctic Circle.',
      history:'Independent from Sweden in 1905. One of the world\'s wealthiest countries via North Sea oil and a $1.6T sovereign wealth fund.',
      funFacts:['Has won the most Winter Olympic medals ever','Hosts the Nobel Peace Prize','First WC appearance since 1998'],
      wc:{ appearances:3, best:'Round of 16 (1998)', titles:0 },
      stars:[
        { name:'Erling Haaland',     pos:'ST', club:'Man City',         age:25, note:'Generational goal-scorer.' },
        { name:'Martin Ødegaard',    pos:'AM', club:'Arsenal',          age:27, note:'Captain and creative hub.' },
        { name:'Alexander Sørloth',  pos:'ST', club:'Atlético Madrid',  age:30, note:'Powerful target man.' },
        { name:'Antonio Nusa',       pos:'LW', club:'RB Leipzig',       age:20, note:'Exciting young winger.' },
      ]
    },
    { code:'CZE', name:'Czech Republic', flag:'🇨🇿', group:'G', pot:3,
      capital:'Prague', population:'10.7M', area:'79,000 km²', languages:'Czech', currency:'Czech koruna (CZK)',
      geography:'Landlocked central Europe — Bohemia in the west, Moravia in the east. Rolling forests, rivers, and the Bohemian Massif.',
      history:'Part of the Habsburg Empire until 1918; split peacefully from Slovakia in 1993.',
      funFacts:['Consumes the most beer per capita on earth','Charles Bridge dates to 1357','Prague is one of Europe\'s best-preserved medieval cities'],
      wc:{ appearances:10, best:'Runners-up (1934, 62 as Czechoslovakia)', titles:0 },
      stars:[
        { name:'Patrik Schick',     pos:'ST', club:'Bayer Leverkusen', age:30, note:'Tall, technical striker.' },
        { name:'Tomáš Souček',      pos:'CM', club:'West Ham',         age:31, note:'Box-to-box runner.' },
        { name:'Adam Hložek',       pos:'AM', club:'Hoffenheim',       age:23, note:'Versatile attacker.' },
      ]
    },
    { code:'SCO', name:'Scotland', flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', group:'H', pot:3,
      capital:'Edinburgh', population:'5.5M', area:'78,000 km²', languages:'English, Scots, Scottish Gaelic', currency:'Pound sterling (GBP)',
      geography:'Highlands in the north, Lowlands in the south, 790 islands. Crossed by Loch Ness and Loch Lomond.',
      history:'Joined with England by the Acts of Union in 1707. The Scottish FA, founded 1873, is the second oldest in the world.',
      funFacts:['Invented modern golf','Bagpipes, kilts, whisky','Played the first international match (vs England, 1872)'],
      wc:{ appearances:8, best:'Group stage', titles:0 },
      stars:[
        { name:'Andrew Robertson',  pos:'LB', club:'Liverpool',  age:31, note:'Captain and overlapping fullback.' },
        { name:'Scott McTominay',   pos:'CM', club:'Napoli',     age:28, note:'Goal-scoring midfielder.' },
        { name:'John McGinn',       pos:'AM', club:'Aston Villa',age:31, note:'Energetic midfielder.' },
        { name:'Kieran Tierney',    pos:'LB', club:'Celtic',     age:28, note:'Hard-running defender.' },
      ]
    },

    /* --- AFC (Asia) --- */
    { code:'JPN', name:'Japan', flag:'🇯🇵', group:'I', pot:1,
      capital:'Tokyo', population:'125M', area:'378,000 km²', languages:'Japanese', currency:'Yen (JPY)',
      geography:'An archipelago of 14,000+ islands across the Pacific. Mount Fuji is the highest point at 3,776m. On the Pacific Ring of Fire.',
      history:'Imperial throne unbroken for ~1,500 years. Opened to the world in 1853; an economic miracle after WWII.',
      funFacts:['Has 5 of the 10 oldest companies in the world','Punctuality is a national pride','Stunned Germany and Spain in Qatar 2022'],
      wc:{ appearances:7, best:'Round of 16 (2002, 10, 18, 22)', titles:0 },
      stars:[
        { name:'Takefusa Kubo',     pos:'RW', club:'Real Sociedad',  age:24, note:'Two-footed creator.' },
        { name:'Kaoru Mitoma',      pos:'LW', club:'Brighton',       age:28, note:'Famous for his dribbling.' },
        { name:'Wataru Endo',       pos:'CDM', club:'Liverpool',     age:32, note:'Captain and defensive shield.' },
        { name:'Takehiro Tomiyasu', pos:'RB/CB', club:'Arsenal',     age:27, note:'Multi-position defender.' },
        { name:'Daichi Kamada',     pos:'AM', club:'Crystal Palace', age:29, note:'Box-arriving playmaker.' },
      ]
    },
    { code:'KOR', name:'South Korea', flag:'🇰🇷', group:'J', pot:3,
      capital:'Seoul', population:'52M', area:'100,000 km²', languages:'Korean', currency:'South Korean won (KRW)',
      geography:'A mountainous peninsula in East Asia. 70% of the country is mountainous; long coastlines on three sides.',
      history:'A unified kingdom since 668 AD. Liberated from Japan in 1945; the Korean War split it in 1953.',
      funFacts:['Co-hosted the 2002 World Cup (reached semifinals)','K-pop is a global phenomenon','Has won 12 of the last 19 archery Olympic golds'],
      wc:{ appearances:11, best:'4th place (2002)', titles:0 },
      stars:[
        { name:'Son Heung-min',     pos:'LW/ST', club:'LAFC',         age:33, note:'Captain, two-footed scorer.' },
        { name:'Lee Kang-in',       pos:'AM', club:'PSG',             age:25, note:'Creative spark.' },
        { name:'Kim Min-jae',       pos:'CB', club:'Bayern Munich',   age:29, note:'"Monster" centre-back.' },
        { name:'Hwang Hee-chan',    pos:'ST', club:'Wolves',          age:30, note:'Pacey forward.' },
      ]
    },
    { code:'AUS', name:'Australia', flag:'🇦🇺', group:'K', pot:3,
      capital:'Canberra', population:'26M', area:'7.69M km²', languages:'English', currency:'Australian dollar (AUD)',
      geography:'A whole continent. The Great Barrier Reef stretches 2,300 km off the coast; the Outback covers most of the interior.',
      history:'Indigenous peoples here for 65,000+ years. British colonisation from 1788; federation in 1901.',
      funFacts:['Has 21 of the world\'s 25 most venomous snakes','Hosts the Australian Open tennis','Switched from Oceania to AFC for football in 2006'],
      wc:{ appearances:6, best:'Round of 16 (2006, 2022)', titles:0 },
      stars:[
        { name:'Mathew Ryan',       pos:'GK', club:'Roma',           age:34, note:'Captain and No.1.' },
        { name:'Mitchell Duke',     pos:'ST', club:'Machida Zelvia', age:35, note:'Veteran target man.' },
        { name:'Jackson Irvine',    pos:'CM', club:'St Pauli',       age:33, note:'Midfield captain.' },
        { name:'Cameron Devlin',    pos:'CM', club:'Hearts',         age:27, note:'Industrious midfielder.' },
      ]
    },
    { code:'IRN', name:'Iran', flag:'🇮🇷', group:'L', pot:3,
      capital:'Tehran', population:'89M', area:'1.65M km²', languages:'Persian (Farsi)', currency:'Iranian rial (IRR)',
      geography:'A Middle-Eastern plateau between mountains and deserts. Has both Caspian Sea and Persian Gulf coasts.',
      history:'Heir to the ancient Persian Empire. Islamic Republic founded after the 1979 revolution.',
      funFacts:['Persepolis was the ceremonial capital of the Persian Empire','Persian carpets are world-renowned','First country to officially recognise religious freedom (Cyrus Cylinder, 539 BC)'],
      wc:{ appearances:7, best:'Group stage', titles:0 },
      stars:[
        { name:'Mehdi Taremi',      pos:'ST', club:'Olympiacos',     age:33, note:'Clinical centre-forward.' },
        { name:'Sardar Azmoun',     pos:'ST', club:'Shabab Al-Ahli', age:30, note:'"Iranian Messi" — versatile forward.' },
        { name:'Alireza Jahanbakhsh', pos:'RW', club:'Heerenveen',   age:32, note:'Captain, technical winger.' },
        { name:'Saeid Ezatolahi',   pos:'CDM', club:'Al-Wakrah',     age:29, note:'Defensive anchor.' },
      ]
    },
    { code:'KSA', name:'Saudi Arabia', flag:'🇸🇦', group:'A', pot:3,
      capital:'Riyadh', population:'36M', area:'2.15M km²', languages:'Arabic', currency:'Saudi riyal (SAR)',
      geography:'Dominates the Arabian Peninsula. 95% desert, including the vast Empty Quarter (Rub\' al Khali).',
      history:'Unified under Ibn Saud in 1932. Modern oil-based economy now diversifying via Vision 2030.',
      funFacts:['Home of Mecca and Medina, Islam\'s holiest cities','Stunned Argentina 2-1 in Qatar 2022','Will host the 2034 World Cup'],
      wc:{ appearances:6, best:'Round of 16 (1994)', titles:0 },
      stars:[
        { name:'Salem Al-Dawsari',  pos:'LW', club:'Al-Hilal', age:34, note:'Scored the famous goal vs Argentina.' },
        { name:'Saleh Al-Shehri',   pos:'ST', club:'Al-Ahli',  age:32, note:'Scored vs Argentina in 2022.' },
        { name:'Mohammed Kanno',    pos:'CM', club:'Al-Hilal', age:31, note:'Captain in midfield.' },
        { name:'Yasser Al-Shahrani',pos:'LB', club:'Al-Hilal', age:33, note:'Veteran fullback.' },
      ]
    },
    { code:'QAT', name:'Qatar', flag:'🇶🇦', group:'B', pot:4,
      capital:'Doha', population:'2.9M', area:'12,000 km²', languages:'Arabic', currency:'Qatari riyal (QAR)',
      geography:'A small peninsula jutting into the Persian Gulf. Mostly flat, sandy desert.',
      history:'A British protectorate until 1971. Hosted the 2022 World Cup.',
      funFacts:['Hosted the 2022 World Cup','Highest GDP per capita in the world by some measures','Home of Al Jazeera'],
      wc:{ appearances:1, best:'Group stage (2022, host)', titles:0 },
      stars:[
        { name:'Akram Afif',        pos:'LW', club:'Al-Sadd',    age:29, note:'AFC Asian Cup MVP.' },
        { name:'Almoez Ali',        pos:'ST', club:'Al-Duhail',  age:29, note:'Top scorer of the 2019 Asian Cup.' },
        { name:'Hassan Al-Haydos',  pos:'AM', club:'Al-Sadd',    age:35, note:'Long-time captain.' },
      ]
    },
    { code:'UZB', name:'Uzbekistan', flag:'🇺🇿', group:'C', pot:4,
      capital:'Tashkent', population:'36M', area:'448,000 km²', languages:'Uzbek, Russian', currency:'Uzbek som (UZS)',
      geography:'Doubly landlocked Central Asia — sand desert in the west, the Tien Shan mountains in the east.',
      history:'On the ancient Silk Road, home to Samarkand and Bukhara. Independent from the USSR in 1991.',
      funFacts:['First-ever World Cup appearance','Samarkand was Tamerlane\'s 14th-century capital','One of only two doubly landlocked countries'],
      wc:{ appearances:0, best:'Debut', titles:0 },
      stars:[
        { name:'Eldor Shomurodov',  pos:'ST', club:'Roma',       age:30, note:'Italy-tested forward.' },
        { name:'Abdukodir Khusanov',pos:'CB', club:'Man City',   age:21, note:'Big-money emerging defender.' },
        { name:'Jaloliddin Masharipov', pos:'AM', club:'Pakhtakor', age:32, note:'Creative midfielder.' },
      ]
    },
    { code:'JOR', name:'Jordan', flag:'🇯🇴', group:'D', pot:4,
      capital:'Amman', population:'11M', area:'89,000 km²', languages:'Arabic', currency:'Jordanian dinar (JOD)',
      geography:'Largely desert, with the Jordan River and the lowest point on earth (the Dead Sea, -430m).',
      history:'An emirate under the British mandate; independent 1946. Stable monarchy in a volatile region.',
      funFacts:['Petra, the rose-red Nabatean city, is a New Wonder of the World','First-ever World Cup appearance','Hosts ~700,000 refugees'],
      wc:{ appearances:0, best:'Debut', titles:0 },
      stars:[
        { name:'Mousa Tamari',      pos:'RW', club:'Rennes',     age:29, note:'Quick, technical winger.' },
        { name:'Yazan Al-Naimat',   pos:'ST', club:'Al-Ahli',    age:27, note:'Captain in attack.' },
        { name:'Ehsan Haddad',      pos:'CB', club:'Al-Faisaly', age:28, note:'Dependable defender.' },
      ]
    },

    /* --- CAF (Africa) --- */
    { code:'MAR', name:'Morocco', flag:'🇲🇦', group:'E', pot:2,
      capital:'Rabat', population:'37M', area:'447,000 km²', languages:'Arabic, Berber', currency:'Moroccan dirham (MAD)',
      geography:'Atlantic and Mediterranean coasts, Atlas Mountains, and the Sahara to the south.',
      history:'A continuous monarchy since the 8th century — one of the world\'s oldest. Independent from France in 1956.',
      funFacts:['First African team to reach the World Cup semifinals (2022)','Co-hosting the 2030 World Cup with Spain & Portugal','Marrakech\'s Jemaa el-Fnaa is UNESCO heritage'],
      wc:{ appearances:6, best:'4th place (2022)', titles:0 },
      stars:[
        { name:'Achraf Hakimi',     pos:'RB', club:'PSG',           age:27, note:'World-class attacking fullback.' },
        { name:'Hakim Ziyech',      pos:'AM', club:'Al-Duhail',     age:32, note:'Left-footed creator.' },
        { name:'Yassine Bounou',    pos:'GK', club:'Al-Hilal',      age:34, note:'Penalty-shootout hero of 2022.' },
        { name:'Sofyan Amrabat',    pos:'CDM',club:'Fenerbahçe',    age:29, note:'Tournament breakout of 2022.' },
        { name:'Youssef En-Nesyri', pos:'ST', club:'Fenerbahçe',    age:28, note:'Scored the historic goal vs Portugal.' },
      ]
    },
    { code:'SEN', name:'Senegal', flag:'🇸🇳', group:'F', pot:2,
      capital:'Dakar', population:'18M', area:'197,000 km²', languages:'French, Wolof', currency:'CFA franc (XOF)',
      geography:'West African Atlantic coast. The Sahel\'s flat plains and the Casamance river system in the south.',
      history:'Independent from France in 1960; a model of African democratic stability.',
      funFacts:['Reigning African champions (2022 AFCON)','Lac Rose turns bright pink in the dry season','Mbalax music is a national export'],
      wc:{ appearances:3, best:'Quarterfinals (2002)', titles:0 },
      stars:[
        { name:'Sadio Mané',        pos:'LW/ST', club:'Al-Nassr', age:33, note:'Talisman and 2022 AFCON winner.' },
        { name:'Kalidou Koulibaly', pos:'CB', club:'Al-Hilal',    age:34, note:'Captain at the back.' },
        { name:'Édouard Mendy',     pos:'GK', club:'Al-Ahli',     age:33, note:'Former CL-winning keeper.' },
        { name:'Ismaïla Sarr',      pos:'RW', club:'Crystal Palace', age:28, note:'Direct, fast winger.' },
      ]
    },
    { code:'EGY', name:'Egypt', flag:'🇪🇬', group:'G', pot:2,
      capital:'Cairo', population:'109M', area:'1.00M km²', languages:'Arabic', currency:'Egyptian pound (EGP)',
      geography:'A Mediterranean and Red Sea coast, but most Egyptians cluster along the Nile, which runs 1,500 km through desert.',
      history:'Ancient civilisation along the Nile from 3100 BC — pyramids, pharaohs, hieroglyphs. Republic since 1953.',
      funFacts:['7-time AFCON winners — most in African history','The Great Pyramid is the only surviving Ancient Wonder','Cairo is Africa\'s largest city'],
      wc:{ appearances:3, best:'Group stage', titles:0 },
      stars:[
        { name:'Mohamed Salah',     pos:'RW', club:'Liverpool',  age:33, note:'African Player of the Year multiple times.' },
        { name:'Mohamed Elneny',    pos:'CM', club:'Al-Jazira',  age:33, note:'Steady midfielder.' },
        { name:'Omar Marmoush',     pos:'ST', club:'Man City',   age:27, note:'Pacey, two-footed forward.' },
        { name:'Mohamed Hamdy',     pos:'CB', club:'Pyramids',   age:24, note:'Emerging young defender.' },
      ]
    },
    { code:'CIV', name:'Ivory Coast', flag:'🇨🇮', group:'H', pot:2,
      capital:'Yamoussoukro', population:'29M', area:'322,000 km²', languages:'French', currency:'CFA franc (XOF)',
      geography:'West African Gulf-of-Guinea coast. Coastal lagoons, rainforests, savannah.',
      history:'Independent from France in 1960. Cocoa now drives ~40% of the economy.',
      funFacts:['World\'s largest cocoa producer','African champions of 2023 (won at home)','Drogba is a national hero'],
      wc:{ appearances:3, best:'Group stage', titles:0 },
      stars:[
        { name:'Sébastien Haller',  pos:'ST', club:'Borussia Dortmund', age:31, note:'Powerful forward.' },
        { name:'Franck Kessié',     pos:'CM', club:'Al-Ahli',       age:29, note:'Box-to-box leader.' },
        { name:'Simon Adingra',     pos:'LW', club:'Brighton',      age:24, note:'Pacey winger.' },
        { name:'Évann Guessand',    pos:'ST', club:'Aston Villa',   age:24, note:'Mobile forward.' },
      ]
    },
    { code:'TUN', name:'Tunisia', flag:'🇹🇳', group:'I', pot:3,
      capital:'Tunis', population:'12M', area:'164,000 km²', languages:'Arabic', currency:'Tunisian dinar (TND)',
      geography:'North African Mediterranean coast. Atlas Mountains in the north, Sahara in the south.',
      history:'Site of ancient Carthage. The 2011 revolution sparked the Arab Spring.',
      funFacts:['Carthage was Rome\'s great rival in the Punic Wars','Beat France in Qatar 2022','Has 8 UNESCO sites'],
      wc:{ appearances:6, best:'Group stage', titles:0 },
      stars:[
        { name:'Hannibal Mejbri',   pos:'CM', club:'Burnley',    age:23, note:'Energetic midfielder.' },
        { name:'Wahbi Khazri',      pos:'AM', club:'Montpellier',age:35, note:'Veteran creator.' },
        { name:'Aïssa Laïdouni',    pos:'CM', club:'Union Berlin', age:28, note:'Industrious midfielder.' },
      ]
    },
    { code:'GHA', name:'Ghana', flag:'🇬🇭', group:'J', pot:4,
      capital:'Accra', population:'33M', area:'239,000 km²', languages:'English, Twi', currency:'Ghanaian cedi (GHS)',
      geography:'West African Gulf-of-Guinea coast. Lake Volta is one of the world\'s largest reservoirs.',
      history:'First sub-Saharan African colony to gain independence (1957). A stable multi-party democracy.',
      funFacts:['Highlife music originated here','Kente cloth is a global symbol of African heritage','Cocoa, gold, and oil drive the economy'],
      wc:{ appearances:4, best:'Quarterfinals (2010)', titles:0 },
      stars:[
        { name:'Mohammed Kudus',    pos:'AM', club:'Tottenham',  age:25, note:'Skillful, two-footed creator.' },
        { name:'Thomas Partey',     pos:'CDM', club:'Villarreal',age:32, note:'Defensive midfield rock.' },
        { name:'Inaki Williams',    pos:'ST', club:'Athletic Bilbao', age:31, note:'Spain-born forward who switched.' },
        { name:'Jordan Ayew',       pos:'ST', club:'Leicester',  age:34, note:'Experienced forward.' },
      ]
    },
    { code:'NGA', name:'Nigeria', flag:'🇳🇬', group:'K', pot:4,
      capital:'Abuja', population:'225M', area:'924,000 km²', languages:'English (plus 500+ languages)', currency:'Naira (NGN)',
      geography:'Africa\'s most populous country. Tropical south on the Atlantic, savannah and semi-desert north.',
      history:'Independent from Britain in 1960. The economy is dominated by oil and a booming film industry (Nollywood).',
      funFacts:['Largest population in Africa','Afrobeats is now a global music genre','3-time African champions'],
      wc:{ appearances:6, best:'Round of 16 (1994, 98, 2014)', titles:0 },
      stars:[
        { name:'Victor Osimhen',    pos:'ST', club:'Galatasaray', age:27, note:'2023 African Player of the Year.' },
        { name:'Ademola Lookman',   pos:'LW', club:'Atalanta',    age:28, note:'Hat-trick scorer in 2024 Europa League final.' },
        { name:'Wilfred Ndidi',     pos:'CDM', club:'Besiktas',   age:29, note:'Ball-winning machine.' },
        { name:'Alex Iwobi',        pos:'AM', club:'Fulham',      age:30, note:'Two-footed midfielder.' },
      ]
    },
    { code:'CMR', name:'Cameroon', flag:'🇨🇲', group:'L', pot:4,
      capital:'Yaoundé', population:'28M', area:'476,000 km²', languages:'French, English', currency:'CFA franc (XAF)',
      geography:'"Africa in miniature": coast, mountains, jungle, savannah, desert. Mount Cameroon erupts often.',
      history:'Once a German colony, partitioned between France and Britain, reunified in 1961.',
      funFacts:['First African team to reach a WC quarterfinal (1990)','Roger Milla\'s 1990 dance is iconic','5-time AFCON champions'],
      wc:{ appearances:8, best:'Quarterfinals (1990)', titles:0 },
      stars:[
        { name:'André Onana',       pos:'GK', club:'Manchester Utd',  age:30, note:'Sweeper-keeper.' },
        { name:'Bryan Mbeumo',      pos:'RW', club:'Manchester Utd',  age:26, note:'Direct, two-footed forward.' },
        { name:'Vincent Aboubakar', pos:'ST', club:'Hatayspor',       age:34, note:'Veteran goal-scorer.' },
        { name:'Karl Toko Ekambi',  pos:'LW', club:'Abha',            age:33, note:'Experienced winger.' },
      ]
    },
    /* --- OFC + intercontinental --- */
    { code:'NZL', name:'New Zealand', flag:'🇳🇿', group:'J', pot:4,
      capital:'Wellington', population:'5.2M', area:'268,000 km²', languages:'English, Māori', currency:'New Zealand dollar (NZD)',
      geography:'Two main islands in the South Pacific. Fjords, geysers, the Southern Alps, and rolling sheep country.',
      history:'Māori settled c. 1300; British annexation in 1840 via the Treaty of Waitangi.',
      funFacts:['More sheep than people','Filming location for Lord of the Rings','The All Blacks (rugby) are world-renowned'],
      wc:{ appearances:3, best:'Group stage', titles:0 },
      stars:[
        { name:'Chris Wood',        pos:'ST', club:'Nottingham Forest', age:34, note:'Captain and goal-scorer.' },
        { name:'Marko Stamenić',    pos:'CM', club:'Olympiacos',        age:23, note:'Young midfielder.' },
        { name:'Liberato Cacace',   pos:'LB', club:'Wellington Phoenix',age:25, note:'Attacking fullback.' },
      ]
    },
    { code:'PAN', name:'Panama', flag:'🇵🇦', group:'K', pot:4,
      capital:'Panama City', population:'4.5M', area:'75,000 km²', languages:'Spanish', currency:'Balboa / US dollar',
      geography:'A narrow isthmus joining Central and South America. The Panama Canal cuts through it, connecting two oceans.',
      history:'Independent from Colombia in 1903 (with US support); regained the canal in 1999.',
      funFacts:['Panama Canal saves ships ~8,000 miles','Has both Atlantic and Pacific coasts','First WC appearance was 2018'],
      wc:{ appearances:1, best:'Group stage (2018)', titles:0 },
      stars:[
        { name:'José Fajardo',      pos:'ST', club:'Pachuca',  age:30, note:'Mobile forward.' },
        { name:'Adalberto Carrasquilla', pos:'CM', club:'Pumas', age:27, note:'Set-piece weapon.' },
        { name:'Aníbal Godoy',      pos:'CM', club:'San Diego FC', age:36, note:'Captain in midfield.' },
      ]
    },
    { code:'JAM', name:'Jamaica', flag:'🇯🇲', group:'L', pot:4,
      capital:'Kingston', population:'2.8M', area:'11,000 km²', languages:'English, Jamaican Patois', currency:'Jamaican dollar (JMD)',
      geography:'A Caribbean island with the Blue Mountains, lush forests, and famous beaches.',
      history:'British colony from 1655 until independence in 1962. Reggae and Rastafari born here in the 1960s.',
      funFacts:['Reggae and Bob Marley are global icons','Usain Bolt was born here','Has the fastest sprinters per capita'],
      wc:{ appearances:1, best:'Group stage (1998)', titles:0 },
      stars:[
        { name:'Leon Bailey',       pos:'RW', club:'Aston Villa', age:28, note:'Pacey, direct winger.' },
        { name:'Demarai Gray',      pos:'LW', club:'Saudi Arabia',age:29, note:'Tricky wide attacker.' },
        { name:'Michail Antonio',   pos:'ST', club:'West Ham',    age:35, note:'Powerful forward.' },
      ]
    },
  ];

  /* ----------------------------------------------------------------
     Build groups A..L (4 teams each) from COUNTRIES.group field.
     ---------------------------------------------------------------- */
  const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  function buildGroups() {
    const groups = {};
    for (const g of GROUP_LETTERS) groups[g] = [];
    for (const c of COUNTRIES) {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c.code);
    }
    return groups;
  }

  /* ----------------------------------------------------------------
     Fixture generation
     Group stage: each group plays 6 matches over ~13 days
     Knockouts: R32 → R16 → QF → SF → 3rd place + Final
     Dates spread Jun 11 (opener) → Jul 19 (final).
     ---------------------------------------------------------------- */
  function pad(n) { return n < 10 ? '0'+n : ''+n; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function ymd(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

  // Each group of 4 — round-robin pairings: (1v2, 3v4) (1v3, 2v4) (1v4, 2v3)
  const GROUP_PAIRINGS = [
    [[0,1],[2,3]],
    [[0,2],[1,3]],
    [[0,3],[1,2]],
  ];

  function buildMatches(groups) {
    const matches = [];
    const start = new Date('2026-06-11T00:00:00');
    let mid = 1;

    /* --- Group stage --- */
    // 12 groups × 3 matchdays × 2 matches = 72 group matches.
    // Schedule 6 matches per day across 12 days (Jun 11 – Jun 27), venue round-robin.
    const groupMatches = [];
    for (let mdIdx = 0; mdIdx < 3; mdIdx++) {
      for (let gi = 0; gi < GROUP_LETTERS.length; gi++) {
        const letter = GROUP_LETTERS[gi];
        const teams = groups[letter];
        if (!teams || teams.length < 4) continue;
        const pairs = GROUP_PAIRINGS[mdIdx];
        for (const [a,b] of pairs) {
          groupMatches.push({
            stage: 'group',
            group: letter,
            home: teams[a],
            away: teams[b],
            md: mdIdx,
          });
        }
      }
    }
    // 72 matches, ~6 per day → 12 days
    const perDay = 6;
    groupMatches.forEach((gm, idx) => {
      const day = Math.floor(idx / perDay);
      const slot = idx % perDay;
      const date = addDays(start, day);
      const hour = 12 + slot * 2; // 12,14,16,18,20,22 local
      const venue = VENUES[(idx) % VENUES.length].id;
      matches.push({
        id: 'm' + pad(mid++),
        date: ymd(date),
        time: pad(hour) + ':00',
        stage: 'group',
        group: gm.group,
        round: 'MD' + (gm.md+1),
        home: gm.home,
        away: gm.away,
        venue,
        result: null,
      });
    });

    /* --- Knockout placeholders ---
       R32 (16) Jun 27–30; R16 (8) Jul 3–6; QF (4) Jul 9–11;
       SF (2) Jul 14–15; 3rd place Jul 18; Final Jul 19.
    */
    const koPlan = [
      { stage:'R32',   round:'R32',          dateStart:'2026-06-27', games:16, perDay:4 },
      { stage:'R16',   round:'Round of 16',  dateStart:'2026-07-03', games:8,  perDay:2 },
      { stage:'QF',    round:'Quarterfinal', dateStart:'2026-07-09', games:4,  perDay:2 },
      { stage:'SF',    round:'Semifinal',    dateStart:'2026-07-14', games:2,  perDay:1 },
      { stage:'3rd',   round:'3rd-place',    dateStart:'2026-07-18', games:1,  perDay:1 },
      { stage:'Final', round:'Final',        dateStart:'2026-07-19', games:1,  perDay:1 },
    ];

    for (const ko of koPlan) {
      for (let i = 0; i < ko.games; i++) {
        const day = Math.floor(i / ko.perDay);
        const slot = i % ko.perDay;
        const date = addDays(new Date(ko.dateStart + 'T00:00:00'), day);
        const hour = 14 + slot * 3;
        const venue = ko.stage === 'Final' ? 'met'
                    : ko.stage === '3rd'   ? 'hrs'
                    : VENUES[(matches.length + i) % VENUES.length].id;
        matches.push({
          id: 'm' + pad(mid++),
          date: ymd(date),
          time: pad(hour)+':00',
          stage: ko.stage,
          group: null,
          round: ko.round,
          home: null,
          away: null,
          venue,
          result: null,
        });
      }
    }

    return matches;
  }

  /* ----------------------------------------------------------------
     STATE — persisted in localStorage
     ---------------------------------------------------------------- */
  const defaultGroups = buildGroups();
  const defaultMatches = buildMatches(defaultGroups);

  let state = {
    groups: defaultGroups,
    matches: defaultMatches,
    members: [],
    picks: {}, // memberId -> { champion, runnerUp, goldenBoot, ko: { R32: {matchId: code}, R16:..., QF:..., SF:..., Final:... }, groupWinners: { A: code, B: code, ... }, groupRunnersUp: { A: code, ... } }
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // shallow merge — keep canonical groups/matches if saved missing
        state = Object.assign(state, saved);
        if (!state.groups || Object.keys(state.groups).length === 0) state.groups = defaultGroups;
        if (!state.matches || state.matches.length === 0) state.matches = defaultMatches;
      }
    } catch (e) { console.warn('wc load failed', e); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('wc save failed', e); }
  }

  /* ----------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------- */
  function countryByCode(code) { return COUNTRIES.find(c => c.code === code); }
  function venueById(id) { return VENUES.find(v => v.id === id); }
  function fmtDate(s) {
    const d = new Date(s+'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  }
  function escapeHTML(s){return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function toast(msg) {
    let t = document.getElementById('wc-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'wc-toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ----------------------------------------------------------------
     Standings computation
     ---------------------------------------------------------------- */
  function computeStandings() {
    const tables = {};
    for (const g of GROUP_LETTERS) {
      tables[g] = (state.groups[g] || []).map(code => ({
        code,
        p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0,
      }));
    }
    state.matches.filter(m => m.stage === 'group' && m.result).forEach(m => {
      const t = tables[m.group];
      if (!t) return;
      const home = t.find(x => x.code === m.home);
      const away = t.find(x => x.code === m.away);
      if (!home || !away) return;
      const hs = m.result.home, as = m.result.away;
      home.p++; away.p++;
      home.gf += hs; home.ga += as;
      away.gf += as; away.ga += hs;
      if (hs > as) { home.w++; away.l++; home.pts += 3; }
      else if (hs < as) { away.w++; home.l++; away.pts += 3; }
      else { home.d++; away.d++; home.pts += 1; away.pts += 1; }
    });
    for (const g of GROUP_LETTERS) {
      tables[g].sort((a,b) => b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf);
    }
    return tables;
  }

  function topScorer() {
    // Not tracked per-player; users enter via Bracket Pool's Golden Boot pick (the answer key).
    // Returned only as an info card.
    return null;
  }

  /* ----------------------------------------------------------------
     SCORING — bracket pool
     ---------------------------------------------------------------- */
  const SCORING = {
    groupWinner: 2,
    groupRunnerUp: 1,
    R32: 1,
    R16: 2,
    QF: 4,
    SF: 8,
    Final: 16,
    champion: 25,
    runnerUp: 10,
    goldenBoot: 10,
  };

  function getActualGroupTop2() {
    const tables = computeStandings();
    const out = {};
    for (const g of GROUP_LETTERS) {
      const t = tables[g];
      if (!t || t.length < 2) continue;
      // only count if all 3 matchdays played (each team played 3 games)
      const allPlayed = t.every(team => team.p >= 3);
      if (!allPlayed) continue;
      out[g] = { winner: t[0].code, runnerUp: t[1].code };
    }
    return out;
  }

  function getKnockoutWinners() {
    const stages = ['R32','R16','QF','SF','Final'];
    const out = {};
    for (const s of stages) {
      out[s] = {};
      const matches = state.matches.filter(m => m.stage === s && m.result);
      for (const m of matches) {
        const w = m.result.home > m.result.away ? m.home : (m.result.away > m.result.home ? m.away : null);
        // PK winner stored as result.pkWinner if entered
        const winner = w || m.result.pkWinner || null;
        if (winner) out[s][m.id] = winner;
      }
    }
    return out;
  }

  function getChampionAndRunnerUp() {
    const final = state.matches.find(m => m.stage === 'Final' && m.result);
    if (!final) return { champion:null, runnerUp:null };
    const homeWon = final.result.home > final.result.away;
    const awayWon = final.result.away > final.result.home;
    let champ, ru;
    if (homeWon) { champ = final.home; ru = final.away; }
    else if (awayWon) { champ = final.away; ru = final.home; }
    else if (final.result.pkWinner) {
      champ = final.result.pkWinner;
      ru = final.result.pkWinner === final.home ? final.away : final.home;
    }
    return { champion: champ || null, runnerUp: ru || null };
  }

  function scoreMember(memberId) {
    const picks = state.picks[memberId];
    if (!picks) return { total:0, breakdown:{} };
    let total = 0;
    const breakdown = { groups:0, ko:0, champion:0, runnerUp:0, goldenBoot:0 };

    const actualTop2 = getActualGroupTop2();
    for (const g of GROUP_LETTERS) {
      const a = actualTop2[g];
      if (!a) continue;
      const pred = picks.groupWinners ? picks.groupWinners[g] : null;
      const predRu = picks.groupRunnersUp ? picks.groupRunnersUp[g] : null;
      if (pred && pred === a.winner) { total += SCORING.groupWinner; breakdown.groups += SCORING.groupWinner; }
      if (predRu && predRu === a.runnerUp) { total += SCORING.groupRunnerUp; breakdown.groups += SCORING.groupRunnerUp; }
    }

    const koActual = getKnockoutWinners();
    for (const stage of ['R32','R16','QF','SF','Final']) {
      const stagePicks = picks.ko && picks.ko[stage] ? picks.ko[stage] : {};
      for (const matchId of Object.keys(stagePicks)) {
        if (koActual[stage][matchId] && stagePicks[matchId] === koActual[stage][matchId]) {
          total += SCORING[stage];
          breakdown.ko += SCORING[stage];
        }
      }
    }

    const { champion, runnerUp } = getChampionAndRunnerUp();
    if (champion && picks.champion && picks.champion === champion) { total += SCORING.champion; breakdown.champion = SCORING.champion; }
    if (runnerUp && picks.runnerUp && picks.runnerUp === runnerUp) { total += SCORING.runnerUp; breakdown.runnerUp = SCORING.runnerUp; }
    if (picks.goldenBootCorrect) { total += SCORING.goldenBoot; breakdown.goldenBoot = SCORING.goldenBoot; }

    return { total, breakdown };
  }

  /* ----------------------------------------------------------------
     RENDER — tabs
     ---------------------------------------------------------------- */
  function activateTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-'+name));
    if (name === 'home')     renderHome();
    if (name === 'teams')    renderTeams();
    if (name === 'matches')  renderMatches();
    if (name === 'venues')   renderVenues();
    if (name === 'standings')renderStandings();
    if (name === 'pool')     renderPool();
    if (name === 'about')    renderAbout();
    window.scrollTo({ top:0, behavior:'instant' });
  }

  /* ---- HOME ---- */
  function renderHome() {
    const root = document.getElementById('screen-home');
    const now = new Date();
    const startD = new Date(TOURNAMENT_START);
    const diff = Math.max(0, startD - now);
    const days = Math.floor(diff / 86400000);
    const hrs  = Math.floor(diff / 3600000) % 24;
    const mins = Math.floor(diff / 60000) % 60;
    const secs = Math.floor(diff / 1000) % 60;

    const next = state.matches
      .filter(m => !m.result)
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];

    const nextHTML = next ? renderMatchRow(next, true) : '<div class="empty">All matches played — see Standings.</div>';

    root.innerHTML = `
      <div class="card">
        <h2>⏱ Kick-off countdown</h2>
        <p class="muted">First match: <b>${fmtDate('2026-06-11')}</b> · Estadio Azteca · Mexico City</p>
        <div class="countdown" id="cd">
          <div class="cd-cell"><div class="n">${days}</div><div class="l">days</div></div>
          <div class="cd-cell"><div class="n">${pad(hrs)}</div><div class="l">hours</div></div>
          <div class="cd-cell"><div class="n">${pad(mins)}</div><div class="l">min</div></div>
          <div class="cd-cell"><div class="n">${pad(secs)}</div><div class="l">sec</div></div>
        </div>
      </div>
      <div class="card">
        <h2>⚽ Next up</h2>
        <div id="home-next">${nextHTML}</div>
      </div>
      <div class="card fact-card">
        <h2>🌎 The 2026 World Cup at a glance</h2>
        <p>The first 48-team World Cup. Three host nations — <b>Canada · Mexico · United States</b>. <b>16 cities</b> and <b>104 matches</b> across 39 days. The opener is at the Estadio Azteca; the final at MetLife Stadium on July 19.</p>
        <h3>Format</h3>
        <p>12 groups of 4. Top two from each group plus the eight best third-placed teams qualify for a new Round of 32, then standard knockouts.</p>
      </div>
      <div class="card">
        <h2>👨‍👩‍👧‍👦 Family bracket pool</h2>
        <p class="muted">Add family members, lock in your picks, watch the leaderboard as the tournament unfolds.</p>
        <button class="btn" onclick="WC.tab('pool')">Open Bracket Pool →</button>
      </div>
    `;
  }

  /* ---- TEAMS ---- */
  function renderTeams() {
    const root = document.getElementById('screen-teams');
    const groups = state.groups;
    let html = `<div class="muted" style="font-size:0.85rem; margin-bottom:10px;">
      All 48 teams, grouped A–L. Tap a country for its history, geography, and star players.
      <span style="display:block;margin-top:4px;">Groups are placeholders you can edit any time — tap ✎ to reshuffle.</span>
      <button class="btn ghost" style="margin-top:8px;" onclick="WC.openGroupEditor()">✎ Edit groups</button>
    </div>`;
    for (const letter of GROUP_LETTERS) {
      const codes = groups[letter] || [];
      html += `<div class="group-block">
        <div class="group-title"><span class="group-badge">Group ${letter}</span></div>
        <div class="team-grid">
          ${codes.map(code => {
            const c = countryByCode(code);
            if (!c) return '';
            return `<div class="team-card" onclick="WC.openCountry('${code}')">
              <div class="flag">${c.flag}</div>
              <div class="tinfo">
                <div class="tname">${escapeHTML(c.name)}</div>
                <div class="tmeta">${escapeHTML(c.capital)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }
    root.innerHTML = html;
  }

  function openCountry(code) {
    const c = countryByCode(code);
    if (!c) return;
    const root = document.getElementById('screen-country');
    root.innerHTML = `
      <button class="btn ghost" style="margin-bottom:12px;" onclick="WC.tab('teams')">← Back to teams</button>
      <div class="country-hero">
        <div class="bigflag">${c.flag}</div>
        <h2>${escapeHTML(c.name)}</h2>
        <div class="chips">
          <span class="chip gold">Group ${c.group}</span>
          <span class="chip">${escapeHTML(c.capital)}</span>
          <span class="chip">Pop ${escapeHTML(c.population)}</span>
        </div>
      </div>
      <div class="card">
        <h2>Country profile</h2>
        <dl class="kv">
          <dt>Capital</dt><dd>${escapeHTML(c.capital)}</dd>
          <dt>Population</dt><dd>${escapeHTML(c.population)}</dd>
          <dt>Area</dt><dd>${escapeHTML(c.area)}</dd>
          <dt>Languages</dt><dd>${escapeHTML(c.languages)}</dd>
          <dt>Currency</dt><dd>${escapeHTML(c.currency)}</dd>
        </dl>
        <h3>Geography</h3>
        <p>${escapeHTML(c.geography)}</p>
        <h3>History</h3>
        <p>${escapeHTML(c.history)}</p>
        <h3>Fun facts</h3>
        <ul style="padding-left:18px; line-height:1.6;">
          ${c.funFacts.map(f => `<li>${escapeHTML(f)}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>World Cup record</h2>
        <dl class="kv">
          <dt>Appearances</dt><dd>${c.wc.appearances}</dd>
          <dt>Best finish</dt><dd>${escapeHTML(c.wc.best)}</dd>
          <dt>Titles</dt><dd>${c.wc.titles}</dd>
        </dl>
      </div>
      <div class="card">
        <h2>⭐ Star players</h2>
        <div class="player-list">
          ${c.stars.map(p => `
            <div class="player">
              <div class="top"><div class="name">${escapeHTML(p.name)}</div><div class="pos">${escapeHTML(p.pos)}</div></div>
              <div class="meta">${escapeHTML(p.club)} · age ${p.age}</div>
              <div class="note">${escapeHTML(p.note)}</div>
            </div>`).join('')}
        </div>
      </div>
    `;
    // hide all screens, show country
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    root.classList.add('active');
  }

  /* ---- MATCHES ---- */
  function renderMatches() {
    const root = document.getElementById('screen-matches');
    const stageFilter = document.getElementById('flt-stage')?.value || 'all';
    const groupFilter = document.getElementById('flt-group')?.value || 'all';

    let list = state.matches.slice();
    if (stageFilter !== 'all') list = list.filter(m => m.stage === stageFilter);
    if (groupFilter !== 'all') list = list.filter(m => m.group === groupFilter);
    list.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    // group by date
    const byDate = {};
    list.forEach(m => { (byDate[m.date] = byDate[m.date] || []).push(m); });

    const filterHTML = `
      <div class="match-filters">
        <select id="flt-stage" onchange="WC.renderMatches()">
          <option value="all">All stages</option>
          <option value="group" ${stageFilter==='group'?'selected':''}>Group stage</option>
          <option value="R32"   ${stageFilter==='R32'?'selected':''}>Round of 32</option>
          <option value="R16"   ${stageFilter==='R16'?'selected':''}>Round of 16</option>
          <option value="QF"    ${stageFilter==='QF'?'selected':''}>Quarterfinals</option>
          <option value="SF"    ${stageFilter==='SF'?'selected':''}>Semifinals</option>
          <option value="3rd"   ${stageFilter==='3rd'?'selected':''}>3rd-place</option>
          <option value="Final" ${stageFilter==='Final'?'selected':''}>Final</option>
        </select>
        <select id="flt-group" onchange="WC.renderMatches()">
          <option value="all">All groups</option>
          ${GROUP_LETTERS.map(g => `<option value="${g}" ${groupFilter===g?'selected':''}>Group ${g}</option>`).join('')}
        </select>
        <span class="muted" style="font-size:0.8rem; align-self:center;">${list.length} matches</span>
      </div>
    `;

    let html = filterHTML;
    if (list.length === 0) html += '<div class="empty">No matches for these filters.</div>';
    Object.keys(byDate).sort().forEach(date => {
      html += `<div class="day-label">${fmtDate(date)}</div>`;
      byDate[date].forEach(m => { html += renderMatchRow(m, false); });
    });
    root.innerHTML = html;
  }

  function renderMatchRow(m, asCard) {
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const venue = venueById(m.venue);
    const played = !!m.result;
    const koClass = m.stage !== 'group' ? ' knockout' : '';
    const stage = m.stage === 'group' ? `Group ${m.group} · ${m.round}` : m.round;
    const homeLabel = home ? `${home.flag} ${escapeHTML(home.name)}` : '<span class="muted">TBD</span>';
    const awayLabel = away ? `${away.flag} ${escapeHTML(away.name)}` : '<span class="muted">TBD</span>';
    const score = played ? `<span class="score">${m.result.home}–${m.result.away}</span>` : `<span class="vs">vs</span>`;
    return `
      <div class="match${played?' played':''}${koClass}" onclick="WC.editResult('${m.id}')">
        <div class="when">
          <div>${m.date.slice(5)}</div>
          <div class="time">${m.time}</div>
        </div>
        <div class="teams">
          <div class="side left"><span class="name">${homeLabel}</span></div>
          ${score}
          <div class="side"><span class="name">${awayLabel}</span></div>
        </div>
        <div class="badge">${stage}<br>${venue ? escapeHTML(venue.city) : ''}</div>
      </div>
    `;
  }

  /* ---- VENUES ---- */
  function renderVenues() {
    const root = document.getElementById('screen-venues');
    const html = `
      <div class="muted" style="font-size:0.88rem; margin-bottom:12px;">
        <b>16 host venues</b> — 11 in the United States, 3 in Mexico, 2 in Canada.
      </div>
      <div class="venue-grid">
        ${VENUES.map(v => `
          <div class="venue">
            <div class="vname">${escapeHTML(v.name)}</div>
            <div class="vcity">${escapeHTML(v.city)} · ${escapeHTML(v.country)}</div>
            <div class="vmeta">
              <span><b>${v.cap.toLocaleString()}</b> seats</span>
              <span>opened <b>${v.opened}</b></span>
            </div>
            <div class="vnotes">${escapeHTML(v.notes)}</div>
          </div>
        `).join('')}
      </div>
    `;
    root.innerHTML = html;
  }

  /* ---- STANDINGS ---- */
  function renderStandings() {
    const root = document.getElementById('screen-standings');
    const tables = computeStandings();
    let html = `<div class="muted" style="font-size:0.86rem;margin-bottom:8px;">
      Tables update automatically as you enter results in the Matches tab.
      The top two per group advance; the 8 best 3rd-placed teams also qualify.</div>`;

    for (const g of GROUP_LETTERS) {
      const rows = tables[g] || [];
      html += `<div class="card" style="padding:14px;">
        <h2>Group ${g}</h2>
        <table class="standings-table">
          <thead><tr><th style="text-align:left;">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              const c = countryByCode(r.code);
              const cls = i < 2 ? 'advancing' : (i === 2 ? 'qualified-3rd' : '');
              return `<tr class="${cls}">
                <td class="team">${c ? c.flag : ''} ${c ? escapeHTML(c.name) : r.code}</td>
                <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
                <td>${r.gf}</td><td>${r.ga}</td><td>${r.gf-r.ga}</td>
                <td><b>${r.pts}</b></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
    }

    // Knockout bracket (computed)
    html += `<div class="bracket-stage">
      <h2 style="font-family:var(--font-display);font-size:1.2rem;margin-bottom:8px;">🏆 Knockout bracket</h2>`;
    for (const stage of ['R32','R16','QF','SF','3rd','Final']) {
      const stageMatches = state.matches.filter(m => m.stage === stage);
      if (stageMatches.length === 0) continue;
      html += `<div class="bracket-stage"><h3>${stage === 'R32' ? 'Round of 32'
                  : stage === 'R16' ? 'Round of 16'
                  : stage === 'QF' ? 'Quarterfinals'
                  : stage === 'SF' ? 'Semifinals'
                  : stage === '3rd' ? 'Third-place match'
                  : 'Final'}</h3>
        <div class="bracket-row">
          ${stageMatches.map(m => bracketTieHTML(m)).join('')}
        </div></div>`;
    }
    html += `</div>`;

    root.innerHTML = html;
  }

  function bracketTieHTML(m) {
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const played = !!m.result;
    let homeCls = '', awayCls = '';
    let hs = '', as = '';
    if (played) {
      hs = m.result.home; as = m.result.away;
      const homeW = m.result.home > m.result.away || m.result.pkWinner === m.home;
      const awayW = m.result.away > m.result.home || m.result.pkWinner === m.away;
      homeCls = homeW ? 'winner' : (awayW ? 'loser' : '');
      awayCls = awayW ? 'winner' : (homeW ? 'loser' : '');
    }
    return `<div class="bracket-tie" onclick="WC.editResult('${m.id}')" style="cursor:pointer;">
      <div class="l ${homeCls}"><span>${home ? home.flag+' '+escapeHTML(home.name) : 'TBD'}</span><span class="s">${hs}</span></div>
      <div class="l ${awayCls}"><span>${away ? away.flag+' '+escapeHTML(away.name) : 'TBD'}</span><span class="s">${as}</span></div>
      <div class="muted" style="font-size:0.7rem; margin-top:4px;">${m.date.slice(5)} · ${m.time}</div>
    </div>`;
  }

  /* ---- BRACKET POOL ---- */
  function renderPool() {
    const root = document.getElementById('screen-pool');
    const memberOpts = state.members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('');
    const selectedId = state.uiSelectedMember || (state.members[0] && state.members[0].id) || null;

    // Leaderboard
    const board = state.members.map(m => {
      const { total, breakdown } = scoreMember(m.id);
      return { ...m, total, breakdown };
    }).sort((a,b) => b.total - a.total);

    let html = `
      <div class="card">
        <h2>👨‍👩‍👧‍👦 Family Pool</h2>
        <p class="muted" style="font-size:0.85rem;">Add each family member, then have each fill in their picks. Scores update automatically as you record real match results in the Matches tab.</p>
        <div class="pool-toolbar">
          <input id="new-member" placeholder="Add a family member" maxlength="24" />
          <button class="btn" onclick="WC.addMember()">+ Add</button>
        </div>

        <h3 style="margin-top:14px;">🏅 Leaderboard</h3>
        ${board.length === 0
          ? '<div class="empty">No members yet. Add the family above to get started!</div>'
          : board.map((m, i) => `
              <div class="leader ${i===0?'top1':''}">
                <div class="rank">${i+1}</div>
                <div class="who">${escapeHTML(m.name)}<div class="muted" style="font-size:0.75rem;font-weight:600;">G:${m.breakdown.groups} · KO:${m.breakdown.ko} · 🏆:${m.breakdown.champion+m.breakdown.runnerUp} · 👟:${m.breakdown.goldenBoot}</div></div>
                <div class="pts">${m.total}</div>
                <div class="actions">
                  <button title="Edit picks" onclick="WC.selectMember('${m.id}')">✎</button>
                  <button title="Remove" onclick="WC.removeMember('${m.id}')">✕</button>
                </div>
              </div>`).join('')}

        <h3 style="margin-top:14px;">📋 Scoring rules</h3>
        <div class="scoring-rules">
          <b>Group stage</b>: 2 pts per correct group winner · 1 pt per correct runner-up<br>
          <b>Knockouts</b>: R32 = 1 · R16 = 2 · QF = 4 · SF = 8 · Final winner = 16<br>
          <b>Bonuses</b>: Champion = 25 · Runner-up = 10 · Golden Boot = 10
        </div>
      </div>
    `;

    if (selectedId) {
      const member = state.members.find(m => m.id === selectedId);
      if (member) {
        html += renderMemberPicks(member);
      }
    }

    root.innerHTML = html;

    // wire enter key
    const inp = document.getElementById('new-member');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addMember(); });
  }

  function renderMemberPicks(member) {
    const picks = state.picks[member.id] || (state.picks[member.id] = { groupWinners:{}, groupRunnersUp:{}, ko:{}, champion:null, runnerUp:null, goldenBoot:'', goldenBootCorrect:false });
    const actualTop2 = getActualGroupTop2();
    const koActual = getKnockoutWinners();
    const champRu = getChampionAndRunnerUp();

    function teamSelect(currentCode, options, onchange) {
      return `<select onchange="${onchange}">
        <option value="">— pick —</option>
        ${options.map(code => {
          const c = countryByCode(code);
          if (!c) return '';
          return `<option value="${code}" ${currentCode===code?'selected':''}>${c.flag} ${escapeHTML(c.name)}</option>`;
        }).join('')}
      </select>`;
    }
    const allTeamCodes = COUNTRIES.map(c => c.code);

    // Group picks
    let groupsHTML = '';
    for (const g of GROUP_LETTERS) {
      const codes = state.groups[g] || [];
      const winPick = picks.groupWinners[g] || '';
      const ruPick  = picks.groupRunnersUp[g] || '';
      const actual = actualTop2[g];
      const winMark = actual ? (winPick === actual.winner ? `<span class="correct">✓ ${SCORING.groupWinner}</span>` : (winPick ? '<span class="miss">✗</span>' : '')) : '';
      const ruMark  = actual ? (ruPick  === actual.runnerUp ? `<span class="correct">✓ ${SCORING.groupRunnerUp}</span>` : (ruPick ? '<span class="miss">✗</span>' : '')) : '';
      groupsHTML += `<div style="margin-bottom:10px;">
        <div style="font-weight:800;color:var(--wc-gold);margin-bottom:4px;">Group ${g}</div>
        <div class="pick-row"><div class="lbl">Winner</div><div>${teamSelect(winPick, codes, `WC.setGroupPick('${member.id}','${g}','winner',this.value)`)}${winMark}</div></div>
        <div class="pick-row"><div class="lbl">Runner-up</div><div>${teamSelect(ruPick, codes, `WC.setGroupPick('${member.id}','${g}','runnerUp',this.value)`)}${ruMark}</div></div>
      </div>`;
    }

    // Knockouts
    function koPicksFor(stage) {
      const matches = state.matches.filter(m => m.stage === stage);
      if (matches.length === 0) return '';
      const label = stage === 'R32' ? 'Round of 32' : stage === 'R16' ? 'Round of 16' : stage === 'QF' ? 'Quarterfinals' : stage === 'SF' ? 'Semifinals' : 'Final';
      const ptsLabel = SCORING[stage];
      const items = matches.map(m => {
        const opts = [];
        if (m.home) opts.push(m.home);
        if (m.away) opts.push(m.away);
        const optionsList = opts.length > 0 ? opts : allTeamCodes;
        const pickStage = picks.ko[stage] || (picks.ko[stage] = {});
        const cur = pickStage[m.id] || '';
        const actual = koActual[stage][m.id];
        const mark = actual ? (cur === actual ? `<span class="correct">✓ ${ptsLabel}</span>` : (cur ? '<span class="miss">✗</span>' : '')) : '';
        const homeName = m.home ? countryByCode(m.home).flag+' '+countryByCode(m.home).name : 'TBD';
        const awayName = m.away ? countryByCode(m.away).flag+' '+countryByCode(m.away).name : 'TBD';
        return `<div class="pick-row">
          <div class="lbl" style="font-size:0.7rem;">${escapeHTML(homeName)} vs ${escapeHTML(awayName)}</div>
          <div>${teamSelect(cur, optionsList, `WC.setKoPick('${member.id}','${stage}','${m.id}',this.value)`)}${mark}</div>
        </div>`;
      }).join('');
      return `<h3>${label} <span class="muted" style="font-size:0.75rem;font-weight:600;">(${ptsLabel} pt${ptsLabel>1?'s':''} per correct pick)</span></h3>${items}`;
    }

    const champMark = champRu.champion ? (picks.champion === champRu.champion ? `<span class="correct">✓ ${SCORING.champion}</span>` : '<span class="miss">✗</span>') : '';
    const ruMark    = champRu.runnerUp ? (picks.runnerUp === champRu.runnerUp ? `<span class="correct">✓ ${SCORING.runnerUp}</span>` : '<span class="miss">✗</span>') : '';

    return `
      <div class="card picks-section">
        <h2>${escapeHTML(member.name)}'s picks</h2>
        <p class="muted" style="font-size:0.85rem;">Changes save automatically.</p>

        <h3>🏆 Tournament outcome</h3>
        <div class="pick-row"><div class="lbl">Champion</div><div>${teamSelect(picks.champion || '', allTeamCodes, `WC.setOutcomePick('${member.id}','champion',this.value)`)}${champMark}</div></div>
        <div class="pick-row"><div class="lbl">Runner-up</div><div>${teamSelect(picks.runnerUp || '', allTeamCodes, `WC.setOutcomePick('${member.id}','runnerUp',this.value)`)}${ruMark}</div></div>
        <div class="pick-row"><div class="lbl">Golden Boot</div><div>
          <input style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;"
                 placeholder="Player name" value="${escapeHTML(picks.goldenBoot || '')}"
                 onchange="WC.setOutcomePick('${member.id}','goldenBoot',this.value)" />
          <label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:0.78rem;color:var(--text-muted);">
            <input type="checkbox" ${picks.goldenBootCorrect ? 'checked' : ''}
                   onchange="WC.setOutcomePick('${member.id}','goldenBootCorrect',this.checked)" />
            Mark as correct (10 pts) — toggle on after the tournament ends
          </label>
        </div></div>

        <h3>🎯 Group winners & runners-up</h3>
        ${groupsHTML}

        <h3>⚔️ Knockout winners</h3>
        ${koPicksFor('R32')}
        ${koPicksFor('R16')}
        ${koPicksFor('QF')}
        ${koPicksFor('SF')}
        ${koPicksFor('Final')}
      </div>
    `;
  }

  /* ---- ABOUT ---- */
  function renderAbout() {
    const root = document.getElementById('screen-about');
    root.innerHTML = `
      <div class="card">
        <h2>About this app</h2>
        <p>A family-built companion for the <b>2026 FIFA World Cup</b> — the first 48-team World Cup, co-hosted by Canada, Mexico, and the United States from June 11 to July 19, 2026.</p>
        <h3>What's inside</h3>
        <ul style="padding-left:18px;line-height:1.6;">
          <li><b>Teams</b> — all 48 nations with capital, geography, history, fun facts, and star players</li>
          <li><b>Matches</b> — 104 fixtures with venue, date, and stage. Tap one to enter the score.</li>
          <li><b>Venues</b> — all 16 host stadiums across the three countries</li>
          <li><b>Standings</b> — auto-computed group tables + knockout bracket</li>
          <li><b>Bracket Pool</b> — add each family member, lock in picks, watch the leaderboard</li>
        </ul>
        <h3>How the picks work</h3>
        <p>Each family member predicts group winners + runners-up, knockout-round winners, plus the eventual champion, runner-up, and Golden Boot. Points are awarded automatically as you enter real match results.</p>
        <h3>One note about the data</h3>
        <p>The qualified teams, venues, dates, and player rosters reflect publicly known information about the 2026 World Cup. The <b>group draw and fixtures are placeholders</b> — once the official schedule comes out, tap <b>"Edit groups"</b> on the Teams tab to shuffle them to match.</p>
        <h3>Reset</h3>
        <p>Want to start fresh? <button class="btn danger" onclick="WC.resetAll()">Clear all data</button></p>
      </div>
    `;
  }

  /* ----------------------------------------------------------------
     Match result editor (modal)
     ---------------------------------------------------------------- */
  function editResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;
    if (!m.home || !m.away) {
      toast('Set the teams via the Knockout bracket or play earlier rounds first.');
      // still allow editing teams for KO via small prompt? Keep simple — allow score only if teams known.
    }

    const modal = document.getElementById('match-modal');
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const stage = m.stage === 'group' ? `Group ${m.group} · ${m.round}` : m.round;
    const venue = venueById(m.venue);
    const koTeamPicker = m.stage !== 'group';

    modal.querySelector('.modal-inner').innerHTML = `
      <h3>${stage}</h3>
      <div class="sub">${fmtDate(m.date)} · ${m.time} · ${venue ? escapeHTML(venue.name+', '+venue.city) : ''}</div>

      ${koTeamPicker ? `
        <div class="pick-row"><div class="lbl">Home</div><div>
          <select id="ko-home" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;">
            <option value="">— TBD —</option>
            ${COUNTRIES.map(c => `<option value="${c.code}" ${m.home===c.code?'selected':''}>${c.flag} ${escapeHTML(c.name)}</option>`).join('')}
          </select>
        </div></div>
        <div class="pick-row"><div class="lbl">Away</div><div>
          <select id="ko-away" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;">
            <option value="">— TBD —</option>
            ${COUNTRIES.map(c => `<option value="${c.code}" ${m.away===c.code?'selected':''}>${c.flag} ${escapeHTML(c.name)}</option>`).join('')}
          </select>
        </div></div>
      ` : ''}

      <div class="score-input">
        <div class="side left">${home ? home.flag+' '+escapeHTML(home.name) : '<span class="muted">TBD</span>'}</div>
        <input type="number" min="0" max="20" id="sc-home" value="${m.result?m.result.home:''}" />
        <div class="muted" style="text-align:center;">–</div>
        <input type="number" min="0" max="20" id="sc-away" value="${m.result?m.result.away:''}" />
        <div class="side">${away ? away.flag+' '+escapeHTML(away.name) : '<span class="muted">TBD</span>'}</div>
      </div>

      ${m.stage !== 'group' ? `
        <div class="pick-row"><div class="lbl">PK winner<br><span style="font-size:0.7rem;">(only if draw)</span></div><div>
          <select id="pk-winner" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;">
            <option value="">— none —</option>
            ${home ? `<option value="${home.code}" ${m.result&&m.result.pkWinner===home.code?'selected':''}>${home.flag} ${escapeHTML(home.name)}</option>`:''}
            ${away ? `<option value="${away.code}" ${m.result&&m.result.pkWinner===away.code?'selected':''}>${away.flag} ${escapeHTML(away.name)}</option>`:''}
          </select>
        </div></div>` : ''}

      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.clearResult('${m.id}')">Clear</button>
        <button class="btn ghost" onclick="WC.closeModal()">Cancel</button>
        <button class="btn" onclick="WC.saveResult('${m.id}')">Save</button>
      </div>
    `;
    modal.classList.add('open');
  }

  function saveResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;
    const koTeamPicker = m.stage !== 'group';
    if (koTeamPicker) {
      const newHome = document.getElementById('ko-home').value || null;
      const newAway = document.getElementById('ko-away').value || null;
      m.home = newHome;
      m.away = newAway;
    }
    const hs = parseInt(document.getElementById('sc-home').value, 10);
    const as = parseInt(document.getElementById('sc-away').value, 10);
    if (isNaN(hs) || isNaN(as)) {
      // clearing
      m.result = null;
    } else {
      const pkEl = document.getElementById('pk-winner');
      const pkWinner = pkEl ? (pkEl.value || null) : null;
      m.result = { home: hs, away: as, pkWinner };
    }
    save();
    closeModal();
    toast('Result saved');
    // refresh current screen
    const cur = document.querySelector('.tab.active')?.dataset.tab;
    if (cur) activateTab(cur);
  }

  function clearResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;
    m.result = null;
    save();
    closeModal();
    toast('Result cleared');
    const cur = document.querySelector('.tab.active')?.dataset.tab;
    if (cur) activateTab(cur);
  }

  function closeModal() {
    const modal = document.getElementById('match-modal');
    modal.classList.remove('open');
  }

  /* ----------------------------------------------------------------
     Group editor
     ---------------------------------------------------------------- */
  function openGroupEditor() {
    const modal = document.getElementById('match-modal');
    let html = `<h3>Edit groups</h3><div class="sub">Move teams between groups to match the official 2026 draw.</div>`;
    html += `<div style="max-height:60vh;overflow-y:auto;padding:6px 0;">`;
    for (const c of COUNTRIES) {
      html += `<div class="pick-row" style="grid-template-columns: 1fr 80px; gap:8px;">
        <div>${c.flag} ${escapeHTML(c.name)}</div>
        <select id="grp-${c.code}">
          ${GROUP_LETTERS.map(l => `<option value="${l}" ${c.group===l?'selected':''}>Group ${l}</option>`).join('')}
        </select>
      </div>`;
    }
    html += `</div>
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Cancel</button>
        <button class="btn" onclick="WC.saveGroups()">Save groups</button>
      </div>`;
    modal.querySelector('.modal-inner').innerHTML = html;
    modal.classList.add('open');
  }

  function saveGroups() {
    for (const c of COUNTRIES) {
      const sel = document.getElementById('grp-' + c.code);
      if (sel) c.group = sel.value;
    }
    state.groups = buildGroups();
    // rebuild only group-stage matches (preserve any knockout results)
    const kos = state.matches.filter(m => m.stage !== 'group');
    state.matches = buildMatches(state.groups).filter(m => m.stage === 'group').concat(kos);
    save();
    closeModal();
    toast('Groups updated');
    activateTab('teams');
  }

  /* ----------------------------------------------------------------
     Pool member + pick helpers (exposed)
     ---------------------------------------------------------------- */
  function addMember() {
    const inp = document.getElementById('new-member');
    if (!inp) return;
    const name = (inp.value || '').trim();
    if (!name) return;
    const id = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
    state.members.push({ id, name });
    state.picks[id] = { groupWinners:{}, groupRunnersUp:{}, ko:{}, champion:null, runnerUp:null, goldenBoot:'', goldenBootCorrect:false };
    state.uiSelectedMember = id;
    save();
    inp.value = '';
    renderPool();
  }
  function removeMember(id) {
    if (!confirm('Remove this member and their picks?')) return;
    state.members = state.members.filter(m => m.id !== id);
    delete state.picks[id];
    if (state.uiSelectedMember === id) state.uiSelectedMember = null;
    save();
    renderPool();
  }
  function selectMember(id) {
    state.uiSelectedMember = id;
    renderPool();
  }
  function setGroupPick(memberId, group, slot, value) {
    const p = state.picks[memberId];
    if (!p) return;
    if (slot === 'winner')   p.groupWinners[group]   = value || null;
    if (slot === 'runnerUp') p.groupRunnersUp[group] = value || null;
    save();
    // light refresh only of leaderboard
    renderPool();
  }
  function setKoPick(memberId, stage, matchId, value) {
    const p = state.picks[memberId];
    if (!p) return;
    p.ko[stage] = p.ko[stage] || {};
    p.ko[stage][matchId] = value || null;
    save();
    renderPool();
  }
  function setOutcomePick(memberId, field, value) {
    const p = state.picks[memberId];
    if (!p) return;
    p[field] = value;
    save();
    renderPool();
  }

  function resetAll() {
    if (!confirm('This will erase all results, members, picks, and group customizations. Continue?')) return;
    localStorage.removeItem(STORE_KEY);
    state = {
      groups: buildGroups(),
      matches: buildMatches(buildGroups()),
      members: [],
      picks: {},
    };
    save();
    activateTab('home');
    toast('All data cleared');
  }

  /* ----------------------------------------------------------------
     Init
     ---------------------------------------------------------------- */
  function init() {
    load();
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => activateTab(t.dataset.tab));
    });
    // refresh countdown every second on home
    setInterval(() => {
      if (document.querySelector('.tab.active')?.dataset.tab === 'home') {
        const cd = document.getElementById('cd');
        if (!cd) return;
        const now = new Date();
        const startD = new Date(TOURNAMENT_START);
        const diff = Math.max(0, startD - now);
        const days = Math.floor(diff / 86400000);
        const hrs  = Math.floor(diff / 3600000) % 24;
        const mins = Math.floor(diff / 60000) % 60;
        const secs = Math.floor(diff / 1000) % 60;
        cd.innerHTML = `
          <div class="cd-cell"><div class="n">${days}</div><div class="l">days</div></div>
          <div class="cd-cell"><div class="n">${pad(hrs)}</div><div class="l">hours</div></div>
          <div class="cd-cell"><div class="n">${pad(mins)}</div><div class="l">min</div></div>
          <div class="cd-cell"><div class="n">${pad(secs)}</div><div class="l">sec</div></div>
        `;
      }
    }, 1000);
    activateTab('home');
  }

  // expose
  window.WC = {
    tab: activateTab,
    openCountry,
    renderMatches,
    editResult, saveResult, clearResult, closeModal,
    openGroupEditor, saveGroups,
    addMember, removeMember, selectMember,
    setGroupPick, setKoPick, setOutcomePick,
    resetAll,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
