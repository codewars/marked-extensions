import { replaceDocTypes } from './doc-types'
import { replaceDocNames } from './doc-names'
import { replaceDocGlobals } from './doc-globals'

/**
 * Preprocesses the markdown before sending it through marked. This is used to process
 * doc tokens and any other future extensions that we support that don't require being handled
 * during the marked rendering.
 * @param result
 */
export function processDocTokens(result, html, pre) {
  const language = result.originalLanguage || result.language;
  const globals = replaceDocGlobals(language, pre, html);
  const types = replaceDocTypes(language, pre, globals);
  const names = replaceDocNames(language, pre, types);

  return names;
}
