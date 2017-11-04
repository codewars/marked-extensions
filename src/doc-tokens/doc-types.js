import { escapeHtml, unescapeHtml } from '../strings'

/**
 * Tracks some basic types that we convert for different languages. We don't need to try to
 * maintain a list for every type for every language we support, however we do want to track some
 * common types, such as hash, void, and primary types to minimize confusion.
 *
 * We will want to expand or trim this list as needed to find a good balance between useful and
 * too much language specialization.
 *
 */
const TYPES = {
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
  },
}

const NULLABLE = {
  csharp: {
    default: 'Nullable<@@>'
  }
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
 * @@docType:Array
 * @type {RegExp}
 */
const regex = /(`|<code>)?@@docType: ?([a-zA-Z_?]*(?:<[a-zA-Z?]*(?:(?:,|, )[a-zA-Z]*)?>)?)(`|<\/code>?)?/g;

/**
 * process all @@docType: tokens and replaces them with the correct display value, and possibly wraps them in a dfn tag
 * @param language
 * @param pre Boolean that determines if we are displaying this content within a pre element, so don't wrap with dfn tags
 * @param content The content to be replaced. Can handle replacing multiple tags at once
 */
export function replaceDocTypes (language, pre, content) {
  // unescape HTML to make it easier to process
  content = unescapeHtml(content);

  return content.replace(regex, function (shell, codeEl, value) {

    const nullable = !!value.match(/\?$/);
    value = value.replace('?', '').trim();

    if (value.indexOf('<') > 0) {
      const parts = value.split(/[<>]/);
      value = collectionType(language, parts[0], parts[1]);
    }
    else {
      value = mapType(language, value);
    }

    if (nullable) {
      value = mapNullable(language, value);
    }

    return wrap(value, shell, pre || !!codeEl);
  })
}

function mapNullable (language, value) {
  if (NULLABLE[language]) {
    const config = NULLABLE[language][value] || NULLABLE[language].default;
    if (config) {
      return config.replace('@@', value);
    }
  }

  return value;
}


function mapType (language, type, _default) {
  const map = TYPES[type.toLowerCase()];
  let mapped = null;
  if (map) {
    Object.keys(map).forEach(key => {
      if (!mapped) {
        if (key === 'default') {
          mapped = map.default;
        }
        // if a string, then the value is an alias to another type
        else if (key === '_alias') {
          mapped = mapType(language, map._alias, type);
        }
        else if (map[key].indexOf(language) >= 0) {
          mapped = key;
        }
      }
    })
    return mapped || _default || type;
  }

  return type;
}

function collectionType (language, type, nestedType) {
  const nestedTypes = nestedType.split(/, ?/);

  switch (language) {
    case 'javascript':
    case 'ruby':
    case 'objc':
    case 'python':
      return `${mapType(language, type)} (of ${mapTypes(language, nestedTypes).join('s/')}s)`;

    case 'csharp':
      if (type === 'Array' && nestedTypes.length == 1) {
        return `${mapType(language, nestedType)}[]`;
      }
      return collectionGeneric(language, type, nestedTypes);

    default:
      return collectionGeneric(language, type, nestedTypes);
  }
}

function mapTypes(language, types) {
  return types.map(t => mapType(language, t));
}

function collectionGeneric (language, type, nestedTypes) {
  const mapped = mapTypes(language, nestedTypes).join(', ');
  return `${mapType(language, type)}<${mapped}>`;
}

/**
 * Wraps the value within the necessary html to ensure that it gets rendered correctly
 * @param value
 * @param shell the shell of the @@docType syntax. Used to determine if a ` is present
 * @returns {string}
 */
function wrap (value, shell, pre) {
  if (pre) {
    return escapeHtml(value);
  }
  else {
    return `<dfn class="doc-type">${escapeHtml(value.trim())}</dfn>`;
  }
}
