---
'@codewars/marked-extensions': major
---

Remove broken `filterLanguages` option. Cannot be fixed because filtering by active language requires postprocessing HTML to avoid breaking many descriptions. The postprocessing depends on the `languageWrapper` and it's not easy to generalize.
