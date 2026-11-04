/* ================================================================
   ART STUDIO — app: Draw, Learn, Gallery (Copy the Master lives in
   js/copy-the-master.js and uses the same studio kit).

   Saved data (zs_art_<name>) — every original field is kept:
     gallery           [{ id, title, dataUrl (JPEG), date }]  newest first
     totalStars        only ever raised by checkStarMilestones()
     lessonsCompleted  [lesson ids]
   Added (optional, older saves simply lack them):
     mixedColors       [hex]  up to 6 colours mixed on the palette
     lessonBest        { lessonId: best % on the guides }
     mastersCopied     [composition ids saved from Copy the Master]

   LESSONS feeds Parents Corner's progress catalog
   (tools/build-progress-catalog.js reads id, title, icon, tier), so
   it stays a plain data literal; ids and order are fixed and new
   lessons go at the end.
   ================================================================ */

const ArtStudio = (() => {

  // ── Paints ────────────────────────────────────────────────────
  const PIGMENTS = [
    { hex: '#F7F4EC', name: 'Titanium white' },
    { hex: '#F3D426', name: 'Lemon yellow' },
    { hex: '#EE8A1E', name: 'Cadmium orange' },
    { hex: '#D9352A', name: 'Vermilion red' },
    { hex: '#A3173A', name: 'Crimson' },
    { hex: '#E77FA8', name: 'Rose pink' },
    { hex: '#6B3FA0', name: 'Violet' },
    { hex: '#2B3FA8', name: 'Ultramarine blue' },
    { hex: '#2E8BCB', name: 'Cerulean blue' },
    { hex: '#3E7B37', name: 'Sap green' },
    { hex: '#8BC34A', name: 'Leaf green' },
    { hex: '#C9922E', name: 'Yellow ochre' },
    { hex: '#8A4A22', name: 'Burnt sienna' },
    { hex: '#4A4744', name: 'Graphite grey' },
    { hex: '#1E1C1A', name: 'Ivory black' }
  ];

  const TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];
  const TIER_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

  // Guides are SVG path data in a 0..100 square centred on the paper.
  // step.tool: pencil | crayon | chalk | marker | watercolour | oil |
  //            dots | fill | line;  step.check: 'line' (default when
  //            there is a guide) | 'area' | 'fill' | 'none'
  const LESSONS = [
    {
      id: 'shapes',
      title: 'Shapes & Patterns',
      description: 'Learn to draw basic shapes like circles and squares.',
      icon: '⭕',
      tier: 'beginner',
      note: 'Artists often begin a picture with simple shapes. A circle, a square and a triangle can become a sun, a window or a roof. Repeating a mark again and again makes a pattern.',
      steps: [
        { text: 'Draw a big circle. Go slowly round the dotted line.', guide: 'M20 50 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0', tool: 'crayon', color: '#D9352A', level: 3 },
        { text: 'Now draw a square inside the circle.', guide: 'M35 35 H65 V65 H35 Z', tool: 'crayon', color: '#2B3FA8', level: 3 },
        { text: 'Make a pattern: put a dot on every little circle.', type: 'dots', tool: 'dots', color: '#F3D426', level: 4,
          guide: 'M88 50a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M82.6 70a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M68 84.6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M48 90a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M28 84.6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M13.4 70a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M8 50a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M13.4 30a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M28 15.4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M48 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M68 15.4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M82.6 30a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' }
      ]
    },
    {
      id: 'mixing',
      title: 'Color Mixing',
      description: 'Discover what happens when you mix colors together!',
      icon: '🎨',
      tier: 'beginner',
      note: 'Painters mix a few colours to make many more. The traditional painters’ primary colours are red, yellow and blue. Mixing two primaries gives a secondary colour: red and yellow make orange, yellow and blue make green, blue and red make purple. Adding white makes a lighter tint; adding black makes a darker shade.',
      steps: [] // a mixing-palette challenge instead of drawing steps
    },
    {
      id: 'house',
      title: 'Draw a House',
      description: 'Build a house using rectangles and triangles.',
      icon: '🏠',
      tier: 'beginner',
      note: 'A house is mostly rectangles and a triangle. Drawing the big shapes first and the small details last is how many artists plan a picture.',
      steps: [
        { text: 'Draw a big rectangle for the walls.', guide: 'M25 50 H75 V88 H25 Z', tool: 'crayon', color: '#D9352A', level: 3 },
        { text: 'Add a triangle on top for the roof.', guide: 'M20 50 L50 22 L80 50 Z', tool: 'crayon', color: '#8A4A22', level: 3 },
        { text: 'Draw a door in the middle.', guide: 'M43 64 H57 V88 H43 Z', tool: 'crayon', color: '#2B3FA8', level: 2 },
        { text: 'Add two square windows.', guide: 'M30 57 H40 V67 H30 Z M60 57 H70 V67 H60 Z', tool: 'crayon', color: '#C9922E', level: 2 },
        { text: 'Pour paint into the shapes with the paint pot. Tap inside a shape!', tool: 'fill', color: '#F3D426', check: 'none' }
      ]
    },
    {
      id: 'tree',
      title: 'Draw a Tree',
      description: 'Use shapes to create a beautiful tree.',
      icon: '🌳',
      tier: 'intermediate',
      note: 'Watercolour is pigment mixed with water and gum arabic. Because the paint is see-through, watercolour painters work from light to dark and let the white paper shine through for the brightest parts.',
      steps: [
        { text: 'Paint the trunk with oil paint, from the ground up.', guide: 'M45 92 L46.5 58 L53.5 58 L55 92 Z', check: 'area', tool: 'oil', color: '#8A4A22', level: 3 },
        { text: 'Wash in a cloud-shaped crown with green watercolour. Pause to let the paint pool.', guide: 'M28 56 A12 12 0 0 1 26 34 A16 16 0 0 1 50 18 A16 16 0 0 1 74 34 A12 12 0 0 1 72 56 Z', check: 'area', tool: 'watercolour', color: '#3E7B37', level: 4 },
        { text: 'Add apples with a red crayon.', guide: 'M37 38a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M55 30a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M59 46a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M41 50a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', check: 'area', tool: 'crayon', color: '#D9352A', level: 2 },
        { text: 'Draw the grass along the ground.', guide: 'M8 92 C30 90 70 94 92 92', tool: 'chalk', color: '#8BC34A', level: 2 }
      ]
    },
    {
      id: 'symmetry',
      title: 'Symmetry',
      description: 'Draw on one side and watch it appear on the other!',
      icon: '🦋',
      tier: 'intermediate',
      note: 'Something is symmetrical when one half is a mirror image of the other. A butterfly’s wings, many leaves and the fronts of many buildings are symmetrical.',
      steps: [
        { text: 'Draw the left wing along the dotted line. The mirror draws the right wing!', type: 'symmetry', guide: 'M50 30 C38 10 12 12 14 36 C16 50 34 50 50 50 C34 52 18 60 22 76 C26 90 44 80 50 62', tool: 'marker', color: '#6B3FA0', level: 2 },
        { text: 'Add spots on the left wing and watch them appear on the right.', type: 'symmetry', tool: 'dots', color: '#F3D426', level: 3, check: 'none' },
        { text: 'Colour the wings with watercolour.', type: 'symmetry', tool: 'watercolour', color: '#2E8BCB', level: 3, check: 'none' }
      ]
    },
    {
      id: 'styles',
      title: 'Art Styles',
      description: 'Try Pointillism like Seurat or a Mondrian grid.',
      icon: '🖼️',
      tier: 'advanced',
      note: 'Artists invent styles. Georges Seurat painted with dots of pure colour, Piet Mondrian with straight black lines and primary colours, and early computer artists with square pixels.',
      steps: [
        { text: 'Pointillism: make the sun only from dots of yellow and orange.', type: 'dots', guide: 'M30 42 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', check: 'area', tool: 'dots', color: '#F3D426', level: 2 },
        { text: 'Mondrian: draw straight black lines. They snap level or upright.', type: 'grid', guide: 'M8 8 H92 V92 H8 Z M36 8 V92 M8 66 H92 M70 66 V92', tool: 'line', media: 'oil', color: '#1E1C1A', level: 3 },
        { text: 'Pixel art: colour squares on the grid to make a heart or a face.', type: 'pixelgrid', tool: 'pixel', color: '#D9352A', check: 'none' }
      ]
    },
    {
      id: 'warm_cool',
      title: 'Warm & Cool Colors',
      description: 'Reds, oranges and yellows feel warm; blues, greens and purples feel cool.',
      icon: '🔥',
      tier: 'beginner',
      note: 'Red, orange and yellow are called warm colours — the colours of fire and sunshine. Blue, green and violet are called cool colours — the colours of water, ice and shade. In a picture, warm colours seem to come forward and cool colours seem to sit back.',
      steps: [
        { text: 'Paint a warm sun with orange watercolour.', guide: 'M34 32 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', check: 'area', tool: 'watercolour', color: '#EE8A1E', level: 4 },
        { text: 'Paint a cool pond with blue.', guide: 'M20 76 a30 12 0 1 0 60 0 a30 12 0 1 0 -60 0', check: 'area', tool: 'watercolour', color: '#2E8BCB', level: 4 },
        { text: 'Fill the sky with warm colours and the grass with cool ones.', tool: 'crayon', color: '#F3D426', level: 4, check: 'none' }
      ]
    },
    {
      id: 'pattern_pointillism',
      title: 'Pattern Pointillism',
      description: 'Seurat made whole pictures from tiny dots. Tap dots to build a shape!',
      icon: '🟣',
      tier: 'intermediate',
      note: 'Georges Seurat (1859–1891) was a French painter. He placed small separate dots of pure colour side by side, a method later called pointillism. From a distance the eye blends the dots. His best-known painting, A Sunday on La Grande Jatte (1884–1886), is about three metres wide.',
      steps: [
        { text: 'Dot the petals with red. No lines — only dots!', type: 'dots', guide: 'M42 27a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M54.4 36a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M49.6 50.5a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M34.4 50.5a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M29.6 36a8 8 0 1 0 16 0a8 8 0 1 0 -16 0', check: 'area', tool: 'dots', color: '#D9352A', level: 2 },
        { text: 'Dot the middle with yellow.', type: 'dots', guide: 'M44 40a6 6 0 1 0 12 0a6 6 0 1 0 -12 0', check: 'area', tool: 'dots', color: '#F3D426', level: 2 },
        { text: 'Dot the stem and leaves with two greens side by side.', type: 'dots', guide: 'M50 58 C50 70 49 80 50 94 M50 76 C40 68 30 70 26 76 C34 82 44 82 50 76 Z M50 68 C60 60 70 62 74 68 C66 74 56 74 50 68 Z', tool: 'dots', color: '#3E7B37', level: 2 },
        { text: 'Dot the background with blue and violet, close together. Then look at the small picture: your eye mixes the dots.', type: 'dots', tool: 'dots', color: '#2E8BCB', level: 2, check: 'none', preview: true }
      ]
    },
    {
      id: 'robot_shapes',
      title: 'Build a Robot from Shapes',
      description: 'Engineers and artists both build big things from simple shapes.',
      icon: '🤖',
      tier: 'advanced',
      note: 'Designers sketch machines from boxes, circles and lines before adding detail. Building a complicated object out of simple forms is called construction drawing.',
      steps: [
        { text: 'Draw a square head with the set square.', guide: 'M38 14 H62 V36 H38 Z', tool: 'line', media: 'marker', color: '#2B3FA8', level: 2, shape: 'rect' },
        { text: 'Draw a big rectangle for the body.', guide: 'M30 38 H70 V72 H30 Z', tool: 'line', media: 'marker', color: '#2B3FA8', level: 2, shape: 'rect' },
        { text: 'Add two round eyes.', guide: 'M41.5 24a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M51.5 24a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0', tool: 'marker', color: '#1E1C1A', level: 2 },
        { text: 'Add an antenna, arms and legs.', guide: 'M50 14 V6 M30 44 L18 60 M70 44 L82 60 M40 72 V92 M60 72 V92', tool: 'line', media: 'marker', color: '#1E1C1A', level: 2 },
        { text: 'Colour your robot in metal greys and one bright colour.', tool: 'fill', color: '#9AA3AD', check: 'none' }
      ]
    },
    {
      id: 'still_life',
      title: 'Still Life',
      description: 'Arrange an apple and a vase on a table using circles, a rectangle, and a line.',
      icon: '🍎',
      tier: 'intermediate',
      note: 'A still life is a picture of objects that do not move, such as fruit, flowers and jugs. Dutch painters of the 1600s made many famous still lifes, and Paul Cézanne (1839–1906) painted many still lifes with apples.',
      steps: [
        { text: 'Paint the table top with oil paint.', guide: 'M6 66 H94 V76 H6 Z', check: 'area', tool: 'oil', color: '#8A4A22', level: 3 },
        { text: 'Draw the apple.', guide: 'M37 44 C33 40 24 40 22 48 C20 58 28 66 36 64 C38 63.6 40 63.6 42 64 C50 66 56 56 53 48 C51 41 42 40 37 44 Z', tool: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Draw the vase beside it.', guide: 'M64 66 C57 64 56 52 61 46 C63 42 63 36 61 32 H75 C73 36 73 42 75 46 C80 52 79 64 72 66 Z', tool: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Add the stem and a leaf.', guide: 'M37 44 C37 39 38 36 40 33 M40 36 C44 32 48 33 49 35 C46 38 42 38 40 36 Z', tool: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Paint the apple red and the vase blue. The light comes from the left, so make the right sides darker.', tool: 'watercolour', color: '#D9352A', level: 3, check: 'none' }
      ]
    },
    // ── Added in the 2026 upgrade (append only) ──────────────────
    {
      id: 'cat_shapes',
      title: 'Draw a Cat from Shapes',
      description: 'A circle, an oval and some triangles become a cat.',
      icon: '🐱',
      tier: 'beginner',
      note: 'Most animals can be drawn from a few simple shapes: a circle for the head, an oval for the body and triangles for the ears. Artists sketch these shapes lightly first and then draw the outline over them.',
      steps: [
        { text: 'Draw a circle for the head.', guide: 'M34 40 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', tool: 'pencil', color: '#4A4744', level: 3 },
        { text: 'Add two pointy triangle ears.', guide: 'M37 32 L36 15 L47 26 M53 26 L64 15 L63 32', tool: 'pencil', color: '#4A4744', level: 3 },
        { text: 'Draw a big oval for the body.', guide: 'M30 74 a20 17 0 1 0 40 0 a20 17 0 1 0 -40 0', tool: 'pencil', color: '#4A4744', level: 3 },
        { text: 'Give it a long curly tail.', guide: 'M69 80 C86 80 92 64 84 54 C80 50 76 52 77 56', tool: 'pencil', color: '#4A4744', level: 3 },
        { text: 'Draw the face: eyes, nose and whiskers.', guide: 'M41.5 38a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M53.5 38a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M48 44 H52 L50 46.5 Z M42 46 L28 44 M42 48 L28 51 M58 46 L72 44 M58 48 L72 51', tool: 'pencil', color: '#1E1C1A', level: 2 },
        { text: 'Colour your cat with crayons.', tool: 'crayon', color: '#EE8A1E', level: 4, check: 'none' }
      ]
    },
    {
      id: 'colour_wheel',
      title: 'Paint a Colour Wheel',
      description: 'Primary and secondary colours in a circle.',
      icon: '🌈',
      tier: 'beginner',
      note: 'Isaac Newton arranged the colours of light in a circle in his book Opticks (1704). Painters use a colour wheel with the primaries red, yellow and blue, and the secondaries orange, green and violet between them. Colours opposite each other on the wheel, like red and green, are called complementary colours.',
      steps: [
        { text: 'Paint the top part RED.', guide: 'M43 37.9 L31 17.1 A38 38 0 0 1 69 17.1 L57 37.9 A14 14 0 0 0 43 37.9 Z', check: 'area', tool: 'watercolour', color: '#D9352A', level: 3 },
        { text: 'Skip one space. Paint YELLOW.', guide: 'M64 50 L88 50 A38 38 0 0 1 69 82.9 L57 62.1 A14 14 0 0 0 64 50 Z', check: 'area', tool: 'watercolour', color: '#F3D426', level: 3 },
        { text: 'Skip one more. Paint BLUE.', guide: 'M43 62.1 L31 82.9 A38 38 0 0 1 12 50 L36 50 A14 14 0 0 0 43 62.1 Z', check: 'area', tool: 'watercolour', color: '#2B3FA8', level: 3 },
        { text: 'Between red and yellow goes ORANGE. Mix it on the palette, or pick orange.', guide: 'M57 37.9 L69 17.1 A38 38 0 0 1 88 50 L64 50 A14 14 0 0 0 57 37.9 Z', check: 'area', tool: 'watercolour', color: '#EE8A1E', level: 3 },
        { text: 'Between yellow and blue goes GREEN.', guide: 'M57 62.1 L69 82.9 A38 38 0 0 1 31 82.9 L43 62.1 A14 14 0 0 0 57 62.1 Z', check: 'area', tool: 'watercolour', color: '#3E7B37', level: 3 },
        { text: 'Between blue and red goes VIOLET.', guide: 'M36 50 L12 50 A38 38 0 0 1 31 17.1 L43 37.9 A14 14 0 0 0 36 50 Z', check: 'area', tool: 'watercolour', color: '#6B3FA0', level: 3 }
      ]
    },
    {
      id: 'perspective_road',
      title: 'A Road in Perspective',
      description: 'Make a flat page look deep with a vanishing point.',
      icon: '🛣️',
      tier: 'intermediate',
      note: 'In linear perspective, lines that are parallel in real life — like the two edges of a road — seem to meet at a vanishing point on the horizon. Filippo Brunelleschi demonstrated this in Florence in the early 1400s, and Leon Battista Alberti explained it in his book On Painting (1435).',
      steps: [
        { text: 'Draw the horizon: one straight line across. Use the set square.', guide: 'M4 45 H96', tool: 'line', media: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Make a dot in the middle of the horizon: the vanishing point.', guide: 'M48.5 45a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0', check: 'area', tool: 'pencil', color: '#1E1C1A', level: 3 },
        { text: 'Draw the two road edges from the bottom corners to the dot.', guide: 'M10 98 L50 45 M90 98 L50 45', tool: 'line', media: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Paint the centre stripes. Each one is shorter as it goes further away.', guide: 'M50 95 V84 M50 76 V68.5 M50 63 V57.5 M50 54 V50.5', tool: 'marker', color: '#F3D426', level: 2 },
        { text: 'Draw poles beside the road: tall near you, tiny far away.', guide: 'M84 92 V50 M74 79 V50.5 M66 68 V48 M60 59 V46.5 M56 53 V46', tool: 'line', media: 'pencil', color: '#4A4744', level: 2 },
        { text: 'Paint the sky and the fields with watercolour.', tool: 'watercolour', color: '#2E8BCB', level: 5, check: 'none' }
      ]
    },
    {
      id: 'shading_sphere',
      title: 'Shading a Sphere',
      description: 'Light and shadow turn a circle into a ball.',
      icon: '⚪',
      tier: 'intermediate',
      note: 'Shading makes a flat circle look round. Artists name the parts: the highlight, the light side, the core shadow, the reflected light near the edge, and the cast shadow on the table. Strong contrast of light and dark is called chiaroscuro, Italian for “light-dark”.',
      steps: [
        { text: 'Draw the circle and the edge of the table.', guide: 'M24 46 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 M4 78 H96', tool: 'pencil', color: '#4A4744', level: 2 },
        { text: 'The light comes from the top left. Shade the whole ball lightly, but leave the highlight white.', guide: 'M34 36 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', check: 'none', tool: 'pencil', color: '#4A4744', level: 4 },
        { text: 'Press harder for the core shadow on the side away from the light.', guide: 'M66 28 C80 44 74 66 54 72 C66 62 70 46 66 28 Z', check: 'area', tool: 'pencil', color: '#2a2826', level: 4 },
        { text: 'Add the cast shadow on the table, away from the light.', guide: 'M50 78 C58 72 86 72 92 78 C86 84 60 84 50 78 Z', check: 'area', tool: 'pencil', color: '#2a2826', level: 5 }
      ]
    },
    {
      id: 'mondrian_grid',
      title: 'Mondrian Grid',
      description: 'Straight black lines and the three primary colours.',
      icon: '🟥',
      tier: 'intermediate',
      note: 'Piet Mondrian (1872–1944) was a Dutch painter and a member of De Stijl (“The Style”), a group of artists founded in the Netherlands in 1917. In paintings such as Composition with Red, Blue and Yellow (1930) he used only straight black lines, white, grey and the three primary colours.',
      steps: [
        { text: 'Draw the thick black lines. They snap perfectly level or upright.', type: 'grid', guide: 'M8 8 H92 V92 H8 Z M30 8 V92 M8 62 H92 M8 30 H30 M78 62 V92 M78 82 H92', tool: 'line', media: 'oil', color: '#1E1C1A', level: 3 },
        { text: 'Pour red into the big square.', type: 'grid', guide: 'M31 9 H91 V61 H31 Z', check: 'fill', tool: 'fill', color: '#C8202A' },
        { text: 'Pour blue into the bottom-left box.', type: 'grid', guide: 'M9 63 H29 V91 H9 Z', check: 'fill', tool: 'fill', color: '#1F3F9A' },
        { text: 'Pour yellow into the little box at the bottom right.', type: 'grid', guide: 'M79 83 H91 V91 H79 Z', check: 'fill', tool: 'fill', color: '#F2CC1D' }
      ]
    },
    {
      id: 'portrait',
      title: 'Portrait Proportions',
      description: 'Where the eyes, nose and mouth go on a face.',
      icon: '🙂',
      tier: 'advanced',
      note: 'Drawing teachers use simple guidelines for a face seen from the front: the eyes sit about halfway down the head, the face is about five eyes wide, the bottom of the nose is about halfway between the eyes and the chin, and the ears line up between the eyes and the nose. Real faces vary. Leonardo da Vinci (1452–1519) filled notebooks with studies of human proportions.',
      steps: [
        { text: 'Draw an egg shape for the head, wider at the top.', guide: 'M50 14 C70 14 76 34 74 52 C72 72 62 88 50 88 C38 88 28 72 26 52 C24 34 30 14 50 14 Z', tool: 'pencil', color: '#6a6660', level: 2 },
        { text: 'Draw light guide lines: one down the middle, one across halfway — the eye line.', guide: 'M50 14 V88 M26 51 H74', tool: 'line', media: 'pencil', color: '#9a958e', level: 1 },
        { text: 'The face is five eyes wide. Draw the two eyes on the eye line, one eye apart.', guide: 'M35.6 51 Q40.4 47 45.2 51 Q40.4 54 35.6 51 Z M54.8 51 Q59.6 47 64.4 51 Q59.6 54 54.8 51 Z', tool: 'pencil', color: '#3a3632', level: 2 },
        { text: 'The bottom of the nose is halfway between the eyes and the chin.', guide: 'M50 55 L46.5 69 Q50 71.5 53.5 69', tool: 'pencil', color: '#3a3632', level: 2 },
        { text: 'The mouth is a third of the way from the nose to the chin. The ears go between the eye line and the nose.', guide: 'M42 76 Q50 79 58 76 M26 51 C20 52 21 68 27 69 M74 51 C80 52 79 68 73 69', tool: 'pencil', color: '#3a3632', level: 2 },
        { text: 'Add hair and colour. Rub out the guide lines if you like.', tool: 'crayon', color: '#8A4A22', level: 3, check: 'none' }
      ]
    },
    {
      id: 'hatching',
      title: 'Hatching & Texture',
      description: 'Shade with lines, crossed lines and dots.',
      icon: '✏️',
      tier: 'intermediate',
      note: 'Hatching means shading with many parallel lines; drawing a second set across them is cross-hatching, and shading with dots is stippling. The closer the marks, the darker the area looks. Albrecht Dürer (1471–1528) used hatching to show light and shadow in his engravings and woodcuts.',
      steps: [
        { text: 'Hatching: fill the first box with lines close together, all going the same way.', guide: 'M8 18 H32 V44 H8 Z', check: 'area', tool: 'pencil', color: '#3a3632', level: 2 },
        { text: 'Cross-hatching: in the middle box, draw lines one way, then across them.', guide: 'M38 18 H62 V44 H38 Z', check: 'area', tool: 'pencil', color: '#3a3632', level: 2 },
        { text: 'Stippling: fill the last box with dots.', guide: 'M68 18 H92 V44 H68 Z', check: 'area', tool: 'dots', color: '#3a3632', level: 1 },
        { text: 'A value scale: shade the five boxes from very light to very dark.', guide: 'M8 58 H92 V80 H8 Z M24.8 58 V80 M41.6 58 V80 M58.4 58 V80 M75.2 58 V80', check: 'area', tool: 'pencil', color: '#3a3632', level: 3 }
      ]
    }
  ];

  const MIX_PAINTS = {
    red:    { hex: '#C81E4A', name: 'red' },
    yellow: { hex: '#F3D426', name: 'yellow' },
    blue:   { hex: '#2A4BB8', name: 'blue' },
    white:  { hex: '#F7F4EC', name: 'white' },
    black:  { hex: '#1E1C1A', name: 'black' }
  };
  const MIX_TARGETS = [
    { name: 'Orange', a: 'red', b: 'yellow', t: 0.5, tier: 0 },
    { name: 'Green', a: 'yellow', b: 'blue', t: 0.5, tier: 0 },
    { name: 'Purple', a: 'red', b: 'blue', t: 0.5, tier: 0 },
    { name: 'Pink — a tint', a: 'red', b: 'white', t: 0.5, tier: 1 },
    { name: 'Sky blue — a tint', a: 'blue', b: 'white', t: 0.6, tier: 1 },
    { name: 'Navy — a shade', a: 'blue', b: 'black', t: 0.3, tier: 2 },
    { name: 'Yellow-orange', a: 'yellow', b: 'red', t: 0.25, tier: 2 }
  ];

  const TOOL_INFO = {
    pencil:      { name: 'Pencil',      tip: 'Pencil: press lightly for pale, grainy lines and harder for dark ones.' },
    crayon:      { name: 'Crayon',      tip: 'Wax crayon: the wax catches the bumps of the paper. Press harder to fill the grain.' },
    chalk:       { name: 'Chalk',       tip: 'Chalk: soft, dusty and bright — good for skies and light colours.' },
    marker:      { name: 'Marker',      tip: 'Marker: smooth see-through ink. Where strokes cross, the colour gets darker.' },
    watercolour: { name: 'Watercolour', short: 'Water', tip: 'Watercolour: see-through washes with soft edges. Pause and the paint pools.' },
    oil:         { name: 'Oil paint',   short: 'Oil', tip: 'Oil paint: thick bristle strokes that pick up wet colour and run dry at the end.' },
    dots:        { name: 'Dot brush',   short: 'Dots', tip: 'Dot brush: dab dots of pure colour, like Seurat.' },
    eraser:      { name: 'Eraser',      tip: 'Eraser: rub out mistakes.' },
    fill:        { name: 'Paint pot',   tip: 'Paint pot: tap inside a closed shape to pour paint into it.' },
    shapes:      { name: 'Set square',  tip: 'Set square: drag to draw straight lines, boxes and ovals with the tool you used last.' },
    pixel:       { name: 'Pixel',       tip: 'Pixel: tap or drag to colour squares.' }
  };

  // ── Storage ───────────────────────────────────────────────────
  function getUserKey() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_art_') : null;
  }
  function getProgress() {
    const base = { gallery: [], totalStars: 0, lessonsCompleted: [] };
    const k = getUserKey();
    if (!k) return base;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(k)); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return base;
    if (!Array.isArray(d.gallery)) d.gallery = [];
    if (!Array.isArray(d.lessonsCompleted)) d.lessonsCompleted = [];
    if (typeof d.totalStars !== 'number') d.totalStars = 0;
    return d;
  }
  function saveProgress(data) {
    const k = getUserKey();
    if (!k) return;
    const p = getProgress();
    Object.assign(p, data);
    localStorage.setItem(k, JSON.stringify(p));
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  // ── Little helpers ────────────────────────────────────────────
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => (typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''));
  const icon = (n, c) => ArtArt.icon(n, c);
  function ageTier() {
    try {
      const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
      return typeof getAgeTier === 'function' ? getAgeTier(u ? u.age : undefined) : 'intermediate';
    } catch (e) { return 'intermediate'; }
  }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} }
  function showFeedback(emoji) {
    const el = document.getElementById('feedback'); if (!el) return;
    el.querySelector('span').textContent = emoji; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1200);
  }
  function toast(msg) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg); }
  function blob(hex, cls) { return '<span class="blob ' + (cls || '') + '" style="--c:' + esc(hex) + '"></span>'; }
  const safeHex = h => (/^#[0-9a-f]{6}$/i.test(h) ? h : '#333333');

  // ================================================================
  // The studio kit: paper + tool rack + paints + mixer + actions.
  // Used by Draw, every lesson and Copy the Master.
  // ================================================================
  function Kit(host, o) {
    o = o || {};
    const tier = o.tier || ageTier();
    const little = tier === 'beginner';
    const older = tier === 'advanced' || tier === 'expert';
    this.o = o; this.tier = tier; this.little = little;
    this.media = o.media || (little ? ['crayon', 'marker', 'watercolour', 'oil', 'pencil', 'dots', 'eraser']
                                    : ['pencil', 'crayon', 'chalk', 'marker', 'watercolour', 'oil', 'dots', 'eraser']);
    this.helpers = o.helpers || (little ? ['fill'] : ['fill', 'shapes', 'mirror']);
    const kid = ArtArt.uid('k');
    this.id = kid;

    const sizes = [1, 2, 3, 4, 5].map(n =>
      '<button type="button" class="ksize" data-level="' + n + '" aria-label="Size ' + n + ' of 5" aria-pressed="false"><span style="--d:' + (4 + n * 4.2) + 'px"></span></button>').join('');
    const helperBtn = {
      fill: '<button type="button" class="khelp" data-tool="fill" aria-label="Paint pot (fill)" aria-pressed="false"><span class="khelp-art"></span></button>',
      shapes: '<button type="button" class="khelp" data-tool="shapes" aria-label="Set square (lines and shapes)" aria-pressed="false"><span class="khelp-art"></span></button>',
      mirror: '<button type="button" class="khelp khelp-ico" data-act="mirror" aria-label="Mirror drawing" aria-pressed="false">' + icon('mirror') + '</button>'
    };
    host.innerHTML =
      '<div class="kit" id="' + kid + '">' +
        '<div class="kit-top">' +
          '<div class="kit-grp">' +
            '<button type="button" class="kbtn" data-act="undo" aria-label="Undo" disabled>' + icon('undo') + '</button>' +
            '<button type="button" class="kbtn" data-act="redo" aria-label="Redo" disabled>' + icon('redo') + '</button>' +
          '</div>' +
          '<div class="kit-grp kit-zoomgrp">' +
            '<button type="button" class="kbtn" data-act="zoomout" aria-label="Zoom out">' + icon('zoomOut') + '</button>' +
            '<button type="button" class="kbtn kbtn-text kit-zl" data-act="fit" aria-label="Fit the paper to the screen">100%</button>' +
            '<button type="button" class="kbtn" data-act="zoomin" aria-label="Zoom in">' + icon('zoomIn') + '</button>' +
            '<button type="button" class="kbtn kit-hand" data-act="hand" aria-label="Move the paper" aria-pressed="false" hidden>' + icon('hand') + '</button>' +
          '</div>' +
          '<div class="kit-grp">' +
            (o.extraTop || '') +
            '<button type="button" class="kbtn" data-act="clear" aria-label="Clear the paper">' + icon('trash') + '</button>' +
            (o.onSave ? '<button type="button" class="kbtn kbtn-save" data-act="save" aria-label="' + esc(o.saveLabel || 'Save to my gallery') + '">' + icon('save') + '<span>' + esc(o.saveShort || 'Save') + '</span></button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="kit-desk"><div class="kit-surface"></div>' + (o.deskExtra || '') + '</div>' +
        '<div class="kit-tray" role="toolbar" aria-label="Drawing tools">' +
          this.media.map(m => '<button type="button" class="tool" data-tool="' + m + '" aria-label="' + esc(TOOL_INFO[m].name) + '" aria-pressed="false">' +
            '<span class="tool-art"></span><span class="tool-name">' + esc(TOOL_INFO[m].short || TOOL_INFO[m].name) + '</span></button>').join('') +
        '</div>' +
        '<div class="kit-side">' +
          '<div class="kit-pans" role="group" aria-label="Paints"></div>' +
          '<div class="kit-mixer" hidden></div>' +
          '<div class="kit-row">' +
            '<div class="kit-sizes" role="group" aria-label="Brush size">' + sizes + '</div>' +
            '<div class="kit-helpers">' + this.helpers.map(h => helperBtn[h] || '').join('') + '</div>' +
          '</div>' +
          '<div class="kit-shapes" role="group" aria-label="Shape" hidden>' +
            ['line', 'rect', 'ellipse'].map(s => '<button type="button" class="kshape" data-shape="' + s + '" aria-label="' + { line: 'Straight line', rect: 'Rectangle', ellipse: 'Oval' }[s] + '" aria-pressed="false">' + icon(s) + '</button>').join('') +
          '</div>' +
          (older ? '<div class="kit-smooth"><label for="' + kid + '-sm">Steady hand</label><input type="range" id="' + kid + '-sm" min="0" max="90" step="5" value="45"></div>' : '') +
          '<p class="kit-tip" aria-live="polite"></p>' +
        '</div>' +
      '</div>';
    this.el = host.querySelector('.kit');
    this.host = host;
    this._layout();
    this.surface = new ArtBrush.Surface(this.el.querySelector('.kit-surface'), { landscape: o.landscape });
    this.mixA = null; this.mixB = null; this.mixT = 50; this.mixSlot = 0;
    this.colour = safeHex(o.colour || (little ? '#2B3FA8' : '#4A4744'));
    this.level = o.level || (little ? 3 : 2);
    this.shape = 'line';
    this.lastMedia = little ? 'crayon' : 'pencil';
    this._bind();
    this.renderPans();
    this.setColour(this.colour);
    this.setLevel(this.level);
    this.setTool(o.tool || this.lastMedia);
    const self = this;
    if (typeof ResizeObserver === 'function') {
      this._ro = new ResizeObserver(() => self._layout());
      this._ro.observe(host);
    }
  }

  Kit.prototype._layout = function () {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const wide = w >= 860 && h >= 470;
    if (this.el.classList.contains('kit-wide') !== wide) {
      this.el.classList.toggle('kit-wide', wide);
      if (this.surface) requestAnimationFrame(() => this.surface && this.surface.fit());
    }
  };

  Kit.prototype._bind = function () {
    const self = this, el = this.el, S = this.surface;
    el.addEventListener('click', function (e) {
      const t = e.target.closest('button');
      if (!t || !el.contains(t)) return;
      if (t.dataset.tool) { self.setTool(t.dataset.tool); sfx('click'); return; }
      if (t.dataset.level) { self.setLevel(+t.dataset.level); return; }
      if (t.dataset.shape) { self.setShape(t.dataset.shape); return; }
      if (t.dataset.pan) { self._pan(t.dataset.pan); return; }
      const a = t.dataset.act;
      if (a === 'undo') S.undo();
      else if (a === 'redo') S.redo();
      else if (a === 'zoomin') S.zoomAt(1.4);
      else if (a === 'zoomout') S.zoomAt(1 / 1.4);
      else if (a === 'fit') { S.resetView(); S.setHand(false); self._syncHand(); }
      else if (a === 'hand') { S.setHand(!S.hand); self._syncHand(); }
      else if (a === 'clear') self.askClear();
      else if (a === 'save' && self.o.onSave) self.o.onSave(self);
      else if (a === 'mirror') { S.mirror = !S.mirror; t.setAttribute('aria-pressed', S.mirror); self._mirrorLine(); }
      else if (a === 'mix') self.toggleMixer();
      else if (a === 'mixclose') self.toggleMixer(false);
      else if (a === 'mixuse') self._useMix();
      else if (a === 'mixwell') { self.mixSlot = +t.dataset.slot; self._renderMixer(); }
    });
    el.addEventListener('input', function (e) {
      if (e.target.matches('.kit-smooth input')) S.smoothing = (+e.target.value) / 100;
      if (e.target.matches('.mx-ratio input')) { self.mixT = +e.target.value; self._updateMix(); }
    });
    S.on('history', () => {
      el.querySelector('[data-act="undo"]').disabled = !S.canUndo();
      el.querySelector('[data-act="redo"]').disabled = !S.canRedo();
    });
    S.on('view', z => {
      el.querySelector('.kit-zl').textContent = Math.round(z * 100) + '%';
      const hb = el.querySelector('.kit-hand');
      hb.hidden = z <= 1.001;
      if (hb.hidden && S.hand) { S.setHand(false); self._syncHand(); }
    });
    this._keys = function (e) {
      if (!el.offsetParent || /input|textarea/i.test(e.target.tagName)) return;
      if (document.querySelector('.modal-overlay.active, .zs-dialog-overlay')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) S.redo(); else S.undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); S.redo(); }
      else if (e.key === '[') self.setLevel(self.level - 1);
      else if (e.key === ']') self.setLevel(self.level + 1);
    };
    window.addEventListener('keydown', this._keys);
  };

  Kit.prototype._syncHand = function () {
    const b = this.el.querySelector('.kit-hand');
    b.setAttribute('aria-pressed', this.surface.hand);
  };
  Kit.prototype._mirrorLine = function () {
    const sheet = this.surface.sheet;
    let m = sheet.querySelector('.as-mirror');
    if (this.surface.mirror && !m) { m = document.createElement('div'); m.className = 'as-mirror'; sheet.appendChild(m); }
    if (!this.surface.mirror && m) m.remove();
  };

  Kit.prototype.setTool = function (name) {
    const S = this.surface;
    this.tool = name;
    if (name === 'fill') S.setFill(true);
    else if (name === 'shapes') { S.setMedia(this.lastMedia); S.setShape(this.shape); }
    else { S.setMedia(name); if (name !== 'eraser' && name !== 'pixel') this.lastMedia = name; }
    this.el.querySelectorAll('[data-tool]').forEach(b => {
      const on = b.dataset.tool === name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    this.el.querySelector('.kit-shapes').hidden = name !== 'shapes';
    this._syncShapes();
    const info = TOOL_INFO[name];
    this.el.querySelector('.kit-tip').textContent = info ? info.tip : '';
    this.el.dataset.tool = name;
  };
  Kit.prototype.setShape = function (kind) {
    this.shape = kind;
    if (this.tool !== 'shapes') this.setTool('shapes');
    this.surface.setShape(kind);
    this._syncShapes();
  };
  Kit.prototype._syncShapes = function () {
    this.el.querySelectorAll('.kshape').forEach(b => b.setAttribute('aria-pressed', this.tool === 'shapes' && b.dataset.shape === this.shape));
  };
  // A lesson can ask for "a straight line drawn with oil paint".
  Kit.prototype.useShape = function (kind, media) {
    if (media) this.lastMedia = media;
    this.shape = kind || 'line';
    this.setTool('shapes');
  };

  Kit.prototype.setLevel = function (n) {
    n = Math.max(1, Math.min(5, n | 0));
    this.level = n;
    this.surface.setLevel(n);
    this.el.querySelectorAll('.ksize').forEach(b => {
      const on = +b.dataset.level === n;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
  };

  Kit.prototype.setColour = function (hex) {
    hex = safeHex(hex);
    this.colour = hex;
    this.surface.setColour(hex);
    this.el.style.setProperty('--ink', hex);
    this.el.querySelectorAll('.pan').forEach(b => {
      const on = b.dataset.pan.toLowerCase() === hex.toLowerCase();
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
    // every tool in the rack shows the colour it would draw
    this.el.querySelectorAll('.tool').forEach(b => {
      b.querySelector('.tool-art').innerHTML = ArtArt.tool(b.dataset.tool, hex);
    });
    this.el.querySelectorAll('.khelp[data-tool]').forEach(b => {
      b.querySelector('.khelp-art').innerHTML = ArtArt.tool(b.dataset.tool, hex, b.dataset.tool === 'fill' ? '0 34 48 112' : '0 18 48 128');
    });
  };

  Kit.prototype.renderPans = function () {
    const mixed = (this.o.mixed !== false) ? (getProgress().mixedColors || []).filter(h => /^#[0-9a-f]{6}$/i.test(h)) : [];
    const pans = this.o.pigments || PIGMENTS;
    let html = '';
    if (this.o.mixer !== false) html += '<button type="button" class="pan-mix" data-act="mix" aria-label="Open the mixing palette" aria-expanded="false">' + icon('mix') + '<span>Mix</span></button>';
    html += pans.map(p => '<button type="button" class="pan" data-pan="' + p.hex + '" style="--c:' + p.hex + '" aria-label="' + esc(p.name) + '" title="' + esc(p.name) + '" aria-pressed="false"></button>').join('');
    html += mixed.map(h => '<button type="button" class="pan pan-mixed" data-pan="' + h + '" style="--c:' + h + '" aria-label="My mixed colour ' + h + '" title="My mix" aria-pressed="false"></button>').join('');
    this.el.querySelector('.kit-pans').innerHTML = html;
    this.setColourMarks();
  };
  Kit.prototype.setColourMarks = function () {
    const hex = (this.colour || '').toLowerCase();
    this.el.querySelectorAll('.pan').forEach(b => {
      const on = b.dataset.pan.toLowerCase() === hex;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
  };

  Kit.prototype._pan = function (hex) {
    const mx = this.el.querySelector('.kit-mixer');
    if (!mx.hidden) {
      if (this.mixSlot === 0) { this.mixA = hex; this.mixSlot = 1; }
      else if (!this.mixA) { this.mixA = hex; }
      else { this.mixB = hex; }
      sfx('click');
      this._renderMixer();
      return;
    }
    if (this.tool === 'eraser') this.setTool(this.lastMedia);
    this.setColour(hex);
  };

  Kit.prototype.toggleMixer = function (force) {
    const mx = this.el.querySelector('.kit-mixer');
    const open = force != null ? force : mx.hidden;
    mx.hidden = !open;
    this.el.classList.toggle('mixing', open);
    const b = this.el.querySelector('.pan-mix');
    if (b) b.setAttribute('aria-expanded', open);
    if (open) {
      if (!this.mixA) this.mixSlot = 0;
      this._renderMixer();
    }
  };
  Kit.prototype._renderMixer = function () {
    const mx = this.el.querySelector('.kit-mixer');
    const id = this.id + '-mx';
    const well = (i, hex) => '<button type="button" class="mx-well' + (this.mixSlot === i ? ' sel' : '') + '" data-act="mixwell" data-slot="' + i + '" aria-label="' + (i ? 'Second' : 'First') + ' paint' + (hex ? '' : ' (empty)') + '">' + (hex ? blob(hex) : '<span class="mx-empty">?</span>') + '</button>';
    mx.innerHTML =
      '<div class="mx">' +
        '<div class="mx-head"><b>Mixing palette</b><button type="button" class="kbtn" data-act="mixclose" aria-label="Close the mixing palette">' + icon('close') + '</button></div>' +
        '<div class="mx-board">' + well(0, this.mixA) + '<span class="mx-op">+</span>' + well(1, this.mixB) + '<span class="mx-op">=</span><div class="mx-out"></div></div>' +
        '<div class="mx-ratio"><label for="' + id + '">More of the first ↔ more of the second</label><input type="range" id="' + id + '" min="0" max="100" step="5" value="' + this.mixT + '"></div>' +
        '<p class="mx-hint">' + (this.mixA && this.mixB ? 'Slide to change the mix.' : 'Tap a paint for the ' + (this.mixSlot ? 'second' : 'first') + ' well.') + '</p>' +
        '<button type="button" class="mx-use" data-act="mixuse"' + (this.mixA && this.mixB ? '' : ' disabled') + '>Use this colour</button>' +
      '</div>';
    this._updateMix();
  };
  Kit.prototype._mixResult = function () {
    if (!this.mixA || !this.mixB) return null;
    return ArtBrush.mixPaint(this.mixA, this.mixB, this.mixT / 100);
  };
  Kit.prototype._updateMix = function () {
    const out = this.el.querySelector('.mx-out');
    if (!out) return;
    const r = this._mixResult();
    out.innerHTML = r ? blob(r, 'big swirl') : '<span class="mx-empty big">?</span>';
  };
  Kit.prototype._useMix = function () {
    const r = this._mixResult();
    if (!r) return;
    if (this.o.mixed !== false) {
      const list = (getProgress().mixedColors || []).filter(h => h.toLowerCase() !== r.toLowerCase());
      list.unshift(r);
      saveProgress({ mixedColors: list.slice(0, 6) });
    }
    if (this.tool === 'eraser' || this.tool === 'fill') this.setTool(this.lastMedia);
    this.renderPans();
    this.setColour(r);
    this.toggleMixer(false);
    sfx('correct');
  };

  Kit.prototype.askClear = async function () {
    const ok = typeof ZsDialog !== 'undefined'
      ? await ZsDialog.confirm({ title: 'Clear the paper?', message: 'Everything on it will be rubbed out. You can still undo.', confirmLabel: 'Clear', danger: true })
      : true;
    if (ok && !this.surface.destroyed) this.surface.clear();
  };

  Kit.prototype.destroy = function () {
    window.removeEventListener('keydown', this._keys);
    if (this._ro) this._ro.disconnect();
    this.surface.destroy();
    this.host.innerHTML = '';
  };

  // ================================================================
  // DRAW
  // ================================================================
  // The picture as a data URL; the export canvas is freed straight away
  // (iPad Safari counts every live canvas against one memory budget).
  function exportUrl(surface, maxDim, type, q) {
    const c = surface.exportCanvas(maxDim);
    const url = c.toDataURL(type, q);
    ZsCanvas.release(c);
    return url;
  }

  let drawKit = null;
  function initDraw() {
    if (drawKit) { drawKit.surface.fit(); return; }
    drawKit = new Kit(document.getElementById('draw-host'), {
      onSave: k => openSaveDialog(k.surface, ''),
      saveShort: 'Save'
    });
  }

  // ================================================================
  // LEARN
  // ================================================================
  let L = null;   // the lesson being played

  function renderLessonList() {
    const wrap = document.getElementById('learn-list');
    if (!wrap) return;
    const tier = ageTier(), maxIdx = TIERS.indexOf(tier);
    const p = getProgress();
    const visible = LESSONS.filter(l => TIERS.indexOf(l.tier) <= maxIdx);
    const later = LESSONS.length - visible.length;
    const done = visible.filter(l => p.lessonsCompleted.includes(l.id)).length;
    const best = p.lessonBest || {};
    let html = '<div class="ll-head"><h2>Guided lessons <span class="es">Lecciones</span></h2>' +
      '<div class="ll-progress"><span class="ll-bar"><i style="width:' + (visible.length ? Math.round(done / visible.length * 100) : 0) + '%"></i></span><b>' + done + ' of ' + visible.length + ' done</b></div></div>';
    TIERS.forEach(t => {
      const group = visible.filter(l => l.tier === t);
      if (!group.length) return;
      html += '<h3 class="ll-tier">' + TIER_LABEL[t] + '</h3><div class="ll-grid">' + group.map(l => {
        const isDone = p.lessonsCompleted.includes(l.id);
        const n = l.id === 'mixing' ? 'Mixing challenge' : l.steps.length + ' steps';
        const sc = best[l.id];
        return '<button type="button" class="ll-card' + (isDone ? ' done' : '') + '" data-lesson="' + l.id + '">' +
          '<span class="ll-thumb">' + ArtArt.lessonThumb(l) + '</span>' +
          '<span class="ll-body"><b>' + esc(l.title) + '</b><span class="ll-desc">' + esc(l.description) + '</span>' +
          '<span class="ll-meta">' + n + (typeof sc === 'number' ? ' · best ' + sc + '%' : '') + '</span></span>' +
          (isDone ? '<span class="ll-done" aria-label="Done">' + icon('check') + '</span>' : '') +
        '</button>';
      }).join('') + '</div>';
    });
    if (later > 0) html += '<p class="ll-later">' + later + ' more lesson' + (later > 1 ? 's' : '') + ' open up as you grow older.</p>';
    wrap.innerHTML = html;
  }

  function startLesson(id) {
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return;
    document.getElementById('learn-list').hidden = true;
    const play = document.getElementById('learn-play');
    play.hidden = false;
    if (id === 'mixing') { startMixing(lesson, play); return; }
    const tier = ageTier();
    L = { lesson, idx: 0, strokes: 0, scores: [], score: null, tier, pts: null, demo: null };
    play.innerHTML =
      '<div class="lp">' +
        '<div class="lp-head">' +
          '<button type="button" class="kbtn" data-lp="back" aria-label="Back to the lessons">' + icon('back') + '</button>' +
          '<div class="lp-title"><b>' + esc(lesson.title) + '</b><span class="lp-count"></span></div>' +
          '<div class="lp-dots" aria-hidden="true">' + lesson.steps.map(() => '<i></i>').join('') + '</div>' +
        '</div>' +
        '<div class="lp-step">' +
          '<div class="lp-num"></div>' +
          '<div class="lp-main"><p class="lp-text"></p>' +
            '<div class="lp-meter" hidden><span class="lp-bar"><i></i></span><span class="lp-score" aria-live="polite"></span></div>' +
            '<img class="lp-preview" alt="Your dots seen small" hidden>' +
          '</div>' +
          '<div class="lp-actions">' +
            '<button type="button" class="lp-show" data-lp="show">' + icon('play') + '<span>Show me</span></button>' +
            '<button type="button" class="lp-next" data-lp="next" disabled>Next</button>' +
          '</div>' +
        '</div>' +
        '<div class="lp-kit"></div>' +
        '<div class="lp-over" hidden></div>' +
      '</div>';
    const host = play.querySelector('.lp-kit');
    L.kit = new Kit(host, { tier, helpers: ['fill', 'shapes'], onSave: null });
    L.kit.surface.on('stroke', () => { L.strokes++; scheduleCheck(); });
    play.querySelector('.lp').addEventListener('click', onLessonClick);
    showIntro();
    renderStep();
  }

  function onLessonClick(e) {
    const b = e.target.closest('[data-lp]');
    if (!b || !L) return;
    const a = b.dataset.lp;
    if (a === 'back') exitLesson();
    else if (a === 'show') playDemo();
    else if (a === 'next') nextLessonStep();
    else if (a === 'start') { closeOver(); sfx('click'); }
    else if (a === 'hang') { const s = L.kit.surface; openSaveDialog(s, L.lesson.title); }
    else if (a === 'done') exitLesson();
  }

  function showIntro() {
    const lesson = L.lesson;
    const over = document.querySelector('#learn-play .lp-over');
    over.hidden = false;
    over.innerHTML = '<div class="lp-card" role="dialog" aria-label="' + esc(lesson.title) + '">' +
      '<div class="lp-card-thumb">' + ArtArt.lessonThumb(lesson) + '</div>' +
      '<h3>' + esc(lesson.title) + '</h3>' +
      '<p class="lp-note"><b>Did you know?</b> ' + esc(lesson.note || lesson.description) + '</p>' +
      '<p class="lp-howto">Follow the dotted guide. Tap <b>Show me</b> to watch how.</p>' +
      '<button type="button" class="lp-go" data-lp="start">Start drawing</button></div>';
  }
  function closeOver() { const o = document.querySelector('#learn-play .lp-over'); if (o) { o.hidden = true; o.innerHTML = ''; } }

  function stepCheck(step) {
    if (step.check) return step.check;
    return step.guide ? 'line' : 'none';
  }

  function renderStep() {
    const lesson = L.lesson, step = lesson.steps[L.idx], kit = L.kit, S = kit.surface;
    const root = document.querySelector('#learn-play .lp');
    L.strokes = 0; L.score = null; L.pts = null;
    stopDemo();
    root.querySelector('.lp-count').textContent = 'Step ' + (L.idx + 1) + ' of ' + lesson.steps.length;
    root.querySelector('.lp-num').textContent = L.idx + 1;
    root.querySelector('.lp-text').textContent = step.text;
    root.querySelectorAll('.lp-dots i').forEach((d, i) => { d.className = i < L.idx ? 'done' : i === L.idx ? 'now' : ''; });
    const next = root.querySelector('.lp-next');
    next.textContent = L.idx === lesson.steps.length - 1 ? 'Finish' : 'Next';
    next.disabled = true;
    root.querySelector('.lp-show').hidden = !step.guide;
    root.querySelector('.lp-meter').hidden = true;
    root.querySelector('.lp-preview').hidden = true;

    // tools for this step
    S.mirror = step.type === 'symmetry';
    kit._mirrorLine();
    S.snap = step.type === 'grid';
    if (step.color) kit.setColour(step.color);
    if (step.level) kit.setLevel(step.level);
    const t = step.tool || (step.type === 'dots' ? 'dots' : 'pencil');
    if (t === 'line') kit.useShape(step.shape || 'line', step.media || 'pencil');
    else kit.setTool(t);

    renderGuides();
  }

  function renderGuides() {
    const lesson = L.lesson, step = lesson.steps[L.idx], S = L.kit.surface;
    let top = '';
    let svg = '<svg class="lg" viewBox="-4 -4 108 108" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<defs><pattern id="lg-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.1" height="3" fill="#6d5fd6" opacity="0.5"/></pattern></defs>';
    if (step.type === 'pixelgrid') {
      let g = '';
      for (let i = 0; i <= 16; i++) { const v = i * 100 / 16; g += 'M' + v + ' 0 V100 M0 ' + v + ' H100 '; }
      svg += '<path d="' + g + '" stroke="#8b86a6" stroke-width="0.25" fill="none" opacity="0.8"/>';
    }
    lesson.steps.slice(0, L.idx).forEach(s => {
      if (s.guide && stepCheck(s) !== 'fill') svg += '<path class="lg-past" d="' + s.guide + '"/>';
    });
    if (step.type === 'symmetry') {
      svg += '<path class="lg-mirror" d="M50 -4 V104"/>';
      if (step.guide) svg += '<path class="lg-past lg-mirrored" d="' + step.guide + '" transform="translate(100 0) scale(-1 1)"/>';
    }
    if (step.guide) {
      const chk = stepCheck(step);
      if (chk === 'area' || chk === 'fill') svg += '<path class="lg-area" d="' + step.guide + '"/>';
      svg += '<path class="lg-now" id="lg-now" d="' + step.guide + '"/>';
      top += '<path class="lg-demo" d="' + step.guide + '" style="stroke:' + esc(safeHex(step.color || '#4A4744')) + '"/>';
      top += '<g class="lg-pen" style="display:none"><path d="M0 0 L2.2 -1.2 L11 -9.5 L12.8 -7.7 L3.5 1.1 Z" fill="#f0cf9e" stroke="#7a5a2f" stroke-width="0.3"/><path d="M0 0 L2.2 -1.2 L3.5 1.1 Z" fill="#333"/><path d="M8.6 -7.3 L11 -9.5 L12.8 -7.7 L10.4 -5.4 Z" fill="' + esc(safeHex(step.color || '#D9352A')) + '"/></g>';
    }
    svg += '</svg>';
    // The ghost guide lies under the paint, like light pencil lines on
    // the sheet: paint covers it as the kid traces. The demonstration
    // stroke and its pencil travel above.
    S.under.innerHTML = svg;
    S.over.innerHTML = top ? '<svg class="lg" viewBox="-4 -4 108 108" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + top + '</svg>' : '';
  }

  // Sample the guide into paper points for checking.
  function guidePoints() {
    if (L.pts) return L.pts;
    const step = L.lesson.steps[L.idx], S = L.kit.surface;
    const path = S.under.querySelector('#lg-now');
    const pts = [];
    if (!path || !path.getTotalLength) return (L.pts = pts);
    const chk = stepCheck(step);
    if (chk === 'line') {
      const len = path.getTotalLength(), stepLen = Math.max(0.8, len / 400);
      for (let d = 0; d <= len; d += stepLen) { const q = path.getPointAtLength(d); pts.push(S.guideToPaper(q.x, q.y)); }
    } else if (chk === 'area' || chk === 'fill') {
      const bb = path.getBBox();
      const g = Math.max(0.8, Math.min(3, Math.sqrt(bb.width * bb.height / 260)));
      const canTest = typeof path.isPointInFill === 'function';
      const svg = path.ownerSVGElement;
      for (let y = bb.y + g / 2; y < bb.y + bb.height; y += g) {
        for (let x = bb.x + g / 2; x < bb.x + bb.width; x += g) {
          let inside = true;
          if (canTest) {
            try {
              let pt;
              if (typeof DOMPoint === 'function') pt = new DOMPoint(x, y);
              else { pt = svg.createSVGPoint(); pt.x = x; pt.y = y; }
              inside = path.isPointInFill(pt);
            } catch (e) { inside = true; }
          }
          if (inside) pts.push(S.guideToPaper(x, y));
        }
      }
    }
    return (L.pts = pts);
  }

  let _checkT = 0;
  function scheduleCheck() {
    clearTimeout(_checkT);
    _checkT = setTimeout(runCheck, 120);
  }
  function runCheck() {
    if (!L) return;
    const step = L.lesson.steps[L.idx], S = L.kit.surface;
    const root = document.querySelector('#learn-play .lp');
    if (!root) return;
    const next = root.querySelector('.lp-next');
    next.disabled = L.strokes < 1;
    if (step.preview) {
      const img = root.querySelector('.lp-preview');
      img.src = exportUrl(S, 110, 'image/png');
      img.hidden = false;
    }
    const chk = stepCheck(step);
    if (chk === 'none') return;
    const pts = guidePoints();
    if (!pts.length) return;
    const unit = S.guideUnit();
    const tol = chk === 'line' ? Math.round(unit * ({ beginner: 5, intermediate: 3.6, advanced: 3.2, expert: 2.8 }[L.tier] || 3.6)) : Math.round(unit * 1.4);
    const f = S.hitFraction(pts, tol);
    const was = L.score || 0;
    L.score = f;
    const pct = Math.round(f * 100);
    const meter = root.querySelector('.lp-meter');
    meter.hidden = false;
    meter.querySelector('i').style.width = pct + '%';
    meter.classList.toggle('good', f >= 0.7);
    const what = chk === 'line' ? 'On the guide' : 'Coloured in';
    meter.querySelector('.lp-score').textContent = what + ': ' + pct + '%' + (f >= 0.7 ? ' — great!' : '');
    if (f >= 0.7 && was < 0.7) { sfx('star'); sparkle(meter); }
  }

  function sparkle(el) {
    const s = document.createElement('span');
    s.className = 'lp-spark';
    s.innerHTML = icon('star');
    el.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  // Watch the guide being drawn, with a pencil travelling along it.
  function playDemo() {
    const S = L.kit.surface;
    const demo = S.over.querySelector('.lg-demo'), pen = S.over.querySelector('.lg-pen');
    if (!demo || !demo.getTotalLength) return;
    stopDemo();
    const len = demo.getTotalLength();
    const dur = Math.max(1200, Math.min(4200, len * 14));
    demo.style.strokeDasharray = len + ' ' + len;
    demo.style.strokeDashoffset = len;
    demo.classList.add('on');
    pen.style.display = '';
    const t0 = performance.now();
    function frame(now) {
      if (!L || !L.demo) return;
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      demo.style.strokeDashoffset = len * (1 - e);
      const q = demo.getPointAtLength(len * e);
      pen.setAttribute('transform', 'translate(' + q.x.toFixed(2) + ' ' + q.y.toFixed(2) + ')');
      if (k < 1) L.demo = requestAnimationFrame(frame);
      else L.demo = setTimeout(() => { if (L) stopDemo(true); }, 900);
    }
    L.demo = requestAnimationFrame(frame);
  }
  function stopDemo(fade) {
    if (!L) return;
    if (L.demo) { cancelAnimationFrame(L.demo); clearTimeout(L.demo); }
    L.demo = null;
    const S = L.kit && L.kit.surface;
    if (!S) return;
    const demo = S.over.querySelector('.lg-demo'), pen = S.over.querySelector('.lg-pen');
    if (demo) demo.classList.remove('on');
    if (pen) pen.style.display = 'none';
    if (fade) {} // CSS fades the demo line out
  }

  function nextLessonStep() {
    if (!L) return;
    const step = L.lesson.steps[L.idx];
    if (stepCheck(step) !== 'none' && L.score != null) L.scores.push(L.score);
    else if (stepCheck(step) !== 'none') L.scores.push(0);
    if (L.idx < L.lesson.steps.length - 1) {
      L.idx++;
      sfx('correct');
      renderStep();
    } else {
      finishLesson();
    }
  }

  // Same completion rule as always: the first finish of a lesson adds
  // its id to lessonsCompleted, then the star milestones are checked.
  function completeLesson(lesson, pct) {
    const p = getProgress();
    if (typeof pct === 'number') {
      const best = Object.assign({}, p.lessonBest || {});
      if (!(best[lesson.id] >= pct)) { best[lesson.id] = pct; saveProgress({ lessonBest: best }); }
    }
    if (!p.lessonsCompleted.includes(lesson.id)) {
      p.lessonsCompleted.push(lesson.id);
      saveProgress({ lessonsCompleted: p.lessonsCompleted });
      checkStarMilestones();
      if (typeof ActivityLog !== 'undefined') ActivityLog.log('Art Studio', '🎨', 'Completed lesson: "' + lesson.title + '"');
    }
    sfx('cheer');
  }

  function finishLesson() {
    // A late callback can arrive after the lesson was left.
    if (!L) return;
    const lesson = L.lesson;
    const avg = L.scores.length ? L.scores.reduce((a, b) => a + b, 0) / L.scores.length : 1;
    const pct = Math.round(avg * 100);
    completeLesson(lesson, L.scores.length ? pct : undefined);
    const stars = avg >= 0.75 ? 3 : avg >= 0.5 ? 2 : 1;
    const art = exportUrl(L.kit.surface, 520, 'image/jpeg', 0.8);
    const show = () => {
      if (!L || L.lesson !== lesson) return;
      const over = document.querySelector('#learn-play .lp-over');
      over.hidden = false;
      over.innerHTML = '<div class="lp-card lp-finish" role="dialog" aria-label="Lesson finished">' +
        '<div class="lp-stars" aria-label="' + stars + ' of 3 stars">' + [1, 2, 3].map(i => '<span class="' + (i <= stars ? 'on' : '') + '">' + icon('star') + '</span>').join('') + '</div>' +
        '<h3>Lesson done!</h3>' +
        '<div class="fr fr-gold fr-sm"><span class="fr-mould"><span class="fr-mat"><img src="' + art + '" alt="Your drawing"></span></span></div>' +
        (L.scores.length ? '<p class="lp-howto">On the guides: <b>' + pct + '%</b></p>' : '') +
        '<div class="lp-fin-btns"><button type="button" class="lp-go alt" data-lp="hang">' + icon('save') + ' Hang it in my gallery</button>' +
        '<button type="button" class="lp-go" data-lp="done">More lessons</button></div></div>';
    };
    if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('art', show);
    else show();
  }

  function exitLesson() {
    if (L) { stopDemo(); if (L.kit) L.kit.destroy(); }
    L = null;
    clearTimeout(_checkT);
    const play = document.getElementById('learn-play');
    play.innerHTML = ''; play.hidden = true;
    document.getElementById('learn-list').hidden = false;
    renderLessonList();
  }

  // ── Colour Mixing challenge ───────────────────────────────────
  let M = null;
  function startMixing(lesson, play) {
    const tierIdx = TIERS.indexOf(ageTier());
    const targets = MIX_TARGETS.filter(t => t.tier <= Math.max(0, tierIdx)).map(t =>
      Object.assign({ hex: ArtBrush.mixPaint(MIX_PAINTS[t.a].hex, MIX_PAINTS[t.b].hex, t.t) }, t));
    M = { lesson, targets, idx: 0, a: null, b: null, t: 50, tries: 0, little: tierIdx === 0, made: [] };
    play.innerHTML =
      '<div class="lp mxc">' +
        '<div class="lp-head">' +
          '<button type="button" class="kbtn" data-mx="back" aria-label="Back to the lessons">' + icon('back') + '</button>' +
          '<div class="lp-title"><b>' + esc(lesson.title) + '</b><span class="lp-count"></span></div>' +
          '<div class="lp-dots" aria-hidden="true">' + targets.map(() => '<i></i>').join('') + '</div>' +
        '</div>' +
        '<div class="mxc-body"></div>' +
        '<div class="lp-over" hidden></div>' +
      '</div>';
    play.querySelector('.mxc').addEventListener('click', onMixClick);
    play.querySelector('.mxc').addEventListener('input', e => {
      if (e.target.matches('.mxc-ratio input')) { M.t = +e.target.value; renderMixResult(false); const m = document.querySelector('#learn-play .mxc-msg'); if (m) { m.textContent = ''; m.className = 'mxc-msg'; } }
    });
    const over = play.querySelector('.lp-over');
    over.hidden = false;
    over.innerHTML = '<div class="lp-card"><div class="lp-card-thumb">' + ArtArt.lessonThumb(lesson) + '</div><h3>' + esc(lesson.title) + '</h3>' +
      '<p class="lp-note"><b>Did you know?</b> ' + esc(lesson.note) + '</p>' +
      '<button type="button" class="lp-go" data-mx="start">Start mixing</button></div>';
    renderMixing();
  }
  function renderMixing() {
    const T = M.targets[M.idx];
    const body = document.querySelector('#learn-play .mxc-body');
    const root = document.querySelector('#learn-play .mxc');
    root.querySelector('.lp-count').textContent = 'Colour ' + (M.idx + 1) + ' of ' + M.targets.length;
    root.querySelectorAll('.lp-dots i').forEach((d, i) => { d.className = i < M.idx ? 'done' : i === M.idx ? 'now' : ''; });
    const well = (slot, key) => '<button type="button" class="mx-well big' + ((slot === 0 && !M.a) || (slot === 1 && M.a && !M.b) ? ' sel' : '') + '" data-mx="clear" data-slot="' + slot + '" aria-label="' + (slot ? 'Second' : 'First') + ' paint: ' + (key ? MIX_PAINTS[key].name : 'empty') + '">' +
      (key ? blob(MIX_PAINTS[key].hex) : '<span class="mx-empty">?</span>') + '</button>';
    body.innerHTML =
      '<div class="mxc-target"><div class="mxc-swatch">' + blob(T.hex, 'huge') + '</div>' +
        '<div><span class="mxc-ask">Mix this colour</span><b class="mxc-name">' + esc(T.name) + '</b>' +
        '<span class="mxc-hint">' + (M.little || M.tries > 0 ? 'Hint: ' + MIX_PAINTS[T.a].name + ' + ' + MIX_PAINTS[T.b].name : 'Which two paints make it?') + '</span></div></div>' +
      '<div class="mxc-board">' +
        '<div class="mxc-wells" role="group" aria-label="Paints">' + Object.keys(MIX_PAINTS).map(k =>
          '<button type="button" class="mxc-paint" data-mx="paint" data-key="' + k + '" aria-label="' + MIX_PAINTS[k].name + '">' + blob(MIX_PAINTS[k].hex, 'big') + '<span>' + MIX_PAINTS[k].name + '</span></button>').join('') + '</div>' +
        '<div class="mx-board mxc-eq">' + well(0, M.a) + '<span class="mx-op">+</span>' + well(1, M.b) + '<span class="mx-op">=</span><div class="mx-out big"></div></div>' +
        (M.little ? '' : '<div class="mxc-ratio mx-ratio"><label for="mxc-r">More of the first ↔ more of the second</label><input type="range" id="mxc-r" min="0" max="100" step="5" value="' + M.t + '"></div>') +
        '<p class="mxc-msg" aria-live="polite"></p>' +
        '<button type="button" class="lp-go" data-mx="check"' + (M.a && M.b ? '' : ' disabled') + '>Mix!</button>' +
      '</div>';
    renderMixResult(false);
  }
  function mixNow() { return M.a && M.b ? ArtBrush.mixPaint(MIX_PAINTS[M.a].hex, MIX_PAINTS[M.b].hex, M.t / 100) : null; }
  function renderMixResult(stir) {
    const out = document.querySelector('#learn-play .mxc .mx-out');
    if (!out) return;
    const r = mixNow();
    // the result stays hidden until "Mix!" so the kid has to predict it
    out.innerHTML = r && stir ? blob(r, 'big stir') : '<span class="mx-empty big">?</span>';
    if (stir && r) out.firstChild.style.setProperty('--a', MIX_PAINTS[M.a].hex), out.firstChild.style.setProperty('--b', MIX_PAINTS[M.b].hex);
  }
  function onMixClick(e) {
    const b = e.target.closest('[data-mx]');
    if (!b || !M) return;
    const a = b.dataset.mx;
    if (a === 'back') { exitMixing(); return; }
    if (a === 'start') { const o = document.querySelector('#learn-play .lp-over'); o.hidden = true; o.innerHTML = ''; return; }
    if (a === 'paint') {
      if (!M.a) M.a = b.dataset.key; else if (!M.b) M.b = b.dataset.key; else { M.a = M.b; M.b = b.dataset.key; }
      sfx('click'); renderMixing(); return;
    }
    if (a === 'clear') { if (+b.dataset.slot === 0) { M.a = M.b; M.b = null; } else M.b = null; renderMixing(); return; }
    if (a === 'check') {
      const T = M.targets[M.idx], r = mixNow();
      if (!r) return;
      renderMixResult(true);
      const msg = document.querySelector('#learn-play .mxc-msg');
      const d = ArtBrush.colourDistance(r, T.hex);
      const tol = M.little ? 14 : 9;
      setTimeout(() => {
        if (!M) return;
        if (d <= tol) {
          msg.className = 'mxc-msg good';
          msg.textContent = 'You made ' + T.name.split(' —')[0].toLowerCase() + '!';
          sfx('correct'); showFeedback('🎨');
          M.made.push(r);
          setTimeout(() => {
            if (!M) return;
            M.idx++; M.a = M.b = null; M.t = 50; M.tries = 0;
            if (M.idx >= M.targets.length) finishMixing(); else renderMixing();
          }, 1300);
        } else {
          M.tries++;
          msg.className = 'mxc-msg try';
          const pair = [M.a, M.b].sort().join(), want = [T.a, T.b].sort().join();
          if (pair !== want) msg.textContent = 'Not quite. Try ' + MIX_PAINTS[T.a].name + ' + ' + MIX_PAINTS[T.b].name + '.';
          else {
            // right paints, wrong amounts: which way to slide?
            const tWant = M.a === T.a ? T.t : 1 - T.t;
            msg.textContent = 'Right paints! Now use more ' + MIX_PAINTS[tWant * 100 > M.t ? M.b : M.a].name + '.';
          }
          sfx('wrong');
          const hint = document.querySelector('#learn-play .mxc-hint');
          if (hint) hint.textContent = 'Hint: ' + MIX_PAINTS[T.a].name + ' + ' + MIX_PAINTS[T.b].name;
        }
      }, 650);
    }
    if (a === 'done') exitMixing();
  }
  function finishMixing() {
    const lesson = M.lesson, made = M.made.slice();
    completeLesson(lesson);
    const show = () => {
      if (!M) return;
      const over = document.querySelector('#learn-play .lp-over');
      over.hidden = false;
      over.innerHTML = '<div class="lp-card lp-finish"><div class="lp-stars">' + [1, 2, 3].map(() => '<span class="on">' + icon('star') + '</span>').join('') + '</div>' +
        '<h3>Master mixer!</h3><div class="mxc-made">' + made.map(h => blob(h, 'big')).join('') + '</div>' +
        '<p class="lp-howto">Mix your own colours any time with the <b>Mix</b> button in Draw.</p>' +
        '<button type="button" class="lp-go" data-mx="done">More lessons</button></div>';
    };
    if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('art', show); else show();
  }
  function exitMixing() {
    M = null;
    const play = document.getElementById('learn-play');
    play.innerHTML = ''; play.hidden = true;
    document.getElementById('learn-list').hidden = false;
    renderLessonList();
  }

  // ================================================================
  // GALLERY — a wall of frames
  // ================================================================
  // A ceiling in bytes, not just in count. Ten small sketches and ten
  // full-canvas paintings are very different amounts of storage, and
  // only the second kind fills a shared iPad. Newest art always wins;
  // the oldest is dropped until the gallery fits.
  const GALLERY_BUDGET_BYTES = 250 * 1024;
  function _galleryBytes(gallery) {
    return gallery.reduce((n, art) => n + ((art && art.dataUrl) ? art.dataUrl.length : 0), 0);
  }
  function _trimGalleryToBudget(gallery) {
    const dropped = [];
    while (gallery.length > 1 && _galleryBytes(gallery) > GALLERY_BUDGET_BYTES) dropped.push(gallery.pop());
    return dropped;
  }
  const FRAMES = ['gold', 'walnut', 'black', 'white', 'silver', 'oak'];
  function frameFor(art, i) { const n = Number(art && art.id) || i; return FRAMES[Math.abs(Math.floor(n / 7)) % FRAMES.length]; }
  const safeImg = u => (typeof u === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(u) ? u : '');
  function fmtDate(d) { try { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString(); } catch (e) { return ''; } }

  function renderGallery() {
    const wall = document.getElementById('gallery-wall');
    if (!wall) return;
    const p = getProgress();
    if (!p.gallery.length) {
      wall.innerHTML = '<div class="wall-empty">' +
        '<div class="fr fr-gold fr-empty"><span class="fr-mould"><span class="fr-mat"><span class="fr-blank"></span></span></span></div>' +
        '<h2>Your gallery is waiting</h2><p>Draw something and press <b>Save</b> — it will hang here in a frame.</p></div>';
      return;
    }
    wall.innerHTML = '<div class="wall-head"><h2>My gallery <span class="es">Mi galería</span></h2><span class="wall-count">' + p.gallery.length + ' of 10 frames</span></div>' +
      '<div class="wall-grid">' + p.gallery.map((art, i) => {
        const src = safeImg(art.dataUrl);
        return '<figure class="fr fr-' + frameFor(art, i) + '">' +
          '<button type="button" class="fr-btn" data-art="' + esc(art.id) + '" aria-label="Open “' + esc(art.title) + '”">' +
            '<span class="fr-light" aria-hidden="true"></span>' +
            '<span class="fr-mould"><span class="fr-mat">' + (src ? '<img src="' + esc(src) + '" alt="' + esc(art.title) + '" loading="lazy">' : '<span class="fr-blank"></span>') + '</span></span>' +
          '</button>' +
          '<figcaption class="fr-plaque"><b>' + esc(art.title) + '</b><span>' + esc(fmtDate(art.date)) + '</span></figcaption>' +
        '</figure>';
      }).join('') + '</div>';
  }

  function viewArt(id) {
    const art = getProgress().gallery.find(a => String(a.id) === String(id));
    if (!art) return;
    const v = document.getElementById('gallery-viewer');
    const fr = v.querySelector('.viewer-frame');
    fr.className = 'viewer-frame fr fr-' + frameFor(art, 0);
    document.getElementById('viewer-img').src = safeImg(art.dataUrl);
    document.getElementById('viewer-img').alt = art.title;
    document.getElementById('viewer-title').textContent = art.title;
    document.getElementById('viewer-date').textContent = fmtDate(art.date);
    v.classList.add('active');
    document.getElementById('viewer-delete').onclick = async () => {
      const ok = await ZsDialog.confirm({ title: 'Delete this artwork?', message: '"' + art.title + '" will be gone forever.', confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      const p = getProgress(); p.gallery = p.gallery.filter(a => a.id !== art.id);
      saveProgress({ gallery: p.gallery }); closeViewer(); renderGallery();
    };
    setTimeout(() => { const c = v.querySelector('.viewer-close'); if (c) c.focus(); }, 30);
  }
  function closeViewer() { document.getElementById('gallery-viewer').classList.remove('active'); }

  // ── Saving ────────────────────────────────────────────────────
  let saveSource = null, saveHook = null;
  function openSaveDialog(surface, title, hook) {
    if (surface.isBlank()) { toast('The paper is empty — draw something first!'); return; }
    saveSource = surface; saveHook = hook || null;
    const inp = document.getElementById('art-title');
    inp.value = (title || '').slice(0, 20);
    const prev = document.getElementById('save-preview');
    if (prev) prev.src = exportUrl(surface, 360, 'image/jpeg', 0.8);
    document.getElementById('save-dialog').classList.add('active');
    setTimeout(() => inp.focus(), 30);
  }
  function closeSaveDialog() { document.getElementById('save-dialog').classList.remove('active'); saveSource = null; saveHook = null; }
  async function confirmSave() {
    if (!saveSource) { closeSaveDialog(); return; }
    const title = document.getElementById('art-title').value.trim() || 'My Masterpiece';

    // ── Downscale for storage ──
    // These live in localStorage as base64, on a device shared by seven
    // profiles, competing with the routines and the shopping list for
    // one 5MB budget. At 1024px they ran 100-250KB each, so ten of them
    // per kid filled the device and everything else silently stopped
    // saving. 720px is still sharper than the gallery thumbnails and
    // the viewer, and costs about half as much.
    const dataUrl = exportUrl(saveSource, 720, 'image/jpeg', 0.6);
    const hook = saveHook;

    const full = getProgress();
    if (full.gallery.length >= 10) {
      const oldest = full.gallery[full.gallery.length - 1];
      const ok = await ZsDialog.confirm({
        title: 'Your gallery is full',
        message: 'It holds 10 artworks. Saving this one will remove "' + oldest.title + '".',
        confirmLabel: 'Save anyway'
      });
      if (!ok) return;
    }

    // Read again after the question: the gallery may have changed meanwhile.
    const p = getProgress();
    p.gallery.unshift({ id: Date.now(), title, dataUrl, date: new Date().toISOString() });
    if (p.gallery.length > 10) p.gallery.pop();
    const droppedForSpace = _trimGalleryToBudget(p.gallery);

    try {
      saveProgress({ gallery: p.gallery });
      if (droppedForSpace.length) toast('Saved! To make room, your oldest artwork was removed.');
    } catch (e) {
      if (p.gallery.length > 1) {
        p.gallery.pop();
        try {
          saveProgress({ gallery: p.gallery });
          toast('Storage full: Oldest artwork was removed to make room.');
        } catch (e2) {
          ZsDialog.alert({ title: 'Storage full', message: 'Please delete some older artworks, then save again.' });
          return;
        }
      } else {
        ZsDialog.alert({ title: 'Storage full', message: 'Could not save the artwork.' });
        return;
      }
    }

    closeSaveDialog();
    sfx('correct');
    if (typeof ActivityLog !== 'undefined') ActivityLog.log('Art Studio', '🎨', 'Saved artwork: "' + title + '"');
    showFeedback('🖼️');
    if (hook) { try { hook(); } catch (e) {} }
    checkStarMilestones();
    renderGallery();
    toast('Hung in your gallery!');
    if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('art');
  }

  // ── Stars (unchanged rule) ────────────────────────────────────
  function checkStarMilestones() {
    const p = getProgress();
    const lessonStars = p.lessonsCompleted.length;                       // 1 star per lesson
    const galleryStars = Math.min(2, Math.floor(p.gallery.length / 5));  // 1 star per 5 artworks (max 2)
    const totalCalculated = lessonStars + galleryStars;
    if (totalCalculated > p.totalStars) {
      saveProgress({ totalStars: totalCalculated });
      if (typeof SFX !== 'undefined') setTimeout(() => SFX.cheer(), 500);
      showFeedback('🌟');
      const sc = document.getElementById('zs-star-count');
      if (sc && typeof getTotalStars === 'function') sc.textContent = '⭐ ' + getTotalStars();
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────
  function showTab(tabId) {
    document.querySelectorAll('.as-tab').forEach(b => {
      const on = b.dataset.tab === tabId;
      b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
    });
    document.querySelectorAll('.as-pane').forEach(c => { c.classList.toggle('active', c.id === 'tab-' + tabId); });
    if (tabId === 'draw') requestAnimationFrame(initDraw);
    if (tabId === 'gallery') renderGallery();
    if (tabId === 'learn' && !L && !M) renderLessonList();
    if (tabId === 'master' && typeof CopyMaster !== 'undefined') CopyMaster.show();
  }
  function bindTabs() {
    document.querySelectorAll('.as-tab').forEach(btn => btn.addEventListener('click', () => { showTab(btn.dataset.tab); sfx('click'); }));
    document.getElementById('learn-list').addEventListener('click', e => {
      const c = e.target.closest('[data-lesson]'); if (c) { sfx('click'); startLesson(c.dataset.lesson); }
    });
    document.getElementById('gallery-wall').addEventListener('click', e => {
      const c = e.target.closest('[data-art]'); if (c) viewArt(c.dataset.art);
    });
    document.getElementById('art-title').addEventListener('keydown', e => { if (e.key === 'Enter') confirmSave(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (document.getElementById('gallery-viewer').classList.contains('active')) closeViewer();
      else if (document.getElementById('save-dialog').classList.contains('active')) closeSaveDialog();
    });
  }

  function init() {
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
      if (u) CloudSync.pull('zs_art_' + u.name.toLowerCase().replace(/\s+/g, '_'));
    }
    const lg = document.getElementById('as-logo');
    if (lg) lg.innerHTML = ArtArt.logo();
    document.querySelectorAll('.as-tab [data-ico]').forEach(s => { s.innerHTML = icon(s.dataset.ico); });
    bindTabs();
    initDraw();
  }

  document.addEventListener('DOMContentLoaded', init);
  return {
    Kit, PIGMENTS, LESSONS,
    viewArt, closeViewer, closeSaveDialog, confirmSave, startLesson, exitLesson,
    openSaveDialog, getProgress, saveProgress, checkStarMilestones, showTab,
    _debug: () => ({ drawKit, L, M })
  };
})();
