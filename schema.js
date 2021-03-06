const validator = require('is-my-json-valid');

/**
 * Returns a function that filters and validates objects.
 *
 * @params schema {object} JSON Schema - json-schema.org
 * @returns {function} Returns filtered obj if obj is valid.
 *                     Returns false if obj is not valid.
 */
const curryFilterAndValid = (schema) => (obj) => {
  const filter = validator.filter(schema);
  const valid = validator(schema);

  const filtered = filter(obj);
  return valid(filtered) ? filtered : false;
}

const postAuthor = {
  required: true,
  type: 'object',
  properties: {
    captcha: { type: 'string', required: true },
    name: { type: 'string', required: true, minLength: 1 }
  },
  additionalProperties: false
};
exports.postAuthor = curryFilterAndValid(postAuthor);

const authorSchema = {
  required: true,
  type: 'object',
  properties: {
    name: { type: 'string', required: true, minLength: 1 }
  },
  additionalProperties: false
};
exports.validAuthor = curryFilterAndValid(authorSchema);

const commentSchema = {
  required: true,
  type: 'object',
  properties: {
    // id from authors table
    author: { type: 'string', required: true },
    // path to page, /scratch/index.html
    page: { type: 'string', required: true },
    paragraph: { type: 'integer', required: true, minimum: 0 },
    hash: {type: 'integer', required: true },
    // the comment
    comment: { type: 'string', required: true, minLength: 1 },
    date: { type: 'string', required: true, format: 'date-time' }
  },
  additionalProperties: false
}
exports.validComment = curryFilterAndValid(commentSchema);
