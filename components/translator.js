const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require('./american-to-british-titles.js');
const britishOnly = require('./british-only.js');

const DEBUG = !!process.env.DEBUG_TRANSLATOR;
const log = (...args) => { if (DEBUG) console.log('[Translator]', ...args); };

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const preserveCase = (src, repl) => {
  if (/^[A-Z][a-z]/.test(src)) return repl.charAt(0).toUpperCase() + repl.slice(1);
  if (/^[A-Z]+$/.test(src)) return repl.toUpperCase();
  return repl;
};

const invertObject = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

class Translator {
  translate(text, locale) {
    if (typeof text !== 'string') throw new Error('Invalid text');

    log('translate() called', { text, locale });

    if (locale === 'american-to-british') {
      const cfg = {
        words: { ...americanToBritishSpelling, ...americanOnly },
        titles: americanToBritishTitles, // "mr." -> "mr"
        timeFrom: ':',
        timeTo: '.',
      };
      log('Using config for american-to-british');
      return this._translate(text, cfg, locale);
    }

    if (locale === 'british-to-american') {
      const brToAmSpelling = invertObject(americanToBritishSpelling);
      const brToAmTitles = invertObject(americanToBritishTitles); // "mr" -> "mr."
      const cfg = {
        words: { ...brToAmSpelling, ...britishOnly },
        titles: brToAmTitles,
        timeFrom: '.',
        timeTo: ':',
      };
      log('Using config for british-to-american');
      return this._translate(text, cfg, locale);
    }

    throw new Error('Invalid locale');
  }

  _translate(text, cfg, locale) {
    let out = text;
    let changed = false;

    log('Initial text:', out);
    log('Titles keys:', Object.keys(cfg.titles));
    log('Words size:', Object.keys(cfg.words).length);

    // 1) Титули: надійні межі через Unicode-класи та lookbehind/lookahead.
    // Якщо у вашому середовищі lookbehind недоступний, див. альтернативу нижче (закоментовано).
    for (const [from, to] of Object.entries(cfg.titles)) {
      const pattern = `(?<=^|[^\\p{L}\\p{N}_])${escapeRegExp(from)}(?=$|[^\\p{L}\\p{N}_])`;
      const re = new RegExp(pattern, 'giu');

      log('Title pass:', { from, to, pattern, locale });

      let localChanges = 0;
      out = out.replace(re, (match) => {
        localChanges++;
        const rep = preserveCase(match, to);
        log('Title match:', { match, rep });
        return `<span class="highlight">${rep}</span>`;
      });

      if (localChanges > 0) {
        changed = true;
        log(`Title replacements done for "${from}" -> "${to}":`, localChanges, 'Current out:', out);
      }
    }

    // АЛЬТЕРНАТИВА БЕЗ LOOKBEHIND (розкоментуйте цей блок і закоментуйте блок вище, якщо треба):
    /*
    for (const [from, to] of Object.entries(cfg.titles)) {
      const pattern = `(^|[^\\p{L}\\p{N}_])(${escapeRegExp(from)})(?=$|[^\\p{L}\\p{N}_])`;
      const re = new RegExp(pattern, 'giu');

      log('Title pass (no-lookbehind):', { from, to, pattern, locale });

      let localChanges = 0;
      out = out.replace(re, (full, left, match) => {
        localChanges++;
        const rep = preserveCase(match, to);
        log('Title match (no-lookbehind):', { match, rep });
        return `${left}<span class="highlight">${rep}</span>`;
      });

      if (localChanges > 0) {
        changed = true;
        log(`Title replacements done (no-lookbehind) for "${from}" -> "${to}":`, localChanges, 'Current out:', out);
      }
    }
    */

    // 2) Фрази/слова — довші ключі спочатку
    const entries = Object.entries(cfg.words).sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of entries) {
      const re = new RegExp(`\\b${escapeRegExp(from)}\\b`, 'gi');
      let localChanges = 0;

      out = out.replace(re, (match) => {
        localChanges++;
        const rep = preserveCase(match, to);
        if (localChanges <= 3) log('Word match:', { from, match, rep });
        return `<span class="highlight">${rep}</span>`;
      });

      if (localChanges > 0) {
        changed = true;
        log(`Word replacements: "${from}" -> "${to}" x${localChanges}`);
      }
    }

    // 3) Час — підсвічуємо повний збіг
    const timeRe = new RegExp(`\\b([0-1]?\\d|2[0-3])\\${cfg.timeFrom}([0-5]\\d)\\b`, 'g');
    let timeChanges = 0;
    out = out.replace(timeRe, (m, hh, mm) => {
      timeChanges++;
      const rep = `<span class="highlight">${hh}${cfg.timeTo}${mm}</span>`;
      log('Time match:', { m, rep });
      return rep;
    });
    if (timeChanges > 0) {
      changed = true;
      log('Time replacements:', timeChanges);
    }

    const result = {
      text,
      translation: changed ? out : 'Everything looks good to me!',
    };

    log('Final result:', result);
    return result;
  }
}

module.exports = Translator;
