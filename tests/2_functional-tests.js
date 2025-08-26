const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server.js');

chai.use(chaiHttp);

suite('Functional Tests', () => {

  test('Translation with text and locale fields: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ text: 'Mangoes are my favorite fruit.', locale: 'american-to-british' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'text');
        assert.property(res.body, 'translation');
        assert.equal(res.body.text, 'Mangoes are my favorite fruit.');
        assert.include(res.body.translation, '<span class="highlight">favourite</span>');
        done();
      });
  });

  test('Translation with text and invalid locale field: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ text: 'text', locale: 'spanish-to-english' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'Invalid value for locale field' });
        done();
      });
  });

  test('Translation with missing text field: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ locale: 'american-to-british' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'Required field(s) missing' });
        done();
      });
  });

  test('Translation with missing locale field: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ text: 'Hello' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'Required field(s) missing' });
        done();
      });
  });

  test('Translation with empty text: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ text: '', locale: 'american-to-british' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'No text to translate' });
        done();
      });
  });

  test('Translation with text that needs no translation: POST /api/translate', function (done) {
    chai.request(server)
      .post('/api/translate')
      .send({ text: 'I love programming.', locale: 'american-to-british' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'text');
        assert.property(res.body, 'translation');
        assert.equal(res.body.translation, 'Everything looks good to me!');
        done();
      });
  });

});
