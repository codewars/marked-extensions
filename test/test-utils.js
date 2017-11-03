import jsdom from 'jsdom'
import fs from 'fs'
import { cwd } from 'process'

// need to make CodeMirror happy by using JS-DOM
const { JSDOM } = jsdom;
const dom = new JSDOM('<body></body>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

const markdown = {}

export function fixture(name) {
  if (markdown[name]) {
    return markdown[name];
  }

  let file = `${cwd()}/test/fixtures/${name}.md`;
  return markdown[name] = fs.readFileSync(file, 'utf8');
}
