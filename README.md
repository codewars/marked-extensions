# marked-extensions

Provides markdown extensions on top of the marked library, including:

- if/if-not markdown blocks
- hide code language blocks based on active language
- special doc syntax for writing documentation for multiple languages at once
- Code line numbers
- CodeMirror runMode integration
- Mermaid integration
- YAML meta data

## Install

```
npm install marked-extensions --save
```

## Usage

````javascript
var { process } = require('marked-extensions');
var { marked } = require('marked');

var markdown = `
# @@docMethod:full_name(@@docParam:first_name, @@docParam:last_name)
```@doc
Parameters:
@@docParam:first_name @@docType:String - The first name
@@docParam:last_name @@docType:String - The last name

Return Value:
@@docType:String - The first and last name
```
`

var processed = process(marked, markdown, { language: 'javascript' });
````

### `%method-doc`

````
```%method-doc
{
    "method": "",
    "desc": "",
    "args": {
          "arg1": { "type": "", "desc": "" },
          "arg2": { "type": "", "desc": "" }
    },
    "returns": { "type": "", "desc": "" },
    "constraints": [
        ""
    ],
    "examples": [
        {"args": [], "returns": null },
        {"args": [], "returns": null }
    ],
    "examplesOnly": false, // set to true if you want to only show examples with no method doc
    "formatTypes": true, // defaults to true, set to false if you want to disable type formattings
    "languages": { // override a specific language
      "javascript": {
        "method": ""
      }
    }
}
```
````
