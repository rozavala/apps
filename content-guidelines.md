# Content Guidelines — Zavala Serra Apps

> Internal policy for all educational apps in the Zavala Serra Kids suite.
> Reference this document every time you add or edit content.

## Mission

Build fun, factual, skill-based learning apps for our kids. Every app should feel like an old-school educational experience — full of curiosity, adventure, and real knowledge. No agendas, no moralizing, just learning.

## Allowed Content

- **Geography**: Maps, regions, landmarks, climate, natural wonders — factual descriptions.
- **History**: Dates, battles, founding events, historical figures — told neutrally as facts.
- **Science & Nature**: Animals, plants, ecosystems, geology, astronomy — observable facts.
- **Math**: Arithmetic, geometry, logic puzzles, patterns — pure skill building.
- **Music**: Theory, instruments, songs, practice — skill and technique focused.
- **Chess & Strategy**: Rules, tactics, puzzles, gameplay — classical instruction.
- **Art**: Techniques, colors, shapes, famous styles — hands-on creative skills.
- **Culture & Traditions**: Food, dance, festivals, customs — presented as cultural facts.
- **Language**: Vocabulary, reading, spelling — neutral educational content.
- **Values**: Hard work, curiosity, exploration, family, perseverance, sportsmanship.

## Strictly Excluded Content

The following topics must **never** appear in any app, quiz, story, image caption, badge name, or UI text:

- Sexual orientation, gender identity, pronouns, non-binary concepts, transgender topics, same-sex relationship framing.
- Diversity/equity/inclusion (DEI) framing or language (e.g., "celebrate differences" around identity groups).
- Environmental activism, climate guilt/shaming, or eco-anxiety framing.
- Social justice framing of historical events (e.g., interpreting history through modern oppression lenses).
- Critical race or gender theory undertones.
- "Representation matters" language or forced inclusion of identity markers.
- Political opinions, partisan framing, or modern political commentary on historical events.

## Content Sourcing Rules

### Text & Facts
- Use dry, verifiable history: dates, battles, inventions, geography.
- Prefer neutral sources: Wikipedia historical pages, official Chilean government tourism/history sites, classic textbooks.
- Avoid modern reinterpretations or editorialized summaries.

### Images & Visuals
- Use public-domain or clearly neutral imagery: mountains, condors, huasos, historical paintings, flags, maps, animals.
- No contemporary protest photos, identity symbols, or politically charged imagery.

### Video Clips (if added later)
- Pre-watch every segment before embedding.
- Skip or cut any part that touches modern politics or social issues.
- Use start/end time parameters to embed only the relevant educational segment.

### Quizzes & Activities
- Questions stay factual: "¿En qué año se fundó Santiago?" — not opinion-based.
- Rewards are stars, levels, explorer/pioneer badges — never "ally" or "inclusive hero" badges.
- Language stays neutral: "familias" not "todo tipo de familias."

## Technical Safeguards

- **No dynamic external content**: All text, questions, and facts live directly in .html/.js files. No API calls that could inject unpredictable text.
- **No AI-generated stories at runtime**: All content is hand-written and reviewed.
- **No user-generated content features**: No comments, public sharing, or multiplayer that could introduce external content.
- **LocalStorage stores only progress data**: Stars, levels completed, scores. No profiles with pronouns, flags, or identity markers.

## Pre-Commit Audit (Optional Git Hook)

Run this before each push to catch accidental keyword drift:

```bash
grep -r -i -E "genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender" --include="*.html" --include="*.js" --include="*.md" .
```

## Review Checklist (Per Feature)

Before adding any new content, answer these questions:

1. Does this teach only skills, facts, or history?
2. Could any sentence be read as pushing a social agenda?
3. Is the language 100% neutral?
4. Are rewards/badges based on skill, not identity?
5. Have I pre-watched any embedded video clips in full?

## Family Branding

The "Zavala Serra Apps" brand focuses on: adventure, learning, Chilean pride, family time, and classic skills (chess, music, drawing, math). Slogans should be about curiosity and fun — "¡Aprende jugando!" — not modern empowerment language.

---

*Last updated: March 2026*
