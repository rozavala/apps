const fs = require('fs');

function report() {
    let out = {};

    // Math
    const math = fs.readFileSync('js/math-galaxy.js', 'utf8');
    out.math = {};
    ['genCadet', 'genExplorer', 'genPilot', 'genCommander'].forEach(level => {
        const regex = new RegExp(`function ${level}\\(\\) {[\\s\\S]*?const types = \\[(.*?)\\];`);
        const match = math.match(regex);
        if (match) {
            const types = match[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(s => s.length > 0);
            out.math[level] = types.length;
        }
    });

    // Chile
    const chile = fs.readFileSync('js/descubre-chile.js', 'utf8');
    const topicsMatch = chile.match(/const TOPICS=\[([\s\S]*?)\];\n/);
    if (topicsMatch) out.chile_topics_count = eval(`[${topicsMatch[1]}]`).length;

    const qbMatch = chile.match(/const QB=\{([\s\S]*?\n\});\n/);
    if (qbMatch) {
        const qb = eval(`({${qbMatch[1]})`);
        out.chile_qb = {};
        for (const k in qb) out.chile_qb[k] = qb[k].length;
    }

    // Fe
    const fe = fs.readFileSync('js/fe-explorador.js', 'utf8');
    const saints = fe.match(/const SAINTS = (\[[\s\S]*?\]);\n/);
    if (saints) out.fe_saints = eval(saints[1]).length;
    const heritage = fe.match(/const HERITAGE = (\[[\s\S]*?\]);\n/);
    if (heritage) out.fe_heritage = eval(heritage[1]).length;

    // Guitar
    const guitar = fs.readFileSync('js/guitar-jam.js', 'utf8');
    const chordsMatch = guitar.match(/const CHORDS = (\[[\s\S]*?\]);\n/);
    if (chordsMatch) out.guitar_chords = eval(chordsMatch[1]).length;
    const songsMatch = guitar.match(/const SONGS = (\[[\s\S]*?\]);\n/);
    if (songsMatch) out.guitar_songs = eval(songsMatch[1]).length;

    // Learning
    const checks = fs.readFileSync('js/learning-checks.js', 'utf8');
    const banks = checks.match(/var QUESTIONS = (\{[\s\S]*?\n\});/);
    if (banks) {
        const qb = eval(`(${banks[1]})`);
        out.learning_checks = {};
        for (const k in qb) out.learning_checks[k] = qb[k].length;
    }

    // Story
    const story = fs.readFileSync('js/story-explorer.js', 'utf8');
    const storiesMatch = story.match(/const STORIES = (\[[\s\S]*?\]);\n/);
    if (storiesMatch) {
        const stories = eval(storiesMatch[1]);
        out.story_explorer = { total: stories.length, en: stories.filter(s => s.lang === 'en').length, es: stories.filter(s => s.lang === 'es').length };
        out.story_vocab_counts = stories.map(s => s.vocabulary ? s.vocabulary.length : (s.vocab ? s.vocab.length : 0));
    }

    console.log(JSON.stringify(out, null, 2));
}

report();
