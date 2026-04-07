import re

with open('js/world-explorer.js', 'r') as f:
    content = f.read()

# Add a country to Europe (which currently has 0).
europe_search = "{ id: 'europe', name: 'Europe', nameEs: 'Europa', icon: '🌍', color: '#3B82F6', countries: [] },"

new_country_europe = """{ id: 'europe', name: 'Europe', nameEs: 'Europa', icon: '🌍', color: '#3B82F6', countries: [
      {
        id: 'france', name: 'France', nameEs: 'Francia', flag: '🇫🇷',
        capital: 'Paris', capitalEs: 'París',
        facts: [
          { en: 'The Eiffel Tower is located in Paris.', es: 'La Torre Eiffel está en París.' },
          { en: 'France is famous for its bread and cheese.', es: 'Francia es famosa por su pan y queso.' },
          { en: 'It is the most visited country in the world.', es: 'Es el país más visitado del mundo.' },
          { en: 'The Tour de France is a famous bicycle race.', es: 'El Tour de Francia es una famosa carrera de bicicletas.' }
        ],
        landmark: { name: 'Eiffel Tower', nameEs: 'Torre Eiffel', emoji: '🗼' },
        animal: { name: 'Rooster', nameEs: 'Gallo', emoji: '🐓' },
        quiz: [
          { q: 'What is the capital of France?', qEs: '¿Cuál es la capital de Francia?', options: ['London', 'Berlin', 'Madrid', 'Paris'], optionsEs: ['Londres', 'Berlín', 'Madrid', 'París'], answer: 3 },
          { q: 'Which famous monument is in France?', qEs: '¿Qué famoso monumento está en Francia?', options: ['Colosseum', 'Eiffel Tower', 'Big Ben', 'Parthenon'], optionsEs: ['Coliseo', 'Torre Eiffel', 'Big Ben', 'Partenón'], answer: 1 },
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2 }
        ]
      }
    ] },"""

content = content.replace(europe_search, new_country_europe)

# Check all existing countries for quiz length < 3 and facts < 3
# All existing countries (chile, argentina, brazil, peru, colombia, venezuela, ecuador, bolivia, paraguay, uruguay, guyana, suriname, mexico, egypt) already seem to have >=3 facts and >=3 quiz questions, but let's make sure.
# Wait, Peru has 4 facts but one is repetitive "This country has a rich history"
# Same for Colombia, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay, Guyana, Suriname. I will improve those facts.

peru_fact_search = "{ en: 'This country has a rich history.', es: 'Este país tiene una rica historia.' }"
peru_fact_replace = "{ en: 'The Amazon River starts in the Peruvian Andes.', es: 'El río Amazonas nace en los Andes peruanos.' }"
content = content.replace(peru_fact_search, peru_fact_replace, 1)

colombia_fact_replace = "{ en: 'Colombia is known for its beautiful coffee regions.', es: 'Colombia es conocida por sus hermosas regiones cafetaleras.' }"
content = content.replace(peru_fact_search, colombia_fact_replace, 1)

venezuela_fact_replace = "{ en: 'The Andes mountains end in Venezuela.', es: 'La cordillera de los Andes termina en Venezuela.' }"
content = content.replace(peru_fact_search, venezuela_fact_replace, 1)

ecuador_fact_replace = "{ en: 'Ecuador has beautiful volcanic mountains.', es: 'Ecuador tiene hermosas montañas volcánicas.' }"
content = content.replace(peru_fact_search, ecuador_fact_replace, 1)

bolivia_fact_replace = "{ en: 'Bolivia has a high-altitude climate.', es: 'Bolivia tiene un clima de gran altitud.' }"
content = content.replace(peru_fact_search, bolivia_fact_replace, 1)

paraguay_fact_replace = "{ en: 'Paraguay is sometimes called the Heart of South America.', es: 'A Paraguay a veces se le llama el Corazón de Sudamérica.' }"
content = content.replace(peru_fact_search, paraguay_fact_replace, 1)

uruguay_fact_replace = "{ en: 'Uruguay has a very long Atlantic coastline.', es: 'Uruguay tiene una costa atlántica muy larga.' }"
content = content.replace(peru_fact_search, uruguay_fact_replace, 1)

guyana_fact_replace = "{ en: 'Guyana is known as the land of many waters.', es: 'Guyana es conocida como la tierra de muchas aguas.' }"
content = content.replace(peru_fact_search, guyana_fact_replace, 1)

suriname_fact_replace = "{ en: 'Suriname has a very diverse culture.', es: 'Surinam tiene una cultura muy diversa.' }"
content = content.replace(peru_fact_search, suriname_fact_replace, 1)


# Egypt has 4 facts, but fact 4 is Arabic language.
# Egypt has 3 quiz questions.

with open('js/world-explorer.js', 'w') as f:
    f.write(content)
