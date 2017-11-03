/**
 * Assigns the keys from source into target, but only those that are not already assigned. Useful
 * in place of Object.assign which would require a polyfill
 * @param target
 * @param source
 * @returns {*}
 */
function assignMissing(target, source) {
  Object.keys(source || {}).forEach(function (key) {
    if (!(key in target)) {
      target[key] = source[key];
    }
  });
  return target;
}

function buildRenderer(marked, options, result) {
  var renderer = result.renderer = new marked.Renderer();

  var markedOptions = { renderer: renderer };
  assignMissing(markedOptions, options.marked || {});

  // provide the render method, this will also be used later to render nested blocks
  result.render = function (md) {
    return marked(md, markedOptions);
  };

  setupHeader(renderer, options, result);
  setupCode(options, result);
}

/**
 *
 * @param renderer
 */
function setupHeader(renderer, options, result) {
  // heading extensions
  renderer.heading = function (text, level) {
    // you can set icons via icon::name
    var icon = text.match(/icon::([a-z-]*)/);
    var attributes = '';
    if (icon) {
      // indicate that this icon has been used
      result.icons[icon[1]] = true;

      attributes = ' class="' + options.iconClassPrefix + icon[1] + '"';
      text = text.replace(/icon::[a-z-]*/, '');
    }

    // we track headers 1 - 4 and add ids to them so that we can link to them later if we want to
    if (level < 5) {
      var header = result.headers['h' + level];
      var index = header.length;
      attributes += ' id="h' + level + '_' + index + '"';
      header.push(text);
    }

    return '<h' + level + attributes + '>' + text + '</h' + level + '>';
  };
}

/**
 * Handles code blocks in a variety of ways
 * @param options
 * @param result
 */
function setupCode(options, result) {
  var _code = result.renderer.code;

  result.renderer.code = function (code, language) {
    if (language) {
      if (language.match(/^if:/)) {
        return matchIfBlockLanguage(result, language) ? result.render(code) : '';
      } else if (language.match(/^if-not:/)) {
        return matchIfBlockLanguage(result, language) ? '' : result.render(code);
      } else if (language.match(/^tab:/)) {
        return handleTab(result, code, language);
      } else if (result.extensions[language]) {
        return handleExtension(options, result, code, language);
      } else if (language === '%definitions' || language === '%doc') {
        return wrapInBlockDiv(language, renderDefinitions(result, code));
      } else if (language[0] === '%') {
        return wrapInBlockDiv(language, result.render(code));
      }

      // process line numbers, if they are set (i.e. ruby:10)
      if (options.lineNumbers) {
        code = lineNumbers(options, code, language);
      }

      // make sure this is a language and not some random tag
      var foundLanguage = options.findLanguage(language.split(':')[0]);

      if (foundLanguage) {
        // if filtering is enabled and this is not the active language then filter it out
        if (options.filterLanguages && foundLanguage !== result.language) {
          return '';
        }

        // if CodeMirror is provided then highlight using that instead
        if (options.cm) {
          return highlightCM(options, code, foundLanguage, language);
        }
      }
    }

    return _code.call(result.renderer, code, language);
  };
}

function lineNumbers(options, code, language) {
  var lineNumber = getLineNumber(language);

  // if there are line numbers, then add them now starting at the start index
  if (lineNumber > 0) {
    code = code.split('\n').map(function (line) {
      // pad out the spaces
      // TODO: this code is naive and can only handle line numbers less than 999
      var spaces = lineNumber < 10 ? '  ' : lineNumber < 100 ? ' ' : '';
      return '' + spaces + lineNumber++ + ' ' + line;
    }).join('\n');
  }

  return code;
}

function highlightCM(options, code, language, raw) {
  var lineNumber = options.lineNumbers ? getLineNumber(raw) : null;
  var el = window.document.createElement('div');
  options.cm.runMode(code, options.findMode(language), el);

  var lnHtml = lineNumber > 0 ? '<div class="' + options.lineNumbersGutter + '"></div>' : '';
  return '<pre class="cm-runmode cm-s-' + options.theme + '"><code>' + lnHtml + el.innerHTML + '</code></pre>';
}

function getLineNumber(language) {
  var parts = language.split(':');
  return parts.length > 1 ? parseInt(parts[1], 10) : null;
}

function wrapInBlockDiv(type, contents) {
  return '<div class="block block--' + type.replace(/^%/, '') + '">' + contents + '</div>';
}

function matchIfBlockLanguage(result, language) {
  return language.replace(/^if(-not)?: ?/, '').split(',').indexOf(result.language) >= 0;
}

function handleTab(result, code, language) {
  // parts should be up to tab:LABEL with language being optional
  var parts = language.split(':');
  var label = parts[1].replace(/\+/g, ' ');
  result.tabs[label] = '' + result.render(code);
  return '';
}

/**
 * If the extension value is a function, it will treat it as a render function, otherwise it will
 * assume the extension value is a string and treat it as a template with {code} as the code placeholder.
 * @param options
 * @param code
 * @param language
 */
function handleExtension(options, result, code, language) {
  var ext = result.extensions[language];

  if (typeof ext.code === 'function') {
    return ext(code, options);
  } else {
    return ext.code.replace('{code}', code);
  }
}

/**
 *
 * @param result
 * @param code
 * @returns {string}
 */
function renderDefinitions(result, code) {
  var html = '<dl>';
  if (code) {
    code.split('\n').forEach(function (line) {
      if (line.match(/^#/)) {
        html += result.render(line);
      } else if (line.trim().match(/:$/)) {
        html += '<dt>' + line.replace(/:$/, '') + '</dt>';
      } else {
        html += '<dd>' + result.render(line) + '</dd>';
      }
    });
  }

  return html + '</dl>';
}

function upperCaseWords(str) {
  if (!str) return str;
  return str.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}

function camelCase(str, pascal) {
  var cased = upperCaseWords(str.replace(/_/g, ' ')).replace(/ /g, '');
  return pascal ? cased : lowerCaseFirst(cased);
}

function lowerCaseFirst(str) {
  return '' + str[0].toLowerCase() + str.substr(1);
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : text;
}

/**
 * Tracks some basic types that we convert for different languages. We don't need to try to
 * maintain a list for every type for every language we support, however we do want to track some
 * common types, such as hash, void, and primary types to minimize confusion.
 *
 * We will want to expand or trim this list as needed to find a good balance between useful and
 * too much language specialization.
 *
 */
var TYPES = {
  void: {
    'undefined': ['javascript'],
    nil: ['ruby'],
    None: ['python']
  },
  'null': {
    nil: ['ruby'],
    NSNull: ['objc'],
    None: ['python']
  },
  object: {
    NSObject: ['objc'],
    _alias: 'hash'
  },
  hash: {
    Hash: ['ruby'],
    dict: ['python'],
    Dictionary: ['csharp'],
    HashMap: ['java'],
    Object: ['javascript']
  },
  collection: {
    List: ['java'],
    Collection: ['csharp'],
    _alias: 'list'
  },
  array: {
    List: ['java'],
    'NSArray*': ['objc'],
    'std::list': ['cpp'],
    default: 'Array'
  },
  list: {
    Array: ['javascript', 'ruby', 'python', 'typescript'],
    'std::list': ['cpp'],
    default: 'List'
  },
  string: {
    string: ['csharp', 'typescript'],
    'std::string': ['cpp'],
    'char*': ['c'],
    'NSString *': ['objc'],
    default: 'String'
  },
  integer: {
    int: ['csharp', 'cpp', 'c'],
    Int: ['swift'],
    'NSNumber *': ['objc'],
    Number: ['javascript'],
    default: 'Integer'
  },
  boolean: {
    bool: ['csharp', 'c', 'cpp'],
    Bool: ['swift'],
    BOOL: ['objc'],
    boolean: ['java', 'typescript'],
    default: 'Boolean'
  },
  float: {
    float: ['csharp'],
    Number: ['javascript'],
    default: 'Float'
  }
};

var NULLABLE = {
  csharp: {
    default: 'Nullable<@@>'
  }
};

function replaceDocTypes(language, content) {
  return content.replace(/`?@@docType: ?([a-zA-Z_?]*(<.*,? ?.*>)?)`?/g, function (shell, value) {
    var nullable = !!value.match(/\?$/);
    value = value.replace('?', '').trim();

    if (value.indexOf('<') > 0) {
      var parts = value.split(/[<>]/);
      value = collectionType(language, parts[0], parts[1]);
    } else {
      value = mapType(language, value);
    }

    if (nullable) {
      value = mapNullable(language, value);
    }

    return wrap(value, shell, nullable);
  });
}

function mapNullable(language, value) {
  if (NULLABLE[language]) {
    var config = NULLABLE[language][value] || NULLABLE[language].default;
    if (config) {
      return config.replace('@@', value);
    }
  }

  return value;
}

function mapType(language, type, _default) {
  var map = TYPES[type.toLowerCase()];
  var mapped = null;
  if (map) {
    Object.keys(map).forEach(function (key) {
      if (!mapped) {
        if (key === 'default') {
          mapped = map.default;
        }
        // if a string, then the value is an alias to another type
        else if (key === '_alias') {
            mapped = mapType(language, map._alias, type);
          } else if (map[key].indexOf(language) >= 0) {
            mapped = key;
          }
      }
    });
    return mapped || _default || type;
  }

  return type;
}

function collectionType(language, type, nestedType) {
  var nestedTypes = nestedType.split(/, ?/);

  switch (language) {
    case 'javascript':
    case 'ruby':
    case 'objc':
    case 'python':
      return mapType(language, type) + ' (of ' + mapTypes(language, nestedTypes).join('s/') + 's)';

    case 'csharp':
      if (type === 'Array' && nestedTypes.length == 1) {
        return mapType(language, nestedType) + '[]';
      }
      return collectionGeneric(language, type, nestedTypes);

    default:
      return collectionGeneric(language, type, nestedTypes);
  }
}

function mapTypes(language, types) {
  return types.map(function (t) {
    return mapType(language, t);
  });
}

function collectionGeneric(language, type, nestedTypes) {
  var mapped = mapTypes(language, nestedTypes).join(', ');
  return mapType(language, type) + '<' + mapped + '>';
}

/**
 * Wraps the value within the necessary html to ensure that it gets rendered correctly
 * @param value
 * @param shell the shell of the @@docType syntax. Used to determine if a ` is present
 * @returns {string}
 */
function wrap(value, shell) {
  if (shell.indexOf('`') === 0) {
    return shell.replace(/@@docType: ?([a-zA-Z_?]*(<.*,? ?.*>)?)/, value);
  } else {
    return '<dfn class="doc-type">' + escapeHtml(value.trim()) + '</dfn>';
  }
}

var STYLES = {
  Const: {
    upper: ['default']
  },
  Param: {
    camel: ['csharp']
  },
  // name acts as default
  Name: {
    camel: ['javascript', 'java'],
    pascal: ['csharp']
  }
};

function replaceDocNames(language, content) {

  return content.replace(/`?@@doc(Name|Method|Const|Prop|Class|Param): ?([a-zA-Z0-9?_]*)`?/g, function (shell, type, value) {
    return wrap$1(shell, type, function () {
      var style = findStyle(type, language);

      switch (style) {
        case 'upper':
          return value.toUpperCase();

        case 'camel':
          return camelCase(value);

        case 'pascal':
          return camelCase(value, true);

        default:
          return value;
      }
    });
  });
}

function findStyle(type, language) {
  var style = Object.keys(STYLES[type] || []).find(function (style) {
    var _style = STYLES[type][style];
    return _style ? _style.indexOf(language) >= 0 : false;
  });

  // try to find a default style for the type
  if (!style && language !== 'default') {
    style = findStyle(type, 'default');
  }

  // default to name if no specific style is set
  if (!style && type !== 'Name') {
    style = findStyle('Name', language);
  }

  return style;
}

function wrap$1(shell, type, value) {
  value = value();
  if (shell.indexOf('`') === 0) {
    return shell.replace(/@@docName: ?([a-zA-Z0-9?_]*)/, value);
  } else {
    return '<dfn class="doc-name doc-name--' + type.toLowerCase() + '">' + value + '</dfn>';
  }
}

function replaceDocGlobals(language, content) {
  return content.replace(/@@docGlobal: ?.*`?/g, function (value) {
    switch (language) {
      // languages which should keep the global class
      case 'java':
      case 'csharp':
        return wrap$2(value.replace(/@@docGlobal: ?/, ''));

      // all other languages remove the global class
      default:
        return wrap$2(value.replace(/@@docGlobal: ?[a-zA-Z\d]*\./, ''));
    }
  });
}

function wrap$2(value) {
  return '<dfn class="doc-method">' + value + '</dfn>';
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var script = createCommonjsModule(function (module) {
/*!
  * $script.js JS loader & dependency manager
  * https://github.com/ded/script.js
  * (c) Dustin Diaz 2014 | License MIT
  */

(function (name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else this[name] = definition();
})('$script', function () {
  var doc = document
    , head = doc.getElementsByTagName('head')[0]
    , s = 'string'
    , f = false
    , push = 'push'
    , readyState = 'readyState'
    , onreadystatechange = 'onreadystatechange'
    , list = {}
    , ids = {}
    , delay = {}
    , scripts = {}
    , scriptpath
    , urlArgs;

  function every(ar, fn) {
    for (var i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f
    return 1
  }
  function each(ar, fn) {
    every(ar, function (el) {
      return !fn(el)
    });
  }

  function $script(paths, idOrDone, optDone) {
    paths = paths[push] ? paths : [paths];
    var idOrDoneIsDone = idOrDone && idOrDone.call
      , done = idOrDoneIsDone ? idOrDone : optDone
      , id = idOrDoneIsDone ? paths.join('') : idOrDone
      , queue = paths.length;
    function loopFn(item) {
      return item.call ? item() : list[item]
    }
    function callback() {
      if (!--queue) {
        list[id] = 1;
        done && done();
        for (var dset in delay) {
          every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = []);
        }
      }
    }
    setTimeout(function () {
      each(paths, function loading(path, force) {
        if (path === null) return callback()
        
        if (!force && !/^https?:\/\//.test(path) && scriptpath) {
          path = (path.indexOf('.js') === -1) ? scriptpath + path + '.js' : scriptpath + path;
        }
        
        if (scripts[path]) {
          return (scripts[path] == 2) ? callback() : setTimeout(function () { loading(path, true); }, 0)
        }

        scripts[path] = 1;
        create(path, callback);
      });
    }, 0);
    return $script
  }

  function create(path, fn) {
    var el = doc.createElement('script'), loaded;
    el.onload = el.onerror = el[onreadystatechange] = function () {
      if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) return;
      el.onload = el[onreadystatechange] = null;
      loaded = 1;
      scripts[path] = 2;
      fn();
    };
    el.async = 1;
    el.src = urlArgs ? path + (path.indexOf('?') === -1 ? '?' : '&') + urlArgs : path;
    head.insertBefore(el, head.lastChild);
  }

  $script.get = create;

  $script.order = function (scripts, id, done) {
    (function callback(s) {
      s = scripts.shift();
      !scripts.length ? $script(s, id, done) : $script(s, callback);
    }());
  };

  $script.path = function (p) {
    scriptpath = p;
  };
  $script.urlArgs = function (str) {
    urlArgs = str;
  };
  $script.ready = function (deps, ready, req) {
    deps = deps[push] ? deps : [deps];
    var missing = [];
    !each(deps, function (dep) {
      list[dep] || missing[push](dep);
    }) && every(deps, function (dep) {return list[dep]}) ?
      ready() : !function (key) {
      delay[key] = delay[key] || [];
      delay[key][push](ready);
      req && req(missing);
    }(deps.join('|'));
    return $script
  };

  $script.done = function (idOrDone) {
    $script([null], idOrDone);
  };

  return $script
});
});

var loaded = {};

function loadScript(url) {
  return new Promise(function (resolve) {
    return script(url, resolve);
  });
}

function loadCSS(url) {
  if (!loaded[url]) {
    loaded[url] = url;
    var el = window.document.createElement('link');
    el.setAttribute('href', url);
    window.document.head.appendChild(el);
  }
}

var loader = { loadScript: loadScript, loadCSS: loadCSS };

var load = loader;

var defaultOptions = {
  // these are the options passed to marked directly
  marked: {},
  // languages that should be treated as extensions. You can configure how each gets handled
  extensions: {
    mermaid: {
      // code handler
      code: function code(_code) {
        return '<div class="mermaid">' + _code + '</div>';
      },
      // will lazy load script automatically
      src: 'https://cdn.rawgit.com/knsv/mermaid/6.0.0/dist/mermaid.min.js',
      afterRender: function afterRender() {
        return window.mermaid.init();
      }
    }
  },
  // set to a method that that will receive a language and return the mapped
  // name. if no name is returned, it is assumed that the language is an extension.
  // The default method only handles a default set of languages.
  findLanguage: function findLanguage(language) {
    return defaultLanguages.indexOf(language) >= 0 ? language : null;
  },

  // used with CodeMirror.runMode, used to find the mode of the language. By default will just return the language
  findMode: function findMode(language) {
    return language;
  },

  // The highlight theme to add, only used with cm runMode
  theme: 'neo',

  // you can set icons within headers using icon::ICONNAME, this setting determines the icon class prefix used
  iconClassPrefix: 'icon-',

  // set to a value that should wrap standard languages. Use "{slot}" to indicate where the code should be inserted: i.e. '<div class="tab">{code}</div>'. Can also be a function which takes (language, languages) as its parameters.
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

  // if true, will try to load external extension scripts when they are needed
  loadExtensionScripts: true,

  // if set to a function, will be called back after all external scripts have loaded
  loadCallback: null
};

var defaultLanguages = ['c', 'clojure', 'coffeescript', 'cpp', 'csharp', 'elixir', 'erlang', 'fsharp', 'go', 'groovy', 'haskell', 'java', 'javascript', 'kotlin', 'objc', 'ocaml', 'php', 'python', 'r', 'ruby', 'scala', 'shell', 'solidity', 'sql', 'swift', 'typescript'];

/**
 * Processes the markdown using marked along with the many extensions this library provides
 * @param marked The marked library, must be passed in since it is not included within this library as a dependency
 * @param markdown The markdown to process
 * @param options The extended set of options, as well as marked options. See defaultOptions for more details.
 * @returns {{originalLanguage, language, languages: [], extensions: [], tabs: {}, headers: {h1: Array, h2: Array, h3: Array, h4: Array}, icons: [], raw: *, preprocessed: *}}
 */
function process(marked, markdown) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  assignMissing(options, defaultOptions);

  var result = {
    originalLanguage: options.language,
    language: options.language,
    languages: {},
    extensions: {},
    tabs: {},
    headers: { h1: [], h2: [], h3: [], h4: [] },
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

  if (options.docTokens) {
    processDocTokens(result);
  }

  result.html = result.render(result.preprocessed);

  // convert objects which have been acting as basic sets to an array
  ['languages', 'extensions', 'icons'].forEach(function (key) {
    return result[key] = Object.keys(result[key]);
  });

  return result;
}

function processMeta(options, result) {
  result.preprocessed = result.preprocessed.replace(/^---\n(.*\n)*\.\.\. *\n\n?/, function (meta) {
    var yaml = meta.replace(/^---\n/, '').replace(/\n\.\.\. *\n?/, '');
    result.meta = options.jsYaml.safeLoad(yaml);

    return '';
  });
}

/**
 * Preprocesses the markdown before sending it through marked. This is used to process
 * doc tokens and any other future extensions that we support that don't require being handled
 * during the marked rendering.
 * @param result
 */
function processDocTokens(result) {
  var language = result.originalLanguage || result.language;
  result.preprocessed = replaceDocNames(language, replaceDocTypes(language, replaceDocGlobals(language, result.preprocessed)));
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
  var blocks = (result.preprocessed.match(/^(```|~~~) ?(.*) *$/gm) || []).map(function (m) {
    return m.replace(/(```|~~~) ?/g, '');
  });

  // loop through each block and track which are languages and which are extensions
  blocks.forEach(function (text) {
    if (text) {
      text = text.replace(/^if(-not)?: ?/, '').split(':')[0];

      text.split(',').forEach(function (name) {
        // % is a special token, we know these aren't either languages or extensions
        if (name.indexOf('%') === -1) {
          // if an extension has been defined for the language, track it now
          if (options.extensions[name] >= 0) {
            result.extensions[name] = true;
          } else {
            var language = options.findLanguage(name);
            if (language) {
              result.languages[language] = true;
            }
          }
        }
      });
    }
  });
}

export { load, defaultOptions, defaultLanguages, process };
