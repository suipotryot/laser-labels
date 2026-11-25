const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeXml(text) {
  return text.replace(/[&<>"]/g, (character) => XML_ESCAPES[character]);
}
