import { assignMissing } from './objects'
import { buildRenderer } from './renderer'
import { processDocTokens } from './doc-tokens'

export const defaultOptions = {
  // these are the options passed to marked directly
  marked: {},
  // languages that should be treated as extensions. You can configure how each gets handled
  extensions: {
    mermaid: {
      // code handler
      code: code => `<div class="mermaid">${code}</div>`,
      // will lazy load script automatically
      src: 'https://cdn.rawgit.com/knsv/mermaid/6.0.0/dist/mermaid.min.js',
      afterRender: () => window.mermaid && window.mermaid.init()
    },
  },
  // set to a method that that will receive a language and return the mapped
  // name. if no name is returned, it is assumed that the language is an extension.
  // The default method only handles a default set of languages.
  findLanguage: (language) => defaultLanguages.indexOf(language) >= 0 ? language: null,

  // used with CodeMirror.runMode, used to find the mode of the language. By default will just return the language
  findMode: (language) => language,

  // The highlight theme to add, only used with cm runMode
  theme: 'neo',

  // you can set icons within headers using icon::ICONNAME, this setting determines the icon class prefix used
  iconClassPrefix: 'icon-',

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

  // true if line numbers should be added to highlighted code (if a starting line number is configured for the block)
  lineNumbers: true,

  // css class used to display a line number gutter, which can be used to try to create an opacity layer
  // which will style the cm-number values differently. Set to null to disable adding a gutter.
  lineNumbersGutter: 'cm-runmode-linenumbers-gutter',

  // true if doc tokens should be parsed
  docTokens: true,

  // if set to an instance of js-yaml, it will process meta data at the top of the markdown.
  jsYaml: null,

  // If set to CodeMirror class, it will use CodeMirror.runMode to process syntax highlighting
  // Note: make sure to import codemirror/addon/runmode/runmode.js first.
  cm: null,

  // set to automatically load a CM language. This is provided by default but you can override if you wish
  // to override. This option is only used if both cm and loadScript are set.
  // You can set this to null if you do not wish or need to load languages dynamically
  loadCMLanguage: (language, options) => {
    return options.loadScript(`//cdnjs.cloudflare.com/ajax/libs/codemirror/${options.cm.version}/mode/${language}/${language}.min.js`);
  },

  // If you wish to support loading external extension scripts, you should set this to a
  // function that takes a url and returns a promise. Note that this function will need to be responsible
  // for not reloading the same scripts if requested more than once, this library does not take care of caching.
  loadScript: null,

  // if set to a function, will be called back after all external scripts have loaded
  onLoaded: null
};

export const defaultLanguages = [
  'c', 'clojure', 'coffeescript', 'cpp', 'csharp', 'elixir', 'erlang', 'fsharp',
  'go', 'groovy', 'haskell', 'java', 'javascript', 'kotlin', 'objc', 'ocaml', 'php', 'python',
  'r', 'ruby', 'scala', 'shell', 'solidity', 'sql', 'swift', 'typescript'
]

/**
 * Processes the markdown using marked along with the many extensions this library provides
 * @param marked The marked library, must be passed in since it is not included within this library as a dependency
 * @param markdown The markdown to process
 * @param options The extended set of options, as well as marked options. See defaultOptions for more details.
 * @returns {{originalLanguage, language, languages: [], extensions: [], tabs: {}, headers: {h1: Array, h2: Array, h3: Array, h4: Array}, icons: [], raw: *, preprocessed: *}}
 */
export function process(marked, markdown, options = {}) {
  assignMissing(options, defaultOptions);

  const result = {
    originalLanguage: options.language,
    language: options.language,
    languages: {},
    extensions: {},
    tabs: {},
    headers: {h1: [], h2: [], h3: [], h4: []},
    icons: {},
    raw: markdown,
    preprocessed: markdown
  };

  if (options.jsYaml) {
    processMeta(options, result);
  }

  processBlocks(options, result);
  if (options.defaultLanguageToFirst) {
    processLanguage(result);
  }

  buildRenderer(marked, options, result);

  var html = null;
  result.html = () => html || (html = render(options, result));
  result.afterRender = afterRenderFn(options, result);

  // convert objects which have been acting as basic sets to an array
  ['languages', 'extensions', 'icons']
    .forEach(key => result[key] = Object.keys(result[key]));

  if (options.loadScript) {
    processExternalScripts(options, result);
  }

  return result;
}

function render(options, result) {
  let html = result.render(result.preprocessed);

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
  return function() {
    result.extensions.forEach(ext => {
      const config = options.extensions[ext];
      if (config && config.afterRender) {
        config.afterRender.apply(result, arguments);
      }
    });
  }
}

/**
 * Will loop through extensions and languages and try to dynamically load scripts.
 * @param options
 * @param result
 */
function processExternalScripts(options, result) {
  const promises = [];
  result.extensions.forEach(ext => {
    const config = options.extensions[ext];
    if (config && config.src) {
      promises.push(options.loadScript(config.src));
    }
  });

  // automatically load the CM language that is shown
  if (options.cm && options.loadCMLanguage) {
    // if we filter languages then we only need to load the one being shown
    if (options.filterLanguages && result.language) {
      promises.push(options.loadCMLanguage(result.language, options));
    }
    // otherwise we need to load them all
    else if (!options.filterLanguages && result.languages.length) {
      result.languages.forEach(language => {
        promises.push(options.loadCMLanguage(language, options));
      });
    }
  }

  Promise.all(promises).then(() => {
    if (options.onLoaded) {
      options.onLoaded(result);
    }
  });
}

/**
 * Processes yaml content at the top of the markdown, marked starting by a --- and ending with a ...
 * @param options
 * @param result
 */
function processMeta(options, result) {
  result.preprocessed = result.preprocessed.replace(/^---\r?\n(.*\r?\n)*\.{3}\s*(\r?\n){1,2}/, meta => {
    let yaml = meta.replace(/^---\r?\n/, '').replace(/\r?\n\.\.\. *\r?\n?/, '');
    result.meta = options.jsYaml.safeLoad(yaml);
    return '';
  });
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
  let blocks = result.preprocessed.match(/^(```|~~~) ?(.*) *$/gm) || [];
  blocks = blocks.map(m => m.replace(/(```|~~~) ?/g, ''));

  // loop through each block and track which are languages and which are extensions
  blocks.forEach((text) => {
    if (text) {
      text = text.replace(/^if(-not)?: ?/, '').split(':')[0];

      text.split(',').forEach(name => {
        // % is a special token, we know these aren't either languages or extensions
        if (name.indexOf('%') === -1) {
          // if an extension has been defined for the language, track it now
          if (options.extensions[name]) {
            result.extensions[name] = true;
          }
          else {
            const language = options.findLanguage(name);
            if (language) {
              result.languages[language] = true;
            }
          }
        }
      })
    }
  });
}
