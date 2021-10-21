---
"@codewars/marked-extensions": major
---

Automate release

- Open and update a release PR when changes are merged
- Release the package when a release PR is merged
- Generate `CHANGELOG.md` based on changeset
- Add `prepare` script so `npm install` builds the package
- Remove `dist/` which is now generated before release or locally when developing
- **BREAKING**: Move the package under `@codewars` org
- **BREAKING**: Remove `dist/marked-extensions.js` IIFE build
- **BREAKING**: Update `rollup` and remove `babel`
  - The generated code is almost identical except for arrow functions and the use of `const`
