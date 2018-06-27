# Documentation
This is some text

```%docjson
{
  "method": "openFiles",
  desc: "Loops through any files that are not opened and opens them"
  "args": {
    "files": {
      "type": "Array<File>",
      "desc": "An array of file objects that may need to be opened"
    },
    "ext": {
      "type": "String",
      "desc": "An optional extension that may be used as a filter to determine which files to open"
    }
  },
  "returns": {
    "type": "Array<File>",
    "desc": "A filtered array of files that were opened"
  }
}
```
