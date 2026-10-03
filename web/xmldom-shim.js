// The browser's own DOMParser under the name src/bulletml.js imports from '@xmldom/xmldom' (via the import map
// in play.html), so the page runs the same parser module as Node. The constructor's options are ignored.
export const DOMParser = globalThis.DOMParser;
