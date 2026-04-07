import re

with open('js/story-explorer.js', 'r') as f:
    content = f.read()

# STORIES array. Limit is 12 per language (currently 4 stories total). Add 1 new story.
# Some stories have vocab. Limit: target 8, fill any below 5.
# Let's count vocab.
# condor_flight: page 1 (2), page 2 (1), page 3 (2), page 4 (2). Total: 7.
# huaso_horse: page 1 (1), page 2 (4). Total: 5.
# volcano_legend: page 1 (3), page 2 (2). Total: 5.
# pudu_journey: page 1 (3), page 2 (2). Total: 5.
# Let's add a few vocab words just to be safe. But wait, none are strictly below 5.

new_story = """    {
      id: 'glacier_explorer',
      title: 'The Great Glacier Explorer',
      titleEs: 'El Gran Explorador de Glaciares',
      tier: 'pilot', ageMin: 8, region: 'patagonia', icon: '🧊',
      pages: [
        {
          en: 'Far in the south of Patagonia, a brave explorer named Tomas set out to study the ancient glaciers.',
          es: 'Muy al sur en la Patagonia, un valiente explorador llamado Tomás se dispuso a estudiar los antiguos glaciares.',
          vocab: [
            { word: 'explorer', wordEs: 'explorador', def: 'A person who travels to unknown places.', defEs: 'Una persona que viaja a lugares desconocidos.' },
            { word: 'ancient', wordEs: 'antiguos', def: 'Very old; from a long time ago.', defEs: 'Muy viejos; de hace mucho tiempo.' },
            { word: 'glaciers', wordEs: 'glaciares', def: 'Huge masses of ice that move slowly.', defEs: 'Enormes masas de hielo que se mueven lentamente.' }
          ]
        },
        {
          en: 'The wind was freezing, and the ice sparkled like diamonds in the sun.',
          es: 'El viento era helado, y el hielo brillaba como diamantes al sol.',
          vocab: [
            { word: 'freezing', wordEs: 'helado', def: 'Very cold.', defEs: 'Muy frío.' },
            { word: 'sparkled', wordEs: 'brillaba', def: 'Shone brightly with flashes of light.', defEs: 'Brilló intensamente con destellos de luz.' },
            { word: 'diamonds', wordEs: 'diamantes', def: 'Precious, sparkling stones.', defEs: 'Piedras preciosas y brillantes.' }
          ]
        }
      ],
      quiz: [
        { q: 'What was Tomas studying?', qEs: '¿Qué estaba estudiando Tomás?', options: ['Forests', 'Glaciers', 'Deserts', 'Oceans'], optionsEs: ['Bosques', 'Glaciares', 'Desiertos', 'Océanos'], answer: 1 },
        { q: 'How did the ice look in the sun?', qEs: '¿Cómo se veía el hielo al sol?', options: ['Like rocks', 'Like diamonds', 'Like glass', 'Like water'], optionsEs: ['Como rocas', 'Como diamantes', 'Como cristal', 'Como agua'], answer: 1 }
      ]
    }"""

story_search = """    {
      id: 'pudu_journey',
      title: 'The Little Pudu\\'s Journey',
      titleEs: 'El Viaje del Pequeño Pudú',
      tier: 'explorer', ageMin: 6, region: 'south', icon: '🦌',
      pages: [
        {
          en: 'In the deep southern forests of Chile, a tiny deer named Pablito opened his eyes early.',
          es: 'En los profundos bosques del sur de Chile, un diminuto ciervo llamado Pablito abrió los ojos temprano.',
          vocab: [
            { word: 'deer', wordEs: 'ciervo', def: 'A hoofed animal with antlers.', defEs: 'Un animal con pezuñas y cuernos.' },
            { word: 'forests', wordEs: 'bosques', def: 'Large areas covered with trees.', defEs: 'Grandes áreas cubiertas de árboles.' },
            { word: 'tiny', wordEs: 'diminuto', def: 'Very small.', defEs: 'Muy pequeño.' }
          ]
        },
        {
          en: 'He was a pudu, the smallest deer in the world, and he was looking for sweet leaves.',
          es: 'Era un pudú, el ciervo más pequeño del mundo, y buscaba hojas dulces.',
          vocab: [
            { word: 'smallest', wordEs: 'más pequeño', def: 'The least big.', defEs: 'El menos grande.' },
            { word: 'leaves', wordEs: 'hojas', def: 'The green parts of a tree or plant.', defEs: 'Las partes verdes de un árbol o planta.' }
          ]
        }
      ],
      quiz: [
        { q: 'What animal is Pablito?', qEs: '¿Qué animal es Pablito?', options: ['A horse', 'A dog', 'A deer', 'A bear'], optionsEs: ['Un caballo', 'Un perro', 'Un ciervo', 'Un oso'], answer: 2 },
        { q: 'What was Pablito looking for?', qEs: '¿Qué buscaba Pablito?', options: ['Water', 'Sweet leaves', 'His mother', 'A cave'], optionsEs: ['Agua', 'Hojas dulces', 'A su madre', 'Una cueva'], answer: 1 }
      ]
    }"""

story_replace = story_search + ",\n" + new_story

content = content.replace(story_search, story_replace)

with open('js/story-explorer.js', 'w') as f:
    f.write(content)
