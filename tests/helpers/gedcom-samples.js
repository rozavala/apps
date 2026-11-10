// A FICTIONAL family for the tests ("the Ejemplo and Muestra families"). Every name,
// date and place here is made up. Nothing in this repository comes from a real tree.
//
//   sample(opts)  GEDCOM text of a 5-generation family with a half-sibling, an adoption,
//                 a remarriage, notes (with CONC/CONT), custom _tags and living people.
//   big(n, seed)  a generated tree of about n people for size tests.
//
// People ids (I..): the kid is I24 "Lucía Ejemplo" (born 2016); see ME below.

const ME = 'I24';

// id, given, surname, sex, [birth date, birth place], [death date, death place], extras
const PEOPLE = [
  ['I1', 'Giuseppe', 'Ejemplo', 'M', ['3 FEB 1878', 'Turín, Piamonte, Italia'], ['ABT 1944', 'Valparaíso, Chile']],
  ['I2', 'Maria', 'Bianchi', 'F', ['1882', 'Turín, Piamonte, Italia'], ['1960', 'Valparaíso, Chile']],
  ['I3', 'Anselmo', 'Prado', 'M', ['12 AUG 1880', 'Oviedo, Asturias, España'], ['1951', 'Santiago, Chile']],
  ['I4', 'Carmen', 'Lugo', 'F', ['1884', 'Gijón, Asturias, España'], ['1962', 'Santiago, Chile']],
  ['I5', 'Ernesto', 'Ejemplo', 'M', ['5 MAY 1908', 'Valparaíso, Chile'], ['1979', 'Valparaíso, Chile']],
  ['I6', 'Rosa', 'Prado', 'F', ['1912', 'Santiago, Chile'], ['1998', 'Santiago, Chile']],
  ['I7', 'Tomás', 'Muestra', 'M', ['1915', 'Concepción, Chile'], ['1990', 'Concepción, Chile']],
  ['I8', 'Elena', 'Vidal', 'F', ['1919', 'Chillán, Chile'], ['2005', 'Concepción, Chile']],
  ['I9', 'Hugo', 'Soto', 'M', ['1913', 'Mendoza, Argentina'], ['1985', 'Mendoza, Argentina']],
  ['I10', 'Irene', 'Ríos', 'F', ['1916', 'Mendoza, Argentina'], ['2001', 'Mendoza, Argentina']],
  ['I11', 'Alberto', 'Ejemplo', 'M', ['1938', 'Valparaíso, Chile'], ['2019', 'Santiago, Chile']],
  ['I12', 'Marta', 'Soto', 'F', ['1941', 'Mendoza, Argentina']],
  ['I13', 'Luis', 'Muestra', 'M', ['1944', 'Concepción, Chile'], ['2020', 'Santiago, Chile']],
  ['I14', 'Sara', 'Núñez', 'F', ['1947', 'Santiago, Chile']],
  ['I15', 'Daniel', 'Ejemplo', 'M', ['1968', 'Santiago, Chile']],
  ['I16', 'Paula', 'Muestra', 'F', ['1971', 'Santiago, Chile']],
  ['I17', 'Teresa', 'Ejemplo', 'F', ['1962', 'Santiago, Chile']],
  ['I19', 'Olga', 'Paz', 'F', ['1940', 'Valparaíso, Chile']],
  ['I20', 'Martín', 'Díaz', 'M', ['1990', 'Santiago, Chile']],
  ['I21', 'Andrés', 'Muestra', 'M', ['1975', 'Santiago, Chile']],
  ['I22', 'Julia', 'Cruz', 'F', ['1978', 'Viña del Mar, Chile']],
  ['I23', 'Mateo', 'Muestra', 'M', ['2012', 'Santiago, Chile']],
  ['I24', 'Lucía', 'Ejemplo', 'F', ['12 MAY 2016', 'Santa Clara, California, USA']],
  ['I25', 'Tomás', 'Ejemplo', 'M', ['2019', 'San José, California, USA']],
  ['I26', 'Iván', 'Ejemplo', 'M', ['2014', 'Santiago, Chile']],
  ['I27', 'Clara', 'Ejemplo', 'F', ['1941', 'Valparaíso, Chile']],
  ['I28', 'Víctor', 'Díaz', 'M', ['1960', 'Rancagua, Chile']],
  ['I29', 'Ema', 'Lugo', 'F', ['1890', 'Gijón, Asturias, España'], ['1970', 'Gijón, Asturias, España']]   // a sister of I4: Lucía's great-great-great-aunt
];

// family id, husband, wife, [children], [marriage date, place], extras
const FAMILIES = [
  ['F1', 'I1', 'I2', ['I5'], ['1905', 'Valparaíso, Chile']],
  ['F2', 'I3', 'I4', ['I6'], ['1909', 'Oviedo, Asturias, España']],
  ['F3', 'I5', 'I6', ['I11', 'I27'], ['1936', 'Santiago, Chile']],
  ['F4', 'I7', 'I8', ['I13'], ['1940', 'Concepción, Chile']],
  ['F5', 'I9', 'I10', ['I12'], ['1938', 'Mendoza, Argentina']],
  ['F6', 'I11', 'I19', ['I17'], ['1960', 'Valparaíso, Chile'], { div: '1964' }],
  ['F7', 'I11', 'I12', ['I15'], ['1965', 'Santiago, Chile']],
  ['F8', 'I13', 'I14', ['I16', 'I21'], ['1969', 'Santiago, Chile']],
  ['F9', 'I15', 'I16', ['I24', 'I25', 'I26'], ['2012', 'Santiago, Chile'], { adopted: 'I26' }],
  ['F10', 'I21', 'I22', ['I23'], ['2010', 'Viña del Mar, Chile']],
  ['F11', 'I28', 'I17', ['I20'], ['1988', 'Santiago, Chile']]
];
// I29 (Ema) shares parents with Carmen (I4): family F13
FAMILIES.push(['F13', 'I30', 'I31', ['I4', 'I29']]);
PEOPLE.push(['I30', 'Bernardo', 'Lugo', 'M', ['1855', 'Gijón, Asturias, España'], ['1920', 'Gijón, Asturias, España']],
            ['I31', 'Josefa', 'Alonso', 'F', ['1859', 'Gijón, Asturias, España'], ['1930', 'Gijón, Asturias, España']]);

function wrap(tag, text, level) {
  // CONC the long lines the way programs do (every 70 characters)
  const out = [];
  const parts = String(text).split('\n');
  parts.forEach((part, pi) => {
    let rest = part, first = true;
    do {
      const chunk = rest.slice(0, 70); rest = rest.slice(70);
      if (pi === 0 && first) out.push(level + ' ' + tag + ' ' + chunk);
      else if (first) out.push((level + 1) + ' CONT ' + chunk);
      else out.push((level + 1) + ' CONC ' + chunk);
      first = false;
    } while (rest.length);
  });
  return out;
}

function sample(o = {}) {
  const v7 = o.version === '7.0';
  const L = [];
  L.push('0 HEAD');
  if (v7) { L.push('1 GEDC', '2 VERS 7.0'); }
  else { L.push('1 SOUR FakeTree', '2 NAME Fake Tree Program (tests)', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'); }
  L.push('1 _CUSTOMHEAD ignored');
  // a shared note record
  L.push('0 @N1@ NOTE The family kept a small shop near the port.');
  L.push('1 CONT It was open every morning, and a bell rang over the door.');
  const extra = o.extra || {};
  PEOPLE.forEach(([id, g, s, sex, birth, death]) => {
    L.push(`0 @${id}@ INDI`);
    L.push(`1 NAME ${g} /${s}/`, `2 GIVN ${g}`, `2 SURN ${s}`);
    L.push(`1 SEX ${sex}`);
    if (birth) { L.push('1 BIRT', `2 DATE ${birth[0]}`, `2 PLAC ${birth[1]}`); }
    if (death) { L.push('1 DEAT', `2 DATE ${death[0]}`, `2 PLAC ${death[1]}`); }
    if (id === 'I13') {
      L.push('1 OCCU Carpenter');
      wrap('NOTE', 'Luis worked as a carpenter and built the long table where the family ate on Sundays. He liked to whistle while he worked, and the neighbours knew he was home when they heard it.\nHe taught his children to measure twice and cut once.', 1).forEach(l => L.push(l));
    }
    if (id === 'I5') L.push('1 NOTE @N1@', '1 RESI', '2 DATE FROM 1930 TO 1950', '2 PLAC Valparaíso, Chile');
    if (id === 'I1') L.push('1 EMIG', '2 DATE ABT 1900', '2 PLAC Génova, Italia', '1 IMMI', '2 DATE 1903', '2 PLAC Valparaíso, Chile', '1 _FSFTID LZ1A-2B3');
    if (id === 'I15') L.push('1 _TAG Something custom', '2 _SUBTAG nested');
    if (id === 'I12') L.push('1 RESN privacy');
    if (id === 'I24') L.push('1 NOTE Private note that must not be shown unless a parent allows it.');
    if (extra[id]) extra[id].forEach(l => L.push(l));
    FAMILIES.forEach(f => {
      if (f[1] === id || f[2] === id) L.push(`1 FAMS @${f[0]}@`);
    });
    FAMILIES.forEach(f => {
      if ((f[3] || []).includes(id)) {
        L.push(`1 FAMC @${f[0]}@`);
        if (f[5] && f[5].adopted === id) L.push('2 PEDI adopted');
      }
    });
    L.push('1 SOUR @S1@', '1 OBJE @M1@');
  });
  FAMILIES.forEach(f => {
    L.push(`0 @${f[0]}@ FAM`);
    if (f[1]) L.push(`1 HUSB @${f[1]}@`);
    if (f[2]) L.push(`1 WIFE @${f[2]}@`);
    (f[3] || []).forEach(c => L.push(`1 CHIL @${c}@`));
    if (f[4]) L.push('1 MARR', `2 DATE ${f[4][0]}`, `2 PLAC ${f[4][1]}`);
    if (f[5] && f[5].div) L.push('1 DIV', `2 DATE ${f[5].div}`);
  });
  L.push('0 @S1@ SOUR', '1 TITL A parish book (fictional)', '0 @M1@ OBJE', '1 FILE photo.jpg', '0 TRLR');
  return L.join(o.eol || '\n') + (o.eol || '\n');
}

// A generated tree of about n people: couples with 2 to 4 children, a few generations deep.
function big(n, seed = 7) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const given = ['Ana', 'Beto', 'Cora', 'Dario', 'Eva', 'Fabio', 'Gala', 'Hugo', 'Ines', 'Jano', 'Kira', 'Lalo', 'Mina', 'Nico', 'Olga', 'Pepe'];
  const sur = ['Ejemplo', 'Muestra', 'Prueba', 'Modelo', 'Sirva', 'Falso'];
  const places = ['Santiago, Chile', 'Valparaíso, Chile', 'Turín, Italia', 'Gijón, España', 'Mendoza, Argentina', 'Leeds, Inglaterra', 'Austin, Texas, USA', 'Lyon, Francia'];
  const L = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1', '1 CHAR UTF-8'];
  const people = [], fams = [];
  let nextI = 1, nextF = 1;
  function person(year) {
    const id = 'I' + (nextI++);
    people.push({ id, g: given[Math.floor(rnd() * given.length)] + ' ' + given[Math.floor(rnd() * given.length)], s: sur[Math.floor(rnd() * sur.length)], z: rnd() < 0.5 ? 'M' : 'F', by: year, bp: places[Math.floor(rnd() * places.length)], famc: null, fams: [] });
    return people[people.length - 1];
  }
  let frontier = [];
  for (let i = 0; i < 40; i++) frontier.push(person(1800 + Math.floor(rnd() * 40)));
  while (people.length < n) {
    const next = [];
    for (const p of frontier) {
      if (people.length >= n) break;
      const mate = person(p.by + Math.floor(rnd() * 8) - 3);
      const fid = 'F' + (nextF++);
      const f = { id: fid, h: p.z === 'M' ? p.id : mate.id, w: p.z === 'M' ? mate.id : p.id, c: [], my: p.by + 24, mp: p.bp };
      p.fams.push(fid); mate.fams.push(fid);
      const nc = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < nc && people.length < n; k++) {
        const c = person(p.by + 24 + k * 2);
        c.famc = fid; f.c.push(c.id); next.push(c);
      }
      fams.push(f);
    }
    frontier = next.length ? next : [person(1900)];
  }
  const noteText = 'A short family story: they moved house, planted a lemon tree and kept the recipe book. '.repeat(3);
  people.forEach(p => {
    L.push(`0 @${p.id}@ INDI`, `1 NAME ${p.g} /${p.s}/`, `1 SEX ${p.z}`, '1 BIRT', `2 DATE ${p.by}`, `2 PLAC ${p.bp}, Region ${p.id}`);
    if (p.by < 1930) L.push('1 DEAT', `2 DATE ${p.by + 70}`, `2 PLAC ${p.bp}`);
    L.push('1 OCCU Worker', '1 RESI', `2 DATE ${p.by + 30}`, `2 PLAC ${p.bp}`);
    L.push('1 NOTE ' + noteText, '1 SOUR @S1@', '2 PAGE page 12');
    if (p.famc) L.push(`1 FAMC @${p.famc}@`);
    p.fams.forEach(f => L.push(`1 FAMS @${f}@`));
  });
  fams.forEach(f => {
    L.push(`0 @${f.id}@ FAM`, `1 HUSB @${f.h}@`, `1 WIFE @${f.w}@`);
    f.c.forEach(c => L.push(`1 CHIL @${c}@`));
    L.push('1 MARR', `2 DATE ${f.my}`, `2 PLAC ${f.mp}`);
  });
  L.push('0 @S1@ SOUR', '1 TITL A book', '0 TRLR');
  return L.join('\n') + '\n';
}

module.exports = { sample, big, ME, PEOPLE, FAMILIES };

if (require.main === module) {
  const fs = require('fs'), path = require('path');
  fs.writeFileSync(path.join(__dirname, '..', 'fixtures', 'familia-ejemplo.ged'), sample());
  fs.writeFileSync(path.join(__dirname, '..', 'fixtures', 'familia-ejemplo-7.ged'), sample({ version: '7.0' }));
  console.log('written');
}
