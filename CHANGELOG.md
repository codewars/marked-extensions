# @codewars/marked-extensions

## 0.6.0

### Minor Changes

- 77597cc: Remove frontmatter extraction
- c72e0e9: Remove unused `extensions` option
- 2a125c2: Upgrade `marked` to 4.0.5
- 27ec6ff: Remove broken `filterLanguages` option. Cannot be fixed because filtering by active language requires postprocessing HTML to avoid breaking many descriptions. The postprocessing depends on the `languageWrapper` and it's not easy to generalize.
- 489ebd8: Automate release

  - Open and update a release PR when changes are merged
  - Release the package when a release PR is merged
  - Generate `CHANGELOG.md` based on changeset
  - Add `prepare` script so `npm install` builds the package
  - Remove `dist/` which is now generated before release or locally when developing
  - **BREAKING**: Move the package under `@codewars` org
  - **BREAKING**: Remove `dist/marked-extensions.js` IIFE build
  - **BREAKING**: Update `rollup` and remove `babel`
    - The generated code is almost identical except for arrow functions and the use of `const`

- 2a43960: Remove heading extensions
- f0c6397: Remove class prefix from Kotlin
- 2b3ee26: Clean up for v1

  - Removed CM support. Utilize `highlight` function with CM directly if you wish to use this.
  - Removed lineNumbers support, this may be added in later if a universal way of handling it is found
  - Simplified extensions, loadScript support was removed, extensions need to load their own resources
  - Removed Mermaid support, this can be added later as an external extension
  - Upgraded `marked` from 0.6.2 to 2.1.1 and added to peer dependencies
  - Removed `findLanguage` option, now just assumes anything unknown is a language
