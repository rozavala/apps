import json

with open('js/fe-explorador.js', 'r') as f:
    content = f.read()

# SAINTS array currently has 12 items (limit 15). Add 1.
new_saint = """    {
      id: 'pablo',
      name: 'San Pablo',
      dates: 'Siglo I',
      country: 'Tarso 📜',
      bio: 'Escribió muchas cartas que están en la Biblia. Viajó por todo el mundo conocido para enseñar sobre Jesús.',
      questions: [
        { q: '¿Qué escribió San Pablo en la Biblia?', a: ['Muchas cartas', 'Poemas', 'Canciones'], correct: 0 },
        { q: '¿Qué hizo para enseñar sobre Jesús?', a: ['Viajó por el mundo', 'Construyó barcos', 'Pintó cuadros'], correct: 0 },
        { q: '¿En qué siglo vivió?', a: ['Siglo X', 'Siglo I', 'Siglo V'], correct: 1 }
      ]
    },"""

# Insert new saint at the end of SAINTS array
saints_search = """      id: 'juan_dios',
      name: 'San Juan de Dios',
      dates: '1495–1550',
      country: 'España 🇪🇸',
      bio: 'Dedicó su vida a cuidar enfermos fundando hospitales. Es un ejemplo de caridad y entrega.',
      questions: [
        { q: '¿A qué se dedicó principalmente?', a: ['A cuidar enfermos', 'A la guerra', 'Al comercio'], correct: 0 },
        { q: '¿Qué tipo de institución fundó?', a: ['Escuelas', 'Hospitales', 'Bancos'], correct: 1 }
      ]
    }
  ];"""

saints_replace = """      id: 'juan_dios',
      name: 'San Juan de Dios',
      dates: '1495–1550',
      country: 'España 🇪🇸',
      bio: 'Dedicó su vida a cuidar enfermos fundando hospitales. Es un ejemplo de caridad y entrega.',
      questions: [
        { q: '¿A qué se dedicó principalmente?', a: ['A cuidar enfermos', 'A la guerra', 'Al comercio'], correct: 0 },
        { q: '¿Qué tipo de institución fundó?', a: ['Escuelas', 'Hospitales', 'Bancos'], correct: 1 },
        { q: '¿De qué país era San Juan de Dios?', a: ['Francia', 'España', 'Italia'], correct: 1 }
      ]
    },
""" + new_saint + "\n  ];"
content = content.replace(saints_search, saints_replace)

# Check for saints with < 3 questions.
# teresa_andes has 2
# jorge has 2
# alberto_hurtado has 2
# tomas_aquino has 2
# rosa_lima has 2
# martin_porres has 2
# ignacio_loyola has 2
# teresa_avila has 2

# teresa_andes
content = content.replace(
    "        { q: 'Fue la primera santa de...', a: ['Argentina', 'España', 'Chile'], correct: 2 }\n      ]",
    "        { q: 'Fue la primera santa de...', a: ['Argentina', 'España', 'Chile'], correct: 2 },\n        { q: '¿En qué ciudad vivió en un monasterio?', a: ['Roma', 'Los Andes', 'Valparaíso'], correct: 1 }\n      ]"
)

# jorge
content = content.replace(
    "        { q: 'Es el patrono de los...', a: ['Exploradores', 'Navegantes', 'Músicos'], correct: 0 }\n      ]",
    "        { q: 'Es el patrono de los...', a: ['Exploradores', 'Navegantes', 'Músicos'], correct: 0 },\n        { q: '¿Cómo se le representa generalmente?', a: ['Como un rey', 'Como un caballero valiente', 'Como un pastor'], correct: 1 }\n      ]"
)

# alberto_hurtado
content = content.replace(
    "        { q: '¿Cuál era su frase más famosa?', a: ['\"Hola amigos\"', '\"Contento, Señor, contento\"', '\"A estudiar mucho\"'], correct: 1 }\n      ]",
    "        { q: '¿Cuál era su frase más famosa?', a: ['\"Hola amigos\"', '\"Contento, Señor, contento\"', '\"A estudiar mucho\"'], correct: 1 },\n        { q: '¿A qué orden pertenecía el Padre Hurtado?', a: ['Franciscanos', 'Jesuitas', 'Dominicos'], correct: 1 }\n      ]"
)

# tomas_aquino
content = content.replace(
    "        { q: '¿Cómo es conocido también?', a: ['El Doctor Angélico', 'El Rey Sabio', 'El Gran Viajero'], correct: 0 }\n      ]",
    "        { q: '¿Cómo es conocido también?', a: ['El Doctor Angélico', 'El Rey Sabio', 'El Gran Viajero'], correct: 0 },\n        { q: '¿Qué le gustaba estudiar?', a: ['La fe y la razón', 'La navegación', 'La agricultura'], correct: 0 }\n      ]"
)

# rosa_lima
content = content.replace(
    "        { q: '¿En qué ciudad vivió?', a: ['Santiago', 'Lima', 'Bogotá'], correct: 1 }\n      ]",
    "        { q: '¿En qué ciudad vivió?', a: ['Santiago', 'Lima', 'Bogotá'], correct: 1 },\n        { q: '¿A quiénes dedicó su vida a ayudar?', a: ['A los enfermos y necesitados', 'A los reyes', 'A los comerciantes'], correct: 0 }\n      ]"
)

# martin_porres
content = content.replace(
    "        { q: '¿Qué animales se dice que alimentó juntos?', a: ['Leones y tigres', 'Perros, gatos y ratones', 'Elefantes y jirafas'], correct: 1 }\n      ]",
    "        { q: '¿Qué animales se dice que alimentó juntos?', a: ['Leones y tigres', 'Perros, gatos y ratones', 'Elefantes y jirafas'], correct: 1 },\n        { q: '¿Por qué virtud es muy conocido?', a: ['Su gran riqueza', 'Su humildad', 'Sus viajes'], correct: 1 }\n      ]"
)

# ignacio_loyola
content = content.replace(
    "        { q: '¿Qué era antes de dedicar su vida a Dios?', a: ['Marinero', 'Soldado', 'Panadero'], correct: 1 }\n      ]",
    "        { q: '¿Qué era antes de dedicar su vida a Dios?', a: ['Marinero', 'Soldado', 'Panadero'], correct: 1 },\n        { q: '¿De qué país era San Ignacio?', a: ['España', 'Francia', 'Italia'], correct: 0 }\n      ]"
)

# teresa_avila
content = content.replace(
    "        { q: '¿Qué fundó en España?', a: ['Muchos hospitales', 'Muchos conventos', 'Muchas escuelas'], correct: 1 }\n      ]",
    "        { q: '¿Qué fundó en España?', a: ['Muchos hospitales', 'Muchos conventos', 'Muchas escuelas'], correct: 1 },\n        { q: '¿Además de fundar conventos, por qué es famosa?', a: ['Por sus viajes en barco', 'Por ser una gran escritora', 'Por inventar la imprenta'], correct: 1 }\n      ]"
)

# HERITAGE array: currently 6 items (limit 8). Add 1.
new_heritage = """    {
      id: 'maipu',
      title: 'Templo Votivo de Maipú',
      info: 'Construido en Santiago para cumplir la promesa hecha a la Virgen del Carmen tras ganar la independencia de Chile.',
      q: '¿A quién se le hizo la promesa de construir este templo?', a: ['A San José', 'A la Virgen del Carmen', 'A San Miguel'], correct: 1
    }"""

heritage_search = """      q: '¿Dónde se celebra la Fiesta de Andacollo?', a: ['En el norte chico', 'En Punta Arenas', 'En Santiago'], correct: 0
    }
  ];"""

heritage_replace = """      q: '¿Dónde se celebra la Fiesta de Andacollo?', a: ['En el norte chico', 'En Punta Arenas', 'En Santiago'], correct: 0
    },
""" + new_heritage + "\n  ];"
content = content.replace(heritage_search, heritage_replace)

with open('js/fe-explorador.js', 'w') as f:
    f.write(content)
