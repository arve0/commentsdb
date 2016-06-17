const child = require('child_process');
const test = require('ava');
const request = require('request-promise');
const config = require('./package.json').config;
const r = require('rethinkdb');

let db, server;
test.cb.before((t) => {
  let timeout = 0;
  if (child.spawnSync('pgrep', ['-lf', 'rethinkdb']).status === 1) {
    console.log('---- STARTING DATABASE ----');
    db = child.spawn('rethinkdb', [], { cwd: __dirname, stdio: 'inherit' });
    timeout += 3000;
  }
  if (child.spawnSync('pgrep', ['-lf', '(node|nodemon) index.js']).status === 1) {
    console.log('---- STARTING SERVER ----');
    server = child.fork('index.js', [], { cwd: __dirname, stdio: 'inherit' });
    timeout += 100;
  }
  // wait for server to start
  function wait () {
    request(HOST + 'captcha')
      .then(() => t.end())
      .catch(wait);
  }
  setTimeout(wait, timeout);
});

const HOST = 'http://localhost:3000/';

test('GET /captcha -> 200 question', t =>
  request(HOST + 'captcha')
    .then(res => {
      t.true(typeof res === 'string');
      t.true(res.length > 2);
    }));

// make sure mingling with datatypes does not throw serverside
test('POST /register JSON and captcha `true` -> !500', t =>
  request({
    uri: HOST + 'register',
    method: 'POST',
    body: { captcha: true, name: 'tester' },
    json: true
  }).catch((err) => t.true(err.statusCode !== 500)));

test('POST /register schema mismatch -> 400', t =>
  request({
    uri: HOST + 'register',
    method: 'POST',
    form: { captcha: 'fire' }
  }).catch((err) => {
    t.true(err.statusCode === 400);
  }));

test('POST /register name not unique -> 409', t => {
  let options = {
    uri: HOST + 'register',
    method: 'POST',
    form: { captcha: 'fire', name: 'tester' }
  };
  return request(options)
    .then(() => request(options))
    .catch((err) => t.true(err.statusCode === 409))
    .then(() => deleteAuthor({ name: 'tester' }));
});

test.serial('POST /register -> 200', t =>
  request({
    uri: HOST + 'register',
    method: 'POST',
    form: { captcha: 'fire', name: 'tester' },
    jar: true  // store cookies
  }));

test.serial('POST /comment -> 200', t =>
  request({
    uri: HOST + 'comment',
    method: 'POST',
    form: { page: 'test.html', paragraph: 2, hash: 3, comment: 'hello' },
    jar: true  // use cookie from jar
  }));

test.serial('POST /comment invalid schema -> 400', t =>
  request({
    uri: HOST + 'comment',
    method: 'POST',
    form: { paragraph: 2, comment: 'hello' },
    jar: true  // use cookie from jar
  }).catch((err) => t.true(err.statusCode === 400)));

test.serial('POST /comment user not registered -> 409', t =>
  deleteAuthor({ name: 'tester' })
    .then(() =>
      request({
        uri: HOST + 'comment',
        method: 'POST',
        form: { paragraph: 2, comment: 'hello' },
        jar: true  // use cookie from jar
      })
    ).catch((err) => t.true(err.statusCode === 403)));

test.serial('GET /comments -> 200', t =>
  request({
    uri: HOST + 'comments/test.html',
    json: true
  }).then((result) => {
    t.true(Array.isArray(result.comments));
    t.true(result.comments.length === 1);
  }).then(() => deleteComments({ page: 'test.html' })));

test.after.always((t) => {
  if (server) {
    console.log('---- STOPPING SERVER ----');
    server.kill('SIGKILL');
  }
  if (db) {
    console.log('---- STOPPING DATABASE ----');
    db.kill('SIGINT');
  }
});

function deleteAuthor (filter) {
  return r.connect({})
   .then((c) =>
     r.db(config.database)
      .table(config.tables.authors)
      .filter(filter)
      .delete()
      .run(c));
}

function deleteComments (filter) {
  return r.connect({})
   .then((c) =>
     r.db(config.database)
      .table(config.tables.comments)
      .filter(filter)
      .delete()
      .run(c));
}
