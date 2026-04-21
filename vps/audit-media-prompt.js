#!/usr/bin/env node
/* ================================================================
   BOOK & MOVIE CHECK — Regression Audit
   Runs a corpus of known-good / known-flagged titles through the
   deployed /api/media/test-evaluate endpoint and reports pass/fail.

   Usage:
     node vps/audit-media-prompt.js
     node vps/audit-media-prompt.js --vps https://other.url
     node vps/audit-media-prompt.js --bail      # stop on first failure
     node vps/audit-media-prompt.js --only lgbtq-crt   # run one category

   Requires Node.js 18+ (uses global fetch).
   Exit code: 0 all pass, 1 failures, 2 fatal.
   ================================================================ */
'use strict';

const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
}
const VPS = argVal('--vps', 'https://real-options-dev.tail57521e.ts.net');
const BAIL = args.includes('--bail');
const ONLY = argVal('--only', null);

const SEV = { none: 0, mild: 1, moderate: 2, significant: 3 };
const sevLte = (a, b) => SEV[a] <= SEV[b];
const sevGte = (a, b) => SEV[a] >= SEV[b];

// Mirror of the client-side grown-up / values banner logic.
// Returns one of: 'approved' | 'caution' | 'grown-up' | 'values'
function predictedBanner(result) {
  const f = result.content_flags || {};
  const valuesFlags = ['lgbtq_content', 'crt_ideology', 'anti_religious', 'occult_aspirational'];
  const hasSignificantValues = valuesFlags.some(k => f[k] === 'significant');
  const hasModerateValues = valuesFlags.some(k => f[k] === 'moderate');
  const hasSignificantRelativism = f.moral_relativism === 'significant';
  const hasSignificantDisrespect = f.disrespect_authority === 'significant';
  const hasValuesIssue = hasSignificantValues || hasModerateValues ||
                         hasSignificantRelativism || hasSignificantDisrespect;

  // Age-gated grown-up book — fires regardless of verdict
  if (!hasValuesIssue && result.minimum_age && result.minimum_age >= 13) {
    return 'grown-up';
  }

  // Values rejection
  if (result.verdict === 'not_recommended') return 'values';

  // Standard caution / approved
  if (result.verdict === 'caution') return 'caution';
  return 'approved';
}

// ── Test corpus ────────────────────────────────────────────────
// Each entry has a synopsis chosen to give Gemini enough signal to
// judge the book without needing external metadata. Expectations use
// flagMax (must be at most this severity) and flagMin (must be at least
// this severity). verdict:null means informational only.

const CORPUS = [

  // ═══════════════════════════════════════════════════════════════
  // Category A — independent-protagonist safe books.
  // These MUST approve; disrespect_authority MUST be "none".
  // These are the regression tests for the criterion-6 fix.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'independent-protagonist',
    title: 'Anne of Green Gables',
    author_or_director: 'L. M. Montgomery',
    year: 1908, type: 'book',
    synopsis: 'Eleven-year-old orphan Anne Shirley is mistakenly sent to Matthew and Marilla Cuthbert on Prince Edward Island, who had requested a boy. Her warmth and imagination gradually win over her reluctant adoptive family. She struggles with her temper, makes lifelong friends, earns a scholarship to Queen\'s Academy, and grows into a young woman of faith and responsibility. A classic of Christian virtue formation.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none', lgbtq_content: 'none', crt_ideology: 'none' } }
  },
  {
    category: 'independent-protagonist',
    title: 'The Boxcar Children',
    author_or_director: 'Gertrude Chandler Warner',
    year: 1924, type: 'book',
    synopsis: 'Four orphaned siblings—Henry, Jessie, Violet, and Benny Alden—run away after their parents\' death, fearing an unknown grandfather will be cruel. They make a home in an abandoned red boxcar, find a dog, work odd jobs, and care for each other. Their grandfather turns out to be kind and wealthy, and brings them home—boxcar and all. A story of sibling loyalty and the joy of reunion with loving kin.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none' } }
  },
  {
    category: 'independent-protagonist',
    title: 'A Little Princess',
    author_or_director: 'Frances Hodgson Burnett',
    year: 1905, type: 'book',
    synopsis: 'Sara Crewe, the privileged daughter of a wealthy British officer, arrives at Miss Minchin\'s London boarding school. When her father dies and his fortune is lost, Sara is reduced to a scullery maid, treated cruelly by Miss Minchin. She bears her suffering with grace and charity toward other poor children. Her father\'s friend eventually finds and adopts her. A classic of Christian virtue: humility, endurance under injustice, kindness to the poor.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none' } }
  },
  {
    category: 'independent-protagonist',
    title: 'The Lion, the Witch and the Wardrobe',
    author_or_director: 'C. S. Lewis',
    year: 1950, type: 'book',
    synopsis: 'The four Pevensie children are evacuated from wartime London and discover a wardrobe leading to Narnia, frozen under the White Witch\'s curse. With the great lion Aslan, they face betrayal and redemption: Edmund\'s treachery is atoned for by Aslan\'s sacrifice and resurrection on the Stone Table. The children become kings and queens of Narnia. An explicit Christian allegory of the Fall, Redemption, and Resurrection.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none', occult_aspirational: 'none' } }
  },
  {
    category: 'independent-protagonist',
    title: 'Heidi',
    author_or_director: 'Johanna Spyri',
    year: 1881, type: 'book',
    synopsis: 'Orphaned five-year-old Heidi is sent to live with her gruff, reclusive grandfather in the Swiss Alps. Her warmth softens the old man\'s heart and restores his faith. Later sent to Frankfurt as companion to the invalid Clara Sesemann, Heidi suffers homesickness but brings love to the household, and Clara\'s grandmother teaches her to read and pray. Eventually Heidi returns to the Alps and Clara visits, learning to walk again. A Christian story of Providence and healing.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none' } }
  },
  {
    category: 'independent-protagonist',
    title: 'A Wrinkle in Time',
    author_or_director: 'Madeleine L\'Engle',
    year: 1962, type: 'book',
    synopsis: 'Awkward Meg Murry, her brilliant little brother Charles Wallace, and classmate Calvin O\'Keefe are guided by three celestial beings to travel by tesseract to rescue Meg\'s father, imprisoned on the planet Camazotz by IT, a disembodied evil enforcing conformity. The cosmic battle between good and evil is framed in overtly Christian terms; Jesus is named among the great fighters against darkness. Love, sacrifice, and individual worth triumph.',
    expect: {
      verdictIn: ['approved', 'caution'],
      flagMax: { disrespect_authority: 'none', lgbtq_content: 'none', crt_ideology: 'none' }
    }
  },
  {
    category: 'independent-protagonist',
    title: 'James and the Giant Peach',
    author_or_director: 'Roald Dahl',
    year: 1961, type: 'book',
    synopsis: 'Orphaned James Henry Trotter is sent to live with his cruel, abusive aunts, Aunt Sponge and Aunt Spiker, who treat him as a slave. A gift of magic crystals causes a peach to grow enormous, and James crawls inside to find a crew of giant talking insects. The peach rolls away, crushing the wicked aunts, and the travelers journey across the Atlantic to New York, where James is welcomed and the insects find new homes. A story of escape from abuse into a loving community.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none' } }
  },

  // ═══════════════════════════════════════════════════════════════
  // Category B — classic virtue / intact family baselines.
  // Straightforward approvals; sanity check the pipeline.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'classic-virtue',
    title: 'Charlotte\'s Web',
    author_or_director: 'E. B. White',
    year: 1952, type: 'book',
    synopsis: 'Eight-year-old Fern rescues a runt piglet named Wilbur from slaughter and raises him until he is moved to her uncle\'s barn, where he befriends Charlotte, a wise barn spider. Charlotte saves Wilbur\'s life from the butcher by weaving words into her web that astonish the farmer. At the end of her natural lifespan Charlotte dies after laying her eggs, and Wilbur faithfully cares for her children. Friendship, loyalty, sacrifice, and acceptance of mortality.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none', lgbtq_content: 'none' } }
  },
  {
    category: 'classic-virtue',
    title: 'Little Women',
    author_or_director: 'Louisa May Alcott',
    year: 1868, type: 'book',
    synopsis: 'The March sisters—Meg, Jo, Beth, and Amy—come of age in Civil-War-era New England under the guidance of their saintly mother Marmee while their father serves as a Union chaplain. The novel follows their moral struggles with vanity, anger, envy, and selfishness, modeled explicitly on Bunyan\'s Pilgrim\'s Progress. An unapologetically Christian bildungsroman centered on virtue, family, and duty.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none', lgbtq_content: 'none', crt_ideology: 'none' } }
  },
  {
    category: 'classic-virtue',
    title: 'Little House on the Prairie',
    author_or_director: 'Laura Ingalls Wilder',
    year: 1935, type: 'book',
    synopsis: 'The semi-autobiographical account of the Ingalls family—Charles (Pa), Caroline (Ma), and daughters Mary and Laura—leaving Wisconsin to settle on the Kansas prairie in a hand-built log cabin. The novel chronicles hardships and joys: building the homestead, encounters with Osage Indians, prairie fire, malaria, and being forced off the land by the government. The family\'s strong Christian faith, industry, and love anchor every episode.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none' } }
  },
  {
    category: 'classic-virtue',
    title: 'The Penderwicks',
    author_or_director: 'Jeanne Birdsall',
    year: 2005, type: 'book',
    synopsis: 'Four sisters—Rosalind, Skye, Jane, and Batty—and their widowed father rent a cottage on the Arundel estate for summer vacation. They befriend Jeffrey, the lonely son of the estate\'s haughty owner, and navigate a summer of mild adventures, family loyalty, and protecting Jeffrey from being sent to military school against his will. A wholesome, intact-family, virtue-forward novel deliberately written in the tradition of E. Nesbit and Edward Eager.',
    expect: { verdict: 'approved', flagMax: { disrespect_authority: 'none', lgbtq_content: 'none' } }
  },

  // ═══════════════════════════════════════════════════════════════
  // Category C — LGBTQ / CRT books that MUST be flagged.
  // These test the reinforced criteria 1 and 2.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'lgbtq-crt',
    title: 'Melissa',
    author_or_director: 'Alex Gino',
    year: 2015, type: 'book',
    synopsis: 'Melissa, originally published as George, is a middle-grade novel about a fourth-grader everyone perceives as a boy named George. Internally she knows she is a girl. The novel follows her as she convinces her friend Kelly and her mother that she is transgender, culminating in Melissa playing the role of Charlotte in a school production of Charlotte\'s Web. The book explicitly advocates affirmation of transgender identity in children and is widely used to introduce trans themes to elementary readers.',
    expect: { verdict: 'not_recommended', flagMin: { lgbtq_content: 'significant' } }
  },
  {
    category: 'lgbtq-crt',
    title: 'Heather Has Two Mommies',
    author_or_director: 'Lesléa Newman',
    year: 1989, type: 'book',
    synopsis: 'A picture book for preschoolers. Three-year-old Heather has two mothers, Mama Jane and Mama Kate. At her preschool the teacher leads an exercise in which children draw their families and learns that families come in many forms, including same-sex parents and single parents. One of the first mainstream picture books written to normalize same-sex parenting for young children.',
    expect: { verdict: 'not_recommended', flagMin: { lgbtq_content: 'significant' } }
  },
  {
    category: 'lgbtq-crt',
    title: 'Antiracist Baby',
    author_or_director: 'Ibram X. Kendi',
    year: 2020, type: 'book',
    synopsis: 'A board book adapted from Kendi\'s How to Be an Antiracist, aimed at infants and toddlers. Presents nine steps for being an antiracist baby, including recognizing every color and confessing when being racist. The book teaches explicit Critical Race Theory framings to pre-readers: that racial inequality results from racist policies, that colorblindness is harmful, and that children must actively oppose a system of racism.',
    expect: { verdict: 'not_recommended', flagMin: { crt_ideology: 'significant' } }
  },
  {
    category: 'lgbtq-crt',
    title: 'Julian Is a Mermaid',
    author_or_director: 'Jessica Love',
    year: 2018, type: 'book',
    synopsis: 'A picture book in which a young boy named Julian, riding the subway with his abuela, sees three women dressed as mermaids and becomes captivated. At home he dresses up as a mermaid using a curtain and makeup. His grandmother, after an initial silence, embraces his self-expression and takes him to the annual Coney Island Mermaid Parade. Widely celebrated as a pro-gender-non-conformity picture book for preschool and early elementary readers.',
    expect: { verdict: 'not_recommended', flagMin: { lgbtq_content: 'moderate' } }
  },

  // ═══════════════════════════════════════════════════════════════
  // Informational — no pass/fail. Useful for eyeballing.
  // These are genuine edge cases for this family.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'informational',
    title: 'Pippi Longstocking',
    author_or_director: 'Astrid Lindgren',
    year: 1945, type: 'book',
    synopsis: 'Nine-year-old Pippi Longstocking has superhuman strength and lives alone in Villa Villekulla with her monkey and horse; her sailor father is believed lost at sea. Pippi flouts convention: she refuses to attend school normally, outwits burglars and police, and invents her own rules. She is kind, generous, and loyal to her friends Tommy and Annika. A whimsical children\'s classic frequently discussed in debates about children\'s literature and authority.',
    expect: { verdict: null }
  },
  {
    category: 'informational',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author_or_director: 'J. K. Rowling',
    year: 1997, type: 'book',
    synopsis: 'Eleven-year-old orphan Harry Potter, neglected by his aunt and uncle, discovers he is a wizard and has been accepted to Hogwarts School of Witchcraft and Wizardry. With friends Ron and Hermione he learns he survived an attack by the dark wizard Voldemort and prevents Voldemort from stealing the Sorcerer\'s Stone. Magic is central to the series. The book is disputed in Catholic circles: some families reject it for occult elements, others accept it as literary magic akin to Narnia.',
    expect: { verdict: null }
  },
  {
    category: 'informational',
    title: 'Percy Jackson and the Olympians: The Lightning Thief',
    author_or_director: 'Rick Riordan',
    year: 2005, type: 'book',
    synopsis: 'Twelve-year-old Percy Jackson learns he is the son of the Greek god Poseidon and a mortal woman. He is sent to Camp Half-Blood for demigods and accused of stealing Zeus\'s master lightning bolt. With his friends Annabeth (daughter of Athena) and Grover (a satyr), Percy journeys across America to the underworld to find the bolt. A middle-grade pastiche of Greek mythology, with Olympian gods and monsters drawn from classical sources.',
    expect: { verdict: null }
  },

  // ═══════════════════════════════════════════════════════════════
  // Category D — Maturity-gate classics.
  // These MUST return verdict: not_recommended with banner: 'grown-up'
  // (amber "Grown-up book" framing, NOT red "Not for our family").
  // Test for the round-2 banner split: adult content alone must not
  // trigger values-rejection messaging.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'maturity-gate',
    title: 'Crime and Punishment',
    author_or_director: 'Fyodor Dostoevsky',
    year: 1866, type: 'book',
    synopsis: 'Raskolnikov, an impoverished former student in St. Petersburg, murders an elderly pawnbroker and her sister with an axe, convinced by a theory that extraordinary men are above conventional morality. The novel follows his psychological torment, pursuit by the detective Porfiry Petrovich, and eventual confession and redemption through the love of the devout Christian prostitute Sonya. A major work of Christian literature on sin, guilt, and the mercy of God. Contains graphic violence and adult themes.',
    expect: {
      verdict: 'caution',  // per prompt rules: violence-significant alone → caution
      banner: 'grown-up',
      flagMax: { lgbtq_content: 'none', crt_ideology: 'none', anti_religious: 'none' },
      minAge: 14
    }
  },
  {
    category: 'maturity-gate',
    title: 'The Brothers Karamazov',
    author_or_director: 'Fyodor Dostoevsky',
    year: 1880, type: 'book',
    synopsis: 'The sensual patriarch Fyodor Pavlovich Karamazov and his three sons — the passionate Dmitri, the intellectual atheist Ivan, and the devout novice monk Alyosha — are drawn into a tangle of passion, philosophical debate, and eventual patricide. The novel contains the famous "Grand Inquisitor" chapter and the teachings of the Elder Zosima, making it one of the most important Christian philosophical novels ever written. Contains adult themes: illegitimate children, a love triangle, and graphic discussion of violence against children in theological debate.',
    expect: {
      verdictIn: ['approved', 'caution', 'not_recommended'],  // Gemini's literary weighting varies
      banner: 'grown-up',  // load-bearing: what the kid actually sees
      flagMax: { lgbtq_content: 'none', crt_ideology: 'none', anti_religious: 'mild' },
      minAge: 14
    }
  },
  {
    category: 'maturity-gate',
    title: 'Anna Karenina',
    author_or_director: 'Leo Tolstoy',
    year: 1878, type: 'book',
    synopsis: 'Anna Karenina, wife of a St. Petersburg government official and mother of a young son, begins an affair with the cavalry officer Count Vronsky. Her abandonment of husband and son, and her subsequent social isolation, culminate in her suicide by throwing herself under a train. In parallel, the devout landowner Konstantin Levin courts Kitty Shcherbatskaya and wrestles with questions of faith and meaning, eventually finding Christian peace. Tolstoy presents Anna\'s adultery as ruinous and Levin\'s faith as redemptive. Contains adultery as a central theme.',
    expect: {
      verdict: 'not_recommended',
      banner: 'grown-up',
      flagMax: { lgbtq_content: 'none', crt_ideology: 'none', anti_religious: 'none' },
      minAge: 15
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // Category E — Ideological rejection re-confirm.
  // These MUST return verdict: not_recommended with banner: 'values'
  // (red "Not for our family" framing). Guards against the maturity-gate
  // branch accidentally softening ideological rejections.
  // ═══════════════════════════════════════════════════════════════
  {
    category: 'values-rejection',
    title: 'Melissa (banner re-confirm)',
    author_or_director: 'Alex Gino',
    year: 2015, type: 'book',
    synopsis: 'Melissa, originally published as George, is a middle-grade novel about a fourth-grader everyone perceives as a boy named George. Internally she knows she is a girl. The novel follows her as she convinces her friend Kelly and her mother that she is transgender, culminating in Melissa playing the role of Charlotte in a school production of Charlotte\'s Web. The book explicitly advocates affirmation of transgender identity in children.',
    expect: {
      verdict: 'not_recommended',
      banner: 'values',
      flagMin: { lgbtq_content: 'significant' }
    }
  },
  {
    category: 'values-rejection',
    title: 'Antiracist Baby (banner re-confirm)',
    author_or_director: 'Ibram X. Kendi',
    year: 2020, type: 'book',
    synopsis: 'A board book adapted from Kendi\'s How to Be an Antiracist, aimed at infants and toddlers. Presents nine steps for being an antiracist baby, including recognizing every color and confessing when being racist. The book teaches explicit Critical Race Theory framings to pre-readers: that racial inequality results from racist policies, that colorblindness is harmful, and that children must actively oppose a system of racism.',
    expect: {
      verdict: 'not_recommended',
      banner: 'values',
      flagMin: { crt_ideology: 'significant' }
    }
  },
];

// ── Runner ─────────────────────────────────────────────────────

const MAX_RETRIES_503 = 4;   // Gemini overload — usually clears fast
const MAX_RETRIES_429 = 2;   // quota — retry a couple times, then give up
const PACING_MS = 2000;      // delay between tests

async function testEvaluate(metadata, attempt) {
  attempt = attempt || 1;
  const r = await fetch(VPS + '/api/media/test-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata })
  });

  if (r.status === 503 && attempt <= MAX_RETRIES_503) {
    const wait = 5000 * attempt;  // 5s, 10s, 15s, 20s
    console.log('\n   ⏸️  upstream 503 (overloaded); retry ' + attempt + '/' + MAX_RETRIES_503 + ' in ' + (wait / 1000) + 's…');
    await new Promise(res => setTimeout(res, wait));
    return testEvaluate(metadata, attempt + 1);
  }
  if (r.status === 429 && attempt <= MAX_RETRIES_429) {
    const wait = 60000 * attempt;  // 60s, 120s
    console.log('\n   ⏸️  upstream 429 (quota); retry ' + attempt + '/' + MAX_RETRIES_429 + ' in ' + (wait / 1000) + 's…');
    await new Promise(res => setTimeout(res, wait));
    return testEvaluate(metadata, attempt + 1);
  }

  if (!r.ok) {
    const body = await r.text();
    throw new Error('HTTP ' + r.status + ': ' + body.slice(0, 200));
  }
  return r.json();
}

function grade(test, result) {
  if (!test.expect || test.expect.verdict === null) {
    return { status: 'info', notes: [] };
  }
  const notes = [];
  let pass = true;

  // Verdict check — supports either exact match or a list
  if (test.expect.verdict && result.verdict !== test.expect.verdict) {
    notes.push('verdict: expected "' + test.expect.verdict + '", got "' + result.verdict + '"');
    pass = false;
  }
  if (test.expect.verdictIn && !test.expect.verdictIn.includes(result.verdict)) {
    notes.push('verdict: expected one of [' + test.expect.verdictIn.join(', ') +
               '], got "' + result.verdict + '"');
    pass = false;
  }

  // Banner check — verifies client-side would render the correct framing
  if (test.expect.banner) {
    const actualBanner = predictedBanner(result);
    if (actualBanner !== test.expect.banner) {
      notes.push('banner: expected "' + test.expect.banner + '", got "' + actualBanner + '"' +
        ' (min_age=' + (result.minimum_age || '?') +
        ', flags=' + JSON.stringify(result.content_flags || {}) + ')');
      pass = false;
    }
  }

  // Flag max check
  const flags = result.content_flags || {};
  for (const f of Object.keys(test.expect.flagMax || {})) {
    const max = test.expect.flagMax[f];
    const actual = flags[f] || 'none';
    if (!sevLte(actual, max)) {
      notes.push(f + ': expected ≤ "' + max + '", got "' + actual + '"');
      pass = false;
    }
  }

  // Flag min check
  for (const f of Object.keys(test.expect.flagMin || {})) {
    const min = test.expect.flagMin[f];
    const actual = flags[f] || 'none';
    if (!sevGte(actual, min)) {
      notes.push(f + ': expected ≥ "' + min + '", got "' + actual + '"');
      pass = false;
    }
  }

  // Minimum age check
  if (typeof test.expect.minAge === 'number') {
    const gotAge = result.minimum_age || 0;
    if (gotAge < test.expect.minAge) {
      notes.push('minimum_age: expected ≥ ' + test.expect.minAge + ', got ' + gotAge);
      pass = false;
    }
  }

  return { status: pass ? 'pass' : 'fail', notes };
}

function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }

async function main() {
  console.log('📚 Zavala Serra — Book & Movie Check Audit');
  console.log('   VPS: ' + VPS);

  const corpus = ONLY ? CORPUS.filter(t => t.category === ONLY) : CORPUS;
  if (!corpus.length) {
    console.log('   No tests match --only ' + ONLY);
    process.exit(2);
  }
  const scoredCount = corpus.filter(t => t.expect && t.expect.verdict !== null).length;
  const infoCount = corpus.length - scoredCount;
  console.log('   Corpus: ' + scoredCount + ' scored, ' + infoCount + ' informational\n');

  let promptVersionSeen = null;
  const results = [];
  for (let i = 0; i < corpus.length; i++) {
    const test = corpus[i];
    process.stdout.write('🧪 [' + (i + 1) + '/' + corpus.length + '] ' + test.title + ' … ');
    try {
      const result = await testEvaluate({
        title: test.title,
        author_or_director: test.author_or_director,
        year: test.year,
        type: test.type,
        synopsis: test.synopsis
      });
      if (promptVersionSeen === null && typeof result.prompt_version === 'number') {
        promptVersionSeen = result.prompt_version;
      }
      const g = grade(test, result);
      results.push({ test, result, grade: g });

      if (g.status === 'pass') {
        const banner = predictedBanner(result);
        const bannerLabel = banner === result.verdict ? '' : ' → ' + banner;
        console.log('✅ PASS (' + result.verdict + bannerLabel + ')');
      } else if (g.status === 'fail') {
        console.log('❌ FAIL');
        g.notes.forEach(n => console.log('     • ' + n));
        // Always print the full verdict/flags/age snapshot on failure for diagnosis
        const f = result.content_flags || {};
        const activeFlags = Object.keys(f)
          .filter(k => f[k] !== 'none')
          .map(k => k + '=' + f[k])
          .join(', ') || '(all none)';
        console.log('     · verdict=' + result.verdict +
                    ', min_age=' + (result.minimum_age || '?') +
                    ', flags={' + activeFlags + '}');
        if (BAIL) {
          console.log('\nStopping after first failure (--bail).');
          break;
        }
      } else {
        const activeFlags = Object.keys(result.content_flags || {})
          .filter(f => result.content_flags[f] !== 'none')
          .map(f => f + '=' + result.content_flags[f]);
        console.log('ℹ️  ' + result.verdict + (activeFlags.length ? ' [' + activeFlags.join(', ') + ']' : ''));
      }
    } catch (err) {
      console.log('❌ ERROR: ' + err.message);
      // Informational titles that error are not scored failures.
      const isInfo = !test.expect || test.expect.verdict === null;
      results.push({
        test,
        result: null,
        grade: { status: isInfo ? 'info-error' : 'error', notes: [err.message] }
      });
    }
    await new Promise(r => setTimeout(r, PACING_MS));  // polite pacing
  }

  // ── Summary ──
  console.log('\n📊 MECE Summary');
  if (promptVersionSeen !== null) {
    console.log('   Prompt version seen: ' + promptVersionSeen);
  }
  const cats = {};
  for (const r of results) {
    const c = r.test.category || 'other';
    if (!cats[c]) cats[c] = { pass: 0, fail: 0, error: 0, info: 0, 'info-error': 0 };
    cats[c][r.grade.status]++;
  }
  const W = 28;
  console.log('   ' + pad('Category', W) + ' | Pass | Fail | Total');
  console.log('   ' + '-'.repeat(W) + '-+------+------+------');
  let totalPass = 0, totalFail = 0;
  for (const c of Object.keys(cats)) {
    const x = cats[c];
    const scored = x.pass + x.fail + x.error;
    const infoTotal = x.info + x['info-error'];
    if (scored === 0 && infoTotal === 0) continue;
    if (scored === 0) {
      const suffix = x['info-error'] ? ' (info, ' + x['info-error'] + ' errored)' : ' (info)';
      console.log('   ' + pad(c, W) + ' |    - |    - |  ' + pad(String(infoTotal), 3) + suffix);
      continue;
    }
    totalPass += x.pass;
    totalFail += x.fail + x.error;
    console.log('   ' + pad(c, W) + ' |  ' + pad(String(x.pass), 3) + ' |  ' + pad(String(x.fail + x.error), 3) + ' |  ' + pad(String(scored), 3));
  }
  console.log('   ' + '-'.repeat(W) + '-+------+------+------');
  console.log('   ' + pad('TOTAL (scored)', W) + ' |  ' + pad(String(totalPass), 3) + ' |  ' + pad(String(totalFail), 3) + ' |  ' + pad(String(totalPass + totalFail), 3));

  if (totalFail > 0) {
    console.log('\n⚠️  ' + totalFail + ' failure(s). Consider further prompt tuning, then bump PROMPT_VERSION.');
    process.exit(1);
  } else {
    console.log('\n✅ All scored tests passed.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\nFatal error:', err && err.message ? err.message : err);
  process.exit(2);
});
