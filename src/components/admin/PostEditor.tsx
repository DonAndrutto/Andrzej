"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MarkdownPreview } from "@/components/admin/MarkdownPreview";
import { uploadImage } from "@/components/admin/upload-utils";
import { formatDate } from "@/lib/format";
import { readingTimeMinutes } from "@/lib/posts/reading-time";
import { slugify } from "@/lib/posts/slug";
import type { Post, PostImage, PostStatus } from "@/lib/posts/types";

interface Notice {
  kind: "ok" | "error";
  text: string;
}

/**
 * The post editor: markdown with live preview, featured + inline image
 * uploads, taxonomy, drafts and publishing. Used for both creating and
 * editing; persistence goes through /api/admin/posts.
 */
export function PostEditor({
  post,
  categories,
  writable,
}: {
  post?: Post;
  categories: string[];
  writable: boolean;
}) {
  const router = useRouter();
  const isNew = !post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [tagsText, setTagsText] = useState(post?.tags.join(", ") ?? "");
  const [featuredImage, setFeaturedImage] = useState<PostImage | null>(
    post?.featuredImage ?? null,
  );
  const [savedStatus, setSavedStatus] = useState<PostStatus | null>(
    post?.status ?? null,
  );

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"featured" | "inline" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const featuredFileRef = useRef<HTMLInputElement>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const currentSlugRef = useRef(post?.slug ?? null);

  const deferredContent = useDeferredValue(content);
  const stats = useMemo(() => {
    const words = content.split(/\s+/).filter(Boolean).length;
    return { words, minutes: readingTimeMinutes(content || " ") };
  }, [content]);

  // Warn before discarding unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function touch<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
      setNotice(null);
    };
  }

  const setTitleTouched = touch(setTitle);
  const setExcerptTouched = touch(setExcerpt);
  const setContentTouched = touch(setContent);
  const setCategoryTouched = touch(setCategory);
  const setTagsTouched = touch(setTagsText);

  function effectiveSlug(): string {
    return (slugTouched ? slug : slugify(title)) || slugify(title);
  }

  async function save(nextStatus: PostStatus) {
    if (!title.trim()) {
      setNotice({ kind: "error", text: "A title is required." });
      return;
    }
    const payloadSlug = effectiveSlug();
    if (!payloadSlug) {
      setNotice({
        kind: "error",
        text: "Please provide a URL slug (the title contains no Latin characters to derive one from).",
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    const payload = {
      slug: payloadSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      status: nextStatus,
      category: category.trim() || "Notes",
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featuredImage,
    };

    const target = currentSlugRef.current
      ? `/api/admin/posts/${currentSlugRef.current}`
      : "/api/admin/posts";
    const response = await fetch(target, {
      method: currentSlugRef.current ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as {
      post?: Post;
      error?: string;
    } | null;
    setBusy(false);

    if (!response.ok || !data?.post) {
      setNotice({ kind: "error", text: data?.error ?? "Saving failed." });
      return;
    }

    const saved = data.post;
    const renamed = currentSlugRef.current && currentSlugRef.current !== saved.slug;
    const created = !currentSlugRef.current;
    currentSlugRef.current = saved.slug;
    setSlug(saved.slug);
    setSlugTouched(true);
    setSavedStatus(saved.status);
    setDirty(false);
    setNotice({
      kind: "ok",
      text:
        saved.status === "published"
          ? "Saved and published."
          : "Draft saved.",
    });

    if (created || renamed) {
      router.replace(`/admin/posts/${saved.slug}`);
    }
    router.refresh();
  }

  async function remove() {
    if (!currentSlugRef.current) return;
    if (!window.confirm(`Delete “${title || slug}”? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/admin/posts/${currentSlugRef.current}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setNotice({ kind: "error", text: data?.error ?? "Deleting failed." });
      return;
    }
    setDirty(false);
    router.push("/admin/posts");
    router.refresh();
  }

  async function handleFeaturedUpload(file: File) {
    setUploading("featured");
    setNotice(null);
    try {
      const image = await uploadImage(file);
      setFeaturedImage({ ...image, alt: featuredImage?.alt ?? "" });
      setDirty(true);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setUploading(null);
    }
  }

  async function handleInlineUpload(file: File) {
    setUploading("inline");
    setNotice(null);
    try {
      const image = await uploadImage(file);
      const label = file.name.replace(/\.[a-z0-9]+$/i, "");
      insertBlock(`![${label}](${image.url})`);
      // If the post has no featured image yet, use this first inline image
      // as one too — otherwise it shows in the body but not on the journal
      // listing cards, which only ever read `featuredImage`.
      setFeaturedImage((current) => current ?? { ...image, alt: label });
      setDirty(true);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setUploading(null);
    }
  }

  /** Wrap the current selection (or insert placeholder text). */
  function wrapSelection(before: string, after = before, placeholder = "text") {
    const textarea = contentRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = content.slice(selectionStart, selectionEnd) || placeholder;
    const next =
      content.slice(0, selectionStart) +
      before +
      selected +
      after +
      content.slice(selectionEnd);
    setContentTouched(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + before.length,
        selectionStart + before.length + selected.length,
      );
    });
  }

  /** Insert a block of markdown on its own line at the cursor. */
  function insertBlock(block: string) {
    const textarea = contentRef.current;
    const position = textarea?.selectionStart ?? content.length;
    const before = content.slice(0, position);
    const after = content.slice(position);
    const prefix = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const next = `${before}${prefix}${block}\n\n${after}`;
    setContentTouched(next);
    requestAnimationFrame(() => textarea?.focus());
  }

  const previewHref =
    savedStatus === "published"
      ? `/blog/${currentSlugRef.current}`
      : `/admin/preview/${currentSlugRef.current}`;

  return (
    <div className="editor-layout">
      <div className="editor-main">
        {!writable && (
          <div className="admin-notice notice-error" role="alert">
            <strong>Read-only deployment.</strong> Saving is disabled here —
            configure Firestore, or run the site locally to write to
            <code> content/posts/</code>.
          </div>
        )}

        {notice && (
          <div
            className={`admin-notice ${notice.kind === "ok" ? "notice-ok" : "notice-error"}`}
            role="status"
          >
            {notice.text}
          </div>
        )}

        <div className="field">
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitleTouched(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Post title"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="post-slug">Slug</label>
            <input
              id="post-slug"
              type="text"
              value={slugTouched ? slug : slugify(title)}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value) || e.target.value.toLowerCase());
                setDirty(true);
              }}
              placeholder="url-of-the-post"
            />
            <span className="field-hint">/blog/{effectiveSlug() || "…"}</span>
          </div>
          <div className="field">
            <label htmlFor="post-category">Category</label>
            <input
              id="post-category"
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategoryTouched(e.target.value)}
              placeholder="e.g. Translations"
            />
            <datalist id="category-suggestions">
              {categories.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field">
          <label htmlFor="post-excerpt">Excerpt</label>
          <textarea
            id="post-excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerptTouched(e.target.value)}
            placeholder="A sentence or two shown in listings, search results and feeds."
          />
        </div>

        <div className="field">
          <label htmlFor="post-tags">Tags</label>
          <input
            id="post-tags"
            type="text"
            value={tagsText}
            onChange={(e) => setTagsTouched(e.target.value)}
            placeholder="Comma-separated, e.g. Dzogchen, Pema Lingpa"
          />
        </div>

        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button type="button" className="btn" onClick={() => insertBlock("## Heading")}>
              H2
            </button>
            <button type="button" className="btn" onClick={() => insertBlock("### Heading")}>
              H3
            </button>
            <button type="button" className="btn" onClick={() => wrapSelection("**")}>
              Bold
            </button>
            <button type="button" className="btn" onClick={() => wrapSelection("*")}>
              Italic
            </button>
            <button type="button" className="btn" onClick={() => wrapSelection("[", "](https://)", "link text")}>
              Link
            </button>
            <button type="button" className="btn" onClick={() => insertBlock("> Quotation")}>
              Quote
            </button>
            <button type="button" className="btn" onClick={() => insertBlock("---")}>
              ✦
            </button>
            <button
              type="button"
              className="btn"
              disabled={uploading !== null}
              onClick={() => inlineFileRef.current?.click()}
            >
              {uploading === "inline" ? "Uploading…" : "Insert image"}
            </button>
          </div>
          <div className="toolbar-group">
            <label
              className="field-hint"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              Live preview
            </label>
          </div>
        </div>

        <div className={`editor-workbench${showPreview ? " with-preview" : ""}`}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="post-content">Content (Markdown)</label>
            <textarea
              id="post-content"
              ref={contentRef}
              className="markdown-input"
              value={content}
              onChange={(e) => setContentTouched(e.target.value)}
              placeholder={"Write in Markdown…\n\n## A heading\n\nSome *emphasis*, a [link](https://example.com), and an image via the toolbar."}
            />
          </div>
          {showPreview && (
            <div className="preview-pane" aria-label="Preview">
              <div className="preview-meta">
                Preview · {stats.words} words · {stats.minutes} min read
              </div>
              <MarkdownPreview markdown={deferredContent} />
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          ref={inlineFileRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleInlineUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      <aside className="editor-side">
        <div className="admin-panel">
          <h2 className="panel-label">Publish</h2>
          <p className="field-hint" style={{ marginBottom: "0.9rem" }}>
            {savedStatus === "published" && "This post is live."}
            {savedStatus === "draft" && "This post is a draft — only you can see it."}
            {savedStatus === null && "Not saved yet."}
            {dirty && " Unsaved changes."}
          </p>
          <div className="btn-row">
            {savedStatus === "published" ? (
              <>
                <button
                  className="btn btn-primary"
                  disabled={busy || !writable}
                  onClick={() => void save("published")}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="btn"
                  disabled={busy || !writable}
                  onClick={() => void save("draft")}
                >
                  Unpublish
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn"
                  disabled={busy || !writable}
                  onClick={() => void save("draft")}
                >
                  {busy ? "Saving…" : "Save draft"}
                </button>
                <button
                  className="btn btn-primary"
                  disabled={busy || !writable}
                  onClick={() => void save("published")}
                >
                  Publish
                </button>
              </>
            )}
          </div>
          {currentSlugRef.current && (
            <div className="btn-row" style={{ marginTop: "0.8rem" }}>
              <Link className="btn" href={previewHref} target="_blank">
                {savedStatus === "published" ? "View post ↗" : "Preview draft ↗"}
              </Link>
            </div>
          )}
        </div>

        <div className="admin-panel featured-widget">
          <h2 className="panel-label">Featured image</h2>
          {featuredImage ? (
            <>
              {/* Plain <img>: the public pages use next/image; here we just
                  need a quick look at what was uploaded. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage.url} alt={featuredImage.alt || "Featured"} />
              <div className="field" style={{ marginTop: "0.8rem" }}>
                <label htmlFor="featured-alt">Alt text</label>
                <input
                  id="featured-alt"
                  type="text"
                  value={featuredImage.alt}
                  onChange={(e) => {
                    setFeaturedImage({ ...featuredImage, alt: e.target.value });
                    setDirty(true);
                  }}
                  placeholder="Describe the image"
                />
              </div>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={uploading !== null}
                  onClick={() => featuredFileRef.current?.click()}
                >
                  {uploading === "featured" ? "Uploading…" : "Replace"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setFeaturedImage(null);
                    setDirty(true);
                  }}
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="featured-empty">No featured image</div>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={uploading !== null || !writable}
                  onClick={() => featuredFileRef.current?.click()}
                >
                  {uploading === "featured" ? "Uploading…" : "Upload image"}
                </button>
              </div>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            hidden
            ref={featuredFileRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFeaturedUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        {post && (
          <div className="admin-panel">
            <h2 className="panel-label">Details</h2>
            <p className="field-hint">Created {formatDate(post.createdAt)}</p>
            <p className="field-hint">Updated {formatDate(post.updatedAt)}</p>
            {post.publishedAt && (
              <p className="field-hint">Published {formatDate(post.publishedAt)}</p>
            )}
            <p className="field-hint">
              {stats.words} words · {stats.minutes} min read
            </p>
            <div className="btn-row" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy || !writable}
                onClick={() => void remove()}
              >
                Delete post
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
