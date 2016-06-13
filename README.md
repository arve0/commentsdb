# commentsdb
Store medium-like comments in rethinkdb. Users first need to answer a captcha question and register their name before they are allowed to post comments. Name crashes are not allowed.

## Config
See `config` in [package.json](package.json).

## Start server
```sh
npm start
```

## API

### GET `/captcha`
Get a captcha question:

**Example response**:
```
Hva er en pluss en?
```


### POST `/register`
Register name in the authors table. `captcha` must be correct and `name` must be unique.

**POST-data**: `captcha`, `name`

**Responses**:
- **400**: Schema not validated. See [schema.js](schema.js).
- **401**: Wrong captcha.
- **409**: Name taken.
- **200**: Success. Sets a cookie with `author=id`.


### GET `/comments/:page`
Get all comments for given page.

**Responses**:
- **200**: Array with comments.


### POST `/comment`
Store comment.

**POST-data:** `page`, `paragraph` and `comment`.

Example:
```sh
curl -d 'page=/scratch/index.html&paragraph=3&comment=Hei!' localhost:3000/comment
```

**Responses**:
- **403**: Not registered. See `/register` endpoint.
- **400**: Schema not validated. See [schema.js](schema.js).
- **200**: Success.


### URL parameters
Parameters given as `/endpoint/:parameter` should be [URI encoded].

### POST-data
POST-data should be [form-urlencoded] or [JSON].

[URI encoded]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
[form-urlencoded]: http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
[JSON]: http://stackoverflow.com/questions/7172784/how-to-post-json-data-with-curl-from-terminal-commandline-to-test-spring-rest?answertab=votes#tab-top
