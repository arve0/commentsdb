const r = require('rethinkdb');
const config = require('./package.json').config;

exports.getAuthor = (author, connection) =>
  r.table(config.tables.authors)
    .filter(author)
    .run(connection)
    .then(cursor => cursor.next())
    .catch((err) => {
      if (err.name === 'ReqlDriverError') {
        // not found
        return;
      }
      // fail hard on other errors
      throw err;
    });

exports.insertAuthor = (author, connection) =>
  r.table(config.tables.authors)
    .insert(author)
    .run(connection)
    .then(result => result.generated_keys[0]);

exports.getComments = (page, connection) =>
  r.table(config.tables.comments)
    .filter({ page })
    .run(connection)
    .then(cursor => cursor.toArray());
    // TODO: join authors

exports.insertComment = (comment, connection) =>
  r.table(config.tables.comments)
    .insert(comment)
    .run(connection)
    .then(result => result.generated_keys[0]);
