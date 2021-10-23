export function upperCaseWords(str) {
  if (!str) return str;
  return str.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

export function camelCase(str, pascal) {
  const cased = upperCaseWords(str.replace(/_/g, ' ')).replace(/ /g, '');
  return pascal ? cased : lowerCaseFirst(cased);
}

export function lowerCaseFirst(str) {
  return `${str[0].toLowerCase()}${str.substr(1)}`;
}

export function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : text;
}

export function unescapeHtml(text) {
  return text ? text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : text;
}
