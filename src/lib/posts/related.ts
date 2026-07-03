import type { Post } from "./types";

/**
 * Related posts, scored by shared taxonomy: same category counts more than a
 * shared tag; recency breaks ties. If taxonomy overlap can't fill the quota,
 * the most recent remaining posts pad the list, so the section never renders
 * empty while other posts exist.
 */
export function relatedPosts(post: Post, all: Post[], count: number): Post[] {
  const candidates = all.filter(
    (p) => p.slug !== post.slug && p.status === "published",
  );

  const tagSet = new Set(post.tags.map((t) => t.toLowerCase()));
  const scored = candidates
    .map((candidate) => {
      let score = 0;
      if (
        candidate.category &&
        candidate.category.toLowerCase() === post.category.toLowerCase()
      ) {
        score += 3;
      }
      for (const tag of candidate.tags) {
        if (tagSet.has(tag.toLowerCase())) score += 1;
      }
      return { candidate, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.publishedAt ?? "").localeCompare(
          a.candidate.publishedAt ?? "",
        ),
    );

  const related = scored
    .filter((s) => s.score > 0)
    .slice(0, count)
    .map((s) => s.candidate);

  if (related.length < count) {
    for (const { candidate } of scored) {
      if (related.length >= count) break;
      if (!related.includes(candidate)) related.push(candidate);
    }
  }

  return related;
}
