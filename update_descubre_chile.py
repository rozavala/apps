import json

with open('js/descubre-chile.js', 'r') as f:
    content = f.read()

# TOPICS array: currently 12 items.
# We cannot add a new topic, because MAX is 12.
# Prompt: "Add +1 new topic only if below max." - Wait, if it's 12, it's at max. Let me check the rules. "TOPICS array: MAX 12 topics. Add +1 new topic only if below max."
# Since it is 12, I don't add a new topic.

# QB question bank: pick 2-3 topics with < 15 questions and add 2-3 questions each.
# Let's count questions per topic in QB.
# geography: 23 questions -> 20 limit. Prune 3. Add 2? "If a bank is at or above its MAX, remove the oldest/weakest items to make room... Descubre Chile - QB question bank per topic: MAX 20 questions per topic. Add +2-3 per topic that's below 15."
# Since geography has 23, it exceeds MAX 20. I must prune 3 down to 20, or if I don't touch it, wait. Rule: "Never let a bank exceed its MAX." So I must prune down to 20 for geography.
# Then I pick 2-3 topics below 15 and add 2-3.
# Let's see counts:
# geography: 23
# antartica: 7
# indigenous: 10
# history: 17 (Prune if add? I will not add to this one)
# culture: 7
# nature: 8
# famous: 5
# inventors: 4
# volcanes: 4
# animales: 7
# volcanes_chile: 4
# fiestas_patrias: 4

# PRUNING geography from 23 to 20:
geo_prune_1 = "{q:'¿Cuál es el río más largo de Chile?',a:'Río Loa',o:['Río Loa','Río Biobío','Río Mapocho','Río Maipo'], tier:'advanced'},"
geo_prune_2 = "{q:'¿Qué país comparte la cordillera de los Andes con Chile en la frontera este?',a:'Argentina',o:['Argentina','Perú','Bolivia','Brasil'], tier:'intermediate'},"
geo_prune_3 = "{q:'¿En qué hemisferio se encuentra Chile?',a:'Hemisferio Sur',o:['Hemisferio Sur','Hemisferio Norte','Hemisferio Oriental','En el Ecuador'], tier:'beginner'},"
content = content.replace(geo_prune_1, "// PRUNED [2026-04-12]: Removed to stay within MAX 20 limit\n    ")
content = content.replace(geo_prune_2, "// PRUNED [2026-04-12]: Removed to stay within MAX 20 limit\n    ")
content = content.replace(geo_prune_3, "// PRUNED [2026-04-12]: Removed to stay within MAX 20 limit\n    ")

# Add to 'famous' (has 5, add 2):
famous_search = "    {q:'¿En qué billete está Gabriela Mistral?',a:'5.000 pesos',o:['5.000 pesos','1.000 pesos','10.000 pesos','20.000 pesos'], tier:'expert'}"
famous_replace = "    {q:'¿En qué billete está Gabriela Mistral?',a:'5.000 pesos',o:['5.000 pesos','1.000 pesos','10.000 pesos','20.000 pesos'], tier:'expert'},\n    {q:'¿Qué deporte practicaba Marcelo Ríos?',a:'Tenis',o:['Tenis','Fútbol','Gimnasia','Natación'], tier:'beginner'},\n    {q:'¿En qué año fue Marcelo Ríos número 1 del mundo?',a:'1998',o:['1998','2000','1995','2005'], tier:'advanced'}"
content = content.replace(famous_search, famous_replace)

# Add to 'inventors' (has 4, add 2):
inventors_search = "    {q:'¿Cómo se llama el gran observatorio ubicado en el norte?',a:'ALMA',o:['ALMA','Hubble','James Webb','Paranal'], tier:'intermediate'}"
inventors_replace = "    {q:'¿Cómo se llama el gran observatorio ubicado en el norte?',a:'ALMA',o:['ALMA','Hubble','James Webb','Paranal'], tier:'intermediate'},\n    {q:'¿Qué virus ayudó a descubrir Pablo Valenzuela?',a:'Hepatitis C',o:['Hepatitis C','Gripe','Sarampión','Varicela'], tier:'advanced'},\n    {q:'¿Cuál será el telescopio más grande del mundo en construcción en Chile?',a:'ELT',o:['ELT','VLT','ALMA','Hubble'], tier:'expert'}"
content = content.replace(inventors_search, inventors_replace)

# Add to 'volcanes' (has 4, add 2):
volcanes_search = "    {q:'¿Cuál es el volcán más alto del mundo ubicado en Chile?',a:'Nevado Ojos del Salado',o:['Nevado Ojos del Salado','Villarrica','Osorno','Llaima'], tier:'expert'}"
volcanes_replace = "    {q:'¿Cuál es el volcán más alto del mundo ubicado en Chile?',a:'Nevado Ojos del Salado',o:['Nevado Ojos del Salado','Villarrica','Osorno','Llaima'], tier:'expert'},\n    {q:'¿Qué volcán es famoso por su forma de cono perfecto en el sur?',a:'Osorno',o:['Osorno','Llaima','Calbuco','Villarrica'], tier:'advanced'},\n    {q:'¿En qué cordillera están los volcanes de Chile?',a:'Los Andes',o:['Los Andes','La Costa','Domeyko','Nahuelbuta'], tier:'beginner'}"
content = content.replace(volcanes_search, volcanes_replace)

with open('js/descubre-chile.js', 'w') as f:
    f.write(content)
