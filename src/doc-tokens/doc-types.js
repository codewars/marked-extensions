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
 * @@docType: Promise<Array<Int>>
 * @@docType:Array
 * @type {RegExp}
 */
const regex = /(`|<code>|<pre>)?@@docType: ?([\w_?]*(?:(?:<|&lt;)[\w?]*(?:[,<]?\s?\w*>?){0,3}(?:>|&gt;))?)(`|<\/code>|<\/pre>)?/g;
const nestedRegex = /(?:<|&lt;)([\w?]*(?:[,<]?\s?\w*>?){0,3})(?:>|&gt;)/g;

/**
 * process all @@docType: tokens and replaces them with the correct display value, and possibly wraps them in a dfn tag
 * @param language
 * @param pre Boolean that determines if we are displaying this content within a pre element, so don't wrap with dfn tags
 * @param content The content to be replaced. Can handle replacing multiple tags at once
 */
export function replaceDocTypes (language, pre, content) {
  return content.replace(regex, function (shell, codeStart, value, codeEnd) {
    const nullable = !!value.match(/\?$/);
    value = value.replace('?', '').trim();
    value = unescapeHtml(value);

    value = maybeMapGeneric(language, value);

    if (nullable) {
      value = mapNullable(language, value);
    }

    return wrap(value, shell, pre, codeStart, codeEnd);
  });
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

function maybeMapGeneric(language, value) {
  const parts = value.split(nestedRegex).filter(p => !!p);

  if (parts.length < 2) {
    return mapType(language, value);
  }
  else if (parts.length === 2) {
    return collectionType(language, parts[0], parts[1]);
  }
  else {
    const root = parts.shift();
    const mapped = parts.map(p => collectionType(language, p));
    return `${root}<${mapped.join(', ')}>`;
  }
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

function isTransformedType(type) {
  return Object.keys(TYPES).indexOf(type.toLowerCase()) > -1;
}

function collectionType (language, type, nestedType) {
  const nestedTypes = nestedType.split(/, ?/);
  if (isTransformedType(type)) {
    switch (language) {
      case 'ruby':
      case 'objc':
      case 'python':
        let plurals = mapTypes(language, nestedTypes)
          .map(s => s.replace(' *', ''))
          .join('s/');

        let addS = plurals.indexOf(')') > 0 ? '' : 's';
        return `${mapType(language, type)} (of ${plurals}${addS})`;

      case 'csharp':
      case 'java':
        if (type === 'Array' && nestedTypes.length == 1) {
          return `${mapType(language, nestedType)}[]`;
        }
        break;
      case 'c':
        if (type === 'List' && nestedTypes.length == 1) {
          return `${mapType(language, nestedType)}[]`;
        }
        break;
      case 'haskell':
        if ((type === 'List' || type === 'Array') && nestedTypes.length == 1) {
          return `[${mapType(language, nestedType)}]`;
        }
        break;
      case 'go':
        if ((type === 'List' || type === 'Array') && nestedTypes.length == 1) {
          return `[]${mapType(language, nestedType)}`;
        }
        break;
    }
  }
  const result = collectionGeneric(language, type, nestedTypes);
  return result;
}

function mapTypes(language, types) {
  return types.map(t => maybeMapGeneric(language, t));
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
function wrap (value, shell, pre, start, end) {
  value = escapeHtml(value.trim());

  if (pre) {
    return value;
  }
  else if (start) {
    return start + value + (end || '');
  }
  else {
    return `<dfn class="doc-type">${value}</dfn>`;
  }
}
