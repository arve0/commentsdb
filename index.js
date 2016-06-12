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
  // check captcha
  let answer = this.request.body.captcha;
  if (!answer || !captcha.correctAnswer(answer)) {
    this.status = 401;
    return;
  }
  // validate: { name: "Per" }
  let author = schema.validAuthor(this.request.body);
  if (!author) {
    this.status = 400;
    return;
  }
  let existingAuthor = yield getAuthor(author, this.dbConnection);
  if (existingAuthor) {
    this.status = 409;
    return;
  }
  let authorId = yield insertAuthor(author, this.dbConnection);
  this.cookies.set('author', authorId, { signed: true });
  this.status = 200;
}

function * getComments () {
  this.body = yield selectors.getComments(this.params.page, this.dbConnection);
}

function * postComment (next) {
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
  this.request.body.author = authorId;
  // make sure paragraph is integer
  this.request.body.paragraph = parseInt(this.request.body.paragraph, 10);
  let comment = schema.validComment(this.request.body);
  if (!comment) {
    this.status = 400;
    return;
  }
  this.body = yield selectors.insertComment(comment, this.dbConnection);
  this.status = 200;
}
