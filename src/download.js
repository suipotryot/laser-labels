export function downloadSvg(svgText, fileName) {
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}
