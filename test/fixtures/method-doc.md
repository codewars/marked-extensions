# Documentation
This is some text

```%method-doc
{
  "method": "open_files",
  "desc": "Loops through any files that are not opened and opens them",
  "args": {
    "files": {
      "type": "Array<File>",
      "desc": "An array of file objects that may need to be opened"
    },
    "ext": {
      "type": "String",
      "desc": "An optional extension that may be used as a filter to determine which files to open"
    },
    "int": {
      "type": "int *",
      "desc": "the data buffer, consisting entirely of lower-case characters; matches the regex `[a-z]*`"
    }
  },
  "constraints": [
    "0 <= files.length <= 10"
  ],
  "returns": {
    "type": "Array<File>",
    "desc": "A filtered array of files that were opened"
  },
  "examples": [
    {
      "name": "Example A",
      "args": [[1,2,3], "js"],
      "returns": [1,2]
    },
    {
      "args": [[1,2,3], "rb"],
      "returns": [3]
    }
  ]
}
```
