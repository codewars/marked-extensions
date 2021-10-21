import fs from 'fs'
import { cwd } from 'process'

const markdown = {}

export function fixture(name) {
  if (markdown[name]) {
    return markdown[name];
  }

  let file = `${cwd()}/test/fixtures/${name}.md`;
  return markdown[name] = fs.readFileSync(file, 'utf8');
}
