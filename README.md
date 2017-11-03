# marked-extensions

Provides markdown extensions on top of the marked library, including:

- if/if-not markdown blocks
- hide code language blocks based on active language
- special doc syntax for writing documentation for multiple languages at once
- Code line numbers
- CodeMirror runMode integration
- Mermaid integration

## Install
```
npm install marked-extensions --save
```

## Usage

~~~javascript
var { process } = require('marked-extensions');
var marked = require('marked');

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
~~~
