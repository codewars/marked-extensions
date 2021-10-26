/**
 * Assigns the keys from source into target, but only those that are not already assigned. Useful
 * in place of Object.assign which would require a polyfill
 * @param target
 * @param source
 * @returns {*}
 */
export function assignMissing(target, source) {
  Object.keys(source || {}).forEach((key) => {
    if (!(key in target)) {
      target[key] = source[key];
    }
  });
  return target;
}
