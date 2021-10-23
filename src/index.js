import { assignMissing } from './objects';
import { buildRenderer } from './renderer';
import { processDocTokens } from './doc-tokens';

export const defaultOptions = {
  // these are the options passed to marked directly
  marked: {},
  // set to a value that should wrap standard languages. Use "{slot}" to indicate where the code should be inserted: i.e.
  // '<div class="tab">{code}</div>'. Can also be a function which takes (code, language) as its parameters.
  languageWrapper: null,

  // the language that should be used for filtering out all other languages
  language: null,

  // true if languages should be filtered
  filterLanguages: true,

  // if the language value is not set, or is set to a value not found within the markdown, this
  // setting will default the language to the first one found within the markdown.
  defaultLanguageToFirst: true,

  // true if doc tokens should be parsed
  docTokens: true,
};

/**
 * Processes the markdown using marked along with the many extensions this library provides
 * @param marked The marked library, must be passed in since it is not included within this library as a dependency
 * @param markdown The markdown to process
 * @param options The extended set of options, as well as marked options. See defaultOptions for more details.
 * @returns {{originalLanguage, language, raw: *}}
 */
export function process(marked, markdown, options = {}) {
  assignMissing(options, defaultOptions);

  const result = {
    originalLanguage: options.language,
    language: options.language,
    raw: markdown,
  };

  if (options.defaultLanguageToFirst) {
    processLanguage(result);
  }

  buildRenderer(marked, options, result);

  var html = null;
  result.html = () => html || (html = render(options, result));
  return result;
}

function render(options, result) {
  let html = result.render(result.raw);

  if (options.docTokens) {
    html = processDocTokens(result, html);
  }

  return html;
}

/**
 * if no language was provided, or the one provided is not in the list of supported languages,
 * then switch to the first language found
 * @param result
 */
function processLanguage(result) {
  const languages = collectLanguages(result.raw);
  if (!result.language || !languages[result.language]) {
    result.language = Object.keys(languages)[0];
  }
}

/**
 * Loops through all ``` style blocks collect languages.
 * @param raw
 */
function collectLanguages(raw) {
  let blocks = raw.match(/^(```|~~~) ?(.*) *$/gm) || [];
  blocks = blocks.map((m) => m.replace(/(```|~~~) ?/g, ''));

  const languages = {};
  // loop through each block and track languages
  blocks.forEach((text) => {
    if (text) {
      text = text.replace(/^if(-not)?: ?/, '').split(':')[0];

      text.split(',').forEach((name) => {
        // TODO Treat anything not defined in this extension as language
        if (name.indexOf('%') === -1) {
          languages[name] = true;
        }
      });
    }
  });
  return languages;
}
