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

function unescapeHtml(text) {
  return text ? text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : text;
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
    'undefined': ['javascript', 'coffeescript'],
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
    Object: ['javascript', 'typescript', 'coffeescript']
  },
  collection: {
    List: ['java'],
    Collection: ['csharp'],
    _alias: 'list'
  },
  enumerable: {
    IEnumerable: ['csharp'],
    vector: ['cpp'],
    _alias: 'array'
  },
  array: {
    List: ['java'],
    'NSArray*': ['objc'],
    'std::list': ['cpp'],
    default: 'Array'
  },
  list: {
    List: ['java', 'csharp', 'scala', 'groovy', 'kotlin'],
    'std::list': ['cpp'],
    default: 'Array'
  },
  string: {
    string: ['csharp', 'typescript'],
    'std::string': ['cpp'],
    'char*': ['c'],
    'NSString *': ['objc'],
    default: 'String'
  },
  integer: {
    int: ['csharp', 'cpp', 'c', 'go'],
    Int: ['swift', 'haskell', 'kotlin'],
    'NSNumber *': ['objc'],
    Number: ['javascript'],
    number: ['typescript'],
    default: 'Integer'
  },
  long: {
    long: ['csharp', 'java', 'c', 'cpp'],
    _alias: 'integer'
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
    Number: ['javascript', 'coffeescript', 'typescript'],
    default: 'Float'
  }
};

var NULLABLE = {
  csharp: {
    default: 'Nullable<@@>'
  }

  /**
   * Long story short this handles these types of cases
   * <code>@@docType:Array</code>
   * <code>@@docType:Array<String></code>
   * `@@docType:Array`
   * `@@docType:Array<String>`
   * `@@docType:Array<String, Int>`
   * `@@docType:Array<String,Int>`
   * @@docType:Array<String, Int>
   * @@docType: Promise<Array<Int>>
   * @@docType:Array
   * @type {RegExp}
   */
};var regex = /(`|<code>|<pre>)?@@docType: ?([\w_?]*(?:(?:<|&lt;)[\w?]*(?:[,<]?\s?\w*>?){0,3}(?:>|&gt;))?)(`|<\/code>|<\/pre>)?/g;
var nestedRegex = /(?:<|&lt;)([\w?]*(?:[,<]?\s?\w*>?){0,3})(?:>|&gt;)/g;

/**
 * process all @@docType: tokens and replaces them with the correct display value, and possibly wraps them in a dfn tag
 * @param language
 * @param pre Boolean that determines if we are displaying this content within a pre element, so don't wrap with dfn tags
 * @param content The content to be replaced. Can handle replacing multiple tags at once
 */
function replaceDocTypes(language, pre, content) {
  return content.replace(regex, function (shell, codeStart, value, codeEnd) {
    var nullable = !!value.match(/\?$/);
    value = value.replace('?', '').trim();
    value = unescapeHtml(value);

    value = maybeMapGeneric(language, value);

    if (nullable) {
      value = mapNullable(language, value);
    }

    return wrap(value, shell, pre, codeStart, codeEnd);
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

function maybeMapGeneric(language, value) {
  var parts = value.split(nestedRegex).filter(function (p) {
    return !!p;
  });

  if (parts.length < 2) {
    return mapType(language, value);
  } else if (parts.length === 2) {
    return collectionType(language, parts[0], parts[1]);
  } else {
    var root = parts.shift();
    var mapped = parts.map(function (p) {
      return collectionType(language, p);
    });
    return root + '<' + mapped.join(', ') + '>';
  }
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

function isTransformedType(type) {
  return Object.keys(TYPES).indexOf(type.toLowerCase()) > -1;
}

function collectionType(language, type, nestedType) {
  var nestedTypes = nestedType.split(/, ?/);
  if (isTransformedType(type)) {
    switch (language) {
      case 'ruby':
      case 'objc':
      case 'python':
        var plurals = mapTypes(language, nestedTypes).map(function (s) {
          return s.replace(' *', '');
        }).join('s/');

        var addS = plurals.indexOf(')') > 0 ? '' : 's';
        return mapType(language, type) + ' (of ' + plurals + addS + ')';

      case 'csharp':
      case 'java':
        // if an array and not wrapping another array
        if (type === 'Array' && nestedTypes.length == 1 && nestedTypes[0].indexOf('<') === -1) {
          return mapType(language, nestedType) + '[]';
        }
        break;
      case 'c':
        if (type === 'List' && nestedTypes.length == 1 && nestedTypes[0].indexOf('<') === -1) {
          return mapType(language, nestedType) + '[]';
        }
        break;
      case 'haskell':
        if ((type === 'List' || type === 'Array') && nestedTypes.length == 1) {
          return '[' + mapType(language, nestedType) + ']';
        }
        break;
      case 'go':
        if ((type === 'List' || type === 'Array') && nestedTypes.length == 1) {
          return '[]' + mapType(language, nestedType);
        }
        break;
    }
  }
  var result = collectionGeneric(language, type, nestedTypes);
  return result;
}

function mapTypes(language, types) {
  return types.map(function (t) {
    return maybeMapGeneric(language, t);
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
function wrap(value, shell, pre, start, end) {
  value = escapeHtml(value.trim());

  if (pre) {
    return value;
  } else if (start) {
    return start + value + (end || '');
  } else {
    return '<dfn class="doc-type">' + value + '</dfn>';
  }
}

var STYLES = {
  Const: {
    upper: ['default']
  },
  Method: {
    upperCamel: ['csharp']
  },
  Prop: {
    upperCamel: ['csharp']
  },
  Class: {
    upperCamel: ['default']
  },
  // name acts as default
  Name: {
    camel: ['javascript', 'java', 'coffeescript', 'typescript', 'go', 'kotlin', 'scala', 'objc', 'php', 'swift', 'csharp', 'solidity', 'haskell'],
    kabob: ['clojure']
  }
};

function replaceDocNames(language, pre, content) {

  return content.replace(/`?@@doc(Name|Method|Const|Prop|Class|Param): ?([a-zA-Z0-9?_]*)`?/g, function (shell, type, value) {
    return wrap$1(shell, type, pre, function () {
      if (value) {
        var style = findStyle(type, language);

        switch (style) {
          case 'upper':
            return value.toUpperCase();

          case 'kabob':
            return value.replace(/_/g, '-');

          case 'camel':
            return camelCase(value);

          case 'upperCamel':
            return camelCase(value, true);

          default:
            return value;
        }
      } else {
        console.warn('replaceDocNames value is missing:', content); // eslint-disable-line no-console
        return '';
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

function wrap$1(shell, type, pre, value) {
  value = value();
  if (shell.indexOf('`') === 0 || pre) {
    return shell.replace(/@@doc(Name|Method|Const|Prop|Class|Param): ?([a-zA-Z0-9?_]*)/, value);
  } else {
    return '<dfn class="doc-name doc-name--' + type.toLowerCase() + '">' + value + '</dfn>';
  }
}

function replaceDocGlobals(language, pre, content) {
  return content.replace(/@@docGlobal: ?.*`?/g, function (value) {
    switch (language) {
      // languages which should keep the global class
      case 'java':
      case 'csharp':
      case 'kotlin':
      case 'scala':
        return wrap$2(value.replace(/@@docGlobal: ?/, ''), pre);

      // all other languages remove the global class
      default:
        return wrap$2(value.replace(/@@docGlobal: ?[a-zA-Z\d]*\./, ''), pre);
    }
  });
}

function wrap$2(value, pre) {
  return pre ? value : '<dfn class="doc-class">' + value + '</dfn>';
}

/**
 * Preprocesses the markdown before sending it through marked. This is used to process
 * doc tokens and any other future extensions that we support that don't require being handled
 * during the marked rendering.
 * @param result
 */
function processDocTokens(result, html, pre) {
  var language = result.originalLanguage || result.language;
  var globals = replaceDocGlobals(language, pre, html);
  var types = replaceDocTypes(language, pre, globals);
  var names = replaceDocNames(language, pre, types);

  return names;
}

function methodDoc(code, language) {
  try {
    var json = JSON.parse(code);

    // support language specific overrides
    if (json.languages && json.languages[language]) {
      Object.assign(json, json.languages[language]);
    }

    var md = [];

    if (!json.examplesOnly) {
      if (json.method) {
        md.push(methodHeader(json));
      }
      if (json.desc) {
        md.push(json.desc);
      }

      md.push('```%doc');

      if (json.args) {
        md.push('Parameters:');
        md.push(parameters(json));
      }
      md.push('Return Value:');
      md.push(returnType(json));
      if (json.constraints && json.constraints.length) {
        md.push('Constraints:');
        md.push(json.constraints.join('\n'));
      }
      if (json.errors && json.errors.length) {
        md.push('Errors:');
        md.push(json.errors.join('\n'));
      }
      md.push('```');
    }

    if (json.examples && json.examples.length) {
      md.push('```%doc-block');
      md.push('#### Examples');
      md.push(exampleHeader(json));
      md.push(exampleRows(json));
      md.push('```');
    }

    return md.join('\n');
  } catch (ex) {
    return '`Failed to render %jsonblock: ' + ex.message + '`';
  }
}

function hasExampleNames(json) {
  return json.examples && json.examples.filter(function (e) {
    return !!e.name;
  }).length > 0;
}
function exampleRows(json) {
  var hasExamples = hasExampleNames(json);
  return json.examples.map(function (v) {
    return exampleRow(json, v, hasExamples);
  }).join('\n');
}

function exampleRow(json, example, hasExamples) {
  var md = '';
  if (hasExamples) {
    var name = example.name;
    md = '*' + (name || 'Example') + '*|';
  }

  if (example.args) {
    md += example.args.map(function (arg) {
      return formatExampleValue(arg);
    }).join('|');
  }
  md += '|' + (formatExampleValue(example.returns) || '');
  return md;
}

function formatExampleValue(value) {
  return '<code>' + JSON.stringify(value) + '</code>';
}

function exampleHeader(json) {
  var line1 = [];
  var line2 = [];
  if (hasExampleNames(json)) {
    line1.push('');
    line2.push('');
  }

  Object.keys(getArgs(json)).forEach(function (key) {
    line1.push(key);
    line2.push('');
  });
  line1.push('Return Value');
  return line1.join('|') + '\n-' + line2.join('|-') + '|-';
}

function getArgs(json) {
  return json.args || json.params || json.parameters || {};
}

function methodName(json) {
  var globalName = json.global !== false ? '@@docGlobal:' + (json.global || 'Challenge') + '.' : '';
  // if a class is provided, it will always be shown and overrides global
  if (json.class) {
    globalName = '@@docClass:' + json.class + '.';
  }

  return globalName + '@@docMethod:' + json.method;
}

function methodHeader(json) {
  var args = Object.keys(getArgs(json)).map(function (key) {
    return '`@@docName:' + key + '`';
  });
  return '### `' + methodName(json) + '`(' + args.join(', ') + ')';
}

function parameters(json) {
  var args = getArgs(json);
  var params = Object.keys(args).map(function (key) {
    var arg = args[key];
    var type = typeof arg === 'string' ? arg : arg.type;
    var md = '@@docName:' + key + ': ' + formatDocType(json, type, 'String');
    if (arg.desc) {
      md += ' - ' + arg.desc;
    }

    return md;
  });

  return params.join('\n');
}

function returnType(json) {
  if (json.returns) {
    var type = typeof json.returns === 'string' ? json.returns : json.returns.type;
    var md = formatDocType(json, type, 'void');
    if (json.returns.desc) {
      md += ' - ' + json.returns.desc;
    }

    return md;
  }
  return '@@docType:void';
}

function formatDocType(json, type, defaultValue) {
  if (json.formatTypes === false) {
    return '<dfn class="doc-type">' + escapeHtml(type) + '</dfn>';
  } else {
    return '@@docType:' + (type || defaultValue || 'null');
  }
}

function tableDoc(code) {
  try {
    var json = JSON.parse(code);
    var html = [];

    if (json.table) {
      html.push('<h3>' + json.table + '</h3>');
    }

    if (json.desc) {
      html.push('<p>' + json.desc + '</p>');
    }

    html.push('<table>');
    html.push('<thead><tr><th>Column</th><th>Type</th></tr></thead>');
    if (json.columns) {
      html.push('<tbody>');
      html.push(tableHeaders(json.columns));
      html.push('</tbody>');
    }

    html.push('</table>');
    return html.join('\n');
  } catch (ex) {
    return '`failed to render %jsonblock: `' + ex.message + '`';
  }
}

var tableHeaders = function tableHeaders(json) {
  return Object.keys(json).map(function (k) {
    return '<tr><td>' + k + '</td><td>' + json[k] + '</td></tr>';
  }).join('\n');
};

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

  // special version of render that will process doc tokens. Needed at times when
  // tokens are nested inside of pre and should be rendered without tags (but their labels should still be processed)
  var render = function render(code, preTokens) {
    if (preTokens && options.docTokens) {
      code = processDocTokens(result, code, true);
    }

    return result.render(code);
  };

  result.renderer.code = function (code, language) {
    if (language) {
      if (language.match(/^if:/)) {
        return matchIfBlockLanguage(result, language) ? render(code) : '';
      } else if (language.match(/^if-not:/)) {
        return matchIfBlockLanguage(result, language) ? '' : render(code);
      } else if (language.match(/^tab:/)) {
        return handleTab(result, code, language);
      } else if (result.extensions.indexOf(language) >= 0) {
        return handleExtension(options, result, code, language);
      } else if (language === '%definitions' || language === '%doc') {
        return wrapInBlockDiv(language, renderDefinitions(result, code, render));
      } else if (language === '%method-doc') {
        return wrapInBlockDiv('docs method-doc', render(methodDoc(code, result.originalLanguage)));
      } else if (language === '%table-doc') {
        return wrapInBlockDiv('docs table-doc', tableDoc(code));
      } else if (language[0] === '%') {
        return wrapInBlockDiv(language, result.render(code));
      }

      // make sure this is a language and not some random tag
      var foundLanguage = options.findLanguage(language.split(':')[0]);

      if (foundLanguage) {
        // if filtering is enabled and this is not the active language then filter it out
        if (options.filterLanguages && foundLanguage !== result.language && result.language) {
          return '';
        }

        // if CodeMirror is provided then highlight using that instead
        if (options.cm) {
          return highlightCM(options, code, foundLanguage, language);
        }
      }
      // process line numbers, if they are set (i.e. ruby:10) in a naive simple way
      else if (options.lineNumbers) {
          code = lineNumbers(code, language);
        }
    }

    return wrapLanguage(options, _code.call(result.renderer, code, language), language);
  };
}

function lineNumbers(code, language) {
  var wrapper = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '@@ ';

  var lineNumber = getLineNumber(language);

  // if there are line numbers, then add them now starting at the start index
  if (lineNumber > 0) {
    code = code.split('\n').map(function (line) {
      return '' + wrapper.replace('@@', lineNumber++) + line;
    }).join('\n');
  }

  return code;
}

function wrapLanguage(options, code, language) {
  // if we have reached this point then CM isn't enabled and we need to
  if (language && options.languageWrapper) {
    if (typeof options.languageWrapper === 'function') {
      code = options.languageWrapper(code, language);
    } else {
      code = options.languageWrapper.replace('{slot}', code);
    }
  }

  return code;
}

function highlightCM(options, code, language, raw) {
  var el = window.document.createElement('div');
  options.cm.runMode(code, options.findMode(language), el);

  var codeHtml = el.innerHTML;
  if (options.lineNumbers) {
    codeHtml = lineNumbers(codeHtml, raw, '<span class="cm-line-number">@@</span>');
  }

  var result = '<pre class="cm-runmode cm-s-' + options.theme + '"><code>' + codeHtml + '</code></pre>';
  return wrapLanguage(options, result, language);
}

function getLineNumber(language) {
  var parts = language.split(':');
  return parts.length > 1 ? parseInt(parts[1], 10) : null;
}

function wrapInBlockDiv(type, contents) {
  return '<div class="block block--' + type.replace(/^%/, '') + '">' + contents + '</div>';
}

function matchIfBlockLanguage(result, language) {
  return language.replace(/^if(-not)?: ?/, '').split(',').indexOf(result.originalLanguage) >= 0;
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
  var ext = options.extensions[language];

  if (typeof ext.code === 'function') {
    return ext.code(code, options);
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
function renderDefinitions(result, code, render) {
  var html = '<dl>';
  if (code) {
    code.split('\n').forEach(function (line) {
      if (line.match(/^#/)) {
        html += render(line);
      } else if (line.match(/: *$/)) {
        html += '<dt>' + line.replace(/:$/, '') + '</dt>';
      } else {
        // if line starts with 4 white spaces, a tab or a ` block, then consider it a pre tag and don't render dfn
        html += '<dd>' + render(line, !!line.match(/^(\t|\s{4}|`)/)) + '</dd>';
      }
    });
  }

  return html + '</dl>';
}

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
        return window.mermaid && window.mermaid.init();
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
  loadCMLanguage: function loadCMLanguage(language, options) {
    return options.loadScript('//cdnjs.cloudflare.com/ajax/libs/codemirror/' + options.cm.version + '/mode/' + language + '/' + language + '.min.js');
  },

  // If you wish to support loading external extension scripts, you should set this to a
  // function that takes a url and returns a promise. Note that this function will need to be responsible
  // for not reloading the same scripts if requested more than once, this library does not take care of caching.
  loadScript: null,

  // if set to a function, will be called back after all external scripts have loaded
  onLoaded: null
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

  var html = null;
  result.html = function () {
    return html || (html = render(options, result));
  };
  result.afterRender = afterRenderFn(options, result);

  // convert objects which have been acting as basic sets to an array
  ['languages', 'extensions', 'icons'].forEach(function (key) {
    return result[key] = Object.keys(result[key]);
  });

  if (options.loadScript) {
    processExternalScripts(options, result);
  }

  return result;
}

function render(options, result) {
  var html = result.render(result.preprocessed);

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
  return function () {
    var _arguments = arguments;

    result.extensions.forEach(function (ext) {
      var config = options.extensions[ext];
      if (config && config.afterRender) {
        config.afterRender.apply(result, _arguments);
      }
    });
  };
}

/**
 * Will loop through extensions and languages and try to dynamically load scripts.
 * @param options
 * @param result
 */
function processExternalScripts(options, result) {
  var promises = [];
  result.extensions.forEach(function (ext) {
    var config = options.extensions[ext];
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
        result.languages.forEach(function (language) {
          promises.push(options.loadCMLanguage(language, options));
        });
      }
  }

  Promise.all(promises).then(function () {
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
  result.preprocessed = result.preprocessed.replace(/^---\r?\n(.*\r?\n)*\.{3}\s*(\r?\n){2}?/, function (meta) {
    var yaml = meta.replace(/^---\r?\n/, '').replace(/\r?\n\.\.\. *\r?\n?/, '');
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
  var blocks = result.preprocessed.match(/^(```|~~~) ?(.*) *$/gm) || [];
  blocks = blocks.map(function (m) {
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
          if (options.extensions[name]) {
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

export { defaultOptions, defaultLanguages, process };
