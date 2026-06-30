/* ================================================================
   WORLD CUP 2026 — app logic & data
   USA · CANADA · MEXICO  |  June 11 – July 19, 2026
   48 teams · 16 venues · 104 matches
   ================================================================ */
(function () {
  'use strict';

  const STORE_KEY = 'wc2026.v2';
  // Local-only, CloudSync-immune redundant backup of match results.
  const RESULTS_BACKUP_KEY = 'wc2026.results';
  const TOURNAMENT_START = '2026-06-11T20:00:00-05:00';
  const TOURNAMENT_END   = '2026-07-19T15:00:00-04:00';

  /* ----------------------------------------------------------------
     VENUES — 16 host stadiums across 3 countries
     ---------------------------------------------------------------- */
  const VENUES = [
    { id:'azt', name:'Estadio Azteca (Banorte)', city:'Mexico City', country:'Mexico',
      utc:-6, cap:87000, opened:1966,
      notes:'Hosts the tournament opener on June 11. The only stadium ever to host two World Cup finals (1970, 1986). At 2,200m altitude, the air is thin.' },
    { id:'akr', name:'Estadio Akron',           city:'Guadalajara',  country:'Mexico',
      utc:-6, cap:49000, opened:2010,
      notes:'Home of Chivas. Its volcano-shaped exterior is wrapped in a green mesh that lights up at night.' },
    { id:'bbva', name:'Estadio BBVA',           city:'Monterrey',    country:'Mexico',
      utc:-6, cap:53500, opened:2015,
      notes:'Nicknamed "El Gigante de Acero" (the Steel Giant). Backed by views of the Cerro de la Silla mountain.' },
    { id:'met', name:'MetLife Stadium',          city:'East Rutherford, NJ', country:'United States',
      utc:-4, cap:82500, opened:2010,
      notes:'Hosts the World Cup Final on July 19. Shared by the NY Giants and NY Jets.' },
    { id:'sofi',name:'SoFi Stadium',             city:'Inglewood, CA',       country:'United States',
      utc:-7, cap:70000, opened:2020,
      notes:'A translucent canopy of ETFE plastic covers the field. Home of the LA Rams and Chargers.' },
    { id:'lev', name:'Levi\'s Stadium',          city:'Santa Clara, CA',     country:'United States',
      utc:-7, cap:68500, opened:2014,
      notes:'Silicon Valley\'s 49ers stadium, packed with tech. A green-roof terrace overlooks the field.' },
    { id:'lum', name:'Lumen Field',              city:'Seattle, WA',         country:'United States',
      utc:-7, cap:69000, opened:2002,
      notes:'Home of the Seahawks and Sounders. Famously the loudest stadium in the NFL.' },
    { id:'mer', name:'Mercedes-Benz Stadium',    city:'Atlanta, GA',         country:'United States',
      utc:-4, cap:71000, opened:2017,
      notes:'A retractable "pinwheel" roof petals open in 8 segments. Home of Atlanta United.' },
    { id:'hrs', name:'Hard Rock Stadium',        city:'Miami Gardens, FL',   country:'United States',
      utc:-4, cap:65000, opened:1987,
      notes:'Home of the Miami Dolphins and the Miami Open tennis. Hosts the 3rd-place match.' },
    { id:'nrg', name:'NRG Stadium',              city:'Houston, TX',         country:'United States',
      utc:-5, cap:72000, opened:2002,
      notes:'NFL\'s first retractable-roof stadium. Home of the Houston Texans.' },
    { id:'att', name:'AT&T Stadium',             city:'Arlington, TX',       country:'United States',
      utc:-5, cap:80000, opened:2009,
      notes:'"Jerry World" — Dallas Cowboys home with a colossal center-hung video board.' },
    { id:'arr', name:'Arrowhead Stadium',        city:'Kansas City, MO',     country:'United States',
      utc:-5, cap:76000, opened:1972,
      notes:'Kansas City Chiefs. NFL record for crowd noise — 142.2 dB.' },
    { id:'gil', name:'Gillette Stadium',         city:'Foxborough, MA',      country:'United States',
      utc:-4, cap:65000, opened:2002,
      notes:'Home of the New England Patriots and Revolution.' },
    { id:'lin', name:'Lincoln Financial Field',  city:'Philadelphia, PA',    country:'United States',
      utc:-4, cap:69000, opened:2003,
      notes:'"The Linc" — Philadelphia Eagles home with a notorious home crowd.' },
    { id:'bmo', name:'BMO Field',                city:'Toronto, ON',         country:'Canada',
      utc:-4, cap:45000, opened:2007,
      notes:'Home of Toronto FC, expanded with temporary seating for 2026.' },
    { id:'bc',  name:'BC Place',                 city:'Vancouver, BC',       country:'Canada',
      utc:-7, cap:54500, opened:1983,
      notes:'A retractable-roof stadium on the Vancouver waterfront, home of the Whitecaps.' },
  ];

  /* ----------------------------------------------------------------
     COUNTRIES — 48 teams.
     Group letters A–L below are EDITABLE TEMPLATES (the official 2026
     draw fills these in). The family can update groups in setup.
     ---------------------------------------------------------------- */
  const COUNTRIES = [
    { code:'CZE', name:'Czech Republic', flag:'🇨🇿', group:'A', pot:3,
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
    { code:'ZAF', name:"South Africa", flag:"\ud83c\uddff\ud83c\udde6", group:'A', pot:3,
      capital:"Pretoria / Cape Town / Bloemfontein", population:"62M", area:"1.22M km\u00b2", languages:"12 official (incl. Zulu, Xhosa, Afrikaans, English)", currency:"South African rand (ZAR)",
      geography:"Two ocean coasts meet at the Cape. Highveld plateau, Drakensberg mountains, Karoo semi-desert, and Kruger's subtropical bushveld.",
      history:"A 1652 Dutch trading post grew into apartheid colonialism; democracy in 1994 with Mandela's presidency.",
      funFacts:["First nation to voluntarily give up nuclear weapons","Home to Kruger National Park","Hosted the 2010 World Cup"],
      wc:{ appearances:3, best:"Group stage", titles:0 },
      stars:[
        { name:"Lyle Foster", pos:"ST", club:"Burnley", age:25, note:"Powerful young forward." },
        { name:"Teboho Mokoena", pos:"CM", club:"Mamelodi Sundowns", age:29, note:"Set-piece specialist." },
        { name:"Themba Zwane", pos:"AM", club:"Mamelodi Sundowns", age:36, note:"Veteran creator." },
        { name:"Ronwen Williams", pos:"GK", club:"Mamelodi Sundowns", age:34, note:"Penalty-shootout hero at AFCON 2023." },
        { name:"Percy Tau", pos:"AM", club:"Al Ahly", age:31, note:"Bafana Bafana captain at times." },
      ]
    },
    { code:'KOR', name:'South Korea', flag:'🇰🇷', group:'A', pot:3,
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
    { code:'BIH', name:"Bosnia & Herzegovina", flag:"\ud83c\udde7\ud83c\udde6", group:'B', pot:4,
      capital:"Sarajevo", population:"3.2M", area:"51,000 km\u00b2", languages:"Bosnian, Croatian, Serbian", currency:"Convertible mark (BAM)",
      geography:"Western Balkans, mostly mountainous (Dinaric Alps). A short 20-km Adriatic coastline at Neum.",
      history:"Independent from Yugoslavia in 1992 after a brutal war (1992\u201395). Sarajevo hosted the 1984 Winter Olympics.",
      funFacts:["Only previous World Cup appearance was 2014","Sarajevo's siege (1992\u201396) was the longest in modern history","Famous for \u0107evapi and Bosnian coffee"],
      wc:{ appearances:1, best:"Group stage (2014)", titles:0 },
      stars:[
        { name:"Edin D\u017eeko", pos:"ST", club:"Fenerbah\u00e7e", age:40, note:"All-time top scorer, evergreen captain." },
        { name:"Sead Kola\u0161inac", pos:"LB", club:"Atalanta", age:32, note:"Powerful overlapping defender." },
        { name:"Miralem Pjani\u0107", pos:"CM", club:"CSKA Moscow", age:35, note:"Elegant passing midfielder." },
        { name:"Ermedin Demirovi\u0107", pos:"ST", club:"VfB Stuttgart", age:28, note:"Reliable goal-scorer." },
      ]
    },
    { code:'CAN', name:'Canada',  flag:'🇨🇦', group:'B', pot:1,
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
    { code:'SUI', name:'Switzerland', flag:'🇨🇭', group:'B', pot:2,
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
        { name:'Marquinhos',      pos:'CB', club:'PSG',         age:32, note:'Captain and rock at the back.' },
        { name:'Alisson Becker',  pos:'GK', club:'Liverpool',   age:33, note:'Among the world\'s best goalkeepers.' },
      ]
    },
    { code:'HAI', name:"Haiti", flag:"\ud83c\udded\ud83c\uddf9", group:'C', pot:4,
      capital:"Port-au-Prince", population:"11.5M", area:"27,750 km\u00b2", languages:"French, Haitian Creole", currency:"Gourde (HTG)",
      geography:"Western third of Hispaniola, sharing with the Dominican Republic. Mountainous interior; Caribbean coastline.",
      history:"First independent Black republic, 1804, after a successful slave revolt against France.",
      funFacts:["First Black-led republic in the world","Won independence from France in 1804","Returns to the World Cup after a 52-year absence (last in 1974)"],
      wc:{ appearances:1, best:"Group stage (1974)", titles:0 },
      stars:[
        { name:"Duckens Nazon", pos:"ST", club:"Caen", age:32, note:"Veteran scorer." },
        { name:"Frantzdy Pierrot", pos:"ST", club:"Damac", age:30, note:"Target man." },
        { name:"Carl Saint\u00e9", pos:"CM", club:"Saint-\u00c9tienne", age:24, note:"Midfield engine." },
      ]
    },
    { code:'MAR', name:'Morocco', flag:'🇲🇦', group:'C', pot:2,
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
    { code:'SCO', name:'Scotland', flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', group:'C', pot:3,
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
    { code:'AUS', name:'Australia', flag:'🇦🇺', group:'D', pot:3,
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
    { code:'PAR', name:'Paraguay', flag:'🇵🇾', group:'D', pot:3,
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
    { code:'TUR', name:'Türkiye (Turkey)', flag:'🇹🇷', group:'D', pot:2,
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
    { code:'CUW', name:"Cura\u00e7ao", flag:"\ud83c\udde8\ud83c\uddfc", group:'E', pot:4,
      capital:"Willemstad", population:"150,000", area:"444 km\u00b2", languages:"Dutch, Papiamento, English", currency:"Caribbean guilder (XCG)",
      geography:"A small Dutch Caribbean island off the coast of Venezuela. Arid, breezy, and ringed by coral reefs.",
      history:"Dutch colony since 1634; constituent country of the Kingdom of the Netherlands since 2010.",
      funFacts:["Smallest country (by population) ever to qualify for a World Cup","Willemstad's colourful colonial centre is UNESCO heritage","Many players are Dutch-born with Cura\u00e7aoan heritage"],
      wc:{ appearances:0, best:"Debut", titles:0 },
      stars:[
        { name:"Leandro Bacuna", pos:"CM", club:"unattached", age:35, note:"Veteran captain." },
        { name:"Tahith Chong", pos:"AM", club:"Sheffield United", age:26, note:"Former Man Utd youth product." },
        { name:"Juninho Bacuna", pos:"CM", club:"Birmingham City", age:28, note:"Long-shot specialist." },
        { name:"Cuco Martina", pos:"RB", club:"unattached", age:36, note:"Experienced fullback." },
      ]
    },
    { code:'ECU', name:'Ecuador', flag:'🇪🇨', group:'E', pot:3,
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
    { code:'CIV', name:'Ivory Coast', flag:'🇨🇮', group:'E', pot:2,
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
    { code:'JPN', name:'Japan', flag:'🇯🇵', group:'F', pot:1,
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
    { code:'NED', name:'Netherlands', flag:'🇳🇱', group:'F', pot:1,
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
    { code:'SWE', name:"Sweden", flag:"\ud83c\uddf8\ud83c\uddea", group:'F', pot:2,
      capital:"Stockholm", population:"10.6M", area:"450,000 km\u00b2", languages:"Swedish", currency:"Swedish krona (SEK)",
      geography:"Long, narrow Scandinavian country: forested south, rugged north stretching above the Arctic Circle. Thousands of lakes and an archipelagic coast.",
      history:"A unified kingdom since the Viking age; a great European power in the 1600s; famously neutral in modern wars.",
      funFacts:["IKEA, ABBA, Spotify and Volvo are all Swedish","Hosts the Nobel Prizes (except Peace)","Made the 1958 World Cup final on home soil"],
      wc:{ appearances:13, best:"Runners-up (1958), 3rd (1950, 94)", titles:0 },
      stars:[
        { name:"Alexander Isak", pos:"ST", club:"Liverpool", age:26, note:"Lethal modern centre-forward." },
        { name:"Viktor Gy\u00f6keres", pos:"ST", club:"Arsenal", age:27, note:"Powerful, prolific striker." },
        { name:"Dejan Kulusevski", pos:"AM", club:"Tottenham", age:26, note:"Two-footed creator on the right." },
        { name:"Anthony Elanga", pos:"RW", club:"Newcastle", age:24, note:"Lightning-quick winger." },
        { name:"Lucas Bergvall", pos:"CM", club:"Tottenham", age:20, note:"Emerging midfield talent." },
      ]
    },
    { code:'TUN', name:'Tunisia', flag:'🇹🇳', group:'F', pot:3,
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
    { code:'BEL', name:'Belgium', flag:'🇧🇪', group:'G', pot:1,
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
    { code:'IRN', name:'Iran', flag:'🇮🇷', group:'G', pot:3,
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
    { code:'NZL', name:'New Zealand', flag:'🇳🇿', group:'G', pot:4,
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
    { code:'CPV', name:"Cape Verde", flag:"\ud83c\udde8\ud83c\uddfb", group:'H', pot:4,
      capital:"Praia", population:"600,000", area:"4,033 km\u00b2", languages:"Portuguese, Cape Verdean Creole", currency:"Cape Verdean escudo (CVE)",
      geography:"A volcanic archipelago of 10 islands off the West African coast. Trade winds and warm year-round.",
      history:"Uninhabited Portuguese colony from the 1460s; independent in 1975. A regional democratic success story.",
      funFacts:["Smallest African nation ever to qualify for a World Cup","Ces\u00e1ria \u00c9vora made morna music world-famous","Population on the islands is dwarfed by the global diaspora"],
      wc:{ appearances:0, best:"Debut", titles:0 },
      stars:[
        { name:"Ryan Mendes", pos:"AM", club:"Al-Wakrah", age:36, note:"Captain and historic talisman." },
        { name:"Beb\u00e9", pos:"LW", club:"Cova da Piedade", age:35, note:"Former Man Utd winger turned Cape Verde stalwart." },
        { name:"Garry Rodrigues", pos:"LW", club:"unattached", age:35, note:"Tricky wide attacker." },
        { name:"Logan Costa", pos:"CB", club:"Toulouse", age:24, note:"Composed young defender." },
      ]
    },
    { code:'KSA', name:'Saudi Arabia', flag:'🇸🇦', group:'H', pot:3,
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
    { code:'ESP', name:'Spain', flag:'🇪🇸', group:'H', pot:1,
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
    { code:'URU', name:'Uruguay', flag:'🇺🇾', group:'H', pot:2,
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
    { code:'FRA', name:'France', flag:'🇫🇷', group:'I', pot:1,
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
    { code:'IRQ', name:"Iraq", flag:"\ud83c\uddee\ud83c\uddf6", group:'I', pot:4,
      capital:"Baghdad", population:"45M", area:"438,000 km\u00b2", languages:"Arabic, Kurdish", currency:"Iraqi dinar (IQD)",
      geography:"Mesopotamia \u2014 the land between the Tigris and Euphrates. Mountains in the Kurdish north, marshes in the south, desert in the west.",
      history:"Cradle of civilization; modern republic since 1958. Has rebuilt football amid decades of conflict.",
      funFacts:["Site of ancient Babylon and Ur \u2014 among the world's oldest cities","Won the 2007 AFC Asian Cup","Second-ever World Cup appearance (first was 1986)"],
      wc:{ appearances:1, best:"Group stage (1986)", titles:0 },
      stars:[
        { name:"Aymen Hussein", pos:"ST", club:"Al-Qadsiah", age:29, note:"Aerial threat in attack." },
        { name:"Ali Al-Hamadi", pos:"ST", club:"Stoke City", age:24, note:"England-raised forward." },
        { name:"Zidane Iqbal", pos:"AM", club:"Utrecht", age:23, note:"Former Man Utd academy product." },
        { name:"Ibrahim Bayesh", pos:"AM", club:"Al-Zawraa", age:28, note:"Creative midfielder." },
      ]
    },
    { code:'NOR', name:'Norway', flag:'🇳🇴', group:'I', pot:3,
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
    { code:'SEN', name:'Senegal', flag:'🇸🇳', group:'I', pot:2,
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
    { code:'ALG', name:"Algeria", flag:"\ud83c\udde9\ud83c\uddff", group:'J', pot:3,
      capital:"Algiers", population:"45M", area:"2.38M km\u00b2", languages:"Arabic, Berber", currency:"Algerian dinar (DZD)",
      geography:"Africa's largest country. Mediterranean coast, Atlas Mountains, vast Sahara stretching south.",
      history:"A long French colonial period ended with independence in 1962 after a brutal war.",
      funFacts:["Largest country in Africa","African champion in 1990 and 2019","Famous for \"Disaster of Gij\u00f3n\" upset of West Germany in 1982"],
      wc:{ appearances:5, best:"Round of 16 (2014)", titles:0 },
      stars:[
        { name:"Riyad Mahrez", pos:"RW", club:"Al-Ahli", age:35, note:"Captain and left-footed wizard." },
        { name:"Isma\u00ebl Bennacer", pos:"CM", club:"Marseille", age:28, note:"Press-resistant midfielder." },
        { name:"Houssem Aouar", pos:"AM", club:"Al-Ittihad", age:27, note:"Creative midfielder." },
        { name:"Sa\u00efd Benrahma", pos:"LW", club:"Lyon", age:30, note:"Tricky winger." },
        { name:"Amine Gouiri", pos:"ST", club:"Marseille", age:26, note:"Mobile forward." },
      ]
    },
    { code:'ARG', name:'Argentina', flag:'🇦🇷', group:'J', pot:1,
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
    { code:'AUT', name:'Austria', flag:'🇦🇹', group:'J', pot:2,
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
    { code:'JOR', name:'Jordan', flag:'🇯🇴', group:'J', pot:4,
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
    { code:'COL', name:'Colombia', flag:'🇨🇴', group:'K', pot:2,
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
    { code:'COD', name:"DR Congo", flag:"\ud83c\udde8\ud83c\udde9", group:'K', pot:4,
      capital:"Kinshasa", population:"109M", area:"2.34M km\u00b2", languages:"French, Lingala, Swahili, Kikongo, Tshiluba", currency:"Congolese franc (CDF)",
      geography:"Africa's second-largest country. Most of the Congo rainforest is here, plus the mighty Congo river.",
      history:"Brutal Belgian colonization until 1960; long instability followed. Kinshasa is one of the world's largest French-speaking cities.",
      funFacts:["Second-largest country in Africa","Home to the largest rainforest after the Amazon","Returns to the World Cup after a 52-year absence (1974 as Zaire)"],
      wc:{ appearances:1, best:"Group stage (1974 as Zaire)", titles:0 },
      stars:[
        { name:"C\u00e9dric Bakambu", pos:"ST", club:"Real Betis", age:35, note:"Captain and goal-scorer." },
        { name:"Yoane Wissa", pos:"ST", club:"Newcastle", age:29, note:"Tireless forward." },
        { name:"Th\u00e9o Bongonda", pos:"LW", club:"Krasnodar", age:30, note:"Pacey winger." },
        { name:"Chancel Mbemba", pos:"CB", club:"Lille", age:31, note:"Defensive leader." },
        { name:"Axel Tuanzebe", pos:"CB", club:"Burnley", age:28, note:"Former Man Utd defender." },
      ]
    },
    { code:'POR', name:'Portugal', flag:'🇵🇹', group:'K', pot:1,
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
    { code:'UZB', name:'Uzbekistan', flag:'🇺🇿', group:'K', pot:4,
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
    { code:'CRO', name:'Croatia', flag:'🇭🇷', group:'L', pot:2,
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
    { code:'ENG', name:'England', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', group:'L', pot:1,
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
        { name:'Cole Palmer',     pos:'AM', club:'Chelsea',        age:24, note:'Ice-cold finisher and creator.' },
      ]
    },
    { code:'GHA', name:'Ghana', flag:'🇬🇭', group:'L', pot:4,
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
    { code:'PAN', name:'Panama', flag:'🇵🇦', group:'L', pot:4,
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
    }
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

  // Real 2026 World Cup schedule sourced from OpenFootball (public domain).
  // Source: https://github.com/openfootball/worldcup.json
  const OFFICIAL_SCHEDULE = [
  {
    "id": "m001",
    "date": "2026-06-11",
    "time": "13:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 1",
    "home": "MEX",
    "away": "ZAF",
    "venue": "azt",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m002",
    "date": "2026-06-11",
    "time": "20:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 1",
    "home": "KOR",
    "away": "CZE",
    "venue": "akr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m003",
    "date": "2026-06-12",
    "time": "15:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 2",
    "home": "CAN",
    "away": "BIH",
    "venue": "bmo",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m004",
    "date": "2026-06-12",
    "time": "18:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 2",
    "home": "USA",
    "away": "PAR",
    "venue": "sofi",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m005",
    "date": "2026-06-13",
    "time": "12:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 3",
    "home": "QAT",
    "away": "SUI",
    "venue": "lev",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m006",
    "date": "2026-06-13",
    "time": "18:00",
    "stage": "group",
    "group": "C",
    "round": "Matchday 3",
    "home": "BRA",
    "away": "MAR",
    "venue": "met",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m007",
    "date": "2026-06-13",
    "time": "21:00",
    "stage": "group",
    "group": "C",
    "round": "Matchday 3",
    "home": "HAI",
    "away": "SCO",
    "venue": "gil",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m008",
    "date": "2026-06-13",
    "time": "21:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 3",
    "home": "AUS",
    "away": "TUR",
    "venue": "bc",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m009",
    "date": "2026-06-14",
    "time": "12:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 4",
    "home": "GER",
    "away": "CUW",
    "venue": "nrg",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m010",
    "date": "2026-06-14",
    "time": "15:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 4",
    "home": "NED",
    "away": "JPN",
    "venue": "att",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m011",
    "date": "2026-06-14",
    "time": "19:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 4",
    "home": "CIV",
    "away": "ECU",
    "venue": "lin",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m012",
    "date": "2026-06-14",
    "time": "20:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 4",
    "home": "SWE",
    "away": "TUN",
    "venue": "bbva",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m013",
    "date": "2026-06-15",
    "time": "12:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 5",
    "home": "BEL",
    "away": "EGY",
    "venue": "lum",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m014",
    "date": "2026-06-15",
    "time": "12:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 5",
    "home": "ESP",
    "away": "CPV",
    "venue": "mer",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m015",
    "date": "2026-06-15",
    "time": "18:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 5",
    "home": "IRN",
    "away": "NZL",
    "venue": "sofi",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m016",
    "date": "2026-06-15",
    "time": "18:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 5",
    "home": "KSA",
    "away": "URU",
    "venue": "hrs",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m017",
    "date": "2026-06-16",
    "time": "15:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 6",
    "home": "FRA",
    "away": "SEN",
    "venue": "met",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m018",
    "date": "2026-06-16",
    "time": "18:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 6",
    "home": "IRQ",
    "away": "NOR",
    "venue": "gil",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m019",
    "date": "2026-06-16",
    "time": "20:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 6",
    "home": "ARG",
    "away": "ALG",
    "venue": "arr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m020",
    "date": "2026-06-16",
    "time": "21:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 6",
    "home": "AUT",
    "away": "JOR",
    "venue": "lev",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m021",
    "date": "2026-06-17",
    "time": "12:00",
    "stage": "group",
    "group": "K",
    "round": "Matchday 7",
    "home": "POR",
    "away": "COD",
    "venue": "nrg",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m022",
    "date": "2026-06-17",
    "time": "15:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 7",
    "home": "ENG",
    "away": "CRO",
    "venue": "att",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m023",
    "date": "2026-06-17",
    "time": "19:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 7",
    "home": "GHA",
    "away": "PAN",
    "venue": "bmo",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m024",
    "date": "2026-06-17",
    "time": "20:00",
    "stage": "group",
    "group": "K",
    "round": "Matchday 7",
    "home": "UZB",
    "away": "COL",
    "venue": "azt",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m025",
    "date": "2026-06-18",
    "time": "12:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 8",
    "home": "CZE",
    "away": "ZAF",
    "venue": "mer",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m026",
    "date": "2026-06-18",
    "time": "12:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 8",
    "home": "SUI",
    "away": "BIH",
    "venue": "sofi",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m027",
    "date": "2026-06-18",
    "time": "15:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 8",
    "home": "CAN",
    "away": "QAT",
    "venue": "bc",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m028",
    "date": "2026-06-18",
    "time": "19:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 8",
    "home": "MEX",
    "away": "KOR",
    "venue": "akr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m029",
    "date": "2026-06-19",
    "time": "12:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 9",
    "home": "USA",
    "away": "AUS",
    "venue": "lum",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m030",
    "date": "2026-06-19",
    "time": "18:00",
    "stage": "group",
    "group": "C",
    "round": "Matchday 9",
    "home": "SCO",
    "away": "MAR",
    "venue": "gil",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m031",
    "date": "2026-06-19",
    "time": "20:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 9",
    "home": "TUR",
    "away": "PAR",
    "venue": "lev",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m032",
    "date": "2026-06-19",
    "time": "20:30",
    "stage": "group",
    "group": "C",
    "round": "Matchday 9",
    "home": "BRA",
    "away": "HAI",
    "venue": "lin",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m033",
    "date": "2026-06-20",
    "time": "12:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 10",
    "home": "NED",
    "away": "SWE",
    "venue": "nrg",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m034",
    "date": "2026-06-20",
    "time": "16:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 10",
    "home": "GER",
    "away": "CIV",
    "venue": "bmo",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m035",
    "date": "2026-06-20",
    "time": "19:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 10",
    "home": "ECU",
    "away": "CUW",
    "venue": "arr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m036",
    "date": "2026-06-20",
    "time": "22:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 10",
    "home": "TUN",
    "away": "JPN",
    "venue": "bbva",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m037",
    "date": "2026-06-21",
    "time": "12:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 11",
    "home": "BEL",
    "away": "IRN",
    "venue": "sofi",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m038",
    "date": "2026-06-21",
    "time": "12:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 11",
    "home": "ESP",
    "away": "KSA",
    "venue": "mer",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m039",
    "date": "2026-06-21",
    "time": "18:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 11",
    "home": "NZL",
    "away": "EGY",
    "venue": "bc",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m040",
    "date": "2026-06-21",
    "time": "18:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 11",
    "home": "URU",
    "away": "CPV",
    "venue": "hrs",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m041",
    "date": "2026-06-22",
    "time": "12:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 12",
    "home": "ARG",
    "away": "AUT",
    "venue": "att",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m042",
    "date": "2026-06-22",
    "time": "17:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 12",
    "home": "FRA",
    "away": "IRQ",
    "venue": "lin",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m043",
    "date": "2026-06-22",
    "time": "20:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 12",
    "home": "NOR",
    "away": "SEN",
    "venue": "met",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m044",
    "date": "2026-06-22",
    "time": "20:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 12",
    "home": "JOR",
    "away": "ALG",
    "venue": "lev",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m045",
    "date": "2026-06-23",
    "time": "12:00",
    "stage": "group",
    "group": "K",
    "round": "Matchday 13",
    "home": "POR",
    "away": "UZB",
    "venue": "nrg",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m046",
    "date": "2026-06-23",
    "time": "16:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 13",
    "home": "ENG",
    "away": "GHA",
    "venue": "gil",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m047",
    "date": "2026-06-23",
    "time": "19:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 13",
    "home": "PAN",
    "away": "CRO",
    "venue": "bmo",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m048",
    "date": "2026-06-23",
    "time": "20:00",
    "stage": "group",
    "group": "K",
    "round": "Matchday 13",
    "home": "COL",
    "away": "COD",
    "venue": "akr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m049",
    "date": "2026-06-24",
    "time": "12:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 14",
    "home": "SUI",
    "away": "CAN",
    "venue": "bc",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m050",
    "date": "2026-06-24",
    "time": "12:00",
    "stage": "group",
    "group": "B",
    "round": "Matchday 14",
    "home": "BIH",
    "away": "QAT",
    "venue": "lum",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m051",
    "date": "2026-06-24",
    "time": "18:00",
    "stage": "group",
    "group": "C",
    "round": "Matchday 14",
    "home": "SCO",
    "away": "BRA",
    "venue": "hrs",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m052",
    "date": "2026-06-24",
    "time": "18:00",
    "stage": "group",
    "group": "C",
    "round": "Matchday 14",
    "home": "MAR",
    "away": "HAI",
    "venue": "mer",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m053",
    "date": "2026-06-24",
    "time": "19:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 14",
    "home": "CZE",
    "away": "MEX",
    "venue": "azt",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m054",
    "date": "2026-06-24",
    "time": "19:00",
    "stage": "group",
    "group": "A",
    "round": "Matchday 14",
    "home": "ZAF",
    "away": "KOR",
    "venue": "bbva",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m055",
    "date": "2026-06-25",
    "time": "16:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 15",
    "home": "CUW",
    "away": "CIV",
    "venue": "lin",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m056",
    "date": "2026-06-25",
    "time": "16:00",
    "stage": "group",
    "group": "E",
    "round": "Matchday 15",
    "home": "ECU",
    "away": "GER",
    "venue": "met",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m057",
    "date": "2026-06-25",
    "time": "18:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 15",
    "home": "JPN",
    "away": "SWE",
    "venue": "att",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m058",
    "date": "2026-06-25",
    "time": "18:00",
    "stage": "group",
    "group": "F",
    "round": "Matchday 15",
    "home": "TUN",
    "away": "NED",
    "venue": "arr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m059",
    "date": "2026-06-25",
    "time": "19:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 15",
    "home": "TUR",
    "away": "USA",
    "venue": "sofi",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m060",
    "date": "2026-06-25",
    "time": "19:00",
    "stage": "group",
    "group": "D",
    "round": "Matchday 15",
    "home": "PAR",
    "away": "AUS",
    "venue": "lev",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m061",
    "date": "2026-06-26",
    "time": "15:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 16",
    "home": "NOR",
    "away": "FRA",
    "venue": "gil",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m062",
    "date": "2026-06-26",
    "time": "15:00",
    "stage": "group",
    "group": "I",
    "round": "Matchday 16",
    "home": "SEN",
    "away": "IRQ",
    "venue": "bmo",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m063",
    "date": "2026-06-26",
    "time": "18:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 16",
    "home": "URU",
    "away": "ESP",
    "venue": "akr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m064",
    "date": "2026-06-26",
    "time": "19:00",
    "stage": "group",
    "group": "H",
    "round": "Matchday 16",
    "home": "CPV",
    "away": "KSA",
    "venue": "nrg",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m065",
    "date": "2026-06-26",
    "time": "20:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 16",
    "home": "EGY",
    "away": "IRN",
    "venue": "lum",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m066",
    "date": "2026-06-26",
    "time": "20:00",
    "stage": "group",
    "group": "G",
    "round": "Matchday 16",
    "home": "NZL",
    "away": "BEL",
    "venue": "bc",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m067",
    "date": "2026-06-27",
    "time": "17:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 17",
    "home": "PAN",
    "away": "ENG",
    "venue": "met",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m068",
    "date": "2026-06-27",
    "time": "17:00",
    "stage": "group",
    "group": "L",
    "round": "Matchday 17",
    "home": "CRO",
    "away": "GHA",
    "venue": "lin",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m069",
    "date": "2026-06-27",
    "time": "19:30",
    "stage": "group",
    "group": "K",
    "round": "Matchday 17",
    "home": "COL",
    "away": "POR",
    "venue": "hrs",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m070",
    "date": "2026-06-27",
    "time": "19:30",
    "stage": "group",
    "group": "K",
    "round": "Matchday 17",
    "home": "COD",
    "away": "UZB",
    "venue": "mer",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m071",
    "date": "2026-06-27",
    "time": "21:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 17",
    "home": "ALG",
    "away": "AUT",
    "venue": "arr",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m072",
    "date": "2026-06-27",
    "time": "21:00",
    "stage": "group",
    "group": "J",
    "round": "Matchday 17",
    "home": "JOR",
    "away": "ARG",
    "venue": "att",
    "result": null,
    "home_label": null,
    "away_label": null
  },
  {
    "id": "m073",
    "date": "2026-06-28",
    "time": "12:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "sofi",
    "result": null,
    "home_label": "2A",
    "away_label": "2B"
  },
  {
    "id": "m074",
    "date": "2026-06-29",
    "time": "12:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "nrg",
    "result": null,
    "home_label": "1C",
    "away_label": "2F"
  },
  {
    "id": "m075",
    "date": "2026-06-29",
    "time": "16:30",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "gil",
    "result": null,
    "home_label": "1E",
    "away_label": "3A/B/C/D/F"
  },
  {
    "id": "m076",
    "date": "2026-06-29",
    "time": "19:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "bbva",
    "result": null,
    "home_label": "1F",
    "away_label": "2C"
  },
  {
    "id": "m077",
    "date": "2026-06-30",
    "time": "12:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "att",
    "result": null,
    "home_label": "2E",
    "away_label": "2I"
  },
  {
    "id": "m078",
    "date": "2026-06-30",
    "time": "17:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "met",
    "result": null,
    "home_label": "1I",
    "away_label": "3C/D/F/G/H"
  },
  {
    "id": "m079",
    "date": "2026-06-30",
    "time": "19:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "azt",
    "result": null,
    "home_label": "1A",
    "away_label": "3C/E/F/H/I"
  },
  {
    "id": "m080",
    "date": "2026-07-01",
    "time": "12:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "mer",
    "result": null,
    "home_label": "1L",
    "away_label": "3E/H/I/J/K"
  },
  {
    "id": "m081",
    "date": "2026-07-01",
    "time": "13:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "lum",
    "result": null,
    "home_label": "1G",
    "away_label": "3A/E/H/I/J"
  },
  {
    "id": "m082",
    "date": "2026-07-01",
    "time": "17:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "lev",
    "result": null,
    "home_label": "1D",
    "away_label": "3B/E/F/I/J"
  },
  {
    "id": "m083",
    "date": "2026-07-02",
    "time": "12:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "sofi",
    "result": null,
    "home_label": "1H",
    "away_label": "2J"
  },
  {
    "id": "m084",
    "date": "2026-07-02",
    "time": "19:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "bmo",
    "result": null,
    "home_label": "2K",
    "away_label": "2L"
  },
  {
    "id": "m085",
    "date": "2026-07-02",
    "time": "20:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "bc",
    "result": null,
    "home_label": "1B",
    "away_label": "3E/F/G/I/J"
  },
  {
    "id": "m086",
    "date": "2026-07-03",
    "time": "13:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "att",
    "result": null,
    "home_label": "2D",
    "away_label": "2G"
  },
  {
    "id": "m087",
    "date": "2026-07-03",
    "time": "18:00",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "hrs",
    "result": null,
    "home_label": "1J",
    "away_label": "2H"
  },
  {
    "id": "m088",
    "date": "2026-07-03",
    "time": "20:30",
    "stage": "R32",
    "group": null,
    "round": "Round of 32",
    "home": null,
    "away": null,
    "venue": "arr",
    "result": null,
    "home_label": "1K",
    "away_label": "3D/E/I/J/L"
  },
  {
    "id": "m089",
    "date": "2026-07-04",
    "time": "12:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "nrg",
    "result": null,
    "home_label": "W73",
    "away_label": "W76"
  },
  {
    "id": "m090",
    "date": "2026-07-04",
    "time": "17:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "lin",
    "result": null,
    "home_label": "W75",
    "away_label": "W78"
  },
  {
    "id": "m091",
    "date": "2026-07-05",
    "time": "16:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "met",
    "result": null,
    "home_label": "W74",
    "away_label": "W77"
  },
  {
    "id": "m092",
    "date": "2026-07-05",
    "time": "18:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "azt",
    "result": null,
    "home_label": "W79",
    "away_label": "W80"
  },
  {
    "id": "m093",
    "date": "2026-07-06",
    "time": "14:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "att",
    "result": null,
    "home_label": "W83",
    "away_label": "W84"
  },
  {
    "id": "m094",
    "date": "2026-07-06",
    "time": "17:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "lum",
    "result": null,
    "home_label": "W81",
    "away_label": "W82"
  },
  {
    "id": "m095",
    "date": "2026-07-07",
    "time": "12:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "mer",
    "result": null,
    "home_label": "W86",
    "away_label": "W87"
  },
  {
    "id": "m096",
    "date": "2026-07-07",
    "time": "13:00",
    "stage": "R16",
    "group": null,
    "round": "Round of 16",
    "home": null,
    "away": null,
    "venue": "bc",
    "result": null,
    "home_label": "W85",
    "away_label": "W88"
  },
  {
    "id": "m097",
    "date": "2026-07-09",
    "time": "16:00",
    "stage": "QF",
    "group": null,
    "round": "Quarter-final",
    "home": null,
    "away": null,
    "venue": "gil",
    "result": null,
    "home_label": "W89",
    "away_label": "W90"
  },
  {
    "id": "m098",
    "date": "2026-07-10",
    "time": "12:00",
    "stage": "QF",
    "group": null,
    "round": "Quarter-final",
    "home": null,
    "away": null,
    "venue": "sofi",
    "result": null,
    "home_label": "W93",
    "away_label": "W94"
  },
  {
    "id": "m099",
    "date": "2026-07-11",
    "time": "17:00",
    "stage": "QF",
    "group": null,
    "round": "Quarter-final",
    "home": null,
    "away": null,
    "venue": "hrs",
    "result": null,
    "home_label": "W91",
    "away_label": "W92"
  },
  {
    "id": "m100",
    "date": "2026-07-11",
    "time": "20:00",
    "stage": "QF",
    "group": null,
    "round": "Quarter-final",
    "home": null,
    "away": null,
    "venue": "arr",
    "result": null,
    "home_label": "W95",
    "away_label": "W96"
  },
  {
    "id": "m101",
    "date": "2026-07-14",
    "time": "14:00",
    "stage": "SF",
    "group": null,
    "round": "Semi-final",
    "home": null,
    "away": null,
    "venue": "att",
    "result": null,
    "home_label": "W97",
    "away_label": "W98"
  },
  {
    "id": "m102",
    "date": "2026-07-15",
    "time": "15:00",
    "stage": "SF",
    "group": null,
    "round": "Semi-final",
    "home": null,
    "away": null,
    "venue": "mer",
    "result": null,
    "home_label": "W99",
    "away_label": "W100"
  },
  {
    "id": "m103",
    "date": "2026-07-18",
    "time": "17:00",
    "stage": "3rd",
    "group": null,
    "round": "Match for third place",
    "home": null,
    "away": null,
    "venue": "hrs",
    "result": null,
    "home_label": "L101",
    "away_label": "L102"
  },
  {
    "id": "m104",
    "date": "2026-07-19",
    "time": "15:00",
    "stage": "Final",
    "group": null,
    "round": "Final",
    "home": null,
    "away": null,
    "venue": "met",
    "result": null,
    "home_label": "W101",
    "away_label": "W102"
  }
];

  function buildMatches(_groups) {
    // Deep clone OFFICIAL_SCHEDULE so editing one match doesn't mutate the constant.
    return JSON.parse(JSON.stringify(OFFICIAL_SCHEDULE));
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

  // Fields that can be mutated per match (vs the canonical OpenFootball
  // baseline). Anything else stays read-only at the OFFICIAL_SCHEDULE level.
  const MATCH_OVERRIDE_FIELDS = ['home', 'away', 'date', 'time', 'venue', 'result'];

  function _scheduleBaseline(id) {
    return OFFICIAL_SCHEDULE.find(x => x.id === id);
  }
  function _diffGroups() {
    for (const g of GROUP_LETTERS) {
      const a = (state.groups[g] || []).slice().sort().join(',');
      const b = (defaultGroups[g] || []).slice().sort().join(',');
      if (a !== b) return state.groups;
    }
    return null;
  }
  // Persisted form of a match result: only the fields that matter for
  // scoring and the bracket. The scorer/card arrays (goals1/goals2/
  // cards1/cards2) are large and fully regenerable from the feed/summary,
  // so they're kept in memory for the session but NOT persisted — storing
  // them bloated the bucket and could blow the localStorage quota, which
  // silently dropped saves and made scores vanish on the next open.
  function _leanResult(r) {
    if (!r || typeof r !== 'object') return r;
    const out = { home: r.home, away: r.away, pkWinner: r.pkWinner || null };
    if (r.eventId) out.eventId = r.eventId; // tiny; lets the modal lazy-fetch detail
    return out;
  }

  function _diffMatches() {
    const overrides = {};
    for (const m of state.matches) {
      const base = _scheduleBaseline(m.id);
      if (!base) continue;
      const ko = m.stage !== 'group';
      const diff = {};
      for (const k of MATCH_OVERRIDE_FIELDS) {
        // Knockout home/away are DERIVED from results + the official
        // feed — never persist them. Storing them caused a cross-device
        // resurrection bug: a reset on one device drops the override,
        // but a stale value on another device merges back via union.
        // Persisting only `result` makes the bracket a pure function of
        // synced results, so it re-derives identically everywhere.
        if (ko && (k === 'home' || k === 'away')) continue;
        let mv = m[k] === undefined ? null : m[k];
        if (k === 'result') mv = _leanResult(mv);
        const bv = base[k] === undefined ? null : base[k];
        if (JSON.stringify(mv) !== JSON.stringify(bv)) diff[k] = mv;
      }
      if (Object.keys(diff).length > 0) overrides[m.id] = diff;
    }
    return Object.keys(overrides).length > 0 ? overrides : null;
  }

  function load() {
    // Always re-seed matches from the canonical schedule so we don't carry
    // 30KB of redundant fixture data through every save cycle.
    state.matches = JSON.parse(JSON.stringify(OFFICIAL_SCHEDULE));
    state.groups = JSON.parse(JSON.stringify(defaultGroups));

    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved.groups && Object.keys(saved.groups).length > 0) {
        state.groups = saved.groups;
      }

      // Ignore any stored knockout home/away — those are derived (see
      // _diffMatches). Skipping them on load also strips stale values
      // from older snapshots / the server so the resurrection bug
      // self-heals: the bracket re-derives from results below.
      const _skipKoTeam = (m, k) => m.stage !== 'group' && (k === 'home' || k === 'away');

      // New slim shape — matchOverrides keyed by match id
      if (saved.matchOverrides && typeof saved.matchOverrides === 'object') {
        for (const id of Object.keys(saved.matchOverrides)) {
          const m = state.matches.find(x => x.id === id);
          if (!m) continue;
          const diff = saved.matchOverrides[id] || {};
          for (const k of MATCH_OVERRIDE_FIELDS) {
            if (k in diff && !_skipKoTeam(m, k)) m[k] = diff[k];
          }
        }
      }

      // Back-compat: old payloads stored the whole matches array inline.
      if (Array.isArray(saved.matches)) {
        for (const sm of saved.matches) {
          if (!sm || !sm.id) continue;
          const m = state.matches.find(x => x.id === sm.id);
          if (!m) continue;
          const base = _scheduleBaseline(sm.id);
          for (const k of MATCH_OVERRIDE_FIELDS) {
            if (k in sm && !_skipKoTeam(m, k)) {
              const sv = sm[k] === undefined ? null : sm[k];
              const bv = base && base[k] !== undefined ? base[k] : null;
              if (JSON.stringify(sv) !== JSON.stringify(bv)) m[k] = sm[k];
            }
          }
        }
      }

      state.members = Array.isArray(saved.members) ? saved.members : [];
      state.picks = (saved.picks && typeof saved.picks === 'object') ? saved.picks : {};
      state.uiSelectedMember = saved.uiSelectedMember || null;
      // koAuto is in-session bookkeeping only (provisional resolver fills).
      state.koAuto = {};
      // koTeams = CONFIRMED knockout team assignments (official feed or a
      // manual correction) that persist + sync. Apply them onto the
      // matches and mirror into koFeed so the provisional resolver won't
      // overwrite a confirmed team. Provisional teams are NOT stored here
      // — they re-derive from results each load.
      state.koTeams = (saved.koTeams && typeof saved.koTeams === 'object') ? saved.koTeams : {};
      state.koFeed = {};
      for (const key of Object.keys(state.koTeams)) {
        const dot = key.lastIndexOf('.');
        const id = key.slice(0, dot), side = key.slice(dot + 1);
        const m = state.matches.find(x => x.id === id);
        if (m && (side === 'home' || side === 'away') && state.koTeams[key]) {
          m[side] = state.koTeams[key];
          state.koFeed[key] = true;
        }
      }
    } catch (e) { console.warn('wc load failed', e); }

    // Heal from the redundant results backup: fill any match result the
    // main bucket is missing (e.g. it was out-flanked by a stale
    // cross-device pull, or a quota hiccup dropped it). Only FILLS gaps —
    // never overrides a result the main bucket already has.
    try {
      const raw = localStorage.getItem(RESULTS_BACKUP_KEY);
      if (raw) {
        const rmap = JSON.parse(raw);
        for (const id of Object.keys(rmap)) {
          const m = state.matches.find(x => x.id === id);
          if (m && !m.result && rmap[id] && typeof rmap[id].home === 'number') {
            m.result = rmap[id];
          }
        }
      }
    } catch (e) {}

    // Re-derive the knockout bracket from whatever results we loaded so
    // resolved teams persist across reloads and self-correct.
    resolveBracketFromResults();
  }

  // Throttle save() so a flurry of edits doesn't write 20 times in a row,
  // and persist only diffs to keep the payload tiny.
  let _saveTimer = null;
  let _lastQuotaWarn = 0;
  function save() {
    if (_saveTimer) return;
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      const slim = {
        members: state.members,
        picks: state.picks,
        uiSelectedMember: state.uiSelectedMember || null,
      };
      const gd = _diffGroups();
      if (gd) slim.groups = gd;
      const md = _diffMatches();
      if (md) slim.matchOverrides = md;
      // Confirmed knockout teams (feed/manual) persist + sync; provisional
      // ones are omitted and re-derived from results on load.
      if (state.koTeams && Object.keys(state.koTeams).length) slim.koTeams = state.koTeams;

      // Persist with progressive fallback so a full localStorage can
      // never silently drop scores (the "vanish on next open" bug). We
      // try the full payload, then shed regenerable data, and as a last
      // resort write just the essentials (results + picks + confirmed KO
      // teams). Whatever survives, the user's scores do.
      const _try = (obj) => {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); return true; }
        catch (e) { return false; }
      };
      let saved = _try(slim);
      if (!saved) {
        // 1) Evict the large, fully-regenerable squad cache and retry.
        for (const k of ['wc2026.nominations', NOMINATIONS_KEY, 'wc2026.summaryCache']) {
          try { if (k) localStorage.removeItem(k); } catch (e2) {}
        }
        saved = _try(slim);
      }
      if (!saved) {
        // 2) Drop the optional/UI-only fields; keep scores + picks + KO.
        const essential = { members: slim.members, picks: slim.picks };
        if (slim.matchOverrides) essential.matchOverrides = slim.matchOverrides;
        if (slim.koTeams) essential.koTeams = slim.koTeams;
        if (slim.groups) essential.groups = slim.groups;
        saved = _try(essential);
      }
      if (!saved) {
        // 3) Last resort: results only (the thing that keeps disappearing).
        saved = _try({ matchOverrides: slim.matchOverrides || {}, picks: slim.picks || {} });
      }
      if (!saved) {
        const now = Date.now();
        if (now - _lastQuotaWarn > 60000) {
          _lastQuotaWarn = now;
          console.warn('wc save failed — storage full even after shedding caches');
          if (typeof toast === 'function') {
            toast('⚠️ Storage full — clear another app\'s data to keep saving scores.');
          }
        }
      }
      // Redundant local-only results backup. CloudSync never touches this
      // key, so even if the main bucket gets out-flanked by a stale
      // cross-device pull or a quota hiccup, the results survive a refresh
      // and load() unions them back. Tiny (lean results only), so it saves
      // even when the full bucket can't.
      try {
        const rmap = {};
        for (const m of state.matches) if (m.result) rmap[m.id] = _leanResult(m.result);
        if (Object.keys(rmap).length) localStorage.setItem(RESULTS_BACKUP_KEY, JSON.stringify(rmap));
      } catch (e) {}

      // Best-effort cross-device sync (no-op if CloudSync not loaded/online)
      try { if (window.CloudSync && CloudSync.online && CloudSync.push) CloudSync.push(STORE_KEY); } catch (e) {}
    }, 200);
  }

  /* ----------------------------------------------------------------
     Kickoff times — schedule times are venue-local, so build real Dates
     from each venue's UTC offset (fixed across June–July: US/Canada on
     DST, Mexico abolished DST in 2022). Falls back to -05:00 (central).
     ---------------------------------------------------------------- */
  function kickoffDate(m) {
    const v = venueById(m.venue);
    const off = v && typeof v.utc === 'number' ? v.utc : -5;
    const sign = off < 0 ? '-' : '+';
    return new Date(m.date + 'T' + (m.time || '12:00') + ':00' + sign + pad(Math.abs(off)) + ':00');
  }
  // Kickoff rendered in the viewer's own timezone, e.g. "11:00 AM".
  function fmtKickoffLocal(m) {
    return kickoffDate(m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  /* ----------------------------------------------------------------
     Live auto-sync — poll OpenFootball while matches are in play.
     A match window opens 5 min before kickoff and runs ~2h45m (covers
     extra time + penalties). Polls are quiet: no toast unless a score
     actually changed. Source is human-maintained, so treat this as
     "live results", not minute-by-minute.
     ---------------------------------------------------------------- */
  const LIVE_WINDOW_MS = 165 * 60000;
  let _scoreSyncBusy = false;
  let _lastScoreSyncAt = null;
  function anyMatchLiveWindow() {
    const now = Date.now();
    return state.matches.some(m => {
      const k = kickoffDate(m).getTime();
      return now >= k - 5 * 60000 && now <= k + LIVE_WINDOW_MS;
    });
  }
  function autoSyncTick() {
    if (document.visibilityState === 'hidden') return;
    if (navigator.onLine === false) return;
    if (!anyMatchLiveWindow()) return;
    syncScores({ quiet: true });
  }

  /* ----------------------------------------------------------------
     Lock deadlines — each group/stage locks once its first match starts.
     ---------------------------------------------------------------- */
  function _matchStarted(m) {
    if (!m) return false;
    return kickoffDate(m).getTime() <= Date.now();
  }
  // Earliest still-unstarted lock deadline across groups and KO stages —
  // powers the "picks lock in…" banner on the pool tab.
  function nextLockInfo() {
    const firstOf = list => list.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    const cands = [];
    for (const g of GROUP_LETTERS) {
      const first = firstOf(state.matches.filter(m => m.stage === 'group' && m.group === g));
      if (first && !_matchStarted(first)) cands.push({ label: 'Group ' + g, at: kickoffDate(first) });
    }
    for (const s of ['R32','R16','QF','SF','Final']) {
      const first = firstOf(state.matches.filter(m => m.stage === s));
      if (first && !_matchStarted(first)) cands.push({ label: s === 'Final' ? 'Final' : s + ' round', at: kickoffDate(first) });
    }
    cands.sort((a,b) => a.at - b.at);
    return cands[0] || null;
  }
  function isGroupLocked(letter) {
    const first = state.matches
      .filter(m => m.stage === 'group' && m.group === letter)
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    return _matchStarted(first);
  }
  function isStageLocked(stage) {
    const first = state.matches
      .filter(m => m.stage === stage)
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    return _matchStarted(first);
  }
  function areOutcomesLocked() { return isStageLocked('Final'); }

  /* ----------------------------------------------------------------
     "Today" view helpers
     ---------------------------------------------------------------- */
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  function matchesOn(dateStr) {
    return state.matches
      .filter(m => m.date === dateStr)
      .sort((a,b) => a.time.localeCompare(b.time));
  }
  // All matches on the same date as `dateStr`, excluding `dateStr` itself —
  // used to surface the rest of the day's slate when showing "next match".
  function matchesOnAfter(dateStr) {
    return state.matches
      .filter(m => m.date === dateStr)
      .sort((a,b) => a.time.localeCompare(b.time))
      .slice(1);
  }

  /* ----------------------------------------------------------------
     "Today in World Cup history" — dataset keyed by MM-DD.
     ---------------------------------------------------------------- */
  const WC_HISTORY = {
    '06-11': '1978 — Argentina ’78 kicks off in Buenos Aires. The home side would go on to win their first World Cup, beating Netherlands 3-1 in extra time.',
    '06-12': '2014 — Brazil ’14 opens at the Arena Corinthians with Brazil 3-1 Croatia. Neymar grabs a brace.',
    '06-13': '1930 — The very first World Cup match is played in Uruguay: France beats Mexico 4-1, with Lucien Laurent scoring history\'s first WC goal.',
    '06-14': '2002 — Senegal stuns France 1-0 in the opening match of Korea/Japan, on their World Cup debut.',
    '06-15': '1958 — A 17-year-old named Pelé makes his World Cup debut for Brazil in Sweden.',
    '06-16': '1994 — USA ’94 opens at Soldier Field. Germany 1-0 Bolivia in the first match of the tournament that put the sport on the US map.',
    '06-17': '1970 — England 0-1 Brazil in Guadalajara. Pelé\'s header is saved by Gordon Banks in what many call the greatest save ever.',
    '06-18': '1994 — Andrés Escobar scores an own goal vs the USA. He was tragically killed weeks after returning home.',
    '06-19': '1966 — North Korea shocks Italy 1-0 at Ayresome Park, knocking the Azzurri out and reaching the quarterfinals.',
    '06-20': '1974 — West Germany 0-1 East Germany in Hamburg, the only meeting of the two German sides at a World Cup.',
    '06-21': '1970 — Brazil 4-1 Italy in the Mexico City final: Pelé\'s third World Cup, and the trophy is awarded permanently to Brazil.',
    '06-22': '1986 — Maradona\'s "Hand of God" and "Goal of the Century" in Argentina 2-1 England at the Estadio Azteca.',
    '06-23': '2010 — USA 1-0 Algeria, Donovan\'s 91st-minute winner sends the Americans through as group winners.',
    '06-24': '1990 — Cameroon 2-1 Colombia in extra time — Roger Milla\'s legend grows, dancing at the corner flag.',
    '06-25': '1978 — A controversial 6-0 win by Argentina over Peru clears their path to the final.',
    '06-26': '1994 — Romania 3-2 Argentina in the round of 16, ending Maradona\'s World Cup career.',
    '06-27': '1954 — Hungary 4-2 Brazil in the "Battle of Berne" — three red cards and a tunnel brawl.',
    '06-28': '1998 — Argentina 2-2 England (Argentina win on pens). Owen\'s solo wonder goal; Beckham\'s red card.',
    '06-29': '2014 — James Rodríguez\'s thunderbolt vs Uruguay wins Goal of the Tournament.',
    '06-30': '1974 — Holland 2-0 Brazil in Dortmund — Cruyff puts Total Football into the final.',
    '07-01': '1990 — Argentina 0-0 Yugoslavia (Argentina win on pens). Maradona converts his spot kick.',
    '07-02': '1978 — Argentina 6-0 Peru (see Jun 25). The "scandal of Rosario" continues to be debated.',
    '07-03': '2010 — Uruguay beat Ghana on penalties after Suárez\'s handball denied a last-minute goal.',
    '07-04': '1990 — West Germany 1-1 England (Germany win on pens). Gascoigne in tears.',
    '07-05': '1998 — France 0-0 Italy (France win on pens). Les Bleus march toward home glory.',
    '07-06': '2002 — Brazil 1-0 Turkey in the semifinal — Ronaldo back from injury to lead Brazil to the final.',
    '07-07': '1974 — West Germany 2-1 Holland in Munich. Müller scores the title-winning goal.',
    '07-08': '2014 — Germany 7-1 Brazil. The most shocking semifinal result in World Cup history.',
    '07-09': '2006 — France 1-0 Portugal in the semifinal; Zidane scores in his final tournament.',
    '07-10': '1966 — England 2-1 Portugal, Bobby Charlton sends the hosts to the final.',
    '07-11': '2010 — Spain 1-0 Netherlands in Johannesburg. Iniesta\'s extra-time goal wins La Roja\'s first.',
    '07-12': '1998 — France 3-0 Brazil — Zidane heads twice in his country\'s first World Cup win.',
    '07-13': '2014 — Germany 1-0 Argentina at the Maracanã; Götze\'s late winner clinches Die Mannschaft\'s 4th star.',
    '07-14': '1974 — Holland 2-0 Brazil (see Jun 30). Cruyff\'s Total Football conquers South America.',
    '07-15': '2018 — France 4-2 Croatia in Moscow. Mbappé becomes the second teenager (after Pelé) to score in a WC Final.',
    '07-16': '1950 — The "Maracanazo": Uruguay 2-1 Brazil in front of 200,000 silent fans.',
    '07-17': '1994 — Brazil beat Italy on penalties at the Rose Bowl. Baggio skies the decisive PK.',
    '07-18': '2010 — Iker Casillas lifts the Cup in Johannesburg. (Bonus: 2026 hosts will play their 3rd-place match today.)',
    '07-19': '2026 — Tournament Final at MetLife Stadium. (Watch this space.)',
  };
  function wcHistoryToday() {
    const d = new Date();
    const key = pad(d.getMonth()+1) + '-' + pad(d.getDate());
    return WC_HISTORY[key] || 'A World Cup story for every date — check back tomorrow!';
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

  /* ----------------------------------------------------------------
     Per-user star bank — flows into the suite-wide Trophy Room. Each
     achievement awards stars to a `zs_worldcup_<userKey>` storage
     entry that trophy-room.js can read like any other app.
     ---------------------------------------------------------------- */
  function _userKey(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/\s+/g, '_');
  }
  function _wcStarsKey(name) {
    const k = _userKey(name);
    return k ? 'zs_worldcup_' + k : null;
  }
  function _readWcStars(name) {
    const key = _wcStarsKey(name);
    if (!key) return { totalStars:0, awards:[] };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { totalStars:0, awards:[] };
      const v = JSON.parse(raw);
      return { totalStars: v.totalStars|0, awards: Array.isArray(v.awards) ? v.awards : [] };
    } catch (e) { return { totalStars:0, awards:[] }; }
  }
  function awardStars(name, n, source) {
    const key = _wcStarsKey(name);
    if (!key || !n) return;
    try {
      const cur = _readWcStars(name);
      cur.totalStars += n;
      cur.awards.unshift({ ts: Date.now(), n, source });
      cur.awards = cur.awards.slice(0, 50); // keep last 50 awards
      localStorage.setItem(key, JSON.stringify(cur));
      if (window.CloudSync && CloudSync.online && CloudSync.push) {
        try { CloudSync.push(key); } catch (e) {}
      }
    } catch (e) { /* quota etc. — fail silent */ }
  }

  /* ----------------------------------------------------------------
     Sticker album — Panini-style 48-country collection. Persisted in
     the same wc2026.v2 bucket under state.stickers, keyed by country
     code. status: 'locked' | 'earned' | 'starred'.
     ---------------------------------------------------------------- */
  function _stickerStatus(code) {
    const s = (state.stickers || {})[code];
    if (!s) return 'locked';
    return s.starred ? 'starred' : 'earned';
  }
  function earnSticker(code, source, starred) {
    if (!code) return;
    state.stickers = state.stickers || {};
    const prev = state.stickers[code];
    const wasStarred = !!(prev && prev.starred);
    if (prev && (starred ? wasStarred : true)) return; // already at this tier
    state.stickers[code] = {
      earnedAt: (prev && prev.earnedAt) || new Date().toISOString(),
      source,
      starred: !!(starred || wasStarred),
    };
    save();
    // Award stars to the active user's bank
    const user = currentActiveUser();
    if (user && !prev) awardStars(user.name, 2, 'sticker:' + code);
    if (user && starred && !wasStarred) awardStars(user.name, 3, 'sticker_starred:' + code);
  }

  /* ----------------------------------------------------------------
     Activity feed — a shared family log (pick entered, result entered,
     sticker earned, bracket imported). Capped, persisted in the
     wc2026.v2 bucket so it rides the same CloudSync as everything else.
     ---------------------------------------------------------------- */
  function logActivity(icon, text) {
    state.activity = state.activity || [];
    const last = state.activity[0];
    // Dedupe identical consecutive entries within 3s (avoids spam from rapid edits)
    if (last && last.text === text && (Date.now() - last.ts) < 3000) return;
    state.activity.unshift({ ts: Date.now(), icon, text });
    state.activity = state.activity.slice(0, 60);
    // Note: caller is responsible for save() (usually already saving state)
  }
  function fmtAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d + 'd ago';
  }

  /* ----------------------------------------------------------------
     Favorite team — per-profile, stored in state.favorites[userKey].
     Drives the "My Tournament" personalized card on the Home tab.
     ---------------------------------------------------------------- */
  function getFavoriteTeam() {
    const user = currentActiveUser();
    const key = user ? _userKey(user.name) : '_guest';
    return (state.favorites || {})[key] || null;
  }
  function setFavoriteTeam(code) {
    const user = currentActiveUser();
    const key = user ? _userKey(user.name) : '_guest';
    state.favorites = state.favorites || {};
    if (code) state.favorites[key] = code;
    else delete state.favorites[key];
    const c = code ? countryByCode(code) : null;
    if (c) logActivity('⭐', `${user ? escapeHTML(user.name) : 'Someone'} is cheering for ${c.flag} ${c.name}`);
    save();
    activateTab('home');
  }

  /* ----------------------------------------------------------------
     Share bracket — encode/decode a member's picks as a URL-safe
     base64 JSON payload. Works on the public GitHub-Pages app URL so
     extended family without VPN access can play.
     ---------------------------------------------------------------- */
  function _b64urlEncode(str) {
    const utf8 = unescape(encodeURIComponent(str));
    return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function _b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  // LZ-compressed payloads are prefixed with 'z' so the decoder can
  // tell them apart from the legacy base64url shape. Anything that
  // doesn't start with 'z' decodes the old way — share/pool links
  // generated before this change keep working.
  function _encodePayload(jsonStr) {
    if (typeof LZString !== 'undefined' && LZString.compressToEncodedURIComponent) {
      const compressed = LZString.compressToEncodedURIComponent(jsonStr);
      // Fall back to the legacy encoding on the off chance LZ produces
      // a longer string for a trivially small payload.
      const legacy = _b64urlEncode(jsonStr);
      if (compressed && compressed.length + 1 < legacy.length) return 'z' + compressed;
      return legacy;
    }
    return _b64urlEncode(jsonStr);
  }
  function _decodePayload(encoded) {
    if (!encoded) return null;
    try {
      if (encoded.charAt(0) === 'z' && typeof LZString !== 'undefined') {
        const out = LZString.decompressFromEncodedURIComponent(encoded.slice(1));
        if (out) return out;
      }
      return _b64urlDecode(encoded);
    } catch (e) { return null; }
  }
  function encodeBracket(member) {
    const picks = state.picks[member.id] || {};
    const payload = {
      v: 1,
      name: member.name || '',
      avatar: member.avatar || '',
      gw: picks.groupWinners || {},
      gr: picks.groupRunnersUp || {},
      ko: picks.ko || {},
      ch: picks.champion || null,
      ru: picks.runnerUp || null,
      gb: picks.goldenBoot || '',
    };
    if (picks.scores && Object.keys(picks.scores).length > 0) payload.sc = picks.scores;
    return _encodePayload(JSON.stringify(payload));
  }
  function decodeBracket(encoded) {
    try {
      const json = _decodePayload(encoded);
      if (!json) return null;
      const p = JSON.parse(json);
      if (p && p.v === 1 && typeof p.name === 'string') return p;
    } catch (e) {}
    return null;
  }
  function importSharedBracket(payload) {
    if (!payload || !payload.name) return null;
    // Match by lowercase name; otherwise create a new entry
    const lower = payload.name.toLowerCase();
    let entry = state.members.find(m => m.name && m.name.toLowerCase() === lower);
    if (!entry) {
      const id = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
      entry = { id, name: payload.name, avatar: payload.avatar || null };
      state.members.push(entry);
    } else if (payload.avatar && !entry.avatar) {
      entry.avatar = payload.avatar;
    }
    state.picks[entry.id] = {
      groupWinners: payload.gw || {},
      groupRunnersUp: payload.gr || {},
      ko: payload.ko || {},
      champion: payload.ch || null,
      runnerUp: payload.ru || null,
      goldenBoot: payload.gb || '',
      goldenBootCorrect: false,
      scores: payload.sc || {},
    };
    logActivity('📨', `${escapeHTML(entry.name)}'s bracket joined the pool`);
    save();
    return entry;
  }
  function checkUrlForImport() {
    try {
      const params = new URLSearchParams(window.location.search);
      const url = new URL(window.location.href);

      // Single-bracket share (?wc_share=...)
      const shareEnc = params.get('wc_share');
      if (shareEnc) {
        const payload = decodeBracket(shareEnc);
        url.searchParams.delete('wc_share');
        history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?'+url.searchParams.toString() : ''));
        if (payload) setTimeout(() => promptImportBracket(payload, shareEnc), 600);
      }

      // Full-family-pool snapshot (?wc_pool=...)
      const poolEnc = params.get('wc_pool');
      if (poolEnc) {
        const payload = decodePool(poolEnc);
        url.searchParams.delete('wc_pool');
        history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?'+url.searchParams.toString() : ''));
        if (payload) setTimeout(() => promptImportPool(payload, poolEnc), 700);
      }
    } catch (e) {}
  }

  /* ----------------------------------------------------------------
     Full-family-pool snapshot — host can share a single URL bundling
     every member's bracket plus all recorded results. Guests open
     the URL and import to see the family leaderboard locally
     (read-only-ish — they can still edit their own bracket).
     ---------------------------------------------------------------- */
  // Picks live in memory with verbose key names (groupWinners, ko, etc.)
  // and verbose score objects ({home:2, away:0}). For pool snapshot URLs
  // we re-key into single-letter fields and flatten the two largest
  // structures into positional comma-separated strings:
  //   sc = "2x0,1x1,..." indexed m001..m072 (group matches)
  //   ko = "MEX,BRA,..."  indexed m073..m104 (R32→Final, incl. 3rd)
  // Trailing empties trim. Symmetric expand restores the verbose shape.
  function _stageForKoIndex(i) {
    const n = 73 + i;
    if (n <= 88)  return 'R32';
    if (n <= 96)  return 'R16';
    if (n <= 100) return 'QF';
    if (n <= 102) return 'SF';
    if (n === 103) return '3rd';
    return 'Final';
  }
  // Group letters A-L in order — positional encoding key for gw/gr/g3.
  const _GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  function _packGroups(obj) {
    if (!obj) return '';
    const arr = _GROUP_ORDER.map(g => obj[g] || '');
    while (arr.length && !arr[arr.length - 1]) arr.pop();
    return arr.join(',');
  }
  function _unpackGroups(str) {
    const out = {};
    if (typeof str !== 'string' || !str) return out;
    const arr = str.split(',');
    for (let i = 0; i < arr.length && i < _GROUP_ORDER.length; i++) {
      if (arr[i]) out[_GROUP_ORDER[i]] = arr[i];
    }
    return out;
  }

  function _compactPicks(p) {
    if (!p) return null;
    const out = {};
    if (p.groupWinners && Object.keys(p.groupWinners).length) {
      const packed = _packGroups(p.groupWinners);
      if (packed) out.gw = packed;
    }
    if (p.groupRunnersUp && Object.keys(p.groupRunnersUp).length) {
      const packed = _packGroups(p.groupRunnersUp);
      if (packed) out.gr = packed;
    }
    if (p.groupThird && Object.keys(p.groupThird).length) {
      const packed = _packGroups(p.groupThird);
      if (packed) out.g3 = packed;
    }
    if (p.ko) {
      const allKo = Object.assign({}, p.ko.R32, p.ko.R16, p.ko.QF, p.ko.SF, p.ko['3rd'], p.ko.Final);
      const arr = [];
      for (let i = 73; i <= 104; i++) arr.push(allKo['m' + String(i).padStart(3, '0')] || '');
      while (arr.length && !arr[arr.length - 1]) arr.pop();
      if (arr.length) out.ko = arr.join(',');
    }
    if (p.champion) out.ch = p.champion;
    if (p.runnerUp) out.ru = p.runnerUp;
    if (p.goldenBoot) out.gb = p.goldenBoot;
    if (p.goldenBootCorrect) out.gbc = 1;
    if (p.mode && p.mode !== 'buildup') out.m = p.mode;
    if (p.scores) {
      const arr = [];
      for (let i = 1; i <= 72; i++) {
        const s = p.scores['m' + String(i).padStart(3, '0')];
        arr.push(s && typeof s.home === 'number' && typeof s.away === 'number' ? s.home + 'x' + s.away : '');
      }
      while (arr.length && !arr[arr.length - 1]) arr.pop();
      if (arr.length) out.sc = arr.join(',');
    }
    return out;
  }
  function _expandPicks(p) {
    if (!p) return null;
    // v=1 used the verbose shape directly — leave it alone.
    if (p.groupWinners || p.groupRunnersUp || p.scores) return p;
    const out = {
      // Both v=2 (object form) and v=3 (positional string) survive this.
      groupWinners:   typeof p.gw === 'string' ? _unpackGroups(p.gw) : (p.gw || {}),
      groupRunnersUp: typeof p.gr === 'string' ? _unpackGroups(p.gr) : (p.gr || {}),
      groupThird:     typeof p.g3 === 'string' ? _unpackGroups(p.g3) : (p.g3 || {}),
      ko: { R32:{}, R16:{}, QF:{}, SF:{}, '3rd':{}, Final:{} },
      champion: p.ch || null,
      runnerUp: p.ru || null,
      goldenBoot: p.gb || '',
      goldenBootCorrect: !!p.gbc,
      mode: p.m || 'buildup',
      scores: {},
    };
    if (typeof p.ko === 'string' && p.ko.length) {
      const arr = p.ko.split(',');
      for (let i = 0; i < arr.length; i++) {
        const code = arr[i];
        if (!code) continue;
        out.ko[_stageForKoIndex(i)]['m' + String(73 + i).padStart(3, '0')] = code;
      }
    }
    if (typeof p.sc === 'string' && p.sc.length) {
      const arr = p.sc.split(',');
      for (let i = 0; i < arr.length; i++) {
        const entry = arr[i];
        if (!entry) continue;
        const m = entry.match(/^(\d+)x(\d+)$/);
        if (m) out.scores['m' + String(i + 1).padStart(3, '0')] = { home: parseInt(m[1], 10), away: parseInt(m[2], 10) };
      }
    }
    return out;
  }

  // Results packing: each of 104 match slots → "HxA[p]" where the
  // optional p suffix encodes a penalty-shootout winner (h or a). Empty
  // slot = unplayed. Trailing empties trim.
  function _packResults(map) {
    const arr = [];
    for (let i = 1; i <= 104; i++) {
      const id = 'm' + String(i).padStart(3, '0');
      const r = map[id];
      if (!r || typeof r.home !== 'number' || typeof r.away !== 'number') {
        arr.push('');
        continue;
      }
      let entry = r.home + 'x' + r.away;
      if (r.pkWinner === 'home') entry += 'ph';
      else if (r.pkWinner === 'away') entry += 'pa';
      arr.push(entry);
    }
    while (arr.length && !arr[arr.length - 1]) arr.pop();
    return arr.join(',');
  }
  function _unpackResults(str, matches) {
    const out = {};
    if (typeof str !== 'string' || !str) return out;
    const arr = str.split(',');
    for (let i = 0; i < arr.length; i++) {
      const entry = arr[i];
      if (!entry) continue;
      const m = entry.match(/^(\d+)x(\d+)(p[ha])?$/);
      if (!m) continue;
      const id = 'm' + String(i + 1).padStart(3, '0');
      const r = { home: parseInt(m[1], 10), away: parseInt(m[2], 10), pkWinner: null };
      if (m[3] === 'ph' || m[3] === 'pa') {
        // pkWinner is a team CODE on result, not 'home'/'away' — look it
        // up from the local match list when available, fall back to the
        // marker if the match isn't loaded yet.
        const local = matches && matches.find(x => x.id === id);
        if (local) r.pkWinner = m[3] === 'ph' ? local.home : local.away;
      }
      out[id] = r;
    }
    return out;
  }

  function encodePool() {
    const members = state.members
      .filter(m => m.name && m.name.trim())
      .map(m => ({
        n: m.name,
        a: m.avatar || '',
        p: _compactPicks(state.picks[m.id]),
      }));
    const resultsMap = {};
    for (const m of state.matches) if (m.result) resultsMap[m.id] = m.result;
    const payload = { v: 3, type: 'pool', members, r: _packResults(resultsMap) };
    return _encodePayload(JSON.stringify(payload));
  }
  function decodePool(encoded) {
    try {
      const json = _decodePayload(encoded);
      if (!json) return null;
      const p = JSON.parse(json);
      if (!p || p.type !== 'pool' || !Array.isArray(p.members)) return null;
      if (p.v !== 1 && p.v !== 2 && p.v !== 3) return null;
      // Re-hydrate v=2/v=3 compact picks back into the verbose in-memory
      // shape so importPool can drop them straight into state.picks.
      if (p.v === 2 || p.v === 3) {
        p.members = p.members.map(m => Object.assign({}, m, { p: _expandPicks(m.p) }));
      }
      // v=3 packs the results dict as a single positional string under
      // `r`; expand it back into the {matchId:{home,away,pkWinner}} shape
      // importPool already knows how to consume.
      if (p.v === 3) {
        p.results = _unpackResults(p.r, state.matches);
        delete p.r;
      }
      return p;
    } catch (e) {}
    return null;
  }
  function importPool(payload) {
    if (!payload) return { added:0, updated:0, results:0 };
    let added = 0, updated = 0;
    for (const sm of payload.members || []) {
      const lower = (sm.n || '').toLowerCase();
      if (!lower) continue;
      let entry = state.members.find(m => m.name && m.name.toLowerCase() === lower);
      if (!entry) {
        const id = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
        entry = { id, name: sm.n, avatar: sm.a || null };
        state.members.push(entry);
        added++;
      } else {
        if (sm.a && !entry.avatar) entry.avatar = sm.a;
        updated++;
      }
      if (sm.p) state.picks[entry.id] = sm.p;
    }
    let resultsApplied = 0;
    for (const id of Object.keys(payload.results || {})) {
      const m = state.matches.find(x => x.id === id);
      if (!m) continue;
      // Merge incoming result into the existing one so scorer/card/event
      // detail attached by sync (goals1, goals2, cards1, cards2, eventId)
      // survives a pool import — the snapshot only carries home/away/
      // pkWinner, and overwriting would clear everything else.
      m.result = Object.assign({}, m.result || {}, payload.results[id] || {});
      resultsApplied++;
    }
    // Imported results may resolve group standings / KO matches.
    resolveBracketFromResults();
    save();
    return { added, updated, results: resultsApplied };
  }
  function promptImportPool(payload, encoded) {
    const modal = document.getElementById('match-modal');
    if (!modal) return;
    _pendingImport = { type:'pool', payload };
    const memberCount = (payload.members || []).filter(m => m.n).length;
    const resultCount = Object.keys(payload.results || {}).length;
    const memberList = (payload.members || [])
      .filter(m => m.n)
      .map(m => `${m.a ? escapeHTML(m.a)+' ' : ''}${escapeHTML(m.n)}`)
      .slice(0, 8)
      .join(', ');
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>📨 Family pool snapshot received</h3>
      <div class="sub">${memberCount} bracket${memberCount===1?'':'s'} · ${resultCount} match result${resultCount===1?'':'s'}</div>
      <p style="margin:10px 0;font-size:0.9rem;line-height:1.5;">${escapeHTML(memberList)}${memberCount > 8 ? ' …' : ''}</p>
      <p style="font-size:0.82rem;color:var(--text-muted);">Existing brackets with the same name will be updated. Your own bracket is preserved unless someone with your name is in the snapshot.</p>
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Not now</button>
        <button class="btn" onclick="WC.confirmImportPool()">✓ Import snapshot</button>
      </div>
    `;
    modal.classList.add('open');
  }
  function confirmImportPool() {
    const p = _pendingImport && _pendingImport.payload;
    const isPool = _pendingImport && _pendingImport.type === 'pool';
    _pendingImport = null;
    closeModal();
    if (!p || !isPool) return;
    const { added, updated, results } = importPool(p);
    const parts = [];
    if (added) parts.push(`${added} new bracket${added===1?'':'s'}`);
    if (updated) parts.push(`${updated} updated`);
    if (results) parts.push(`${results} result${results===1?'':'s'}`);
    toast('Imported — ' + (parts.join(' · ') || 'no changes'));
    activateTab('pool');
  }
  let _pendingImport = null;
  function promptImportBracket(payload, encoded) {
    const modal = document.getElementById('match-modal');
    if (!modal) return;
    _pendingImport = { type: 'bracket', payload };
    const guess = payload.gb ? `Golden Boot guess: <b>${escapeHTML(payload.gb)}</b>` : '';
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>📨 Bracket received</h3>
      <div class="sub">From <b>${payload.avatar ? escapeHTML(payload.avatar)+' ' : ''}${escapeHTML(payload.name)}</b></div>
      <p style="margin:10px 0;font-size:0.9rem;">Add this bracket to the family pool? Picks will start scoring as results come in.</p>
      ${guess ? `<p style="font-size:0.82rem;color:var(--text-muted);">${guess}</p>` : ''}
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Not now</button>
        <button class="btn" onclick="WC.confirmImportBracket()">✓ Add to pool</button>
      </div>
    `;
    modal.classList.add('open');
  }
  function confirmImportBracket() {
    const wrap = _pendingImport;
    _pendingImport = null;
    closeModal();
    if (!wrap || wrap.type !== 'bracket' || !wrap.payload) return;
    const entry = importSharedBracket(wrap.payload);
    if (entry) {
      toast('Added ' + entry.name + ' to the pool');
      activateTab('pool');
    }
  }

  /* ----------------------------------------------------------------
     Bracket candidate resolver — given a placeholder label like
     "1A", "2B", "3A/B/C/D/F", "W73", "L101", return the set of team
     codes that could fill that slot. Cascades recursively so R16+
     picks narrow naturally as earlier rounds are decided.
     ---------------------------------------------------------------- */
  function candidatesForSlot(label, _seen) {
    if (!label) return [];
    _seen = _seen || new Set();
    if (_seen.has(label)) return [];   // safety against cycles
    _seen.add(label);

    let m;
    if ((m = /^([12])([A-L])$/.exec(label))) {
      return (state.groups[m[2]] || []).slice();
    }
    if ((m = /^3((?:[A-L])(?:\/[A-L])+)$/.exec(label))) {
      const letters = m[1].split('/');
      const out = [];
      for (const l of letters) for (const c of (state.groups[l] || [])) if (!out.includes(c)) out.push(c);
      return out;
    }
    if ((m = /^[WL](\d+)$/.exec(label))) {
      const refId = 'm' + String(parseInt(m[1])).padStart(3, '0');
      const prev = state.matches.find(x => x.id === refId);
      if (!prev) return [];
      const homeC = prev.home ? [prev.home] : candidatesForSlot(prev.home_label, _seen);
      const awayC = prev.away ? [prev.away] : candidatesForSlot(prev.away_label, _seen);
      const out = [];
      for (const c of [...homeC, ...awayC]) if (c && !out.includes(c)) out.push(c);
      return out;
    }
    return [];
  }
  function candidatesForMatch(m) {
    const homeC = m.home ? [m.home] : candidatesForSlot(m.home_label);
    const awayC = m.away ? [m.away] : candidatesForSlot(m.away_label);
    const out = [];
    for (const c of [...homeC, ...awayC]) if (c && !out.includes(c)) out.push(c);
    return out;
  }

  /* ----------------------------------------------------------------
     Member-aware bracket cascade (build-up mode). Resolves each KO
     match's two sides from a SINGLE member's own group + KO picks,
     so the bracket flows: group placements → R32 → R16 → … → champion.
     ---------------------------------------------------------------- */
  function _memberPickedWinner(picks, matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return null;
    return (picks.ko && picks.ko[m.stage] && picks.ko[m.stage][matchId]) || null;
  }
  // Resolve one side's label to a single team code via the member's picks
  // (null if not yet determined). 3rd-place slots return null — they expand
  // to a candidate pool instead (see memberCandidatesForMatch).
  function resolveSideForMember(label, picks, _seen) {
    if (!label) return null;
    _seen = _seen || new Set();
    if (_seen.has(label)) return null;
    _seen.add(label);
    let mm;
    if ((mm = /^1([A-L])$/.exec(label))) return (picks.groupWinners || {})[mm[1]] || null;
    if ((mm = /^2([A-L])$/.exec(label))) return (picks.groupRunnersUp || {})[mm[1]] || null;
    if (/^3[A-L/]+$/.test(label)) return null; // ambiguous 3rd-place slot
    if ((mm = /^([WL])(\d+)$/.exec(label))) {
      const refId = 'm' + String(parseInt(mm[2])).padStart(3, '0');
      const winner = _memberPickedWinner(picks, refId);
      if (mm[1] === 'W') return winner || null;
      // Loser: the side of refId that isn't the winner
      if (!winner) return null;
      const sides = memberSides(refId, picks, _seen);
      if (sides[0] && sides[1]) return winner === sides[0] ? sides[1] : sides[0];
      return null;
    }
    return null;
  }
  function memberSides(matchId, picks, _seen) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return [null, null];
    const h = m.home || resolveSideForMember(m.home_label, picks, _seen);
    const a = m.away || resolveSideForMember(m.away_label, picks, _seen);
    return [h, a];
  }
  // 3rd-place candidates for a "3X/Y/Z" slot, per the member's group picks.
  function memberThirdCandidates(label, picks) {
    const mm = /^3([A-L/]+)$/.exec(label);
    if (!mm) return [];
    const letters = mm[1].split('/');
    const out = [];
    for (const g of letters) {
      const third = (picks.groupThird || {})[g];
      if (third) { if (!out.includes(third)) out.push(third); continue; }
      // Fall back to the group teams not picked 1st/2nd
      const gw = (picks.groupWinners || {})[g], gr = (picks.groupRunnersUp || {})[g];
      for (const code of (state.groups[g] || [])) {
        if (code !== gw && code !== gr && !out.includes(code)) out.push(code);
      }
    }
    return out;
  }
  // The teams a member could pick as WINNER of a match (build-up mode).
  function memberCandidatesForMatch(m, picks) {
    const collect = (real, label) => {
      if (real) return [real];
      const single = resolveSideForMember(label, picks);
      if (single) return [single];
      if (label && /^3[A-L/]+$/.test(label)) return memberThirdCandidates(label, picks);
      return [];
    };
    const out = [];
    for (const c of [...collect(m.home, m.home_label), ...collect(m.away, m.away_label)]) {
      if (c && !out.includes(c)) out.push(c);
    }
    return out;
  }
  // Human label for a side in build-up (resolved team, or a hint).
  function memberSideLabel(real, label, picks) {
    const code = real || resolveSideForMember(label, picks);
    if (code) { const c = countryByCode(code); return c ? c.flag + ' ' + c.name : code; }
    if (label && /^3[A-L/]+$/.test(label)) return '3rd place (' + label.slice(1) + ')';
    return label || 'TBD';
  }
  // Keep champion/runner-up in sync with the member's Final pick (build-up).
  function syncOutcomeFromFinal(picks) {
    const finalM = state.matches.find(x => x.stage === 'Final');
    if (!finalM) return;
    const winner = (picks.ko && picks.ko.Final && picks.ko.Final[finalM.id]) || null;
    if (!winner) return;
    const sides = memberSides(finalM.id, picks);
    picks.champion = winner;
    picks.runnerUp = sides[0] && sides[1] ? (winner === sides[0] ? sides[1] : sides[0]) : picks.runnerUp;
  }
  // Compute 1st/2nd/3rd for a group from a member's predicted scorelines.
  function computeGroupOrderFromScores(group, picks) {
    const codes = state.groups[group] || [];
    const tbl = codes.map(code => ({ code, pts:0, gf:0, ga:0 }));
    const find = c => tbl.find(t => t.code === c);
    const gms = state.matches.filter(x => x.stage === 'group' && x.group === group);
    let any = false;
    for (const m of gms) {
      const sp = (picks.scores || {})[m.id];
      if (!sp || typeof sp.home !== 'number' || typeof sp.away !== 'number') continue;
      any = true;
      const h = find(m.home), a = find(m.away);
      if (!h || !a) continue;
      h.gf += sp.home; h.ga += sp.away; a.gf += sp.away; a.ga += sp.home;
      if (sp.home > sp.away) h.pts += 3; else if (sp.away > sp.home) a.pts += 3; else { h.pts++; a.pts++; }
    }
    if (!any) return null;
    tbl.sort((x,y) => y.pts-x.pts || (y.gf-y.ga)-(x.gf-x.ga) || y.gf-x.gf);
    return tbl.map(t => t.code);
  }

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

  // Live qualification scenarios for a mid-stage group. Points-based
  // (ignores GD / head-to-head tiebreakers — labelled as such in the UI).
  function groupScenarios(table) {
    const out = {};
    if (!table || table.length === 0) return out;
    const anyPlayed = table.some(t => t.p > 0);
    const allDone = table.every(t => t.p >= 3);
    if (!anyPlayed || allDone) return out; // only show mid-group
    for (const t of table) {
      const maxPts = t.pts + Math.max(0, 3 - t.p) * 3;
      const alreadyAbove = table.filter(o => o.code !== t.code && o.pts > maxPts).length;
      const couldPass = table.filter(o => o.code !== t.code && (o.pts + Math.max(0, 3 - o.p) * 3) > t.pts).length;
      if (alreadyAbove >= 2) out[t.code] = { kind: 'out', label: '❌ Out' };
      else if (couldPass <= 1) out[t.code] = { kind: 'in', label: '✅ Through' };
      else out[t.code] = { kind: 'alive', label: '⏳ Alive' };
    }
    return out;
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
    // Score-prediction bonuses (group-stage only)
    scoreExact:  5,
    scoreGD:     3,
    scoreResult: 1,
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

  /* ----------------------------------------------------------------
     AUTO-RESOLVE the knockout bracket from real results.
     Fills R32 1X/2X slots from completed group standings, seeds the 8
     best third-placed teams into their slots, and cascades W##/L##
     winners/losers forward as KO results are entered. Idempotent —
     re-derives every auto side from the baseline label each call, so a
     corrected group result re-flows correctly. Manual edits (sides not
     in state.koAuto) are never clobbered.
     ---------------------------------------------------------------- */

  // Baseline placeholder label for a KO side, e.g. "2A", "3A/B/C/D/F",
  // "W73", "L101" — the slot's *meaning*, independent of any fill.
  function _koLabel(matchId, side) {
    const base = _scheduleBaseline(matchId);
    if (!base) return null;
    return side === 'home' ? base.home_label : base.away_label;
  }

  // Ranked third-placed teams across all 12 groups (FIFA tiebreakers we
  // model: points, goal difference, goals for). `complete` is true only
  // once every group has played all three matchdays — third-place
  // seeding can't be finalised until then.
  function getThirdPlaceRanking() {
    const tables = computeStandings();
    let complete = true;
    const thirds = [];
    for (const g of GROUP_LETTERS) {
      const t = tables[g];
      if (!t || t.length < 3 || !t.every(x => x.p >= 3)) { complete = false; continue; }
      const th = t[2];
      thirds.push({ group: g, code: th.code, pts: th.pts, gd: th.gf - th.ga, gf: th.gf });
    }
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    return { thirds, complete, qualifiers: complete ? thirds.slice(0, 8) : [] };
  }

  // The 8 third-place R32 slots and the groups each can accept, parsed
  // straight from the baseline "3X/Y/Z" labels so this stays in sync
  // with the schedule.
  function _thirdSlots() {
    const out = [];
    for (const base of OFFICIAL_SCHEDULE) {
      if (base.stage !== 'R32') continue;
      for (const side of ['home', 'away']) {
        const label = side === 'home' ? base.home_label : base.away_label;
        const mm = label && /^3([A-L/]+)$/.exec(label);
        if (mm) out.push({ id: base.id, side, allowed: mm[1].split('/') });
      }
    }
    return out;
  }

  // Official FIFA third-place allocation (Annex C), keyed by the sorted
  // set of groups whose third-placed team qualified -> { matchId: group }.
  // The full 495-row table isn't reproducible offline (every combination
  // admits many valid matchings), so we encode the rows that actually
  // occur. 2026: the eight qualifying thirds came from B,D,E,F,I,J,K,L,
  // and FIFA seated them as below — this is the authoritative slotting,
  // used in preference to the constraint-matching fallback.
  const OFFICIAL_THIRD_TABLE = {
    BDEFIJKL: { m075: 'D', m078: 'F', m079: 'E', m080: 'K', m081: 'I', m082: 'B', m085: 'J', m088: 'L' },
  };

  // Assign each qualifying group to a distinct third-place slot. Uses the
  // official table when the qualifying combination is known; otherwise
  // falls back to constraint matching (most-constrained slot first), which
  // yields a VALID — but possibly non-official — bracket. Returns
  // { 'matchId.side': group } or null.
  function _assignThirds(qualGroups) {
    const slots = _thirdSlots();
    if (slots.length !== 8 || qualGroups.length !== 8) return null;

    // Official table fast-path.
    const comboKey = qualGroups.slice().sort().join('');
    const official = OFFICIAL_THIRD_TABLE[comboKey];
    if (official) {
      const assign = {};
      let ok = true;
      for (const slot of slots) {
        const grp = official[slot.id];
        if (grp && slot.allowed.includes(grp)) assign[slot.id + '.' + slot.side] = grp;
        else { ok = false; break; }
      }
      if (ok && Object.keys(assign).length === slots.length) return assign;
    }

    const order = slots.slice().sort((a, b) =>
      a.allowed.filter(g => qualGroups.includes(g)).length -
      b.allowed.filter(g => qualGroups.includes(g)).length);
    const used = new Set();
    const assign = {};
    function bt(i) {
      if (i === order.length) return true;
      const slot = order[i];
      for (const g of slot.allowed) {
        if (!qualGroups.includes(g) || used.has(g)) continue;
        used.add(g); assign[slot.id + '.' + slot.side] = g;
        if (bt(i + 1)) return true;
        used.delete(g); delete assign[slot.id + '.' + slot.side];
      }
      return false;
    }
    return bt(0) ? assign : null;
  }

  // Resolve a single KO side's label to a concrete team code given the
  // current standings, third-place assignment, and KO results. Returns
  // null when not yet determinable.
  function _resolveKoSide(label, ctx) {
    if (!label) return null;
    let mm;
    if ((mm = /^1([A-L])$/.exec(label))) return ctx.top2[mm[1]] ? ctx.top2[mm[1]].winner : null;
    if ((mm = /^2([A-L])$/.exec(label))) return ctx.top2[mm[1]] ? ctx.top2[mm[1]].runnerUp : null;
    if (/^3[A-L/]+$/.test(label)) return null; // third slots filled via ctx.thirdBySlot, not here
    if ((mm = /^([WL])(\d+)$/.exec(label))) {
      const refId = 'm' + String(parseInt(mm[2], 10)).padStart(3, '0');
      const ref = state.matches.find(x => x.id === refId);
      if (!ref || !ref.result) return null;
      const { home, away, pkWinner } = ref.result;
      let winner = home > away ? ref.home : (away > home ? ref.away : (pkWinner || null));
      if (!winner) return null;
      if (mm[1] === 'W') return winner;
      // Loser: the other resolved side of the referenced match
      if (ref.home && ref.away) return winner === ref.home ? ref.away : ref.home;
      return null;
    }
    return null;
  }

  function resolveBracketFromResults() {
    state.koAuto = state.koAuto || {};
    state.koFeed = state.koFeed || {};
    const top2 = getActualGroupTop2();
    const thirdRank = getThirdPlaceRanking();
    // Map slot "id.side" -> resolved third-place team code (provisional).
    let thirdBySlot = {};
    if (thirdRank.complete && thirdRank.qualifiers.length === 8) {
      const qualGroups = thirdRank.qualifiers.map(q => q.group);
      const assign = _assignThirds(qualGroups);
      if (assign) {
        const codeByGroup = {};
        for (const q of thirdRank.qualifiers) codeByGroup[q.group] = q.code;
        for (const key of Object.keys(assign)) thirdBySlot[key] = codeByGroup[assign[key]];
      }
    }
    const ctx = { top2, thirdBySlot };

    // Write one side if it's empty or was previously auto-set by us.
    function applySide(m, side) {
      const key = m.id + '.' + side;
      const label = _koLabel(m.id, side);
      if (!label) return false; // group-stage match, nothing to resolve
      const resolved = /^3[A-L/]+$/.test(label) ? (thirdBySlot[key] || null) : _resolveKoSide(label, ctx);
      const current = m[side];
      // Resolver owns a side only if it's empty or its own prior auto
      // value — never a true manual edit, and never an authoritative
      // feed value (koFeed), so official teams aren't replaced by the
      // provisional third-place guess.
      const isOurs = current == null || (state.koAuto[key] === current && !state.koFeed[key]);
      if (!isOurs) return false;
      if (!resolved) {
        // No longer determinable (e.g. a group result was corrected and
        // the group is incomplete again). Revert our prior auto value.
        if (current != null && state.koAuto[key] === current) {
          m[side] = null;
          delete state.koAuto[key];
          return true;
        }
        return false;
      }
      if (current === resolved) return false;
      m[side] = resolved;
      state.koAuto[key] = resolved;
      return true;
    }

    // Iterate to a fixed point so KO winners cascade R32 → R16 → … .
    let changed = true, guard = 0;
    while (changed && guard++ < 12) {
      changed = false;
      for (const m of state.matches) {
        if (m.stage === 'group') continue;
        if (applySide(m, 'home')) changed = true;
        if (applySide(m, 'away')) changed = true;
      }
    }
  }

  function scoreMember(memberId) {
    const picks = state.picks[memberId];
    if (!picks) return { total:0, breakdown:{} };
    let total = 0;
    const breakdown = { groups:0, ko:0, champion:0, runnerUp:0, goldenBoot:0, scores:0 };

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

    // Score-prediction bonuses on group-stage matches with recorded results
    const scorePicks = picks.scores || {};
    for (const m of state.matches.filter(x => x.stage === 'group' && x.result)) {
      const sp = scorePicks[m.id];
      if (!sp || typeof sp.home !== 'number' || typeof sp.away !== 'number') continue;
      if (sp.home === m.result.home && sp.away === m.result.away) {
        total += SCORING.scoreExact; breakdown.scores += SCORING.scoreExact;
      } else {
        const sign = Math.sign(sp.home - sp.away);
        const actualSign = Math.sign(m.result.home - m.result.away);
        if (sign === actualSign) {
          // Same result; check goal difference
          if ((sp.home - sp.away) === (m.result.home - m.result.away)) {
            total += SCORING.scoreGD; breakdown.scores += SCORING.scoreGD;
          } else {
            total += SCORING.scoreResult; breakdown.scores += SCORING.scoreResult;
          }
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
    if (name === 'home')        renderHome();
    if (name === 'santaclara')  renderSantaClara();
    if (name === 'teams')       renderTeams();
    if (name === 'matches')     renderMatches();
    if (name === 'venues')      renderVenues();
    if (name === 'standings')   renderStandings();
    if (name === 'pool')        renderPool();
    if (name === 'quiz')        renderQuiz();
    if (name === 'stickers')    renderStickers();
    if (name === 'about')       renderAbout();
    window.scrollTo({ top:0, behavior:'instant' });
  }

  /* ---- SANTA CLARA — Levi's Stadium spotlight ---- */
  function stageLabel(m) {
    if (m.stage === 'group') return 'Group ' + m.group + ' · ' + m.round;
    return m.round;
  }
  function buildStoryline(m) {
    const a = m.home ? countryByCode(m.home) : null;
    const b = m.away ? countryByCode(m.away) : null;
    if (!a || !b) return 'Bracket spot still to be decided. We won\'t know the teams until earlier rounds finish — but Levi\'s will be packed either way.';
    const bits = [];
    if (a.wc.titles && b.wc.titles) bits.push(`A heavyweight clash — ${a.wc.titles}-time champions ${a.name} against ${b.wc.titles}-time champions ${b.name}.`);
    else if (a.wc.titles)           bits.push(`${a.name}'s ${a.wc.titles} World Cup title${a.wc.titles>1?'s':''} meet ${b.name}'s rising story.`);
    else if (b.wc.titles)           bits.push(`${b.name} (${b.wc.titles}× champion) tested by ${a.name}.`);
    else if ((a.wc.appearances||0) <= 1 || (b.wc.appearances||0) <= 1) bits.push(`A history-making fixture — at least one of these sides is still writing its World Cup story.`);
    else                            bits.push(`${a.name} vs ${b.name} — two proud football nations meet in the Bay Area sunshine.`);
    if (m.stage === 'group') {
      bits.push(`Three points up for grabs in Group ${m.group}. Lose this and the maths get hard fast.`);
    } else {
      bits.push(`Win or go home — knockout football at its loudest.`);
    }
    return bits.join(' ');
  }
  function topStars(country, n) {
    if (!country || !country.stars) return [];
    return country.stars.slice(0, n);
  }

  function renderSantaClara() {
    const root = document.getElementById('screen-santaclara');
    const venue = venueById('lev');
    const matches = state.matches
      .filter(m => m.venue === 'lev')
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    const groupCount    = matches.filter(m => m.stage === 'group').length;
    const koCount       = matches.length - groupCount;
    const playedCount   = matches.filter(m => m.result).length;
    const nextOne       = matches.find(m => !m.result);

    let html = `
      <div class="sc-hero">
        <div class="city">Santa Clara · Bay Area</div>
        <h2>🌉 Levi's Stadium</h2>
        <div class="badge-row">
          <span class="chip">Home of the 49ers</span>
          <span class="chip">Opened ${venue.opened}</span>
          <span class="chip">${venue.cap.toLocaleString()} seats</span>
          <span class="chip gold">Our home games</span>
        </div>
        <div class="sc-stats">
          <div class="sc-stat"><div class="n">${matches.length}</div><div class="l">assigned here</div></div>
          <div class="sc-stat"><div class="n">${groupCount}</div><div class="l">group</div></div>
          <div class="sc-stat"><div class="n">${koCount}</div><div class="l">knockout</div></div>
          <div class="sc-stat"><div class="n">${playedCount}/${matches.length}</div><div class="l">played</div></div>
        </div>
      </div>

      <div class="card" style="border-left:3px solid var(--wc-green);">
        <h2>✅ Real official 2026 schedule</h2>
        <p style="font-size:0.88rem;">Matches below are the <b>actual 6 games</b> Levi's Stadium will host — 5 group games (Jun 13–25) plus a Round of 32 on Jul 1 — sourced from the official FIFA draw. Tap any match to record scores as they're played.</p>
        <p style="font-size:0.88rem;margin-top:6px;">Want live scores? Use <button class="btn gold" style="padding:4px 10px;font-size:0.78rem;" onclick="WC.syncScores()">⟳ Sync from OpenFootball</button> below to pull the latest results.</p>
      </div>

      <div class="card">
        <h2>About the stadium</h2>
        <p>${escapeHTML(venue.notes)}</p>
        <h3>Why Levi's stands out</h3>
        <ul style="padding-left:18px;line-height:1.6;font-size:0.9rem;">
          <li><b>LEED Gold</b> — one of the first major US stadiums certified for sustainability</li>
          <li><b>Solar bridges</b> & a <b>green roof</b> on the suite tower visible from BART/light rail</li>
          <li>Hosted <b>Super Bowl 50</b> (2016), <b>Super Bowl LX</b> (2026), <b>Copa América</b> (2016, 2024), and the College Football Playoff Final</li>
          <li>Field runs <b>north–south</b> — afternoon sun hits the west sideline; bring a hat for sunny seats</li>
        </ul>
      </div>

      <div class="card">
        <h2>🎟 Our matches at Levi's</h2>
        <p class="muted" style="font-size:0.86rem;margin-bottom:8px;">
          ${matches.length} match${matches.length===1?'':'es'} scheduled here.
          ${nextOne ? 'Next up: <b>'+stageLabel(nextOne)+'</b> on '+fmtDate(nextOne.date)+'.' : 'Every Levi\'s match has been played.'}
          Tap a country to see its full profile, or hit <b>Enter result</b> to record a score.
        </p>
        ${matches.length === 0 ? `<div class="empty">No matches currently assigned to Levi's. Reshuffle groups on the Teams tab and matches will rebuild here.</div>` : ''}
        ${matches.map(m => renderDetailMatch(m)).join('')}
      </div>

      <div class="card">
        <h2>🚗 Going to the game</h2>
        <div class="guide-grid">
          <div class="guide-tile">
            <div class="ttitle">📍 Address</div>
            <p>4900 Marie P. DeBartolo Way, Santa Clara, CA 95054. ~45 min south of SF, ~10 min from SJC airport.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">🚆 Transit</div>
            <p>VTA light rail "Mountain View – Winchester" line stops at the Great America station, right next to the stadium. From SF: Caltrain to Mountain View, then VTA south. Fans get free game-day VTA on match tickets.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">🅿️ Parking</div>
            <p>Pre-paid official lots are the safest bet (closes early in the day). Nearby Levi's lots, Great America, and several private lots open ~4 hours before kickoff.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">☀️ Weather</div>
            <p>Bay Area summer is mild — daytime 70–80°F (21–27°C). Evenings can dip to 55°F (13°C) and fog rolls in late. Bring a light layer for night games.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">👨‍👩‍👧‍👦 Family tips</div>
            <p>Family restrooms on every concourse. Bring noise-cancelling earmuffs for younger kids — the south-end supporters' section gets very loud. Empty water bottles allowed; fill at fountains.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">🍔 Food on site</div>
            <p>Local Bay Area vendors throughout the concourse — Bobby G's pizza, Mexicali tacos, garlic fries, and burritos. Plant-based options around section 121.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">⚽ Best place to sit (kids)</div>
            <p>Lower-bowl sideline 100s have the best sightlines; upper-300s east are cheapest and out of the sun. Avoid south-end-zone for first-time fans — that\'s the supporters' chant zone.</p>
          </div>
          <div class="guide-tile">
            <div class="ttitle">📱 Stadium app</div>
            <p>The official Levi's app shows real-time gate wait times, mobile ordering, and seat-finder. Worth downloading the morning of the match.</p>
          </div>
        </div>
      </div>

      <div class="card fact-card">
        <h2>🌎 What to expect at a World Cup match</h2>
        <p><b>Gates open 2 hours before kickoff</b> — and security can take a while, so plan to arrive 90+ minutes early. The crowd will be a mix of locals and travelling supporters in full kit; expect drums, anthems, and a serious party.</p>
        <p style="margin-top:8px;">FIFA enforces <b>strict no-political-message rules</b> on signs and banners. Bags must be clear and under the listed size — check the venue site before you go.</p>
      </div>
    `;

    root.innerHTML = html;
  }

  function renderDetailMatch(m) {
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const played = !!m.result;
    const score = played
      ? `<div class="dm-score played">${m.result.home}–${m.result.away}</div>`
      : `<div class="dm-score vs">vs</div>`;
    const homeStars = topStars(home, 2);
    const awayStars = topStars(away, 2);

    const teamCol = (c, side, label) => {
      if (!c) return `<div class="dm-team"><div class="flag">❔</div><div class="name muted">${label ? escapeHTML(label) : 'TBD'}</div><div class="meta">${label ? 'qualifier slot' : '—'}</div></div>`;
      return `<div class="dm-team" onclick="WC.openCountry('${c.code}')">
        <div class="flag">${c.flag}</div>
        <div class="name">${escapeHTML(c.name)}</div>
        <div class="meta">${c.wc.titles ? c.wc.titles+'× champion' : c.wc.appearances+' WC apps'}</div>
      </div>`;
    };

    const watchCol = (c, stars) => {
      if (!c) return `<div class="col"><div class="ctitle">—</div><div class="muted" style="font-size:0.78rem;">Awaiting team</div></div>`;
      return `<div class="col">
        <div class="ctitle">${c.flag} Watch for</div>
        ${stars.map(s => `<div><span class="star">${escapeHTML(s.name)}</span> <span class="pos">${escapeHTML(s.pos)}</span></div>`).join('')}
      </div>`;
    };

    return `<div class="detail-match${played?' played':''}">
      <div class="dm-head">
        <div class="dm-stage">${stageLabel(m)}</div>
        <div class="dm-when">${fmtDate(m.date)}<br>${m.time} PT</div>
      </div>
      <div class="dm-teams">
        ${teamCol(home, 'left', m.home_label)}
        ${score}
        ${teamCol(away, 'right', m.away_label)}
      </div>
      <div class="dm-storyline">${escapeHTML(buildStoryline(m))}</div>
      <div class="dm-watch">
        ${watchCol(home, homeStars)}
        ${watchCol(away, awayStars)}
      </div>
      <div class="dm-actions">
        <button class="btn" onclick="WC.editResult('${m.id}')">${played ? '✎ Edit result' : '⚽ Enter result'}</button>
        ${home ? `<button class="btn ghost" onclick="WC.openCountry('${home.code}')">${home.flag} ${escapeHTML(home.name)}</button>` : ''}
        ${away ? `<button class="btn ghost" onclick="WC.openCountry('${away.code}')">${away.flag} ${escapeHTML(away.name)}</button>` : ''}
      </div>
    </div>`;
  }

  /* ---- HOME ---- */
  function renderHome() {
    const root = document.getElementById('screen-home');
    const now = new Date();
    // Count down to the real opener's kickoff (venue-tz aware), falling
    // back to TOURNAMENT_START if the schedule is somehow empty.
    const opener = state.matches.slice().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
    const startD = opener ? kickoffDate(opener) : new Date(TOURNAMENT_START);
    const diff = Math.max(0, startD - now);
    const days = Math.floor(diff / 86400000);
    const hrs  = Math.floor(diff / 3600000) % 24;
    const mins = Math.floor(diff / 60000) % 60;
    const secs = Math.floor(diff / 1000) % 60;

    const today = todayKey();
    const todays = matchesOn(today);
    const next = state.matches
      .filter(m => !m.result)
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];

    // Today section: show today's games if any, otherwise the next
    // upcoming fixture rendered as a real match row (not just a date line).
    let todayCardTitle;
    let todayHTML;
    if (todays.length > 0) {
      todayCardTitle = `📅 Today — ${todays.length} match${todays.length===1?'':'es'}`;
      todayHTML = todays.map(m => renderTodayRow(m)).join('');
    } else if (next) {
      const dayDiff = Math.ceil((new Date(next.date+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000);
      const dayLabel = dayDiff === 1 ? 'Tomorrow' : (dayDiff <= 0 ? 'Coming up' : 'Coming up — in ' + dayDiff + ' days');
      todayCardTitle = `⚽ Next match — ${dayLabel}`;
      todayHTML = `
        <p class="muted" style="font-size:0.85rem;margin-bottom:8px;">${fmtDate(next.date)} · ${fmtKickoffLocal(next)} your time (${next.time} at the venue)</p>
        ${renderTodayRow(next)}
        ${matchesOnAfter(next.date).slice(0, 4).map(m => renderTodayRow(m)).join('')}
        <p class="muted" style="font-size:0.78rem;margin-top:10px;text-align:center;">No fixtures today — these are the next up.</p>
      `;
    } else {
      todayCardTitle = '🏆 Tournament complete';
      todayHTML = '<div class="empty">All 104 matches played — final whistle has blown!</div>';
    }

    const preTournament = days > 0;
    const tourneyOver = !next && todays.length === 0;

    // ---- My Tournament: favorite team + personalized feed ----
    const favCode = getFavoriteTeam();
    const fav = favCode ? countryByCode(favCode) : null;
    const teamOptionsHtml = COUNTRIES.slice()
      .sort((a,b) => a.name.localeCompare(b.name))
      .map(c => `<option value="${c.code}" ${favCode===c.code?'selected':''}>${c.flag} ${escapeHTML(c.name)}</option>`)
      .join('');
    let myTournamentHTML = `
      <div class="pick-row" style="grid-template-columns:auto 1fr;gap:8px;align-items:center;">
        <div class="lbl">Favourite</div>
        <select onchange="WC.setFavoriteTeam(this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.9rem;width:100%;">
          <option value="">— pick a team to follow —</option>
          ${teamOptionsHtml}
        </select>
      </div>`;
    if (fav) {
      const favNext = state.matches
        .filter(m => !m.result && (m.home === favCode || m.away === favCode))
        .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
      const favLast = state.matches
        .filter(m => m.result && (m.home === favCode || m.away === favCode))
        .sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time))[0];
      myTournamentHTML += `<div style="margin-top:10px;">`;
      if (favLast) myTournamentHTML += `<div style="font-size:0.85rem;margin-bottom:6px;">Last result:</div>${renderTodayRow(favLast)}`;
      if (favNext) {
        myTournamentHTML += `<div style="font-size:0.85rem;margin:8px 0 6px;">Next up:</div>${renderTodayRow(favNext)}`;
      } else if (!favLast) {
        myTournamentHTML += `<p class="muted" style="font-size:0.85rem;">${fav.flag} ${escapeHTML(fav.name)} are in <b>Group ${fav.group}</b>. Their fixtures will appear here.</p>`;
      }
      myTournamentHTML += `<button class="btn ghost" style="margin-top:10px;font-size:0.8rem;" onclick="WC.openCountry('${favCode}')">${fav.flag} View ${escapeHTML(fav.name)} profile →</button></div>`;
    }

    // ---- Activity feed ----
    const acts = (state.activity || []).slice(0, 12);
    const activityHTML = acts.length === 0
      ? '<div class="empty" style="padding:14px;">No activity yet — submit a bracket or record a result to get things going.</div>'
      : acts.map(a => `
          <div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--wc-line);">
            <span style="font-size:1.1rem;">${escapeHTML(a.icon||'•')}</span>
            <div style="flex:1;font-size:0.86rem;line-height:1.4;">${a.text}<div class="muted" style="font-size:0.72rem;">${fmtAgo(a.ts)}</div></div>
          </div>`).join('');

    root.innerHTML = `
      ${preTournament ? `
      <div class="card">
        <h2>⏱ Kick-off countdown</h2>
        <p class="muted">First match: <b>${fmtDate('2026-06-11')}</b> · Estadio Azteca · Mexico City${opener ? ` · <b>${fmtKickoffLocal(opener)}</b> your time` : ''}</p>
        <div class="countdown" id="cd">
          <div class="cd-cell"><div class="n">${days}</div><div class="l">days</div></div>
          <div class="cd-cell"><div class="n">${pad(hrs)}</div><div class="l">hours</div></div>
          <div class="cd-cell"><div class="n">${pad(mins)}</div><div class="l">min</div></div>
          <div class="cd-cell"><div class="n">${pad(secs)}</div><div class="l">sec</div></div>
        </div>
      </div>` : ''}

      <div class="card">
        <h2>${todayCardTitle}</h2>
        <div id="today-list">${todayHTML}</div>
      </div>

      <div class="card" style="${fav ? 'border-left:3px solid var(--wc-gold);' : ''}">
        <h2>⭐ My Tournament</h2>
        ${myTournamentHTML}
      </div>

      <div class="card">
        <h2>📣 Family activity</h2>
        <div>${activityHTML}</div>
      </div>

      <div class="card fact-card">
        <h2>📜 Today in World Cup history</h2>
        <p>${escapeHTML(wcHistoryToday())}</p>
      </div>

      <div class="card fact-card">
        <h2>🌎 The 2026 World Cup at a glance</h2>
        <p>The first 48-team World Cup. Three host nations — <b>Canada · Mexico · United States</b>. <b>16 cities</b> and <b>104 matches</b> across 39 days. The opener is at the Estadio Azteca; the final at MetLife Stadium on July 19.</p>
        <h3>Format</h3>
        <p>12 groups of 4. Top two from each group plus the eight best third-placed teams qualify for a new Round of 32, then standard knockouts.</p>
      </div>
      <div class="card">
        <h2>🌉 Our home games — Santa Clara</h2>
        <p class="muted">Levi's Stadium is hosting World Cup matches just up the road. Detailed previews, key players, and a "going to the game" guide are in their own tab.</p>
        <button class="btn gold" onclick="WC.tab('santaclara')">Open Santa Clara tab →</button>
      </div>
      <div class="card">
        <h2>👨‍👩‍👧‍👦 Family bracket pool</h2>
        <p class="muted">Lock in your picks, then watch the leaderboard as results come in. Your hub profile signs you in automatically.</p>
        <button class="btn" onclick="WC.tab('pool')">Open Bracket Pool →</button>
      </div>
    `;
  }

  // One headline star per side for upcoming fixtures — "⭐ Messi · Mahrez".
  // Uses the curated stars list (short, always present) rather than the
  // 26-man nominated squad.
  function matchStarsHTML(m) {
    if (m.result) return '';
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const h = home && home.stars && home.stars[0] ? home.stars[0].name : null;
    const a = away && away.stars && away.stars[0] ? away.stars[0].name : null;
    if (!h || !a) return '';
    return `<div class="stars">⭐ ${escapeHTML(h)} · ${escapeHTML(a)}</div>`;
  }

  function renderTodayRow(m) {
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const venue = venueById(m.venue);
    const played = !!m.result;
    const diffMs = kickoffDate(m).getTime() - Date.now();
    // A synced score inside the live window may be partial (OpenFootball
    // updates as games run), so keep the LIVE badge until the window ends.
    const inLiveWindow = diffMs <= 0 && diffMs > -LIVE_WINDOW_MS;
    let when;
    if (played && !inLiveWindow) {
      when = '<span style="color:var(--wc-green);font-weight:800;">FT</span>';
    } else if (inLiveWindow) {
      when = '<span style="color:var(--wc-red);font-weight:800;">LIVE</span>';
    } else if (diffMs > 0) {
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor(diffMs / 60000) % 60;
      when = hrs >= 48 ? `in ${Math.floor(hrs/24)}d ${hrs%24}h` : (hrs > 0 ? `in ${hrs}h ${mins}m` : `in ${mins}m`);
    } else {
      when = '<span class="muted">finished</span>';
    }
    const hLabel = home ? `${home.flag} ${escapeHTML(home.name)}` : (m.home_label ? `<span class="muted">${escapeHTML(m.home_label)}</span>` : 'TBD');
    const aLabel = away ? `${away.flag} ${escapeHTML(away.name)}` : (m.away_label ? `<span class="muted">${escapeHTML(m.away_label)}</span>` : 'TBD');
    const score = played ? `<span class="score">${m.result.home}–${m.result.away}</span>` : `<span class="vs">${fmtKickoffLocal(m)}</span>`;
    return `
      <div class="match" onclick="WC.editResult('${m.id}')" style="grid-template-columns: 60px 1fr auto;">
        <div class="when"><div class="time">${when}</div><div>${venue ? escapeHTML(venue.city.split(',')[0]) : ''}</div></div>
        <div class="teams">
          <div class="side left"><span class="name">${hLabel}</span></div>
          ${score}
          <div class="side"><span class="name">${aLabel}</span></div>
          ${matchStarsHTML(m)}
        </div>
        <div class="badge">${m.stage === 'group' ? 'Group '+m.group : m.round}</div>
      </div>`;
  }

  /* ---- TEAMS ---- */
  function renderTeams() {
    const root = document.getElementById('screen-teams');
    const groups = state.groups;
    let html = `<div class="muted" style="font-size:0.85rem; margin-bottom:10px;">
      All 48 teams, grouped A–L. Tap a country for its history, geography, and star players.
      <span style="display:block;margin-top:4px;">Groups reflect the official December 2025 draw. (You can still reshuffle for fun via ✎.)</span>
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
    // Earn a sticker just for visiting (only the first time)
    earnSticker(code, 'visit', false);
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
        ${(() => {
          const roster = rosterFor(c);
          const heading = roster.nominated
            ? `👕 Nominated squad <span class="muted" style="font-size:0.8rem;font-weight:400;">(${roster.players.length})</span>`
            : '⭐ Star players';
          const footnote = roster.nominated
            ? 'Official nominated squad. ⭐ marks the key players we\'d flagged to watch.'
            : 'Player snapshot — clubs, ages, and squad selections may have changed since mid-2025. The full nominated squad loads here once published.';
          return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="margin:0;">${heading}</h2>
          <button class="btn gold" style="padding:6px 12px;font-size:0.78rem;flex-shrink:0;" onclick="WC.syncNominations()" title="Pull the latest nominated squads">⟳ Refresh squads</button>
        </div>
        <div class="player-list" style="margin-top:10px;">
          ${roster.players.map(p => `
            <div class="player${p.key ? ' player-key' : ''}">
              <div class="top"><div class="name">${p.num != null && p.num !== '' ? `<span class="shirt">${escapeHTML(String(p.num))}</span> ` : ''}${escapeHTML(p.name)}${p.key ? ' <span class="key-badge" title="Key player to watch">⭐</span>' : ''}</div><div class="pos">${escapeHTML(p.pos || '')}</div></div>
              <div class="meta">${escapeHTML(p.club || '')}${p.age != null && p.age !== '' ? ` · age ${escapeHTML(String(p.age))}` : ''}</div>
              ${p.note ? `<div class="note">${escapeHTML(p.note)}</div>` : ''}
            </div>`).join('')}
        </div>
        <p class="muted" style="font-size:0.78rem;margin-top:10px;line-height:1.5;">
          ${footnote}
        </p>`;
        })()}
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
    const chip = state.matchChip || 'all';

    let list = state.matches.slice();
    if (stageFilter !== 'all') list = list.filter(m => m.stage === stageFilter);
    if (groupFilter !== 'all') list = list.filter(m => m.group === groupFilter);

    // Quick chips: today / knockouts / my picks / Levi's
    if (chip === 'today') {
      const t = todayKey();
      list = list.filter(m => m.date === t);
    } else if (chip === 'ko') {
      list = list.filter(m => m.stage !== 'group');
    } else if (chip === 'lev') {
      list = list.filter(m => m.venue === 'lev');
    } else if (chip === 'mine') {
      const user = currentActiveUser();
      const myEntry = user ? state.members.find(m => m.name && m.name.toLowerCase() === user.name.toLowerCase()) : null;
      const picks = myEntry ? state.picks[myEntry.id] : null;
      const picked = new Set();
      if (picks) {
        for (const g of GROUP_LETTERS) {
          if (picks.groupWinners && picks.groupWinners[g]) picked.add(picks.groupWinners[g]);
          if (picks.groupRunnersUp && picks.groupRunnersUp[g]) picked.add(picks.groupRunnersUp[g]);
        }
        for (const stage of ['R32','R16','QF','SF','Final']) {
          const s = picks.ko && picks.ko[stage] ? picks.ko[stage] : {};
          for (const id of Object.keys(s)) if (s[id]) picked.add(s[id]);
        }
        if (picks.champion) picked.add(picks.champion);
        if (picks.runnerUp) picked.add(picks.runnerUp);
      }
      list = list.filter(m => (m.home && picked.has(m.home)) || (m.away && picked.has(m.away)));
    }

    list.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

    // group by date
    const byDate = {};
    list.forEach(m => { (byDate[m.date] = byDate[m.date] || []).push(m); });

    const chipBtn = (val, label) => `<button class="tab ${chip===val?'active':''}" style="font-size:0.78rem;padding:6px 12px;" onclick="WC.setMatchChip('${val}')">${label}</button>`;

    const filterHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
        ${chipBtn('all',   'All')}
        ${chipBtn('today', '📅 Today')}
        ${chipBtn('ko',    '⚔ Knockouts')}
        ${chipBtn('mine',  '🎯 My picks')}
        ${chipBtn('lev',   '🌉 Levi&#39;s')}
      </div>
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
        <span class="muted" style="font-size:0.8rem; align-self:center;">${list.length} match${list.length===1?'':'es'}</span>
      </div>
    `;

    const liveNow = anyMatchLiveWindow();
    const lastSyncStr = _lastScoreSyncAt ? new Date(_lastScoreSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
    const liveLine = liveNow
      ? `<div style="font-size:0.78rem;margin-top:6px;color:var(--wc-red);font-weight:700;">🔴 Match in play — auto-syncing results every minute${lastSyncStr ? ` · last checked ${lastSyncStr}` : ''}</div>`
      : (lastSyncStr ? `<div class="muted" style="font-size:0.74rem;margin-top:6px;">Auto-sync runs during matches · last checked ${lastSyncStr}</div>` : '');
    let html = `<div class="card" style="border-left:3px solid var(--wc-green);padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:0.86rem;line-height:1.5;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <span>✅ <b>Official 2026 schedule</b> — sourced from FIFA via the public OpenFootball dataset. Tap any match to enter scores or edit details.</span>
        <button class="btn gold" style="padding:6px 12px;font-size:0.78rem;flex-shrink:0;" onclick="WC.syncScores()">⟳ Sync scores</button>
      </div>
      ${liveLine}
    </div>` + filterHTML;
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
    const homeLabel = home ? `${home.flag} ${escapeHTML(home.name)}` : (m.home_label ? `<span class="muted">${escapeHTML(m.home_label)}</span>` : '<span class="muted">TBD</span>');
    const awayLabel = away ? `${away.flag} ${escapeHTML(away.name)}` : (m.away_label ? `<span class="muted">${escapeHTML(m.away_label)}</span>` : '<span class="muted">TBD</span>');
    const score = played ? `<span class="score">${m.result.home}–${m.result.away}</span>` : `<span class="vs">vs</span>`;
    const localKick = fmtKickoffLocal(m);
    return `
      <div class="match${played?' played':''}${koClass}" onclick="WC.editResult('${m.id}')">
        <div class="when">
          <div>${m.date.slice(5)}</div>
          <div class="time">${m.time}</div>
          ${played ? '' : `<div style="font-size:0.66rem;color:var(--text-muted);">${localKick} you</div>`}
        </div>
        <div class="teams">
          <div class="side left"><span class="name">${homeLabel}</span></div>
          ${score}
          <div class="side"><span class="name">${awayLabel}</span></div>
          ${matchStarsHTML(m)}
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

    // ---- Golden Boot race (fed by syncScores when OpenFootball has scorers) ----
    const scorers = (state.scorers || []).slice(0, 10);
    html += `<div class="card" style="padding:14px;border-left:3px solid var(--wc-gold);">
      <h2>👟 Golden Boot race</h2>
      ${scorers.length === 0
        ? `<div class="empty" style="padding:12px;">No goals recorded yet — once matches kick off, hit
             <button class="btn gold" style="padding:4px 10px;font-size:0.78rem;" onclick="WC.syncScores()">⟳ Sync scores</button>
             to pull the live scorer list.</div>`
        : `<table class="standings-table">
            <thead><tr><th></th><th style="text-align:left;">Player</th><th style="text-align:left;">Team</th><th>⚽</th></tr></thead>
            <tbody>
              ${scorers.map((s, i) => {
                const c = countryByCode(s.team);
                return `<tr${i === 0 ? ' class="advancing"' : ''}>
                  <td>${i + 1}</td>
                  <td style="text-align:left;font-weight:700;">${escapeHTML(s.name)}</td>
                  <td style="text-align:left;">${c ? c.flag + ' ' + escapeHTML(c.name) : escapeHTML(s.team)}</td>
                  <td><b>${s.goals}</b></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <p class="muted" style="font-size:0.72rem;margin-top:6px;">Top 10 · own goals excluded · updates with each score sync. Ties shown alphabetically — FIFA breaks ties on assists, then minutes played.</p>`}
    </div>`;

    // ---- Best third-placed teams (8 qualify for the Round of 32) ----
    const tr = getThirdPlaceRanking();
    if (tr.thirds.length > 0) {
      html += `<div class="card" style="padding:14px;border-left:3px solid var(--wc-blue);">
        <h2>🥉 Best third-placed teams</h2>
        <table class="standings-table">
          <thead><tr><th></th><th style="text-align:left;">Team</th><th>Grp</th><th>Pts</th><th>GD</th><th>GF</th></tr></thead>
          <tbody>
            ${tr.thirds.map((t, i) => {
              const c = countryByCode(t.code);
              const through = i < 8;
              return `<tr class="${through ? 'advancing' : ''}">
                <td>${i + 1}</td>
                <td class="team" style="text-align:left;">${c ? c.flag + ' ' + escapeHTML(c.name) : t.code}${through ? '' : ' <span class="muted" style="font-size:0.7rem;">(out)</span>'}</td>
                <td>${t.group}</td><td><b>${t.pts}</b></td><td>${t.gd > 0 ? '+' : ''}${t.gd}</td><td>${t.gf}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <p class="muted" style="font-size:0.72rem;margin-top:6px;">
          ${tr.complete
            ? 'Top 8 qualify. They\'re auto-seeded into the Round of 32 — exact slotting is <b>provisional</b> until confirmed against the official bracket (tap a match to correct).'
            : 'Ranking finalises once every group has played all three matchdays. Tiebreakers: points, goal difference, goals for.'}
        </p>
      </div>`;
    }

    for (const g of GROUP_LETTERS) {
      const rows = tables[g] || [];
      const scen = groupScenarios(rows);
      const hasScen = Object.keys(scen).length > 0;
      html += `<div class="card" style="padding:14px;">
        <h2>Group ${g}</h2>
        <table class="standings-table">
          <thead><tr><th style="text-align:left;">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>${hasScen?'<th></th>':''}</tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              const c = countryByCode(r.code);
              const cls = i < 2 ? 'advancing' : (i === 2 ? 'qualified-3rd' : '');
              const s = scen[r.code];
              const scenColor = s ? (s.kind==='in'?'var(--wc-green)':(s.kind==='out'?'var(--wc-red)':'var(--text-muted)')) : '';
              return `<tr class="${cls}">
                <td class="team">${c ? c.flag : ''} ${c ? escapeHTML(c.name) : r.code}</td>
                <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
                <td>${r.gf}</td><td>${r.ga}</td><td>${r.gf-r.ga}</td>
                <td><b>${r.pts}</b></td>
                ${hasScen?`<td style="font-size:0.7rem;font-weight:700;color:${scenColor};white-space:nowrap;">${s?s.label:''}</td>`:''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${hasScen?'<p class="muted" style="font-size:0.72rem;margin-top:6px;">Live scenarios are points-based — goal difference & head-to-head tiebreakers may still shuffle things.</p>':''}
      </div>`;
    }

    // Knockout bracket (computed). The reset button clears any
    // manually-set teams (e.g. edits made before auto-resolution
    // existed) and re-derives the bracket from results + the feed.
    const koManualCount = state.matches.filter(m =>
      m.stage !== 'group' &&
      ((m.home && !(state.koAuto || {})[m.id + '.home'] && !(state.koFeed || {})[m.id + '.home']) ||
       (m.away && !(state.koAuto || {})[m.id + '.away'] && !(state.koFeed || {})[m.id + '.away']))
    ).length;
    html += `<div class="bracket-stage">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
        <h2 style="font-family:var(--font-display);font-size:1.2rem;margin:0;">🏆 Knockout bracket</h2>
        <button class="btn ghost" style="font-size:0.76rem;padding:5px 10px;" onclick="WC.resetBracket()">↺ Reset to auto</button>
      </div>
      ${koManualCount ? `<p class="muted" style="font-size:0.74rem;margin:-4px 0 8px;">${koManualCount} match${koManualCount===1?'':'es'} ${koManualCount===1?'has a':'have'} manually-set team. "Reset to auto" re-derives the whole bracket from results and the official feed.</p>` : ''}`;
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
    const homeText = home ? home.flag+' '+escapeHTML(home.name) : (m.home_label ? escapeHTML(m.home_label) : 'TBD');
    const awayText = away ? away.flag+' '+escapeHTML(away.name) : (m.away_label ? escapeHTML(m.away_label) : 'TBD');
    return `<div class="bracket-tie" onclick="WC.editResult('${m.id}')" style="cursor:pointer;">
      <div class="l ${homeCls}"><span>${homeText}</span><span class="s">${hs}</span></div>
      <div class="l ${awayCls}"><span>${awayText}</span><span class="s">${as}</span></div>
      <div class="muted" style="font-size:0.7rem; margin-top:4px;">${m.date.slice(5)} · ${m.time}</div>
    </div>`;
  }

  /* ---- BRACKET POOL ---- */
  function renderPool() {
    const root = document.getElementById('screen-pool');
    const selectedId = state.uiSelectedMember || null;

    // Leaderboard — only entries with a name show up
    const board = state.members
      .filter(m => m.name && m.name.trim())
      .map(m => {
        const { total, breakdown } = scoreMember(m.id);
        return { ...m, total, breakdown };
      })
      .sort((a,b) => b.total - a.total);

    const activeUser = currentActiveUser();
    const myEntry = activeUser ? state.members.find(m => m.name && m.name.toLowerCase() === activeUser.name.toLowerCase()) : null;
    const ctaLabel = activeUser
      ? (myEntry ? `✎ Edit ${escapeHTML(activeUser.name)}'s bracket` : `🎯 Submit your bracket, ${escapeHTML(activeUser.name)}`)
      : '🎯 Submit your bracket';

    // Lock-deadline banner: countdown to the next group/round freeze.
    const nextLock = nextLockInfo();
    let lockBannerHTML = '';
    if (nextLock) {
      const ms = nextLock.at - Date.now();
      const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, mi = Math.floor(ms / 60000) % 60;
      const inStr = d > 0 ? `${d}d ${h}h` : (h > 0 ? `${h}h ${mi}m` : `${mi}m`);
      const atStr = nextLock.at.toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
      lockBannerHTML = `
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:10px 12px;margin-top:10px;font-size:0.85rem;line-height:1.45;">
          ⏳ <b>${escapeHTML(nextLock.label)} picks lock in ${inStr}</b> — at kickoff, ${atStr} your time.
          Each group freezes when its first match starts; knockout rounds freeze as each round begins.
        </div>`;
    } else {
      lockBannerHTML = `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:10px 12px;margin-top:10px;font-size:0.85rem;">
          🔒 <b>All picks are locked</b> — every round has kicked off. Watch the leaderboard!
        </div>`;
    }

    let html = `
      <div class="card">
        <h2>👨‍👩‍👧‍👦 Family Bracket Pool</h2>
        <p class="muted" style="font-size:0.85rem;">${activeUser
          ? 'Each profile gets one bracket — your picks are saved against your name automatically. Scores update as real results come in.'
          : 'Enter your name and your picks — once you\'ve saved at least your name, you\'re in the pool. Scores update automatically as real results land on the Matches tab.'}</p>
        ${lockBannerHTML}

        <h3 style="margin-top:14px;">🏅 Leaderboard</h3>
        ${board.length === 0
          ? '<div class="empty">Be the first to submit a bracket! Hit the button below to get started.</div>'
          : board.map((m, i) => `
              <div class="leader ${i===0?'top1':''}">
                <div class="rank">${i+1}</div>
                <div class="who">${m.avatar ? '<span style="margin-right:6px;">'+escapeHTML(m.avatar)+'</span>' : ''}${escapeHTML(m.name)}<div class="muted" style="font-size:0.75rem;font-weight:600;">G:${m.breakdown.groups} · KO:${m.breakdown.ko} · 🏆:${m.breakdown.champion+m.breakdown.runnerUp} · 👟:${m.breakdown.goldenBoot}</div></div>
                <div class="pts">${m.total}</div>
                <div class="actions">
                  <button title="Edit picks" onclick="WC.editEntry('${m.id}')">✎</button>
                  <button title="Share bracket" onclick="WC.openShareBracket('${m.id}')">🔗</button>
                  <button title="Remove from pool" onclick="WC.removeMember('${m.id}')">✕</button>
                </div>
              </div>`).join('')}

        ${selectedId ? '' : `
          <div style="text-align:center;margin-top:14px;display:flex;flex-direction:column;gap:8px;align-items:center;">
            <button class="btn gold" style="font-size:1rem;padding:12px 24px;" onclick="WC.startEntry()">${ctaLabel}</button>
            ${board.length >= 2 ? `<button class="btn ghost" style="font-size:0.82rem;" onclick="WC.openCompare()">⚖ Compare two brackets</button>` : ''}
            ${board.length > 0 ? `<button class="btn ghost" style="font-size:0.82rem;" onclick="WC.openShareFamilyPool()">📤 Share family pool (snapshot link)</button>` : ''}
            <button class="btn ghost" style="font-size:0.82rem;" onclick="WC.openInviteGuest()">📨 Invite extended family (no app/VPN needed)</button>
          </div>
        `}

        <h3 style="margin-top:14px;">📋 Scoring rules</h3>
        <div class="scoring-rules">
          <b>Group stage</b>: 2 pts per correct group winner · 1 pt per correct runner-up<br>
          <b>Score predictions</b> (group games only): exact = 5 · correct GD = 3 · right winner = 1<br>
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
  }

  function renderMemberPicks(member) {
    const picks = state.picks[member.id] || (state.picks[member.id] = { groupWinners:{}, groupRunnersUp:{}, ko:{}, champion:null, runnerUp:null, goldenBoot:'', goldenBootCorrect:false });
    picks.mode = picks.mode || 'buildup';
    picks.groupThird = picks.groupThird || {};
    picks.scores = picks.scores || {};
    const buildup = picks.mode === 'buildup';
    if (buildup) syncOutcomeFromFinal(picks);

    const actualTop2 = getActualGroupTop2();
    const koActual = getKnockoutWinners();
    const champRu = getChampionAndRunnerUp();

    function teamSelect(currentCode, options, onchange, disabled) {
      return `<select onchange="${onchange}" ${disabled ? 'disabled' : ''}>
        <option value="">— pick —</option>
        ${options.map(code => {
          const c = countryByCode(code);
          if (!c) return '';
          return `<option value="${code}" ${currentCode===code?'selected':''}>${c.flag} ${escapeHTML(c.name)}</option>`;
        }).join('')}
      </select>`;
    }
    const allTeamCodes = COUNTRIES.map(c => c.code);
    const outcomesLocked = areOutcomesLocked();

    // ---- Group section ----
    // build-up: scoreline inputs + "apply" + 1st/2nd/3rd selects.
    // top-down: 1st/2nd selects only (scorelines live in the collapsible below).
    let groupsHTML = '';
    for (const g of GROUP_LETTERS) {
      const codes = state.groups[g] || [];
      const winPick = picks.groupWinners[g] || '';
      const ruPick  = picks.groupRunnersUp[g] || '';
      const thirdPick = picks.groupThird[g] || '';
      const actual = actualTop2[g];
      const winMark = actual ? (winPick === actual.winner ? `<span class="correct">✓ ${SCORING.groupWinner}</span>` : (winPick ? '<span class="miss">✗</span>' : '')) : '';
      const ruMark  = actual ? (ruPick  === actual.runnerUp ? `<span class="correct">✓ ${SCORING.groupRunnerUp}</span>` : (ruPick ? '<span class="miss">✗</span>' : '')) : '';
      const locked = isGroupLocked(g);
      const lockChip = locked ? ' <span class="chip" style="background:rgba(239,68,68,0.12);color:#FCA5A5;font-size:0.65rem;padding:2px 6px;">🔒 locked</span>' : '';

      let scoreRows = '';
      if (buildup) {
        const gms = state.matches.filter(x => x.stage === 'group' && x.group === g)
          .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
        scoreRows = gms.map(m => {
          const sp = picks.scores[m.id] || {};
          const h = m.home ? countryByCode(m.home) : null;
          const a = m.away ? countryByCode(m.away) : null;
          const ml = locked || _matchStarted(m);
          return `<div style="display:grid;grid-template-columns:1fr 42px 10px 42px;gap:5px;align-items:center;font-size:0.78rem;padding:2px 0;">
            <span>${h?h.flag+' '+escapeHTML(h.name):'TBD'} <span style="opacity:0.4;">v</span> ${a?a.flag+' '+escapeHTML(a.name):'TBD'}</span>
            <input type="number" min="0" max="20" ${ml?'disabled':''} value="${typeof sp.home==='number'?sp.home:''}" oninput="WC.setScorePred('${member.id}','${m.id}','home',this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:6px;padding:3px;text-align:center;font-weight:700;" />
            <span style="text-align:center;opacity:0.5;">–</span>
            <input type="number" min="0" max="20" ${ml?'disabled':''} value="${typeof sp.away==='number'?sp.away:''}" oninput="WC.setScorePred('${member.id}','${m.id}','away',this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:6px;padding:3px;text-align:center;font-weight:700;" />
          </div>`;
        }).join('');
        scoreRows = `<div style="margin:4px 0;">${scoreRows}<button class="btn ghost" style="font-size:0.72rem;padding:4px 8px;margin-top:4px;" onclick="WC.applyGroupScores('${member.id}','${g}')" ${locked?'disabled':''}>↻ Standings from scores</button></div>`;
      }

      const thirdRow = buildup
        ? `<div class="pick-row"><div class="lbl">3rd place</div><div>${teamSelect(thirdPick, codes, `WC.setGroupPick('${member.id}','${g}','third',this.value)`, locked)}</div></div>`
        : '';

      groupsHTML += `<div style="margin-bottom:14px;">
        <div style="font-weight:800;color:var(--wc-gold);margin-bottom:4px;">Group ${g}${lockChip}</div>
        ${scoreRows}
        <div class="pick-row"><div class="lbl">Winner</div><div>${teamSelect(winPick, codes, `WC.setGroupPick('${member.id}','${g}','winner',this.value)`, locked)}${winMark}</div></div>
        <div class="pick-row"><div class="lbl">Runner-up</div><div>${teamSelect(ruPick, codes, `WC.setGroupPick('${member.id}','${g}','runnerUp',this.value)`, locked)}${ruMark}</div></div>
        ${thirdRow}
      </div>`;
    }

    // ---- Knockouts ----
    // build-up: candidates cascade from THIS member's picks (their group
    // placements feed R32; each round's winners feed the next).
    // top-down: candidates come from the full bracket structure.
    function koPicksFor(stage) {
      const matches = state.matches.filter(m => m.stage === stage);
      if (matches.length === 0) return '';
      const label = stage === 'R32' ? 'Round of 32' : stage === 'R16' ? 'Round of 16' : stage === 'QF' ? 'Quarterfinals' : stage === 'SF' ? 'Semifinals' : 'Final';
      const ptsLabel = SCORING[stage];
      const stageLocked = isStageLocked(stage);
      const lockChip = stageLocked ? ' <span class="chip" style="background:rgba(239,68,68,0.12);color:#FCA5A5;font-size:0.65rem;padding:2px 6px;">🔒 locked</span>' : '';
      const items = matches.map(m => {
        const optionsList = buildup ? memberCandidatesForMatch(m, picks) : candidatesForMatch(m);
        const pickStage = picks.ko[stage] || (picks.ko[stage] = {});
        const cur = pickStage[m.id] || '';
        const actual = koActual[stage][m.id];
        const mark = actual ? (cur === actual ? `<span class="correct">✓ ${ptsLabel}</span>` : (cur ? '<span class="miss">✗</span>' : '')) : '';
        const homeName = buildup ? memberSideLabel(m.home, m.home_label, picks)
                                 : (m.home ? countryByCode(m.home).flag+' '+countryByCode(m.home).name : (m.home_label || 'TBD'));
        const awayName = buildup ? memberSideLabel(m.away, m.away_label, picks)
                                 : (m.away ? countryByCode(m.away).flag+' '+countryByCode(m.away).name : (m.away_label || 'TBD'));
        return `<div class="pick-row">
          <div class="lbl" style="font-size:0.7rem;">${escapeHTML(homeName)} vs ${escapeHTML(awayName)}</div>
          <div>${teamSelect(cur, optionsList, `WC.setKoPick('${member.id}','${stage}','${m.id}',this.value)`, stageLocked)}${mark}</div>
        </div>`;
      }).join('');
      const hint = buildup && stage === 'R32' ? ' <span class="muted" style="font-size:0.7rem;font-weight:600;">— teams come from your group picks above</span>' : '';
      return `<h3>${label}${lockChip} <span class="muted" style="font-size:0.75rem;font-weight:600;">(${ptsLabel} pt${ptsLabel>1?'s':''} per correct pick)</span>${hint}</h3>${items}`;
    }

    // Score predictions per group match (collapsed by default)
    function scorePredictionsHTML() {
      picks.scores = picks.scores || {};
      const groups = {};
      for (const m of state.matches.filter(x => x.stage === 'group')) {
        (groups[m.group] = groups[m.group] || []).push(m);
      }
      let inner = '';
      for (const g of GROUP_LETTERS) {
        const list = (groups[g] || []).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
        if (list.length === 0) continue;
        const locked = isGroupLocked(g);
        const lockChip = locked ? ' <span class="chip" style="background:rgba(239,68,68,0.12);color:#FCA5A5;font-size:0.65rem;padding:2px 6px;">🔒</span>' : '';
        inner += `<div style="margin-top:10px;"><div style="font-weight:800;color:var(--wc-gold);margin-bottom:4px;">Group ${g}${lockChip}</div>`;
        for (const m of list) {
          const sp = picks.scores[m.id] || {};
          const home = m.home ? countryByCode(m.home) : null;
          const away = m.away ? countryByCode(m.away) : null;
          const matchLocked = locked || _matchStarted(m);
          const played = !!m.result;
          let mark = '';
          if (played && typeof sp.home === 'number' && typeof sp.away === 'number') {
            if (sp.home === m.result.home && sp.away === m.result.away) mark = `<span class="correct">✓ ${SCORING.scoreExact}</span>`;
            else if (Math.sign(sp.home-sp.away) === Math.sign(m.result.home-m.result.away) && (sp.home-sp.away) === (m.result.home-m.result.away)) mark = `<span class="correct">+${SCORING.scoreGD}</span>`;
            else if (Math.sign(sp.home-sp.away) === Math.sign(m.result.home-m.result.away)) mark = `<span class="correct">+${SCORING.scoreResult}</span>`;
            else mark = '<span class="miss">✗</span>';
          }
          inner += `<div style="display:grid;grid-template-columns:1fr 50px 12px 50px;gap:6px;align-items:center;font-size:0.82rem;padding:4px 0;">
            <span>${home ? home.flag+' '+escapeHTML(home.name) : 'TBD'} <span style="opacity:0.5;">vs</span> ${away ? away.flag+' '+escapeHTML(away.name) : 'TBD'} ${mark}</span>
            <input type="number" min="0" max="20" ${matchLocked ? 'disabled' : ''} value="${typeof sp.home === 'number' ? sp.home : ''}" oninput="WC.setScorePred('${member.id}','${m.id}','home',this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:6px;padding:4px;text-align:center;font-weight:700;" />
            <span style="text-align:center;opacity:0.6;">–</span>
            <input type="number" min="0" max="20" ${matchLocked ? 'disabled' : ''} value="${typeof sp.away === 'number' ? sp.away : ''}" oninput="WC.setScorePred('${member.id}','${m.id}','away',this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:6px;padding:4px;text-align:center;font-weight:700;" />
          </div>`;
        }
        inner += '</div>';
      }
      return `<details style="margin-top:14px;">
        <summary style="cursor:pointer;font-family:var(--font-display);font-weight:800;font-size:1rem;color:var(--wc-gold);padding:4px 0;">💯 Score predictions <span style="font-weight:600;font-size:0.75rem;color:var(--text-muted);">(group games — optional bonus pts)</span></summary>
        <div style="margin-top:6px;">${inner}</div>
      </details>`;
    }

    // Champion + Runner-up — narrow to teams that could reach the Final
    const finalMatch = state.matches.find(m => m.stage === 'Final');
    const finalistCodes = finalMatch ? candidatesForMatch(finalMatch) : allTeamCodes;

    const champMark = champRu.champion ? (picks.champion === champRu.champion ? `<span class="correct">✓ ${SCORING.champion}</span>` : '<span class="miss">✗</span>') : '';
    const ruMark    = champRu.runnerUp ? (picks.runnerUp === champRu.runnerUp ? `<span class="correct">✓ ${SCORING.runnerUp}</span>` : '<span class="miss">✗</span>') : '';

    // Outcome block differs by mode
    const goldenBootRow = `<div class="pick-row"><div class="lbl">Golden Boot</div><div>
          <input style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;"
                 placeholder="Player name" value="${escapeHTML(picks.goldenBoot || '')}"
                 ${outcomesLocked ? 'disabled' : ''}
                 onchange="WC.setOutcomePick('${member.id}','goldenBoot',this.value)" />
          <label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:0.78rem;color:var(--text-muted);">
            <input type="checkbox" ${picks.goldenBootCorrect ? 'checked' : ''}
                   onchange="WC.setOutcomePick('${member.id}','goldenBootCorrect',this.checked)" />
            Mark as correct (10 pts) — toggle on after the tournament ends
          </label>
        </div></div>`;

    let outcomeBlock;
    if (buildup) {
      // Champion / runner-up are derived from the Final pick (read-only)
      const champC = picks.champion ? countryByCode(picks.champion) : null;
      const ruC = picks.runnerUp ? countryByCode(picks.runnerUp) : null;
      outcomeBlock = `<h3>🏆 Tournament outcome <span class="muted" style="font-size:0.72rem;font-weight:600;">— set by your Final pick</span></h3>
        <div class="pick-row"><div class="lbl">Champion</div><div><b>${champC ? champC.flag+' '+escapeHTML(champC.name) : '<span class="muted">pick your Final winner below</span>'}</b> ${champMark}</div></div>
        <div class="pick-row"><div class="lbl">Runner-up</div><div>${ruC ? ruC.flag+' '+escapeHTML(ruC.name) : '<span class="muted">—</span>'} ${ruMark}</div></div>
        ${goldenBootRow}`;
    } else {
      outcomeBlock = `<h3>🏆 Tournament outcome</h3>
        <div class="pick-row"><div class="lbl">Champion</div><div>${teamSelect(picks.champion || '', finalistCodes, `WC.setOutcomePick('${member.id}','champion',this.value)`, outcomesLocked)}${champMark}</div></div>
        <div class="pick-row"><div class="lbl">Runner-up</div><div>${teamSelect(picks.runnerUp || '', finalistCodes, `WC.setOutcomePick('${member.id}','runnerUp',this.value)`, outcomesLocked)}${ruMark}</div></div>
        ${goldenBootRow}`;
    }

    const groupsBlock = `<h3>🎯 Group stage</h3>${buildup ? '<p class="muted" style="font-size:0.75rem;margin-bottom:6px;">Enter scorelines and tap “Standings from scores”, or just pick 1st/2nd/3rd directly. These feed your knockout bracket.</p>' : ''}${groupsHTML}`;
    const koBlock = `<h3>⚔️ Knockout bracket</h3>${koPicksFor('R32')}${koPicksFor('R16')}${koPicksFor('QF')}${koPicksFor('SF')}${koPicksFor('Final')}`;

    // Order: build-up flows groups → knockouts → outcome.
    // Top-down leads with the outcome, then groups, then knockouts.
    const body = buildup
      ? `${groupsBlock}${koBlock}${outcomeBlock}`
      : `${outcomeBlock}${groupsBlock}${scorePredictionsHTML()}${koBlock}`;

    const modeToggle = `
      <div style="display:flex;gap:6px;margin:10px 0;background:var(--wc-card);border:1px solid var(--wc-line);border-radius:99px;padding:4px;">
        <button class="btn ${buildup?'':'ghost'}" style="flex:1;font-size:0.78rem;padding:7px 8px;${buildup?'':'background:transparent;'}" onclick="WC.setBracketMode('${member.id}','buildup')">🔼 Build-up (groups → final)</button>
        <button class="btn ${buildup?'ghost':''}" style="flex:1;font-size:0.78rem;padding:7px 8px;${buildup?'background:transparent;':''}" onclick="WC.setBracketMode('${member.id}','topdown')">🔽 Top-down (champion first)</button>
      </div>`;

    const hasName = !!(member.name && member.name.trim());
    const activeUser = currentActiveUser();
    const isActiveUserEntry = !!(activeUser && hasName && member.name.toLowerCase() === activeUser.name.toLowerCase());
    return `
      <div class="card picks-section">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="margin:0;display:flex;align-items:center;gap:8px;">
            ${member.avatar ? `<span style="font-size:1.2em;">${escapeHTML(member.avatar)}</span>` : ''}
            ${hasName ? escapeHTML(member.name)+'\'s bracket' : 'Your bracket'}
          </h2>
          <button class="btn ghost" style="padding:6px 12px;font-size:0.85rem;" onclick="WC.doneEntry()">${hasName ? '✓ Done' : '× Cancel'}</button>
        </div>
        <p class="muted" style="font-size:0.85rem;margin-top:6px;">${hasName ? 'Changes save automatically as you make them.' : 'Enter your name to lock in your bracket. Picks save automatically.'}</p>

        ${isActiveUserEntry ? '' : `
        <div class="pick-row" style="border-bottom:1px solid var(--wc-line);padding-bottom:10px;margin-bottom:10px;">
          <div class="lbl">${activeUser ? 'Bracket for' : 'Your name'}</div>
          <div>
            <input id="entrant-name"
                   style="background:var(--wc-card-strong);border:1px solid ${hasName ? 'var(--wc-line)' : 'var(--wc-gold)'};color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.95rem;width:100%;font-weight:700;"
                   placeholder="Type your name to enter the pool"
                   value="${escapeHTML(member.name || '')}"
                   maxlength="24"
                   oninput="WC.setEntrantName('${member.id}', this.value)" />
          </div>
        </div>`}

        ${modeToggle}

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px;">
          <button class="btn ghost" style="padding:6px 10px;font-size:0.78rem;" onclick="WC.quickFill('${member.id}','favorites')">⭐ Pick all favorites</button>
          <button class="btn ghost" style="padding:6px 10px;font-size:0.78rem;" onclick="WC.quickFill('${member.id}','underdogs')">🌶 Pick all underdogs</button>
          <button class="btn ghost" style="padding:6px 10px;font-size:0.78rem;" onclick="WC.quickFill('${member.id}','random')">🎲 Random</button>
        </div>
        <p class="muted" style="font-size:0.72rem;margin-bottom:8px;">Quick-fill only overwrites unlocked picks.</p>

        ${body}

        <div style="text-align:center;margin-top:18px;">
          <button class="btn" onclick="WC.doneEntry()">${hasName ? '✓ Done' : 'Save & enter the pool'}</button>
        </div>
      </div>
    `;
  }

  /* ----------------------------------------------------------------
     QUIZ — 10-question multiple-choice rounds. Mixes question types.
     Best score per profile persisted.
     ---------------------------------------------------------------- */
  function _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function _pickN(arr, n) { return _shuffle(arr).slice(0, n); }

  /* ----------------------------------------------------------------
     Quiz generators. Each returns { q, options:[{label, correct}] }
     or null when the data doesn't support a good question. The
     dispatcher (startQuiz) shuffles the generator list and picks 10
     distinct types per round so every round feels different.
     ---------------------------------------------------------------- */

  // 1. Flag → Country: name the country whose flag is shown.
  function _qFlag() {
    const correct = _pickN(COUNTRIES, 1)[0];
    const distractors = _pickN(COUNTRIES.filter(c => c.code !== correct.code), 3);
    const opts = _shuffle([correct, ...distractors]);
    return {
      q: `Whose flag is this? <span style="font-size:3rem;display:block;margin-top:8px;">${correct.flag}</span>`,
      options: opts.map(o => ({ label: o.name, correct: o.code === correct.code })),
    };
  }
  // 2. Country → Capital
  function _qCapital() {
    const correct = _pickN(COUNTRIES, 1)[0];
    const distractors = _pickN(COUNTRIES.filter(c => c.code !== correct.code && c.capital !== correct.capital), 3);
    const opts = _shuffle([correct, ...distractors]);
    return {
      q: `What is the capital of <b>${escapeHTML(correct.name)}</b> ${correct.flag}?`,
      options: opts.map(o => ({ label: o.capital, correct: o.code === correct.code })),
    };
  }
  // 3. Capital → Country (reverse direction)
  function _qCapitalReverse() {
    const correct = _pickN(COUNTRIES, 1)[0];
    const distractors = _pickN(COUNTRIES.filter(c => c.code !== correct.code), 3);
    const opts = _shuffle([correct, ...distractors]);
    return {
      q: `Which country's capital is <b>${escapeHTML(correct.capital.split('/')[0].split('(')[0].trim())}</b>?`,
      options: opts.map(o => ({ label: o.flag + ' ' + o.name, correct: o.code === correct.code })),
    };
  }
  // 4. Star player → Country (which national team)
  function _qPlayer() {
    const pool = COUNTRIES.filter(c => c.stars && c.stars.length);
    if (pool.length < 4) return null;
    const country = _pickN(pool, 1)[0];
    const star = country.stars[Math.floor(Math.random() * country.stars.length)];
    const distractors = _pickN(COUNTRIES.filter(c => c.code !== country.code), 3);
    const opts = _shuffle([country, ...distractors]);
    return {
      q: `Which country does <b>${escapeHTML(star.name)}</b> play for?`,
      options: opts.map(o => ({ label: o.flag + ' ' + o.name, correct: o.code === country.code })),
    };
  }
  // 5. Country → Star player (who plays for X — pick the right player among 4 names)
  function _qPlayerFor() {
    const pool = COUNTRIES.filter(c => c.stars && c.stars.length);
    if (pool.length < 4) return null;
    const country = _pickN(pool, 1)[0];
    const star = country.stars[Math.floor(Math.random() * country.stars.length)];
    // Distractor stars from OTHER countries
    const others = _shuffle(pool.filter(c => c.code !== country.code))
      .map(c => c.stars[Math.floor(Math.random() * c.stars.length)])
      .filter(s => s.name !== star.name)
      .slice(0, 3);
    if (others.length < 3) return null;
    const all = _shuffle([star, ...others]);
    return {
      q: `Which of these players plays for <b>${country.flag} ${escapeHTML(country.name)}</b>?`,
      options: all.map(s => ({ label: s.name, correct: s.name === star.name })),
    };
  }
  // 6. Star player → Position
  function _qPosition() {
    const pool = COUNTRIES.filter(c => c.stars && c.stars.length);
    if (pool.length === 0) return null;
    const country = _pickN(pool, 1)[0];
    const star = country.stars[Math.floor(Math.random() * country.stars.length)];
    const positionMap = {
      'GK':'Goalkeeper','CB':'Centre-back','LB':'Left-back','RB':'Right-back',
      'CDM':'Defensive midfielder','CM':'Midfielder','AM':'Attacking midfielder',
      'LW':'Left winger','RW':'Right winger','ST':'Striker',
    };
    // Find canonical position
    const posKey = (star.pos || '').split('/')[0].trim();
    const correctLabel = positionMap[posKey] || star.pos;
    const allLabels = Object.values(positionMap);
    const distractors = _shuffle(allLabels.filter(l => l !== correctLabel)).slice(0, 3);
    const opts = _shuffle([correctLabel, ...distractors]);
    return {
      q: `What position does <b>${escapeHTML(star.name)}</b> (${country.flag} ${escapeHTML(country.name)}) play?`,
      options: opts.map(l => ({ label: l, correct: l === correctLabel })),
    };
  }
  // 7. Star player → Club (which club does this player play for professionally?)
  function _qClub() {
    const pool = COUNTRIES.filter(c => c.stars && c.stars.length);
    if (pool.length === 0) return null;
    const country = _pickN(pool, 1)[0];
    const star = country.stars[Math.floor(Math.random() * country.stars.length)];
    // Collect distinct clubs across all stars
    const allClubs = [];
    for (const c of COUNTRIES) for (const s of (c.stars || [])) {
      const club = (s.club || '').split('(')[0].trim();
      if (club && !allClubs.includes(club)) allClubs.push(club);
    }
    const correctClub = (star.club || '').split('(')[0].trim();
    if (!correctClub) return null;
    const distractors = _shuffle(allClubs.filter(c => c !== correctClub)).slice(0, 3);
    if (distractors.length < 3) return null;
    const opts = _shuffle([correctClub, ...distractors]);
    return {
      q: `Which club does <b>${escapeHTML(star.name)}</b> (${country.flag} ${escapeHTML(country.name)}) play for?`,
      options: opts.map(c => ({ label: c, correct: c === correctClub })),
    };
  }
  // 8. Country → Group
  function _qGroup() {
    const country = _pickN(COUNTRIES, 1)[0];
    const groups = _shuffle(GROUP_LETTERS).slice(0, 4);
    if (!groups.includes(country.group)) groups[0] = country.group;
    const opts = _shuffle(groups.map(g => ({ label: 'Group ' + g, correct: g === country.group })));
    return {
      q: `Which group is <b>${country.flag} ${escapeHTML(country.name)}</b> in?`,
      options: opts,
    };
  }
  // 9. Group → which team is NOT in this group (odd one out)
  function _qNotInGroup() {
    const letter = GROUP_LETTERS[Math.floor(Math.random() * GROUP_LETTERS.length)];
    const inGroup = (state.groups[letter] || []).map(code => countryByCode(code)).filter(Boolean);
    if (inGroup.length < 3) return null;
    const three = _shuffle(inGroup).slice(0, 3);
    const outsider = _pickN(COUNTRIES.filter(c => c.group !== letter), 1)[0];
    const opts = _shuffle([...three, outsider]);
    return {
      q: `Which of these teams is <b>NOT</b> in Group ${letter}?`,
      options: opts.map(o => ({ label: o.flag + ' ' + o.name, correct: o.code === outsider.code })),
    };
  }
  // 10. Country → World Cup titles count
  function _qTitles() {
    const pool = COUNTRIES.filter(c => c.wc);
    if (pool.length === 0) return null;
    const country = _pickN(pool, 1)[0];
    const correct = country.wc.titles | 0;
    const candidates = [0, 1, 2, 3, 4, 5].filter(n => n !== correct);
    const distractors = _shuffle(candidates).slice(0, 3);
    const opts = _shuffle([correct, ...distractors]);
    return {
      q: `How many World Cup titles has <b>${country.flag} ${escapeHTML(country.name)}</b> won?`,
      options: opts.map(n => ({ label: n === 0 ? 'Zero' : String(n), correct: n === correct })),
    };
  }
  // 11. Venue → City (which city hosts this stadium?)
  function _qVenue() {
    if (!VENUES || VENUES.length < 4) return null;
    const venue = VENUES[Math.floor(Math.random() * VENUES.length)];
    const distractors = _shuffle(VENUES.filter(v => v.city !== venue.city)).slice(0, 3);
    const opts = _shuffle([venue, ...distractors]);
    return {
      q: `Which city hosts <b>${escapeHTML(venue.name)}</b>?`,
      options: opts.map(v => ({ label: v.city, correct: v.city === venue.city })),
    };
  }
  // 12. Country → Currency
  function _qCurrency() {
    const country = _pickN(COUNTRIES.filter(c => c.currency), 1)[0];
    if (!country) return null;
    // Collect distinct currencies
    const allCurrencies = [];
    for (const c of COUNTRIES) {
      const cur = c.currency || '';
      if (cur && !allCurrencies.includes(cur)) allCurrencies.push(cur);
    }
    const distractors = _shuffle(allCurrencies.filter(c => c !== country.currency)).slice(0, 3);
    if (distractors.length < 3) return null;
    const opts = _shuffle([country.currency, ...distractors]);
    return {
      q: `Which currency does <b>${country.flag} ${escapeHTML(country.name)}</b> use?`,
      options: opts.map(c => ({ label: c, correct: c === country.currency })),
    };
  }
  // 13. Pot — given a country, which pot was it seeded in?
  function _qPot() {
    const pool = COUNTRIES.filter(c => typeof c.pot === 'number');
    if (pool.length === 0) return null;
    const country = _pickN(pool, 1)[0];
    const correct = country.pot;
    const distractors = [1, 2, 3, 4].filter(n => n !== correct);
    const opts = _shuffle([correct, ...distractors]);
    return {
      q: `Which seeding <b>pot</b> was ${country.flag} ${escapeHTML(country.name)} in for the 2026 draw? <span class="muted" style="font-size:0.78rem;display:block;margin-top:4px;">(Pot 1 = top seeds, Pot 4 = lowest.)</span>`,
      options: opts.map(n => ({ label: 'Pot ' + n, correct: n === correct })),
    };
  }
  // 14. Player age — among 4 listed players, which is the oldest?
  function _qOldest() {
    const allStars = [];
    for (const c of COUNTRIES) for (const s of (c.stars || [])) {
      if (typeof s.age === 'number') allStars.push({ ...s, country: c });
    }
    if (allStars.length < 4) return null;
    const picks = _shuffle(allStars).slice(0, 4);
    const oldest = picks.slice().sort((a,b) => b.age - a.age)[0];
    return {
      q: `Which of these players is the <b>oldest</b>?`,
      options: picks.map(p => ({ label: p.country.flag + ' ' + p.name, correct: p === oldest })),
    };
  }

  const QUIZ_GENERATORS = [
    _qFlag, _qCapital, _qCapitalReverse, _qPlayer, _qPlayerFor,
    _qPosition, _qClub, _qGroup, _qNotInGroup, _qTitles,
    _qVenue, _qCurrency, _qPot, _qOldest,
  ];

  function generateQuestion() {
    // Try generators in random order; return the first that succeeds.
    for (const g of _shuffle(QUIZ_GENERATORS)) {
      const q = g();
      if (q) return q;
    }
    return null;
  }

  const quizState = { questions: [], current: 0, score: 0, answered: false };

  function startQuiz() {
    // Pick 10 DIFFERENT question types per round so two rounds rarely look
    // the same. We shuffle the generator list, take the first 10, and run
    // each one; if any fail (data not suitable) we substitute another type.
    const order = _shuffle(QUIZ_GENERATORS).slice(0, 10);
    const questions = [];
    for (const gen of order) {
      const q = gen();
      if (q) questions.push(q);
    }
    // Top up if any generators returned null
    while (questions.length < 10) {
      const q = generateQuestion();
      if (q) questions.push(q); else break;
    }
    quizState.questions = questions;
    quizState.current = 0;
    quizState.score = 0;
    quizState.answered = false;
    renderQuiz();
  }
  function answerQuiz(idx) {
    if (quizState.answered) return;
    quizState.answered = true;
    const q = quizState.questions[quizState.current];
    const opt = q.options[idx];
    if (opt && opt.correct) {
      quizState.score++;
      const user = currentActiveUser();
      if (user) awardStars(user.name, 1, 'quiz_correct');
      // Earn a sticker for any country referenced in the question
      const countryMention = (q.q + ' ' + (q.options || []).map(o => o.label).join(' '))
        .toUpperCase();
      for (const c of COUNTRIES) {
        if (countryMention.indexOf(c.flag) !== -1) {
          earnSticker(c.code, 'quiz', false);
          break; // one per question
        }
      }
    }
    renderQuiz();
  }
  function nextQuestion() {
    if (quizState.current < quizState.questions.length - 1) {
      quizState.current++;
      quizState.answered = false;
      renderQuiz();
    } else {
      // Quiz finished — persist best score per profile (name keyed)
      const user = currentActiveUser();
      const key = user && user.name ? 'wc_quiz_best_' + user.name.toLowerCase().replace(/\s+/g,'_') : 'wc_quiz_best_guest';
      let best = 0;
      try { best = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) {}
      if (quizState.score > best) {
        try { localStorage.setItem(key, String(quizState.score)); } catch (e) {}
      }
      quizState.current = -1; // signals "results"
      renderQuiz();
    }
  }

  function renderQuiz() {
    const root = document.getElementById('screen-quiz');
    const user = currentActiveUser();
    const key = user && user.name ? 'wc_quiz_best_' + user.name.toLowerCase().replace(/\s+/g,'_') : 'wc_quiz_best_guest';
    let best = 0;
    try { best = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) {}

    // No quiz in progress
    if (quizState.questions.length === 0) {
      root.innerHTML = `
        <div class="card" style="text-align:center;">
          <h2>🧠 World Cup Quiz</h2>
          <p class="muted" style="font-size:0.9rem;">10 questions on flags, capitals, star players and groups.</p>
          ${best > 0 ? `<p style="margin-top:10px;">Your best score: <b style="color:var(--wc-gold);">${best} / 10</b></p>` : ''}
          <button class="btn gold" style="margin-top:14px;font-size:1rem;padding:12px 24px;" onclick="WC.startQuiz()">▶ Start a quiz</button>
        </div>
        <div class="card">
          <h3 style="color:var(--wc-gold);">Question types — 14 in total</h3>
          <p class="muted" style="font-size:0.82rem;">Each round picks 10 different categories, so two rounds rarely look the same.</p>
          <ul style="padding-left:18px;line-height:1.6;font-size:0.88rem;margin-top:6px;">
            <li>🏳 <b>Flag → Country</b> &nbsp;|&nbsp; 🏛 <b>Country → Capital</b> &nbsp;|&nbsp; ↩ <b>Capital → Country</b></li>
            <li>⭐ <b>Star player → Country</b> &nbsp;|&nbsp; 🎯 <b>Country → Star player</b></li>
            <li>📐 <b>Player → Position</b> &nbsp;|&nbsp; 🏟 <b>Player → Club</b></li>
            <li>📋 <b>Country → Group</b> &nbsp;|&nbsp; ❌ <b>Odd one out</b> (which team is NOT in this group)</li>
            <li>🏆 <b>World Cup titles count</b> &nbsp;|&nbsp; 🌱 <b>Pot seeding</b> (1–4)</li>
            <li>🏟 <b>Venue → City</b> &nbsp;|&nbsp; 💱 <b>Country → Currency</b></li>
            <li>👴 <b>Player age</b> — who's the oldest of these four?</li>
          </ul>
        </div>
      `;
      return;
    }
    // Results screen
    if (quizState.current === -1) {
      const pct = Math.round((quizState.score / quizState.questions.length) * 100);
      let emoji = '🥉';
      if (pct >= 90) emoji = '🏆';
      else if (pct >= 70) emoji = '🥇';
      else if (pct >= 50) emoji = '🥈';
      root.innerHTML = `
        <div class="card" style="text-align:center;">
          <h2>${emoji} Quiz complete!</h2>
          <p style="font-size:1.4rem;font-family:var(--font-display);font-weight:800;color:var(--wc-gold);margin:10px 0;">${quizState.score} / ${quizState.questions.length}</p>
          <p class="muted">${pct >= 90 ? 'World Cup expert!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Not bad — try again to improve.' : 'Keep practicing!'}</p>
          ${quizState.score > best || (quizState.score === best && best > 0) ? '<p style="color:var(--wc-green);font-weight:800;margin-top:8px;">⭐ New best score!</p>' : best > 0 ? `<p class="muted" style="margin-top:8px;">Best: ${best} / 10</p>` : ''}
          <button class="btn gold" style="margin-top:14px;" onclick="WC.startQuiz()">▶ Play again</button>
          <button class="btn ghost" style="margin-top:14px;margin-left:8px;" onclick="WC.resetQuiz()">Done</button>
        </div>
      `;
      return;
    }
    // Active question
    const q = quizState.questions[quizState.current];
    root.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="muted" style="font-size:0.85rem;">Question ${quizState.current+1} of ${quizState.questions.length}</span>
          <span style="font-weight:800;color:var(--wc-gold);">Score: ${quizState.score}</span>
        </div>
        <h2 style="margin-bottom:14px;">${q.q}</h2>
        <div style="display:grid;gap:8px;">
          ${q.options.map((o, i) => {
            let cls = 'btn ghost';
            let extra = '';
            if (quizState.answered) {
              if (o.correct) { cls = 'btn'; extra = 'background:var(--wc-green);'; }
              else cls = 'btn ghost';
            }
            return `<button class="${cls}" style="text-align:left;padding:12px 14px;font-size:0.95rem;${extra}" onclick="WC.answerQuiz(${i})">${o.label} ${quizState.answered && o.correct ? '✓' : ''}</button>`;
          }).join('')}
        </div>
        ${quizState.answered ? `<div style="text-align:right;margin-top:14px;"><button class="btn gold" onclick="WC.nextQuestion()">${quizState.current < quizState.questions.length-1 ? 'Next →' : 'See results →'}</button></div>` : ''}
      </div>
    `;
  }
  function resetQuiz() {
    quizState.questions = [];
    quizState.current = 0;
    quizState.score = 0;
    quizState.answered = false;
    renderQuiz();
  }

  /* ---- STICKERS — Panini-style 48-country album ---- */
  function renderStickers() {
    const root = document.getElementById('screen-stickers');
    state.stickers = state.stickers || {};
    const total = COUNTRIES.length;
    const earned = COUNTRIES.filter(c => _stickerStatus(c.code) !== 'locked').length;
    const starred = COUNTRIES.filter(c => _stickerStatus(c.code) === 'starred').length;
    const pct = Math.round((earned / total) * 100);

    let html = `
      <div class="card sc-hero">
        <div class="city">Panini-style album</div>
        <h2 style="margin:4px 0;">📒 Sticker Collection</h2>
        <div style="display:flex;gap:8px;align-items:center;margin:8px 0;">
          <div style="flex:1;height:10px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--wc-green),var(--wc-gold));"></div>
          </div>
          <b style="color:var(--wc-gold);">${earned} / ${total}</b>
        </div>
        <p class="muted" style="font-size:0.85rem;">⭐ ${starred} winner stickers · 🏷 ${earned - starred} earned · 🔒 ${total - earned} locked</p>
        <p class="muted" style="font-size:0.78rem;margin-top:8px;">Earn stickers by visiting country pages, answering quiz questions about them, or entering their match results. A team's <b>⭐ winner sticker</b> unlocks when you record a match they win.</p>
      </div>
    `;

    // Render by group
    for (const g of GROUP_LETTERS) {
      const codes = state.groups[g] || [];
      html += `<div class="card" style="padding:14px;">
        <h3 style="margin-bottom:8px;color:var(--wc-gold);">Group ${g}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
          ${codes.map(code => {
            const c = countryByCode(code);
            if (!c) return '';
            const status = _stickerStatus(code);
            const isLocked = status === 'locked';
            const isStarred = status === 'starred';
            return `
              <div onclick="WC.openCountry('${code}')" style="cursor:pointer;background:${isLocked?'rgba(255,255,255,0.03)':'var(--wc-card-strong)'};border:2px solid ${isStarred?'var(--wc-gold)':(isLocked?'var(--wc-line)':'rgba(22,163,74,0.35)')};border-radius:12px;padding:10px 8px;text-align:center;position:relative;${isLocked?'opacity:0.4;':''}">
                <div style="font-size:2rem;line-height:1;filter:${isLocked?'grayscale(1)':'none'};">${c.flag}</div>
                <div style="font-size:0.7rem;font-weight:800;margin-top:4px;line-height:1.15;">${escapeHTML(c.name)}</div>
                ${isStarred ? '<div style="position:absolute;top:-6px;right:-6px;background:var(--wc-gold);color:#1a1a1a;border-radius:99px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">⭐</div>' : ''}
                ${isLocked ? '<div style="position:absolute;top:6px;right:6px;font-size:0.8rem;opacity:0.7;">🔒</div>' : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    root.innerHTML = html;
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
          <li><b>Santa Clara</b> — our home venue (Levi's Stadium): every match here with previews, key players, and a family travel guide</li>
          <li><b>Teams</b> — all 48 nations with capital, geography, history, fun facts, and star players</li>
          <li><b>Matches</b> — 104 fixtures with venue, date, and stage. Tap one to enter the score.</li>
          <li><b>Venues</b> — all 16 host stadiums across the three countries</li>
          <li><b>Standings</b> — auto-computed group tables + knockout bracket</li>
          <li><b>Bracket Pool</b> — add each family member, lock in picks, watch the leaderboard</li>
        </ul>
        <h3>How the picks work</h3>
        <p>Each family member predicts group winners + runners-up, knockout-round winners, plus the eventual champion, runner-up, and Golden Boot. Points are awarded automatically as you enter real match results.</p>
        <h3>Where the data comes from</h3>
        <ul style="padding-left:18px;line-height:1.6;font-size:0.9rem;">
          <li><b>Schedule</b> — all 104 official matches (teams, dates, times, venues) sourced from the public-domain <a href="https://github.com/openfootball/worldcup.json" target="_blank" rel="noopener" style="color:var(--wc-gold);">OpenFootball</a> dataset. Group stage matchups, knockout-round placeholders ("1A", "W73", "3B/E/F/I/J"), and venues all match the official FIFA draw.</li>
          <li><b>Groups</b> — the 12 groups (A–L) reflect the December 5, 2025 final draw.</li>
          <li><b>Teams</b> — all 48 qualified nations.</li>
          <li><b>Venues</b> — all 16 host stadiums, confirmed.</li>
          <li><b>Live scores</b> — tap <b>⟳ Sync scores</b> on the Matches or Santa Clara tab to pull the latest results from OpenFootball (a community-maintained feed, refreshed during matches).</li>
          <li><b>Player rosters</b> — a mid-2025 snapshot. Clubs, ages, and final squad selections may have changed since.</li>
        </ul>
        <h3>Reset</h3>
        <p>Want to start fresh? <button class="btn danger" onclick="WC.resetAll()">Clear all data</button></p>
      </div>
    `;
  }

  /* ----------------------------------------------------------------
     Match result editor (modal)
     ---------------------------------------------------------------- */
  /* ----------------------------------------------------------------
     Match result editor (modal) — also surfaces every family pool
     participant's prediction for the match, with point-earned badges
     once a real result is in, plus prev/next arrows to swipe through
     the day's slate without closing the modal.
     ---------------------------------------------------------------- */

  // Compare picks for a played group match against the recorded result
  // and return the points awarded (5 exact / 3 GD / 1 result / 0 miss),
  // matching the live scoring rules in scoreMember.
  function _groupPickBadge(sp, result) {
    if (!result || !sp || typeof sp.home !== 'number' || typeof sp.away !== 'number') return '';
    if (sp.home === result.home && sp.away === result.away) {
      return `<span class="correct">✓ ${SCORING.scoreExact}</span>`;
    }
    const predSign = Math.sign(sp.home - sp.away);
    const realSign = Math.sign(result.home - result.away);
    if (predSign !== realSign) return '<span class="miss">✗</span>';
    if ((sp.home - sp.away) === (result.home - result.away)) {
      return `<span class="correct">✓ ${SCORING.scoreGD}</span>`;
    }
    return `<span class="correct">✓ ${SCORING.scoreResult}</span>`;
  }

  // Render a "Family picks" section listing each participant's
  // prediction for this match. Group games show predicted scorelines;
  // knockout games show predicted advancing team. Empty pool → no-op
  // (returns '') so guests with nobody in the pool don't see clutter.
  function _renderMatchPoolPicks(m) {
    const named = state.members.filter(x => x.name && x.name.trim());
    if (named.length === 0) return '';

    const isGroup = m.stage === 'group';
    const koActual = isGroup ? null : getKnockoutWinners();
    const actualWinner = !isGroup && koActual && koActual[m.stage] ? koActual[m.stage][m.id] : null;

    // Sort participants alphabetically — predictable, no ranking noise.
    const rows = named
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(member => {
        const picks = state.picks[member.id] || {};
        const avatar = member.avatar ? `<span style="margin-right:6px;">${escapeHTML(member.avatar)}</span>` : '';
        const who = `${avatar}<b>${escapeHTML(member.name)}</b>`;

        if (isGroup) {
          const sp = (picks.scores || {})[m.id];
          if (!sp || typeof sp.home !== 'number' || typeof sp.away !== 'number') {
            return `<div class="pool-pick"><div>${who}</div><div class="muted" style="font-size:0.8rem;">— no pick —</div><div></div></div>`;
          }
          const badge = _groupPickBadge(sp, m.result);
          return `<div class="pool-pick">
            <div>${who}</div>
            <div class="pool-pick-val">${sp.home}<span class="muted">–</span>${sp.away}</div>
            <div class="pool-pick-badge">${badge}</div>
          </div>`;
        }

        // Knockout match: show who they think advances.
        const stagePicks = (picks.ko || {})[m.stage] || {};
        const pickedCode = stagePicks[m.id];
        if (!pickedCode) {
          return `<div class="pool-pick"><div>${who}</div><div class="muted" style="font-size:0.8rem;">— no pick —</div><div></div></div>`;
        }
        const c = countryByCode(pickedCode);
        const label = c ? `${c.flag} ${escapeHTML(c.name)}` : escapeHTML(pickedCode);
        let badge = '';
        if (actualWinner) {
          badge = pickedCode === actualWinner
            ? `<span class="correct">✓ ${SCORING[m.stage] || ''}</span>`
            : '<span class="miss">✗</span>';
        }
        return `<div class="pool-pick">
          <div>${who}</div>
          <div class="pool-pick-val" style="font-size:0.85rem;">${label}</div>
          <div class="pool-pick-badge">${badge}</div>
        </div>`;
      })
      .join('');

    const hint = m.result || actualWinner
      ? 'Points awarded as soon as the result lands.'
      : (isGroup
          ? 'Predictions lock when this match kicks off. Badges appear after the result is entered.'
          : 'Showing each picker\'s advancing team. Locks at kickoff of this round.');

    return `
      <div class="pool-picks-section">
        <h4 style="margin:14px 0 4px;font-size:0.95rem;">👨‍👩‍👧 Family picks <span class="muted" style="font-size:0.8rem;font-weight:400;">(${named.length})</span></h4>
        <p class="muted" style="font-size:0.74rem;margin-bottom:8px;">${hint}</p>
        <div>${rows}</div>
      </div>`;
  }

  /* ----------------------------------------------------------------
     Lazy match-detail fetch (ESPN summary endpoint via VPS proxy)
     Scoreboard JSON loses play-by-play after ~2 days, so on modal
     open we fetch the summary endpoint for the match's eventId and
     overlay scorers + cards on top of anything we already had. Cache
     keyed by event id, 5 min TTL, in-memory only (small, ephemeral).
     ---------------------------------------------------------------- */
  const _matchDetailCache = new Map(); // eventId -> { fetchedAt, payload }
  const MATCH_DETAIL_TTL_MS = 5 * 60 * 1000;
  const VPS_WC_MATCH_URL = (window.CloudSync && CloudSync.isConfigured && CloudSync.isConfigured())
    ? 'https://all-options-dev.tail57521e.ts.net/api/wc-match'
    : null;

  async function _fetchMatchDetail(eventId) {
    if (!eventId || !VPS_WC_MATCH_URL) return null;
    const cached = _matchDetailCache.get(eventId);
    if (cached && Date.now() - cached.fetchedAt < MATCH_DETAIL_TTL_MS) return cached.payload;
    try {
      const res = await fetch(VPS_WC_MATCH_URL + '?eventId=' + encodeURIComponent(eventId), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const payload = await res.json();
      _matchDetailCache.set(eventId, { fetchedAt: Date.now(), payload });
      return payload;
    } catch (e) {
      console.warn('match detail fetch failed for', eventId, e.message);
      return null;
    }
  }

  // Kick a lazy fetch and re-render the modal in place when it lands.
  // Modal might have been closed or stepped to a different match in
  // the meantime — guard by checking the rendered match id.
  function _hydrateMatchDetail(m) {
    const eventId = m && m.result && m.result.eventId;
    if (!eventId) return;
    // Bail if cache is fresh — m.result already holds the latest
    // scorers/cards from the previous fetch. Without this gate, the
    // post-fetch re-render below calls editResult, which calls us
    // again, which sees the cache as still empty... freeze.
    const cached = _matchDetailCache.get(eventId);
    if (cached && Date.now() - cached.fetchedAt < MATCH_DETAIL_TTL_MS) return;
    _fetchMatchDetail(eventId).then(detail => {
      if (!detail) return;
      // Overlay onto local result so the static scorer renderer picks
      // it up — and so it sticks through subsequent navigations.
      if (detail.scorers) {
        // Only overlay scorer lists when the summary actually has them.
        // Empty arrays from ESPN (older match with no detail published)
        // would otherwise wipe goals attached by the scoreboard sync.
        if (Array.isArray(detail.scorers.home) && detail.scorers.home.length) {
          m.result.goals1 = detail.scorers.home;
        }
        if (Array.isArray(detail.scorers.away) && detail.scorers.away.length) {
          m.result.goals2 = detail.scorers.away;
        }
      }
      if (detail.cards) {
        // Cards only ever come from the summary endpoint, so an empty
        // array is the authoritative "no cards" — safe to write.
        if (Array.isArray(detail.cards.home)) m.result.cards1 = detail.cards.home;
        if (Array.isArray(detail.cards.away)) m.result.cards2 = detail.cards.away;
      }
      save();
      const inner = document.querySelector('#match-modal.open .modal-inner');
      if (!inner) return;
      const openId = inner.getAttribute('data-match-id');
      if (openId !== m.id) return;
      // In-place re-render without re-opening the modal so the user's
      // scroll position is preserved as much as possible.
      editResult(m.id);
    });
  }

  // Render yellow/red cards under the scorers, same two-column shape.
  function _renderMatchCards(m) {
    const c1 = (m && m.result && Array.isArray(m.result.cards1)) ? m.result.cards1.slice() : [];
    const c2 = (m && m.result && Array.isArray(m.result.cards2)) ? m.result.cards2.slice() : [];
    if (c1.length === 0 && c2.length === 0) return '';
    const sortByMin = (a, b) => (a.minute || 999) - (b.minute || 999);
    c1.sort(sortByMin); c2.sort(sortByMin);
    function cardIcon(color) {
      if (color === 'red') return '<span class="card-icon red" title="Red card"></span>';
      if (color === 'second-yellow') return '<span class="card-icon yellow"></span><span class="card-icon red" style="margin-left:-3px;"></span>';
      return '<span class="card-icon yellow" title="Yellow card"></span>';
    }
    function renderList(cards) {
      if (cards.length === 0) return '<span class="muted" style="font-size:0.78rem;">—</span>';
      return cards.map(c => {
        const min = typeof c.minute === 'number' ? `<span class="muted">${c.minute}'</span>` : '';
        return `<div class="scorer">${cardIcon(c.color)} ${escapeHTML(c.name)} ${min}</div>`;
      }).join('');
    }
    return `
      <div class="scorers-grid" style="margin-top:0;">
        <div class="scorers-col home">${renderList(c1)}</div>
        <div class="scorers-icon" style="font-size:0.85rem;">🟨🟥</div>
        <div class="scorers-col away">${renderList(c2)}</div>
      </div>`;
  }

  // Render the goal scorers attached to a match's result. Two columns:
  // home on the left, away on the right. Returns '' when neither side
  // has scorer data (manual entry, or remote feed didn't include it),
  // so the modal stays clean.
  function _renderMatchScorers(m) {
    const r = m && m.result;
    const g1 = (r && Array.isArray(r.goals1)) ? r.goals1.slice() : [];
    const g2 = (r && Array.isArray(r.goals2)) ? r.goals2.slice() : [];
    if (g1.length === 0 && g2.length === 0) return '';
    const sortByMin = (a, b) => (a.minute || 999) - (b.minute || 999);
    g1.sort(sortByMin);
    g2.sort(sortByMin);
    function renderList(goals) {
      if (goals.length === 0) return '<span class="muted" style="font-size:0.78rem;">—</span>';
      return goals.map(g => {
        const min = typeof g.minute === 'number' ? `<span class="muted">${g.minute}'</span>` : '';
        const og  = g.owngoal ? ' <span class="og">(OG)</span>' : '';
        return `<div class="scorer">${escapeHTML(g.name)}${og} ${min}</div>`;
      }).join('');
    }
    return `
      <div class="scorers-grid">
        <div class="scorers-col home">${renderList(g1)}</div>
        <div class="scorers-icon">⚽</div>
        <div class="scorers-col away">${renderList(g2)}</div>
      </div>`;
  }

  // Chronologically sorted match list used by the prev/next nav. Cached
  // per-render is overkill — there are only ~104 matches.
  function _sortedMatchIds() {
    return state.matches
      .slice()
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map(x => x.id);
  }
  function editResultNeighbor(currentId, dir) {
    const ids = _sortedMatchIds();
    const idx = ids.indexOf(currentId);
    if (idx < 0) return;
    const next = ids[(idx + dir + ids.length) % ids.length];
    editResult(next);
  }

  function editResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;

    const modal = document.getElementById('match-modal');
    const home = m.home ? countryByCode(m.home) : null;
    const away = m.away ? countryByCode(m.away) : null;
    const stage = m.stage === 'group' ? `Group ${m.group} · ${m.round}` : m.round;

    const teamOptions = ['<option value="">— TBD —</option>'].concat(
      COUNTRIES.map(c => `<option value="${c.code}">${c.flag} ${escapeHTML(c.name)}</option>`)
    ).join('');
    const venueOptions = VENUES.map(v =>
      `<option value="${v.id}" ${m.venue===v.id?'selected':''}>${escapeHTML(v.name)} — ${escapeHTML(v.city)}</option>`
    ).join('');

    const inputStyle = 'background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.85rem;width:100%;';

    const navHeader = `
      <div class="match-modal-nav">
        <button class="nav-arrow" onclick="WC.editResultNeighbor('${m.id}', -1)" aria-label="Previous match">‹</button>
        <div class="nav-title">
          <h3 style="margin:0;">${stage}</h3>
          <div class="muted" style="font-size:0.72rem;">${fmtDate(m.date)} · ${m.time}</div>
        </div>
        <button class="nav-arrow" onclick="WC.editResultNeighbor('${m.id}', 1)" aria-label="Next match">›</button>
      </div>`;

    modal.querySelector('.modal-inner').innerHTML = `
      ${navHeader}
      <div class="sub">Edit any field below — match, score, or schedule.</div>

      <div class="pick-row"><div class="lbl">Home</div><div>
        <select id="ed-home" style="${inputStyle}">${teamOptions.replace(`value="${m.home||''}"`, `value="${m.home||''}" selected`)}</select>
      </div></div>
      <div class="pick-row"><div class="lbl">Away</div><div>
        <select id="ed-away" style="${inputStyle}">${teamOptions.replace(`value="${m.away||''}"`, `value="${m.away||''}" selected`)}</select>
      </div></div>

      <div class="pick-row"><div class="lbl">Date</div><div>
        <input type="date" id="ed-date" value="${m.date}" style="${inputStyle}" />
      </div></div>
      <div class="pick-row"><div class="lbl">Time</div><div>
        <input type="time" id="ed-time" value="${m.time}" style="${inputStyle}" />
      </div></div>
      <div class="pick-row"><div class="lbl">Venue</div><div>
        <select id="ed-venue" style="${inputStyle}">${venueOptions}</select>
      </div></div>

      <div class="score-input">
        <div class="side left">${home ? home.flag+' '+escapeHTML(home.name) : '<span class="muted">TBD</span>'}</div>
        <input type="number" min="0" max="20" id="sc-home" value="${m.result?m.result.home:''}" />
        <div class="muted" style="text-align:center;">–</div>
        <input type="number" min="0" max="20" id="sc-away" value="${m.result?m.result.away:''}" />
        <div class="side">${away ? away.flag+' '+escapeHTML(away.name) : '<span class="muted">TBD</span>'}</div>
      </div>

      ${_renderMatchScorers(m)}
      ${_renderMatchCards(m)}

      ${m.stage !== 'group' ? `
        <div class="pick-row"><div class="lbl">PK winner<br><span style="font-size:0.7rem;">(only if draw)</span></div><div>
          <select id="pk-winner" style="${inputStyle}">
            <option value="">— none —</option>
            ${home ? `<option value="${home.code}" ${m.result&&m.result.pkWinner===home.code?'selected':''}>${home.flag} ${escapeHTML(home.name)}</option>`:''}
            ${away ? `<option value="${away.code}" ${m.result&&m.result.pkWinner===away.code?'selected':''}>${away.flag} ${escapeHTML(away.name)}</option>`:''}
          </select>
        </div></div>` : ''}

      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.clearResult('${m.id}')">Clear score</button>
        <button class="btn ghost" onclick="WC.closeModal()">Cancel</button>
        <button class="btn" onclick="WC.saveResult('${m.id}')">Save</button>
      </div>

      ${_renderMatchPoolPicks(m)}
    `;
    modal.querySelector('.modal-inner').setAttribute('data-match-id', m.id);
    modal.classList.add('open');
    // Fire-and-forget summary fetch — if the cached scoreboard entry
    // already had goals1/goals2 from a recent sync we still upgrade
    // to the richer summary view (cards become available).
    _hydrateMatchDetail(m);
  }

  // Clear every manually-set knockout team and re-derive the whole
  // bracket from results + the official feed. Match scores and bracket
  // pool picks are untouched — only the KO fixtures' home/away teams
  // revert to placeholders and then refill automatically. Use this to
  // wipe edits made before auto-resolution existed.
  function resetBracket() {
    if (!confirm('Reset the knockout bracket?\n\nThis clears any manually-set teams in the Round of 32 onward and re-derives them from results and the official feed. Match scores and your bracket picks are NOT affected.')) return;
    state.koAuto = state.koAuto || {};
    state.koFeed = state.koFeed || {};
    state.koTeams = state.koTeams || {};
    for (const m of state.matches) {
      if (m.stage === 'group') continue;
      m.home = null;
      m.away = null;
      delete state.koAuto[m.id + '.home']; delete state.koAuto[m.id + '.away'];
      delete state.koFeed[m.id + '.home']; delete state.koFeed[m.id + '.away'];
      delete state.koTeams[m.id + '.home']; delete state.koTeams[m.id + '.away'];
    }
    resolveBracketFromResults();
    save();
    toast('Bracket reset — tap ⟳ Sync scores to pull official teams');
    const cur = document.querySelector('.tab.active')?.dataset.tab;
    if (cur) activateTab(cur);
  }

  function saveResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;
    const homeEl  = document.getElementById('ed-home');
    const awayEl  = document.getElementById('ed-away');
    const dateEl  = document.getElementById('ed-date');
    const timeEl  = document.getElementById('ed-time');
    const venueEl = document.getElementById('ed-venue');
    // A manual team edit on a KO match is a confirmed assignment: record
    // it in koTeams so it persists + syncs (and mark koFeed so the
    // provisional resolver won't overwrite it). Blanking a side clears
    // the confirmation, letting it re-derive.
    state.koAuto = state.koAuto || {};
    state.koFeed = state.koFeed || {};
    state.koTeams = state.koTeams || {};
    const _setKoManual = (side, el) => {
      if (!el) return;
      const isKo = m.stage !== 'group';
      m[side] = el.value || null;
      const key = m.id + '.' + side;
      delete state.koAuto[key];
      if (isKo && el.value) { state.koTeams[key] = el.value; state.koFeed[key] = true; }
      else { delete state.koTeams[key]; delete state.koFeed[key]; }
    };
    _setKoManual('home', homeEl);
    _setKoManual('away', awayEl);
    if (dateEl  && dateEl.value)  m.date  = dateEl.value;
    if (timeEl  && timeEl.value)  m.time  = timeEl.value;
    if (venueEl && venueEl.value) m.venue = venueEl.value;

    const hs = parseInt(document.getElementById('sc-home').value, 10);
    const as = parseInt(document.getElementById('sc-away').value, 10);
    if (isNaN(hs) || isNaN(as)) {
      m.result = null;
    } else {
      const pkEl = document.getElementById('pk-winner');
      const pkWinner = pkEl ? (pkEl.value || null) : null;
      m.result = { home: hs, away: as, pkWinner };
      // Sticker for each team that played, starred for the winner
      const winnerCode = hs > as ? m.home : (as > hs ? m.away : pkWinner);
      if (m.home) earnSticker(m.home, 'result', winnerCode === m.home);
      if (m.away) earnSticker(m.away, 'result', winnerCode === m.away);
      // Award stars to the active user (rewards engagement with results)
      const user = currentActiveUser();
      if (user) awardStars(user.name, 2, 'result:' + m.id);
      // Activity feed
      const hC = m.home ? countryByCode(m.home) : null;
      const aC = m.away ? countryByCode(m.away) : null;
      if (hC && aC) {
        logActivity('⚽', `${user ? escapeHTML(user.name) : 'Someone'} recorded ${hC.flag} ${hC.name} ${hs}–${as} ${aC.name} ${aC.flag}`);
      }
    }
    resolveBracketFromResults();
    save();
    closeModal();
    toast('Match saved');
    const cur = document.querySelector('.tab.active')?.dataset.tab;
    if (cur) activateTab(cur);
  }

  function clearResult(matchId) {
    const m = state.matches.find(x => x.id === matchId);
    if (!m) return;
    m.result = null;
    resolveBracketFromResults();
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
     Pool entry + pick helpers (exposed)
     ---------------------------------------------------------------- */
  // Returns the currently signed-in profile, if the hub auth is loaded.
  function currentActiveUser() {
    try { return (typeof getActiveUser === 'function') ? getActiveUser() : null; }
    catch (e) { return null; }
  }
  // Find or create a bracket entry for the active user.
  function ensureEntryForActiveUser(user) {
    const existing = state.members.find(m => m.name && m.name.toLowerCase() === user.name.toLowerCase());
    if (existing) {
      // Refresh the avatar in case it changed since they last saved a bracket
      if (user.avatar && existing.avatar !== user.avatar) existing.avatar = user.avatar;
      return existing;
    }
    const id = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
    const entry = { id, name: user.name, avatar: user.avatar || null };
    state.members.push(entry);
    state.picks[id] = { groupWinners:{}, groupRunnersUp:{}, ko:{}, champion:null, runnerUp:null, goldenBoot:'', goldenBootCorrect:false };
    return entry;
  }
  function startEntry() {
    const user = currentActiveUser();
    let entry;
    if (user && user.name) {
      entry = ensureEntryForActiveUser(user);
    } else {
      const id = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
      entry = { id, name: '' };
      state.members.push(entry);
      state.picks[id] = { groupWinners:{}, groupRunnersUp:{}, ko:{}, champion:null, runnerUp:null, goldenBoot:'', goldenBootCorrect:false };
    }
    state.uiSelectedMember = entry.id;
    save();
    renderPool();
    // Focus the name input only if it's still empty (i.e. no session user)
    setTimeout(() => {
      const n = document.getElementById('entrant-name');
      if (n && !n.value) n.focus();
    }, 50);
  }
  function editEntry(id) {
    state.uiSelectedMember = id;
    renderPool();
  }
  function doneEntry() {
    const id = state.uiSelectedMember;
    if (id) {
      const m = state.members.find(x => x.id === id);
      // Drop unnamed entries on Done so the leaderboard stays clean
      if (m && !(m.name && m.name.trim())) {
        state.members = state.members.filter(x => x.id !== id);
        delete state.picks[id];
      } else if (m) {
        logActivity('📝', `${escapeHTML(m.name)} ${m._loggedBracket ? 'updated' : 'submitted'} their bracket`);
        m._loggedBracket = true;
      }
    }
    state.uiSelectedMember = null;
    save();
    renderPool();
  }
  function setEntrantName(id, value) {
    const m = state.members.find(x => x.id === id);
    if (!m) return;
    m.name = (value || '').slice(0, 24);
    save();
    // Don't re-render on every keystroke — just persist. Leaderboard updates on Done.
  }
  function removeMember(id) {
    if (!confirm('Remove this bracket from the pool?')) return;
    state.members = state.members.filter(m => m.id !== id);
    delete state.picks[id];
    if (state.uiSelectedMember === id) state.uiSelectedMember = null;
    save();
    renderPool();
  }
  // Pick setters persist state but DON'T rebuild the whole pool form — the
  // <select> already holds the new value, so a full re-render only caused
  // scroll-jumps and focus loss. Picks are locked once a result can exist,
  // so there is never a live ✓/✗ mark or leaderboard delta to refresh while
  // editing. The leaderboard recomputes when the user taps Done.
  // In build-up mode a pick cascades into later rounds, so the form must
  // re-render — but we preserve scroll position so it doesn't jump.
  function _afterPick(p) {
    if (p && p.mode === 'buildup') {
      const y = window.scrollY;
      renderPool();
      window.scrollTo({ top: y, behavior: 'instant' });
    }
  }
  function setGroupPick(memberId, group, slot, value) {
    const p = state.picks[memberId];
    if (!p) return;
    if (isGroupLocked(group)) { toast('🔒 Group ' + group + ' picks are locked — its first match has kicked off'); renderPool(); return; }
    p.groupThird = p.groupThird || {};
    if (slot === 'winner')   p.groupWinners[group]   = value || null;
    if (slot === 'runnerUp') p.groupRunnersUp[group] = value || null;
    if (slot === 'third')    p.groupThird[group]     = value || null;
    save();
    _afterPick(p);
  }
  function setKoPick(memberId, stage, matchId, value) {
    const p = state.picks[memberId];
    if (!p) return;
    if (isStageLocked(stage)) { toast('🔒 ' + stage + ' picks are locked — that round has started'); renderPool(); return; }
    p.ko[stage] = p.ko[stage] || {};
    p.ko[stage][matchId] = value || null;
    if (p.mode === 'buildup' && stage === 'Final') syncOutcomeFromFinal(p);
    save();
    _afterPick(p);
  }
  function setOutcomePick(memberId, field, value) {
    const p = state.picks[memberId];
    if (!p) return;
    // goldenBootCorrect is the scoring-admin toggle, never locked
    if (field !== 'goldenBootCorrect' && areOutcomesLocked()) { toast('🔒 Outcome picks are locked — the Final has kicked off'); renderPool(); return; }
    p[field] = value;
    save();
  }
  function setBracketMode(memberId, mode) {
    const p = state.picks[memberId];
    if (!p) return;
    p.mode = mode === 'topdown' ? 'topdown' : 'buildup';
    if (p.mode === 'buildup') syncOutcomeFromFinal(p);
    save();
    renderPool();
  }
  function applyGroupScores(memberId, group) {
    const p = state.picks[memberId];
    if (!p) return;
    if (isGroupLocked(group)) { toast('🔒 Group ' + group + ' picks are locked — its first match has kicked off'); renderPool(); return; }
    const order = computeGroupOrderFromScores(group, p);
    if (!order) { toast('Enter all three group scores first'); return; }
    p.groupWinners = p.groupWinners || {};
    p.groupRunnersUp = p.groupRunnersUp || {};
    p.groupThird = p.groupThird || {};
    p.groupWinners[group]   = order[0] || null;
    p.groupRunnersUp[group] = order[1] || null;
    p.groupThird[group]     = order[2] || null;
    save();
    toast('Group ' + group + ' standings set from your scores');
    const y = window.scrollY;
    renderPool();
    window.scrollTo({ top: y, behavior: 'instant' });
  }
  function setMatchChip(value) {
    state.matchChip = value;
    renderMatches();
  }

  /* ---- Global search across teams, venues, matches ---- */
  function search(q) {
    const box = document.getElementById('wc-search-results');
    if (!box) return;
    const query = (q || '').trim().toLowerCase();
    if (query.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }

    const rows = [];
    // Teams
    for (const c of COUNTRIES) {
      if (c.name.toLowerCase().includes(query) || (c.capital||'').toLowerCase().includes(query) || c.code.toLowerCase() === query) {
        rows.push({ kind:'Team', icon:c.flag, label:c.name, sub:'Group '+c.group, action:`WC.searchGo('country','${c.code}')` });
      }
    }
    // Venues
    for (const v of VENUES) {
      if (v.name.toLowerCase().includes(query) || v.city.toLowerCase().includes(query)) {
        rows.push({ kind:'Venue', icon:'🏟', label:v.name, sub:v.city, action:`WC.searchGo('venues','')` });
      }
    }
    // Matches (by team names)
    for (const m of state.matches) {
      const h = m.home ? countryByCode(m.home) : null;
      const a = m.away ? countryByCode(m.away) : null;
      const hn = h ? h.name.toLowerCase() : (m.home_label||'').toLowerCase();
      const an = a ? a.name.toLowerCase() : (m.away_label||'').toLowerCase();
      if (hn.includes(query) || an.includes(query)) {
        const label = `${h?h.flag+' '+h.name:(m.home_label||'TBD')} vs ${a?a.flag+' '+a.name:(m.away_label||'TBD')}`;
        rows.push({ kind:'Match', icon:'⚽', label, sub:`${m.date.slice(5)} · ${m.stage==='group'?'Group '+m.group:m.round}`, action:`WC.editResult('${m.id}')` });
      }
      if (rows.length > 40) break;
    }

    if (rows.length === 0) {
      box.innerHTML = `<div class="wc-search-row muted">No matches for "${escapeHTML(q)}"</div>`;
    } else {
      box.innerHTML = rows.slice(0, 30).map(r => `
        <div class="wc-search-row" onclick="${r.action}">
          <span style="font-size:1.2rem;">${r.icon}</span>
          <span>${escapeHTML(r.label)}<div class="muted" style="font-size:0.72rem;">${escapeHTML(r.sub)}</div></span>
          <span class="sr-kind">${r.kind}</span>
        </div>`).join('');
    }
    box.classList.add('open');
  }
  function searchGo(kind, code) {
    const box = document.getElementById('wc-search-results');
    const input = document.getElementById('wc-search-input');
    if (box) { box.classList.remove('open'); box.innerHTML = ''; }
    if (input) input.value = '';
    if (kind === 'country') openCountry(code);
    else activateTab(kind);
  }

  /* ---- Bracket divergence — compare two members side by side ---- */
  function openCompare() {
    const named = state.members.filter(m => m.name && m.name.trim());
    if (named.length < 2) { toast('Need at least two brackets to compare.'); return; }
    if (!state._cmpA || !named.find(m=>m.id===state._cmpA)) state._cmpA = named[0].id;
    if (!state._cmpB || !named.find(m=>m.id===state._cmpB)) state._cmpB = named[1].id;
    renderCompare();
  }
  function setCompare(slot, id) { state['_cmp'+slot] = id; renderCompare(); }
  function renderCompare() {
    const named = state.members.filter(m => m.name && m.name.trim());
    const a = state.members.find(m => m.id === state._cmpA) || named[0];
    const b = state.members.find(m => m.id === state._cmpB) || named[1];
    const pa = state.picks[a.id] || {}, pb = state.picks[b.id] || {};
    const tl = (code) => { const c = code ? countryByCode(code) : null; return c ? c.flag+' '+escapeHTML(c.name) : '<span class="muted">—</span>'; };
    const sel = (slot, cur) => `<select onchange="WC.setCompare('${slot}',this.value)" style="background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.82rem;max-width:46%;">
      ${named.map(m => `<option value="${m.id}" ${cur===m.id?'selected':''}>${escapeHTML(m.name)}</option>`).join('')}</select>`;

    const row = (label, av, bv) => {
      const same = av && bv && av === bv;
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--wc-line);${same?'background:rgba(22,163,74,0.06);':''}">
        <div style="font-size:0.82rem;">${tl(av)}</div>
        <div style="font-size:0.82rem;text-align:right;">${tl(bv)}</div>
        <div style="grid-column:1/3;font-size:0.68rem;color:${same?'var(--wc-green)':'var(--text-muted)'};text-transform:uppercase;letter-spacing:0.05em;">${label}${same?' · agree ✓':''}</div>
      </div>`;
    };

    let body = `<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;">
      ${sel('A', a.id)}${sel('B', b.id)}
    </div>`;
    body += row('Champion', pa.champion, pb.champion);
    body += row('Runner-up', pa.runnerUp, pb.runnerUp);
    // Golden boot (text)
    const gbSame = pa.goldenBoot && pb.goldenBoot && pa.goldenBoot.toLowerCase() === pb.goldenBoot.toLowerCase();
    body += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--wc-line);${gbSame?'background:rgba(22,163,74,0.06);':''}">
      <div style="font-size:0.82rem;">👟 ${escapeHTML(pa.goldenBoot||'—')}</div>
      <div style="font-size:0.82rem;text-align:right;">👟 ${escapeHTML(pb.goldenBoot||'—')}</div>
      <div style="grid-column:1/3;font-size:0.68rem;color:${gbSame?'var(--wc-green)':'var(--text-muted)'};text-transform:uppercase;">Golden Boot${gbSame?' · agree ✓':''}</div>
    </div>`;
    // Group winners
    body += `<div style="font-weight:800;color:var(--wc-gold);margin:10px 0 4px;font-size:0.85rem;">Group winners</div>`;
    let agreements = 0, comparable = 0;
    for (const g of GROUP_LETTERS) {
      const av = (pa.groupWinners||{})[g], bv = (pb.groupWinners||{})[g];
      if (av && bv) { comparable++; if (av===bv) agreements++; }
      body += row('Group '+g, av, bv);
    }

    const modal = document.getElementById('match-modal');
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>⚖ Compare brackets</h3>
      <div class="sub">${comparable>0?`Agree on ${agreements} of ${comparable} group winners`:'Pick two brackets to compare'}</div>
      <div style="max-height:60vh;overflow-y:auto;margin-top:10px;">${body}</div>
      <div class="modal-actions"><button class="btn" onclick="WC.closeModal()">Close</button></div>
    `;
    modal.classList.add('open');
  }

  /* ----------------------------------------------------------------
     Share bracket + invite extended family — uses URL parameter
     payload so guests can play from the public app URL without VPN.
     ---------------------------------------------------------------- */
  function _publicAppBase() {
    // Strip any existing query string, keep the directory + filename.
    return window.location.origin + window.location.pathname;
  }
  function openShareBracket(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;
    const enc = encodeBracket(member);
    const url = _publicAppBase() + '?wc_share=' + enc;
    const modal = document.getElementById('match-modal');
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>🔗 Share ${escapeHTML(member.name)}'s bracket</h3>
      <div class="sub">Send this link to anyone in the family pool. They'll see the picks and can add the bracket.</div>
      <textarea readonly id="share-url-area"
                style="width:100%;background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:10px;font-size:0.78rem;font-family:monospace;margin:10px 0;min-height:90px;word-break:break-all;"
                onclick="this.select()">${escapeHTML(url)}</textarea>
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Close</button>
        <button class="btn" onclick="WC.copyShareUrl()">📋 Copy link</button>
      </div>
    `;
    modal.classList.add('open');
  }
  function copyShareUrl() {
    const area = document.getElementById('share-url-area');
    if (!area) return;
    area.select();
    try {
      navigator.clipboard.writeText(area.value).then(() => toast('Link copied!')).catch(() => {
        document.execCommand && document.execCommand('copy');
        toast('Link copied!');
      });
    } catch (e) {
      try { document.execCommand('copy'); toast('Link copied!'); } catch (e2) { toast('Copy failed — long-press the link to select.'); }
    }
  }
  function openShareFamilyPool() {
    const named = state.members.filter(m => m.name && m.name.trim());
    if (named.length === 0) {
      toast('No brackets to share yet — submit one first.');
      return;
    }
    const enc = encodePool();
    const url = _publicAppBase() + '?wc_pool=' + enc;
    const resultCount = state.matches.filter(m => m.result).length;
    const sizeKB = (url.length / 1024).toFixed(1);
    const modal = document.getElementById('match-modal');
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>📤 Share the family pool</h3>
      <div class="sub">${named.length} bracket${named.length===1?'':'s'} · ${resultCount} result${resultCount===1?'':'s'} · ${sizeKB} KB URL</div>
      <p style="margin:10px 0;font-size:0.85rem;line-height:1.5;">Send this link to extended family — opening it adds the whole pool to their device so they can see the leaderboard. Re-share after every round to keep them in sync.</p>
      <textarea readonly id="share-url-area"
                style="width:100%;background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:10px;font-size:0.78rem;font-family:monospace;margin:6px 0;min-height:90px;word-break:break-all;"
                onclick="this.select()">${escapeHTML(url)}</textarea>
      <p class="muted" style="font-size:0.72rem;">URLs above ~4 KB may get truncated by SMS — WhatsApp / email / Slack are safe.</p>
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Close</button>
        <button class="btn" onclick="WC.copyShareUrl()">📋 Copy link</button>
      </div>
    `;
    modal.classList.add('open');
  }
  function openInviteGuest() {
    const link = _publicAppBase();
    const modal = document.getElementById('match-modal');
    modal.querySelector('.modal-inner').innerHTML = `
      <h3>📨 Invite extended family</h3>
      <div class="sub">No app install, no VPN needed.</div>
      <ol style="padding-left:20px;line-height:1.6;font-size:0.88rem;margin:10px 0;">
        <li>Send the family member this public app link:</li>
      </ol>
      <textarea readonly id="share-url-area"
                style="width:100%;background:var(--wc-card-strong);border:1px solid var(--wc-line);color:var(--text-primary);border-radius:8px;padding:10px;font-size:0.78rem;font-family:monospace;margin:6px 0 10px;min-height:60px;word-break:break-all;"
                onclick="this.select()">${escapeHTML(link)}</textarea>
      <ol start="2" style="padding-left:20px;line-height:1.6;font-size:0.88rem;">
        <li>They open it, fill out their bracket, and tap the <b>🔗 share</b> button next to their name.</li>
        <li>They text/email/WhatsApp <b>that link</b> back to you.</li>
        <li>You open <b>their link</b> here — the app prompts you to add their bracket to the pool. Done.</li>
      </ol>
      <p class="muted" style="font-size:0.78rem;margin-top:10px;">Their bracket then syncs to the rest of the family devices via the regular pool sync.</p>
      <div class="modal-actions">
        <button class="btn ghost" onclick="WC.closeModal()">Close</button>
        <button class="btn" onclick="WC.copyShareUrl()">📋 Copy invite link</button>
      </div>
    `;
    modal.classList.add('open');
  }
  function setScorePred(memberId, matchId, side, raw) {
    const p = state.picks[memberId];
    if (!p) return;
    const match = state.matches.find(m => m.id === matchId);
    if (match && _matchStarted(match)) { toast('🔒 That match has kicked off — score prediction locked'); return; }
    p.scores = p.scores || {};
    p.scores[matchId] = p.scores[matchId] || {};
    const n = raw === '' ? null : parseInt(raw, 10);
    if (n === null || isNaN(n)) delete p.scores[matchId][side];
    else p.scores[matchId][side] = n;
    if (p.scores[matchId].home === undefined && p.scores[matchId].away === undefined) delete p.scores[matchId];
    save();
    // No re-render — keep focus in the input
  }

  /* ----------------------------------------------------------------
     Quick-fill — favorites / underdogs / random
     Skips any pick whose stage/group is already locked.
     "Favorite" = team in pot 1 (or lowest pot) within candidate set.
     ---------------------------------------------------------------- */
  function _potOf(code) {
    const c = countryByCode(code);
    return c && c.pot ? c.pot : 9;
  }
  function _quickPick(candidates, mode) {
    if (!candidates || candidates.length === 0) return null;
    if (mode === 'random') return candidates[Math.floor(Math.random() * candidates.length)];
    const sorted = candidates.slice().sort((a,b) => _potOf(a) - _potOf(b));
    if (mode === 'favorites') return sorted[0];
    if (mode === 'underdogs') return sorted[sorted.length - 1];
    return sorted[0];
  }
  function quickFill(memberId, mode) {
    const p = state.picks[memberId];
    if (!p) return;
    if (!confirm(`Quick-fill all UNLOCKED picks with ${mode}? Already-locked picks won't change.`)) return;
    // Groups
    for (const g of GROUP_LETTERS) {
      if (isGroupLocked(g)) continue;
      const codes = (state.groups[g] || []).slice();
      const sorted = codes.slice().sort((a,b) => _potOf(a) - _potOf(b));
      let winner, ru;
      if (mode === 'random') {
        const shuf = codes.slice().sort(() => Math.random() - 0.5);
        winner = shuf[0]; ru = shuf[1];
      } else if (mode === 'favorites') {
        winner = sorted[0]; ru = sorted[1];
      } else {
        winner = sorted[sorted.length - 1]; ru = sorted[sorted.length - 2];
      }
      p.groupWinners = p.groupWinners || {};
      p.groupRunnersUp = p.groupRunnersUp || {};
      p.groupWinners[g] = winner;
      p.groupRunnersUp[g] = ru;
    }
    // KOs
    for (const stage of ['R32','R16','QF','SF','Final']) {
      if (isStageLocked(stage)) continue;
      p.ko[stage] = p.ko[stage] || {};
      for (const m of state.matches.filter(x => x.stage === stage)) {
        const pick = _quickPick(candidatesForMatch(m), mode);
        if (pick) p.ko[stage][m.id] = pick;
      }
    }
    // Outcomes
    if (!areOutcomesLocked()) {
      const finalMatch = state.matches.find(m => m.stage === 'Final');
      const finalists = finalMatch ? candidatesForMatch(finalMatch) : COUNTRIES.map(c => c.code);
      const picked = _quickPick(finalists, mode);
      if (picked) p.champion = picked;
      // Runner-up: pick a different one
      const ruPool = finalists.filter(c => c !== p.champion);
      const ruPick = _quickPick(ruPool, mode);
      if (ruPick) p.runnerUp = ruPick;
    }
    save();
    toast(`Filled ${mode} picks`);
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
    loadNominations();                 // show any cached squads immediately
    syncNominations({ quiet: true });  // refresh in the background (no-op until URL is set)
    document.querySelectorAll('.tab[data-tab]').forEach(t => {
      t.addEventListener('click', () => activateTab(t.dataset.tab));
    });
    // Live score auto-sync: poll once a minute during match windows, and
    // immediately when the app returns to the foreground mid-match (the
    // classic "reopen phone at half time" case).
    setInterval(autoSyncTick, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') autoSyncTick();
    });
    autoSyncTick();
    // refresh countdown every second on home
    setInterval(() => {
      if (document.querySelector('.tab.active')?.dataset.tab === 'home') {
        const cd = document.getElementById('cd');
        if (!cd) return;
        const now = new Date();
        const opener = state.matches.slice().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0];
        const startD = opener ? kickoffDate(opener) : new Date(TOURNAMENT_START);
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

    // Auto-sync when the tab is reactivated after being hidden 10+ min,
    // and pull cross-device picks via CloudSync on every visibility return.
    let hiddenSince = null;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now();
        return;
      }
      // Became visible
      if (window.CloudSync && CloudSync.online && CloudSync.pull) {
        try {
          CloudSync.pull(STORE_KEY).then(() => {
            // Re-read storage after pull
            load();
            const cur = document.querySelector('.tab.active')?.dataset.tab;
            if (cur) activateTab(cur);
          }).catch(() => {});
        } catch (e) {}
      }
      if (hiddenSince && (Date.now() - hiddenSince) > 10 * 60 * 1000) {
        if (typeof syncScores === 'function') syncScores();
      }
      hiddenSince = null;
    });

    // Honor ?wc_share=... in the URL — guest brought us a bracket to import
    checkUrlForImport();

    // Initial cross-device pull so a new device picks up family picks
    if (window.CloudSync && CloudSync.pull) {
      setTimeout(() => {
        try {
          CloudSync.pull(STORE_KEY).then(() => {
            load();
            const cur = document.querySelector('.tab.active')?.dataset.tab;
            if (cur) activateTab(cur);
          }).catch(() => {});
        } catch (e) {}
      }, 800);
    }

    activateTab('home');
  }

  /* ----------------------------------------------------------------
     NOMINATIONS — official nominated squads, fetched from a remote
     JSON feed once published. Replaces the curated `stars` snapshot
     for any country with a nominated squad, while flagging the names
     we'd pre-tagged as "key players" with a ⭐. Falls back to `stars`
     for any country not yet in the feed.

     Expected feed shape (all per-player fields optional except name):
       { "version": "2026-06-02",
         "squads": {
           "MEX": [ { "name":"Santiago Giménez", "pos":"ST",
                      "club":"AC Milan", "age":25, "num":9,
                      "note":"…" }, … ],
           … } }
     A bare { "MEX": [ … ] } object (no wrapper) is also accepted.
     ---------------------------------------------------------------- */
  // Self-hosted nominated-squad feed, committed to this repo at
  // data/squads-2026.json. Empty squads -> app falls back to curated stars,
  // so this is safe to point live before the file is populated.
  const NOMINATIONS_URL = 'https://raw.githubusercontent.com/rozavala/apps/main/data/squads-2026.json';
  const NOMINATIONS_KEY = 'wc2026.nominations';
  let NOMINATIONS = {};          // { CODE: [ {name,pos,club,age,num,note}, … ] }

  // Normalize a name for matching feed players against curated stars
  // (case/accent/punctuation-insensitive so "Giménez" === "gimenez").
  function normName(s) {
    return (s || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/["'.]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Resolve the roster to render for a country: the nominated squad if we
  // have one (with key players flagged), otherwise the curated stars.
  function rosterFor(c) {
    const squad = NOMINATIONS[c.code];
    if (Array.isArray(squad) && squad.length) {
      const starNames = new Set((c.stars || []).map(p => normName(p.name)));
      return {
        nominated: true,
        players: squad.map(p => ({ ...p, key: starNames.has(normName(p.name)) })),
      };
    }
    return { nominated: false, players: (c.stars || []).map(p => ({ ...p, key: false })) };
  }

  // Load any cached squads from a previous fetch (so they show offline /
  // before the background refresh completes).
  function loadNominations() {
    try {
      const raw = localStorage.getItem(NOMINATIONS_KEY);
      if (raw) NOMINATIONS = JSON.parse(raw).squads || {};
    } catch (e) { NOMINATIONS = {}; }
  }

  // Fetch nominated squads from the remote feed and cache them. Safe to
  // call with no URL set (no-op with a gentle toast). Re-renders the
  // active tab so an open country page updates in place.
  async function syncNominations(opts = {}) {
    const quiet = opts.quiet;
    if (!NOMINATIONS_URL) {
      if (!quiet) toast('Nominated squads not published yet');
      return;
    }
    if (!quiet) toast('Fetching nominated squads…');
    try {
      const res = await fetch(NOMINATIONS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const squads = data.squads || data;       // accept wrapped or bare
      if (!squads || typeof squads !== 'object') throw new Error('bad feed shape');
      NOMINATIONS = squads;
      _cacheNominations(data.version || null);
      const n = Object.keys(NOMINATIONS).length;
      const cur = document.querySelector('.tab.active')?.dataset.tab;
      if (cur) activateTab(cur);
      if (!quiet) toast(n
        ? `Squads loaded — ${n} team${n === 1 ? '' : 's'} updated`
        : 'No nominated squads published yet');
    } catch (e) {
      console.error('Nominations sync failed', e);
      if (!quiet) toast('Squad fetch failed: ' + (e.message || 'network error'));
    }
  }

  // Persist the fetched squads for offline use. The feed is ~170KB and
  // every page on this origin shares one localStorage quota, so on full
  // devices the blind setItem on each load threw QuotaExceededError 26+
  // times across the family (#diag). Quota failure is non-fatal — the
  // in-memory copy serves the whole session — so: skip the write when
  // the cached version already matches (the common case), and on quota
  // failure evict our own stale copy, retry once, then degrade to a
  // single console.warn instead of an error.
  function _cacheNominations(version) {
    try {
      const raw = localStorage.getItem(NOMINATIONS_KEY);
      if (raw && version && JSON.parse(raw).version === version) return;
    } catch (e) { /* unreadable cache — fall through and rewrite */ }
    const payload = JSON.stringify({ version: version, squads: NOMINATIONS });
    try {
      localStorage.setItem(NOMINATIONS_KEY, payload);
    } catch (e1) {
      try {
        localStorage.removeItem(NOMINATIONS_KEY);
        localStorage.setItem(NOMINATIONS_KEY, payload);
      } catch (e2) {
        console.warn('Nominations cache skipped (storage full) — squads still loaded for this session');
      }
    }
  }

  /* ----------------------------------------------------------------
     SYNC — pull latest scores. Primary source is the VPS-side ESPN
     scoreboard proxy (truly live, minute-by-minute) when CloudSync is
     connected; fallback is the OpenFootball community dataset (lags,
     but works without the VPS for guests on the public host).
     ---------------------------------------------------------------- */
  const OPENFOOTBALL_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
  const VPS_WC_SCORES_URL = (window.CloudSync && CloudSync.isConfigured && CloudSync.isConfigured())
    ? 'https://all-options-dev.tail57521e.ts.net/api/wc-scores'
    : null;

  // Dates the proxy should query. Group-stage matches are limited to the
  // live window (recent + within 24h) so routine polling stays lean —
  // but EVERY knockout date is always included so the official bracket
  // resolves the moment ESPN publishes it, instead of trickling in ~24h
  // before each KO match. The tournament has 34 distinct match-days, so
  // the union stays under the proxy's 40-date cap; we trim oldest as a
  // defensive backstop if the schedule ever grows.
  function _vpsQueryDates() {
    const cutoff = Date.now() + 24 * 3600 * 1000;
    const dates = new Set();
    for (const m of state.matches) {
      if (m.stage !== 'group' || kickoffDate(m).getTime() <= cutoff) {
        dates.add(m.date.replace(/-/g, ''));
      }
    }
    const sorted = Array.from(dates).sort();
    return sorted.length > 40 ? sorted.slice(sorted.length - 40) : sorted;
  }

  async function _fetchEspn() {
    if (!VPS_WC_SCORES_URL || !window.CloudSync || !CloudSync.online) return null;
    const dates = _vpsQueryDates();
    if (dates.length === 0) return null;
    try {
      const res = await fetch(VPS_WC_SCORES_URL + '?dates=' + dates.join(','), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return Array.isArray(data.matches) ? data.matches : null;
    } catch (e) {
      console.warn('ESPN scoreboard fetch failed, falling back to OpenFootball:', e.message);
      return null;
    }
  }

  async function syncScores(opts = {}) {
    const quiet = !!opts.quiet;
    if (_scoreSyncBusy) return;
    _scoreSyncBusy = true;
    if (!quiet) toast('Fetching latest scores…');
    try {
      // Try ESPN-via-VPS first; fall back to OpenFootball when the VPS
      // is unreachable (offline, guest device, transient hiccup).
      let remote = await _fetchEspn();
      let sourceLabel = 'ESPN';
      if (!remote) {
        const res = await fetch(OPENFOOTBALL_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        remote = data.matches || [];
        sourceLabel = 'OpenFootball';
      }

      let updated = 0, teamsResolved = 0;
      // Build a lookup: by (date, team1, team2) and also by team codes if mapping known.
      // Local: state.matches has id, date, time, home, away, home_label, away_label, group, stage, venue, result.
      // Remote: { date, time, team1, team2, group, ground, round, score: {ft:[h,a], ht?:[..]} | undefined }
      // We match by date + team labels/codes. For unresolved KO matches with placeholder labels,
      // we also try to fill in the now-known teams.

      // Build a remote-team-name → code map from our COUNTRIES list.
      const nameToCode = {};
      for (const c of COUNTRIES) nameToCode[c.name] = c.code;
      // Some openfootball names differ
      nameToCode['Bosnia & Herzegovina'] = 'BIH';
      nameToCode['Czech Republic'] = 'CZE';
      nameToCode['DR Congo'] = 'COD';
      nameToCode['Ivory Coast'] = 'CIV';
      nameToCode['Saudi Arabia'] = 'KSA';
      nameToCode['South Africa'] = 'ZAF';
      nameToCode['South Korea'] = 'KOR';
      nameToCode['Cape Verde'] = 'CPV';
      nameToCode['Turkey'] = 'TUR';
      nameToCode['USA'] = 'USA';
      nameToCode['Curaçao'] = 'CUW';
      nameToCode['New Zealand'] = 'NZL';
      nameToCode['Sweden'] = 'SWE';
      nameToCode['Iraq'] = 'IRQ';
      nameToCode['Haiti'] = 'HAI';
      nameToCode['Algeria'] = 'ALG';
      // ESPN-side variants
      nameToCode['Türkiye'] = 'TUR';
      nameToCode['Cape Verde Islands'] = 'CPV';
      nameToCode['Korea Republic'] = 'KOR';
      nameToCode['IR Iran'] = 'IRN';
      nameToCode['United States of America'] = 'USA';

      // ESPN sends a 3-letter abbreviation alongside the display name —
      // most line up with our FIFA codes but a handful differ (e.g.
      // GHA→GHA, but SUI vs SWZ etc). Build the abbr lookup defensively
      // and let the team-name match win on ties.
      const abbrToCode = {};
      for (const c of COUNTRIES) abbrToCode[c.code] = c.code;
      abbrToCode['RSA'] = 'ZAF';   // ESPN uses RSA for South Africa
      abbrToCode['CZR'] = 'CZE';   // ESPN: Czech Republic
      abbrToCode['IVO'] = 'CIV';   // ESPN: Ivory Coast
      abbrToCode['CTA'] = 'CIV';   // alt
      abbrToCode['MOR'] = 'MAR';   // ESPN: Morocco
      abbrToCode['SAU'] = 'KSA';
      abbrToCode['CRC'] = 'CRC';
      abbrToCode['NED'] = 'NED';
      abbrToCode['POR'] = 'POR';
      function _resolveCode(name, abbr) {
        return nameToCode[name] || (abbr && abbrToCode[abbr]) || null;
      }

      const isCode = x => COUNTRIES.some(c => c.code === x);
      state.koAuto = state.koAuto || {};
      state.koFeed = state.koFeed || {};
      state.koTeams = state.koTeams || {};

      // Fill/override a knockout side from the authoritative feed. The
      // feed wins over an empty side, a provisional resolver value
      // (koAuto), or a prior confirmed value (koFeed). Records the team
      // in koTeams so it persists + syncs to every device, and marks
      // koFeed so the provisional resolver won't overwrite it.
      function fillKoSide(m, side, code) {
        if (!isCode(code)) return false;
        const key = m.id + '.' + side;
        const cur = m[side];
        const ours = cur == null || state.koAuto[key] === cur || state.koFeed[key];
        if (!ours) return false;
        const wasFeed = state.koFeed[key];
        state.koFeed[key] = true;
        delete state.koAuto[key];
        if (cur === code && state.koTeams[key] === code) return false;
        m[side] = code;
        state.koTeams[key] = code;
        if (side === 'home') m.home_label = null; else m.away_label = null;
        if (!wasFeed) teamsResolved++;
        return true;
      }

      // Locate the local match for a remote fixture and report whether
      // the feed lists the two teams in our slot's orientation or flipped.
      // Exact (resolved code or placeholder label) match first; then a
      // knockout anchor where one already-resolved real side identifies
      // the fixture (so the OTHER side — e.g. a provisional third — gets
      // the official team).
      function matchRemote(rm, rhCode, raCode) {
        const r1 = rhCode || rm.team1, r2 = raCode || rm.team2;
        for (const lm of state.matches) {
          if (lm.date !== rm.date) continue;
          const lh = lm.home || lm.home_label, la = lm.away || lm.away_label;
          if (lh === r1 && la === r2) return { local: lm, flipped: false };
          if (lh === r2 && la === r1) return { local: lm, flipped: true };
        }
        if (isCode(rhCode) || isCode(raCode)) {
          for (const lm of state.matches) {
            if (lm.stage === 'group' || lm.date !== rm.date) continue;
            if (isCode(lm.home)) {
              if (lm.home === rhCode) return { local: lm, flipped: false };
              if (lm.home === raCode) return { local: lm, flipped: true };
            }
            if (isCode(lm.away)) {
              if (lm.away === raCode) return { local: lm, flipped: false };
              if (lm.away === rhCode) return { local: lm, flipped: true };
            }
          }
        }
        return null;
      }

      const cleanGoals = arr => Array.isArray(arr)
        ? arr.filter(g => g && g.name).map(g => {
            const out = { name: g.name };
            if (typeof g.minute === 'number') out.minute = g.minute;
            if (g.owngoal) out.owngoal = true;
            return out;
          })
        : null;

      for (const rm of remote) {
        const rhCode = _resolveCode(rm.team1, rm.team1_abbr);
        const raCode = _resolveCode(rm.team2, rm.team2_abbr);
        const match = matchRemote(rm, rhCode, raCode);
        if (!match) continue;
        const local = match.local, flip = match.flipped;
        // Remote teams mapped onto OUR home/away orientation.
        const homeCode = flip ? raCode : rhCode;
        const awayCode = flip ? rhCode : raCode;

        if (local.stage === 'group') {
          // Group placeholders are rare; fill if the feed has real teams.
          if (!local.home && isCode(homeCode)) { local.home = homeCode; local.home_label = null; teamsResolved++; }
          if (!local.away && isCode(awayCode)) { local.away = awayCode; local.away_label = null; teamsResolved++; }
        } else {
          // Knockout: official teams override provisional seeding.
          if (isCode(homeCode)) fillKoSide(local, 'home', homeCode);
          if (isCode(awayCode)) fillKoSide(local, 'away', awayCode);
        }

        // Score (flip-aware): OpenFootball/ESPN ft = [team1, team2].
        let hs = null, as = null;
        if (rm.score && Array.isArray(rm.score.ft)) { hs = rm.score.ft[0]; as = rm.score.ft[1]; }
        else if (typeof rm.score1 === 'number' && typeof rm.score2 === 'number') { hs = rm.score1; as = rm.score2; }
        if (flip) { const t = hs; hs = as; as = t; }
        if (hs !== null && as !== null) {
          // Penalty-shootout / advancing-team winner. Only meaningful when
          // full time is level — for a decisive score the winner is implied
          // by the goals. Computed every sync (not just when the score
          // changes) so a draw that later goes to pens still gets its
          // winner, and re-derives the bracket cascade.
          let pkWinner = (local.result && local.result.pkWinner) || null;
          if (hs === as) {
            if (rm.winner === 'home' || rm.winner === 'away') {
              // ESPN's definitive winner flag (flip-aware) — source of truth.
              const winSide = flip ? (rm.winner === 'home' ? 'away' : 'home') : rm.winner;
              pkWinner = winSide === 'home' ? local.home : local.away;
            } else if (rm.score && Array.isArray(rm.score.p)) {
              // Shootout tally fallback (OpenFootball, or ESPN score.p).
              let p0 = rm.score.p[0], p1 = rm.score.p[1];
              if (flip) { const t = p0; p0 = p1; p1 = t; }
              if (p0 > p1) pkWinner = local.home;
              else if (p1 > p0) pkWinner = local.away;
            }
          } else {
            pkWinner = null; // decisive result — no shootout
          }
          const prev = local.result;
          const changed = !prev || prev.home !== hs || prev.away !== as ||
                          (prev.pkWinner || null) !== (pkWinner || null);
          // Guard against a background poll wiping a recorded result. A
          // quiet auto-sync may ADD a result for a match that has none, or
          // update one that's genuinely in its live window right now — but
          // it must NOT rewrite a result whose match is already over. That
          // was zeroing out completed games on open (e.g. a match the
          // feed momentarily reports 0-0/in-progress, or the lagging
          // fallback). Manual "Sync scores" (not quiet) is always allowed.
          const kt = kickoffDate(local).getTime();
          const inLiveWindow = Date.now() >= kt - 5 * 60000 && Date.now() <= kt + LIVE_WINDOW_MS;
          const overwriteOk = !prev || !quiet || inLiveWindow;
          if (changed && overwriteOk) {
            // Object.assign preserves goals/cards/eventId already attached.
            local.result = Object.assign({}, local.result, { home: hs, away: as, pkWinner });
            updated++;
          }
          // Scorer lists, flip-aware. Empty arrays clear stale entries.
          const gA = cleanGoals(rm.goals1), gB = cleanGoals(rm.goals2);
          const g1 = flip ? gB : gA, g2 = flip ? gA : gB;
          if (g1 !== null) local.result.goals1 = g1;
          if (g2 !== null) local.result.goals2 = g2;
          if (rm.eventId) local.result.eventId = rm.eventId;
        }
      }

      // Golden Boot: harvest goal scorers when OpenFootball includes them
      // (goals1/goals2 arrays of {name, minute, owngoal?, penalty?}).
      // Full recompute each sync — remote is the source of truth.
      const tally = {};
      for (const rm of remote) {
        const sides = [[rm.goals1, rm.team1], [rm.goals2, rm.team2]];
        for (const [goals, teamName] of sides) {
          if (!Array.isArray(goals)) continue;
          for (const g of goals) {
            if (!g || !g.name || g.owngoal) continue;
            const code = nameToCode[teamName] || null;
            const key = g.name + '|' + (code || teamName || '?');
            tally[key] = (tally[key] || 0) + 1;
          }
        }
      }
      state.scorers = Object.entries(tally)
        .map(([k, n]) => { const i = k.lastIndexOf('|'); return { name: k.slice(0, i), team: k.slice(i + 1), goals: n }; })
        .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

      // Newly-synced group results may complete a group or a KO match —
      // re-derive the bracket so qualified teams flow into the R32+ slots.
      resolveBracketFromResults();

      save();
      _lastScoreSyncAt = Date.now();
      const changed = updated > 0 || teamsResolved > 0;
      // Don't yank the DOM out from under an open editor modal mid-poll.
      const modalOpen = !!document.querySelector('.modal.open');
      if ((!quiet || changed) && !modalOpen) {
        const cur = document.querySelector('.tab.active')?.dataset.tab;
        if (cur) activateTab(cur);
      }
      if (!quiet) {
        // Two distinct numbers — match-result deltas vs. cumulative Golden
        // Boot leaderboard size — were getting misread as a fraction.
        // Spell each out so "8 scores updated, 88 scorers tracked" reads
        // as two unrelated counts.
        const scorersNote = state.scorers.length ? ` · 👟 ${state.scorers.length} scorer${state.scorers.length===1?'':'s'} on Golden Boot board` : '';
        toast(`Synced from ${sourceLabel} — ${updated} match score${updated===1?'':'s'} updated${teamsResolved?`, ${teamsResolved} team${teamsResolved===1?'':'s'} resolved`:''}${scorersNote}`);
      } else if (changed) {
        toast(`⚽ Live — ${updated} score${updated===1?'':'s'} updated`);
      }
    } catch (e) {
      console.error('Sync failed', e);
      if (!quiet) toast('Sync failed: ' + (e.message || 'network error'));
    } finally {
      _scoreSyncBusy = false;
    }
  }

  // expose
  window.WC = {
    tab: activateTab,
    openCountry,
    renderMatches,
    editResult, editResultNeighbor, saveResult, clearResult, closeModal,
    resetBracket,
    openGroupEditor, saveGroups,
    startEntry, editEntry, doneEntry, setEntrantName, removeMember,
    setGroupPick, setKoPick, setOutcomePick, setScorePred,
    setBracketMode, applyGroupScores,
    setMatchChip,
    quickFill,
    startQuiz, answerQuiz, nextQuestion, resetQuiz,
    openShareBracket, copyShareUrl, openInviteGuest, confirmImportBracket,
    openShareFamilyPool, confirmImportPool,
    search, searchGo,
    openCompare, setCompare,
    setFavoriteTeam,
    resetAll,
    syncScores,
    syncNominations,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
