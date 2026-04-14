export function downloadTextFile(options: {
  filename: string;
  content: string;
  mimeType: string;
}) {
  const blob = new Blob([options.content], {
    type: `${options.mimeType};charset=utf-8`,
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = options.filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
