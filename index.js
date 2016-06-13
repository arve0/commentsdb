const r = require('rethinkdb');
const app = require('koa')();
const router = require('koa-router')();
const parseBody = require('koa-bodyparser');
const captcha = require('./captcha');
const schema = require('./schema');
const selectors = require('./selectors');
const getAuthor = selectors.getAuthor;
const insertAuthor = selectors.insertAuthor;
const config = require('./package.json').config;

/**
 * Signed cookies.
 */
app.keys = config.secrets.split(',').map(s => s.trim());

/**
 * Routes.
 */
router.get('/captcha', function * () {
  this.body = captcha.question;
});
router.post('/register', register);
router.get('/comments/:page', getComments);
router.post('/comment', postComment);

/**
 * Middlewares.
 */
app.use(time);
app.use(dbConnection);
app.use(parseBody());
app.use(router.routes());
app.use(router.allowedMethods())
app.listen(3000);
console.log('Listening on port 3000');

function * time (next) {
  let start = Date.now();
  yield next;
  this.set('X-Response-Time', Date.now() - start);
}

function * dbConnection (next) {
  this.dbConnection = yield r.connect({});
  this.dbConnection.use(config.database);
  yield next;
  yield this.dbConnection.close();
}

function * register () {
  // validate body
  let body = schema.validAuthor(this.request.body);
  if (!body) {
    this.status = 400;
    return;
  }
  // check captcha
  if (!captcha.correctAnswer(body.captcha)) {
    this.status = 401;
    return;
  }
  delete body.captcha;  // TODO: schema filter instead?
  let existingAuthor = yield getAuthor(body, this.dbConnection);
  if (existingAuthor) {
    this.status = 409;
    return;
  }
  let authorId = yield insertAuthor(body, this.dbConnection);
  this.cookies.set('author', authorId, { signed: true });
  this.status = 200;
}

function * getComments () {
  this.body = yield selectors.getComments(this.params.page, this.dbConnection);
}

function * postComment () {
  // is author cookie set?
  let authorId = this.cookies.get('author', { signed: true });
  if (!authorId) {
    this.status = 403;
    return;
  }
  // author found in db?
  // TODO: r.get instead of r.filter?
  let author = yield getAuthor({ id: authorId }, this.dbConnection);
  if (!author) {
    this.status = 403;
    return;
  }
  let comment = Object.assign({}, this.request.body, {
    author: authorId,
    // make sure paragraph is integer
    paragraph: parseInt(this.request.body.paragraph, 10)
  });
  comment = schema.validComment(comment);
  if (!comment) {
    this.status = 400;
    return;
  }
  this.body = yield selectors.insertComment(comment, this.dbConnection);
  this.status = 200;
}
