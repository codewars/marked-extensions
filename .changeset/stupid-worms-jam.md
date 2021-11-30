---
'@codewars/marked-extensions': minor
---

Clean up for v1

- Removed CM support. Utilize `highlight` function with CM directly if you wish to use this.
- Removed lineNumbers support, this may be added in later if a universal way of handling it is found
- Simplified extensions, loadScript support was removed, extensions need to load their own resources
- Removed Mermaid support, this can be added later as an external extension
- Upgraded `marked` from 0.6.2 to 2.1.1 and added to peer dependencies
- Removed `findLanguage` option, now just assumes anything unknown is a language
