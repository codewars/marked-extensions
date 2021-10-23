import { assignMissing } from './objects';
import { buildRenderer } from './renderer';
import { processDocTokens } from './doc-tokens';

export const defaultOptions = {
  // these are the options passed to marked directly
  marked: {},
  /**
   *  block extensions can be configured here.
   *  i.e. ```%mermaid block could be configured as
   *   extensions: {
   *      mermaid: {
   *        code (code, options) {
   *          // transform code
   *        },
   *        afterRender () {
   *          // called after the markdown has rendered
   *        }
   *      }
   *   }
   */
  extensions: {},

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
 * @returns {{originalLanguage, language, languages: [], extensions: [], raw: *}}
 */
export function process(marked, markdown, options = {}) {
  assignMissing(options, defaultOptions);

  const result = {
    originalLanguage: options.language,
    language: options.language,
    languages: {},
    extensions: {},
    raw: markdown,
  };

  processBlocks(options, result);
  if (options.defaultLanguageToFirst) {
    processLanguage(result);
  }

  buildRenderer(marked, options, result);

  var html = null;
  result.html = () => html || (html = render(options, result));
  result.afterRender = afterRenderFn(options, result);

  // convert objects which have been acting as basic sets to an array
  ['languages', 'extensions'].forEach((key) => (result[key] = Object.keys(result[key])));

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
 * Creates the afterRender function that is added to the result, which can be called once the
 * processed html has been added to the DOM to initialize any extensions that may have been loaded.
 * @param options
 * @param result
 * @returns {Function}
 */
function afterRenderFn(options, result) {
  return () => {
    result.extensions.forEach((ext) => {
      const config = options.extensions[ext];
      if (config && config.afterRender) {
        config.afterRender.apply(result, arguments);
      }
    });
  };
}

/**
 * if no language was provided, or the one provided is not in the list of supported languages,
 * then switch to the first language found
 * @param result
 */
function processLanguage(result) {
  if (!result.language || !result.languages[result.language]) {
    result.language = Object.keys(result.languages)[0];
  }
}

/**
 * Loops through all ``` style blocks and figures out which are languages and which are
 * possibly extensions
 * @param markdown
 * @param options
 * @param result
 */
function processBlocks(options, result) {
  let blocks = result.raw.match(/^(```|~~~) ?(.*) *$/gm) || [];
  blocks = blocks.map((m) => m.replace(/(```|~~~) ?/g, ''));

  // loop through each block and track which are languages and which are extensions
  blocks.forEach((text) => {
    if (text) {
      text = text.replace(/^if(-not)?: ?/, '').split(':')[0];

      text.split(',').forEach((name) => {
        // % is a special token, we know these aren't either languages or extensions
        if (name.indexOf('%') === -1) {
          // if an extension has been defined for the language, track it now
          if (options.extensions[name]) {
            result.extensions[name] = true;
          } else {
            result.languages[name] = true;
          }
        }
      });
    }
  });
}
