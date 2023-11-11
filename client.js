function $$ (query) {
  return Array.prototype.slice.call(document.querySelectorAll(query));
}

function hashCode (str) {
  let hash = 0;
  let i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
