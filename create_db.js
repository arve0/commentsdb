'use strict';
const r = require('rethinkdb');
const config = require('./package.json').config;

let c;
r.connect({}).then((connection) => {
  c = connection;
}).then(() => r.dbCreate(config.database).run(c))
  .then(() => console.log(`database ${config.database} created`))
  .then(() => c.use(config.database))
  .then(() => Object.keys(config.tables).map(k => config.tables[k]))
  .then((tables) => Promise.all(tables.map(t => r.tableCreate(t).run(c))))
  .then(() => console.log(`created tables: ${config.tables}`))
  .catch((e) => {
    console.error('ERROR: ' + e.msg);
  })
  .then(() => c.close());
