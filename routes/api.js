'use strict';

const Translator = require('../components/translator.js');
const translator = new Translator();

module.exports = function (app) {
  app.route('/api/translate').post((req, res) => {
    const { text, locale } = req.body || {};

    if (text === undefined || locale === undefined) {
      return res.json({ error: 'Required field(s) missing' });
    }

    if (text === '') {
      return res.json({ error: 'No text to translate' });
    }

    if (!['american-to-british', 'british-to-american'].includes(locale)) {
      return res.json({ error: 'Invalid value for locale field' });
    }

    try {
      const result = translator.translate(text, locale);
      return res.json(result);
    } catch {
      return res.json({ error: 'Invalid value for locale field' });
    }
  });
};
