/**
 * Plain text of a markdown document — for reading time and search.
 * Kept dependency-free so both server code and the admin editor can use it.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
    .replace(/<[^>]+>/g, " ") // raw HTML
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/[*_~>#|-]+/g, " ") // remaining markdown punctuation
    .replace(/\s+/g, " ")
    .trim();
}
