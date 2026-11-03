/* ================================================================
   LAB EXPLORER — lab-explorer-data.js
   Star positions for the Night Sky lab.

   Right ascension (hours) and declination (degrees) are J2000.0
   values of the named stars, rounded to about 0.01°, with their
   apparent visual magnitude. These are standard published values
   (as listed in the Yale Bright Star Catalogue / Hipparcos). Only
   the stars below are real; the faint background speckle the lab
   adds is decorative and is not drawn as part of any figure.
   ================================================================ */

const LXData = (() => {
  'use strict';

  // id, name, ra (h), dec (°), mag, color (B-V tint)
  const STARS = [
    // Cruz del Sur (Crux)
    { id: 'acrux',   name: 'Acrux',     ra: 12.4433, dec: -63.099, mag: 0.76, col: '#B9CCFF' },
    { id: 'mimosa',  name: 'Mimosa',    ra: 12.7954, dec: -59.689, mag: 1.25, col: '#B9CCFF' },
    { id: 'gacrux',  name: 'Gacrux',    ra: 12.5194, dec: -57.113, mag: 1.64, col: '#FFB27A' },
    { id: 'imai',    name: 'Imai (δ Crucis)',  ra: 12.2524, dec: -58.749, mag: 2.79, col: '#C4D4FF' },
    { id: 'ginan',   name: 'Ginan (ε Crucis)', ra: 12.3560, dec: -60.401, mag: 3.59, col: '#FFC890' },
    // Centaurus: the two Pointers
    { id: 'rigilk',  name: 'Alpha Centauri',   ra: 14.6601, dec: -60.834, mag: -0.27, col: '#FFF2D6' },
    { id: 'hadar',   name: 'Hadar (Beta Centauri)', ra: 14.0637, dec: -60.373, mag: 0.61, col: '#B9CCFF' },
    { id: 'epscen',  name: 'Epsilon Centauri', ra: 13.6647, dec: -53.466, mag: 2.30, col: '#C4D4FF' },
    { id: 'gamcen',  name: 'Gamma Centauri',   ra: 12.6919, dec: -48.960, mag: 2.17, col: '#E8EEFF' },
    // Orion (Las Tres Marías are the belt)
    { id: 'betelgeuse', name: 'Betelgeuse', ra: 5.9195, dec: 7.407,  mag: 0.50, col: '#FF9A5C' },
    { id: 'rigel',      name: 'Rigel',      ra: 5.2423, dec: -8.202, mag: 0.13, col: '#B9CCFF' },
    { id: 'bellatrix',  name: 'Bellatrix',  ra: 5.4189, dec: 6.350,  mag: 1.64, col: '#C4D4FF' },
    { id: 'saiph',      name: 'Saiph',      ra: 5.7959, dec: -9.670, mag: 2.09, col: '#C4D4FF' },
    { id: 'alnitak',    name: 'Alnitak',    ra: 5.6793, dec: -1.943, mag: 1.77, col: '#C4D4FF' },
    { id: 'alnilam',    name: 'Alnilam',    ra: 5.6036, dec: -1.202, mag: 1.69, col: '#C4D4FF' },
    { id: 'mintaka',    name: 'Mintaka',    ra: 5.5334, dec: -0.299, mag: 2.23, col: '#C4D4FF' },
    { id: 'meissa',     name: 'Meissa',     ra: 5.5856, dec: 9.934,  mag: 3.33, col: '#C4D4FF' },
    // Scorpius
    { id: 'antares', name: 'Antares',  ra: 16.4901, dec: -26.432, mag: 1.06, col: '#FF7A4A' },
    { id: 'acrab',   name: 'Acrab',    ra: 16.0906, dec: -19.806, mag: 2.62, col: '#C4D4FF' },
    { id: 'dschubba',name: 'Dschubba', ra: 16.0056, dec: -22.622, mag: 2.29, col: '#C4D4FF' },
    { id: 'pisco',   name: 'Pi Scorpii', ra: 15.9809, dec: -26.114, mag: 2.89, col: '#C4D4FF' },
    { id: 'alniyat', name: 'Alniyat',  ra: 16.3531, dec: -25.593, mag: 2.88, col: '#C4D4FF' },
    { id: 'tausco',  name: 'Tau Scorpii', ra: 16.5980, dec: -28.216, mag: 2.82, col: '#C4D4FF' },
    { id: 'larawag', name: 'Larawag',  ra: 16.8361, dec: -34.293, mag: 2.29, col: '#FFD4A0' },
    { id: 'musco',   name: 'Mu Scorpii', ra: 16.8645, dec: -38.048, mag: 3.00, col: '#C4D4FF' },
    { id: 'zetasco', name: 'Zeta Scorpii', ra: 16.9097, dec: -42.361, mag: 3.62, col: '#FFC890' },
    { id: 'etasco',  name: 'Eta Scorpii', ra: 17.2026, dec: -43.239, mag: 3.33, col: '#FFF2D6' },
    { id: 'sargas',  name: 'Sargas',   ra: 17.6220, dec: -42.998, mag: 1.86, col: '#FFF2D6' },
    { id: 'iotasco', name: 'Iota Scorpii', ra: 17.7931, dec: -40.127, mag: 3.00, col: '#FFF2D6' },
    { id: 'girtab',  name: 'Girtab',   ra: 17.7081, dec: -39.030, mag: 2.39, col: '#C4D4FF' },
    { id: 'shaula',  name: 'Shaula',   ra: 17.5601, dec: -37.104, mag: 1.62, col: '#C4D4FF' },
    { id: 'lesath',  name: 'Lesath',   ra: 17.5127, dec: -37.296, mag: 2.70, col: '#C4D4FF' },
    // Canis Major
    { id: 'sirius',  name: 'Sirius',   ra: 6.7525, dec: -16.716, mag: -1.46, col: '#E8EEFF' },
    { id: 'mirzam',  name: 'Mirzam',   ra: 6.3783, dec: -17.956, mag: 1.98, col: '#C4D4FF' },
    { id: 'adhara',  name: 'Adhara',   ra: 6.9771, dec: -28.972, mag: 1.50, col: '#C4D4FF' },
    { id: 'wezen',   name: 'Wezen',    ra: 7.1399, dec: -26.393, mag: 1.83, col: '#FFF2D6' },
    { id: 'aludra',  name: 'Aludra',   ra: 7.4016, dec: -29.303, mag: 2.45, col: '#C4D4FF' },
    // Sagittarius (the Teapot)
    { id: 'kausaus', name: 'Kaus Australis', ra: 18.4029, dec: -34.385, mag: 1.85, col: '#C4D4FF' },
    { id: 'nunki',   name: 'Nunki',    ra: 18.9211, dec: -26.297, mag: 2.05, col: '#C4D4FF' },
    { id: 'kausmed', name: 'Kaus Media', ra: 18.3499, dec: -29.828, mag: 2.70, col: '#FFC890' },
    { id: 'kausbor', name: 'Kaus Borealis', ra: 18.4662, dec: -25.422, mag: 2.81, col: '#FFC890' },
    { id: 'ascella', name: 'Ascella',  ra: 19.0435, dec: -29.880, mag: 2.60, col: '#E8EEFF' },
    { id: 'alnasl',  name: 'Alnasl',   ra: 18.0968, dec: -30.424, mag: 2.99, col: '#FFC890' },
    { id: 'phisgr',  name: 'Phi Sagittarii', ra: 18.7609, dec: -26.991, mag: 3.17, col: '#C4D4FF' },
    { id: 'tausgr',  name: 'Tau Sagittarii', ra: 19.1157, dec: -27.670, mag: 3.32, col: '#FFC890' },
    // Other bright stars that help a kid find their way
    { id: 'canopus',   name: 'Canopus',   ra: 6.3992,  dec: -52.696, mag: -0.74, col: '#FFF8E8' },
    { id: 'achernar',  name: 'Achernar',  ra: 1.6286,  dec: -57.237, mag: 0.46, col: '#B9CCFF' },
    { id: 'fomalhaut', name: 'Fomalhaut', ra: 22.9608, dec: -29.622, mag: 1.16, col: '#E8EEFF' },
    { id: 'aldebaran', name: 'Aldebaran', ra: 4.5987,  dec: 16.509,  mag: 0.86, col: '#FFA060' },
    { id: 'alcyone',   name: 'Pleiades (Alcyone)', ra: 3.7914, dec: 24.105, mag: 2.87, col: '#C4D4FF' },
    { id: 'procyon',   name: 'Procyon',   ra: 7.6550,  dec: 5.225,   mag: 0.34, col: '#FFF8E8' },
    { id: 'pollux',    name: 'Pollux',    ra: 7.7553,  dec: 28.026,  mag: 1.14, col: '#FFC890' },
    { id: 'castor',    name: 'Castor',    ra: 7.5767,  dec: 31.888,  mag: 1.58, col: '#E8EEFF' },
    { id: 'regulus',   name: 'Regulus',   ra: 10.1395, dec: 11.967,  mag: 1.35, col: '#C4D4FF' },
    { id: 'spica',     name: 'Spica',     ra: 13.4199, dec: -11.161, mag: 0.97, col: '#B9CCFF' },
    { id: 'arcturus',  name: 'Arcturus',  ra: 14.2610, dec: 19.183,  mag: -0.05, col: '#FFB27A' },
    { id: 'vega',      name: 'Vega',      ra: 18.6156, dec: 38.784,  mag: 0.03, col: '#E8EEFF' },
    { id: 'altair',    name: 'Altair',    ra: 19.8464, dec: 8.868,   mag: 0.76, col: '#F4F6FF' },
    { id: 'capella',   name: 'Capella',   ra: 5.2782,  dec: 45.998,  mag: 0.08, col: '#FFE6A8' },
    { id: 'peacock',   name: 'Peacock',   ra: 20.4275, dec: -56.735, mag: 1.94, col: '#C4D4FF' },
    { id: 'atria',     name: 'Atria',     ra: 16.8111, dec: -69.028, mag: 1.91, col: '#FFB27A' },
    { id: 'miaplac',   name: 'Miaplacidus', ra: 9.2200, dec: -69.717, mag: 1.68, col: '#F4F6FF' },
    { id: 'avior',     name: 'Avior',     ra: 8.3752,  dec: -59.510, mag: 1.86, col: '#FFC890' },
    { id: 'suhail',    name: 'Suhail',    ra: 9.1333,  dec: -43.433, mag: 2.21, col: '#FFB27A' },
    { id: 'regor',     name: 'Regor (Gamma Velorum)', ra: 8.1589, dec: -47.337, mag: 1.83, col: '#B9CCFF' },
    { id: 'deltavel',  name: 'Delta Velorum', ra: 8.7451, dec: -54.708, mag: 1.96, col: '#F4F6FF' },
    { id: 'alnair',    name: 'Alnair',    ra: 22.1372, dec: -46.961, mag: 1.74, col: '#C4D4FF' }
  ];

  // Figures the lab can draw and the kids can find.
  const FIGURES = [
    { id: 'crux', name: 'Cruz del Sur', en: 'Southern Cross',
      stars: ['gacrux', 'acrux', 'mimosa', 'imai'], extra: ['ginan'],
      lines: [['gacrux', 'acrux'], ['mimosa', 'imai']] },
    { id: 'pointers', name: 'Los Punteros', en: 'The Pointers (Alpha and Beta Centauri)',
      stars: ['rigilk', 'hadar'], lines: [['rigilk', 'hadar']] },
    { id: 'orion', name: 'Orión', en: 'Orion',
      stars: ['betelgeuse', 'bellatrix', 'alnitak', 'alnilam', 'mintaka', 'saiph', 'rigel'], extra: ['meissa'],
      lines: [['betelgeuse', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'],
              ['alnitak', 'alnilam'], ['alnilam', 'mintaka'], ['alnitak', 'saiph'], ['mintaka', 'rigel'],
              ['meissa', 'betelgeuse'], ['meissa', 'bellatrix']] },
    { id: 'belt', name: 'Las Tres Marías', en: "Orion's Belt",
      stars: ['alnitak', 'alnilam', 'mintaka'], lines: [['alnitak', 'alnilam'], ['alnilam', 'mintaka']] },
    { id: 'scorpius', name: 'Escorpión', en: 'Scorpius',
      stars: ['acrab', 'dschubba', 'antares', 'larawag', 'musco', 'sargas', 'shaula'],
      extra: ['pisco', 'alniyat', 'tausco', 'zetasco', 'etasco', 'iotasco', 'girtab', 'lesath'],
      lines: [['acrab', 'dschubba'], ['dschubba', 'pisco'], ['dschubba', 'alniyat'], ['alniyat', 'antares'],
              ['antares', 'tausco'], ['tausco', 'larawag'], ['larawag', 'musco'], ['musco', 'zetasco'],
              ['zetasco', 'etasco'], ['etasco', 'sargas'], ['sargas', 'iotasco'], ['iotasco', 'girtab'],
              ['girtab', 'shaula'], ['shaula', 'lesath']] },
    { id: 'canismajor', name: 'Can Mayor', en: 'Canis Major',
      stars: ['sirius', 'mirzam', 'wezen', 'adhara', 'aludra'],
      lines: [['mirzam', 'sirius'], ['sirius', 'wezen'], ['wezen', 'adhara'], ['wezen', 'aludra']] },
    { id: 'teapot', name: 'La Tetera', en: 'The Teapot (Sagittarius)',
      stars: ['kausaus', 'kausmed', 'kausbor', 'alnasl', 'phisgr', 'nunki', 'tausgr', 'ascella'],
      lines: [['alnasl', 'kausmed'], ['kausmed', 'kausaus'], ['kausaus', 'alnasl'], ['kausmed', 'kausbor'],
              ['kausbor', 'phisgr'], ['phisgr', 'kausmed'], ['phisgr', 'nunki'], ['nunki', 'tausgr'],
              ['tausgr', 'ascella'], ['ascella', 'phisgr'], ['ascella', 'kausaus']] }
  ];

  // Deep-sky patches drawn as soft glows (centre RA h, Dec °, size °).
  const PATCHES = [
    { id: 'lmc', name: 'Large Magellanic Cloud', ra: 5.393, dec: -69.75, w: 10.0, h: 8.5, a: 0.30, rot: 30 },
    { id: 'smc', name: 'Small Magellanic Cloud', ra: 0.878, dec: -72.83, w: 5.3, h: 3.2, a: 0.24, rot: 45 },
    { id: 'm42', name: 'Orion Nebula', ra: 5.588, dec: -5.39, w: 1.2, h: 1.0, a: 0.35, rot: 0, tint: '#FFC2E0' }
  ];

  // Where the sky is seen from: Santiago de Chile.
  const SITE = { name: 'Santiago, Chile', lat: -33.45, lon: -70.67 };

  return { STARS, FIGURES, PATCHES, SITE };
})();
window.LXData = LXData;
