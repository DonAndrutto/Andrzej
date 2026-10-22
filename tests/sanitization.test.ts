import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { PostInput } from "../src/lib/posts/types";

/**
 * Save → reload → render tests for the markdown pipeline.
 *
 * Every payload is written through the real FsPostRepository into a private
 * temp directory (the repository resolves content/posts from process.cwd(), so
 * we chdir before importing it — the real content/ directory is never touched),
 * read back through a *fresh* repository instance, and rendered with the same
 * renderMarkdown() the public post page, RSS feed and admin preview use.
 *
 * Run with: npm test
 */

const SAFE_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol", "nl",
  "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div", "table",
  "thead", "caption", "tbody", "tr", "th", "td", "pre", "iframe-never",
  "img", "figure", "figcaption", "details", "summary", "ins", "del", "sup", "sub",
]);
const SAFE_ATTRS: Record<string, Set<string>> = {
  "*": new Set(["id"]),
  a: new Set(["href", "title", "target", "rel", "name"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading", "decoding"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
  td: new Set(["align"]),
  th: new Set(["align"]),
};

// sanitize-html always re-serialises: text `<` becomes `&lt;`, attribute values
// are quoted and escaped. So every literal `<` in its output starts a real tag
// and a strict tag grammar can verify the whole output without a second parser.
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+(?:="[^"<>]*")?)*)\s*(\/?)>/g;
const ATTR = /\s+([a-zA-Z-]+)(?:="([^"]*)")?/g;

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Asserts the HTML contains only allow-listed tags/attributes and safe URLs. */
function assertSafeHtml(html: string, label: string): void {
  let tagCount = 0;
  for (const m of html.matchAll(TAG)) {
    tagCount++;
    const [, , rawName, attrs] = m;
    const name = rawName.toLowerCase();
    assert.ok(SAFE_TAGS.has(name), `${label}: disallowed tag <${name}> in: ${html}`);
    for (const a of attrs.matchAll(ATTR)) {
      const attr = a[1].toLowerCase();
      assert.ok(!attr.startsWith("on"), `${label}: event handler ${attr} in: ${html}`);
      assert.ok(
        SAFE_ATTRS["*"].has(attr) || SAFE_ATTRS[name]?.has(attr),
        `${label}: disallowed attribute ${attr} on <${name}> in: ${html}`,
      );
      if (attr === "href" || attr === "src") {
        const url = decodeEntities(a[2] ?? "").replace(/[\u0000- \u007f]+/g, "").toLowerCase();
        const scheme = /^([a-z][a-z0-9+.-]*):/.exec(url)?.[1];
        assert.ok(
          !scheme || scheme === "http" || scheme === "https" || (scheme === "mailto" && attr === "href"),
          `${label}: unsafe ${attr} scheme "${scheme}" in: ${html}`,
        );
        assert.ok(!url.startsWith("//"), `${label}: protocol-relative ${attr} in: ${html}`);
      }
    }
  }
  // Any `<` that is not part of a recognised tag would be raw markup.
  const withoutTags = html.replace(TAG, "");
  assert.ok(!withoutTags.includes("<"), `${label}: stray "<" outside a tag in: ${html}`);
  assert.ok(typeof tagCount === "number");
}

let workDir: string;
let originalCwd: string;
let FsPostRepository: typeof import("../src/lib/posts/fs-repository").FsPostRepository;
let renderMarkdown: typeof import("../src/lib/posts/markdown").renderMarkdown;
let counter = 0;

before(async () => {
  originalCwd = process.cwd();
  workDir = mkdtempSync(path.join(os.tmpdir(), "arybszleger-sanitize-"));
  process.chdir(workDir); // POSTS_DIR is computed from cwd at import time
  ({ FsPostRepository } = await import("../src/lib/posts/fs-repository"));
  ({ renderMarkdown } = await import("../src/lib/posts/markdown"));
});

after(() => {
  process.chdir(originalCwd);
  rmSync(workDir, { recursive: true, force: true });
});

function input(content: string, extra: Partial<PostInput> = {}): PostInput {
  return {
    slug: `t-${++counter}`,
    title: "Sanitisation test",
    excerpt: "",
    content,
    status: "published",
    category: "Notes",
    tags: [],
    featuredImage: null,
    ...extra,
  };
}

/** save → reload (fresh repository instance) → render. */
async function roundTrip(content: string, extra: Partial<PostInput> = {}) {
  const saver = new FsPostRepository();
  const saved = await saver.createPost(input(content, extra));
  const reader = new FsPostRepository(); // no shared cache with the writer
  const reloaded = await reader.getPost(saved.slug);
  assert.ok(reloaded, "post must reload from disk");
  return { reloaded, html: renderMarkdown(reloaded.content) };
}

describe("isolation", () => {
  test("tests write only to a private temp directory", async () => {
    await roundTrip("hello");
    assert.ok(process.cwd().startsWith(os.tmpdir()) || process.cwd().includes("arybszleger-sanitize-"));
    assert.ok(readdirSync(path.join(workDir, "content", "posts")).length >= 1);
    // The real repository content is untouched.
    const real = readdirSync(path.join(originalCwd, "content", "posts"));
    assert.ok(!real.some((f) => f.startsWith("t-")), "real content/posts must not receive test files");
  });
});

describe("legitimate article formatting survives save → reload → render", () => {
  const article = [
    "# Title heading",
    "",
    "## Section *two*",
    "",
    "Some **bold**, _italic_, ~~struck~~ and `inline code` text with a [link](https://example.org/a?b=1&c=2) and a [relative link](/blog/other-post).",
    "",
    "> A blockquote.",
    "",
    "- one\n- two\n\n1. first\n2. second",
    "",
    "```ts\nconst x = 1 < 2;\n```",
    "",
    "| a | b |\n|:-:|--:|\n| 1 | 2 |",
    "",
    "![Alt text](/uploads/example.png \"Caption\")",
    "",
    "<figure><img src=\"/uploads/f.png\" alt=\"F\" width=\"10\" height=\"10\"><figcaption>Cap</figcaption></figure>",
    "",
    "<details><summary>More</summary>Hidden <sup>1</sup> text<sub>2</sub></details>",
    "",
    "Mail [me](mailto:translation@arybszleger.com).",
  ].join("\n");

  test("headings, emphasis, lists, quotes, code, tables, figures survive", async () => {
    const { html } = await roundTrip(article);
    assertSafeHtml(html, "article");
    assert.match(html, /<h1 id="title-heading">Title heading<\/h1>/);
    assert.match(html, /<h2 id="[^"]+">Section <em>two<\/em><\/h2>/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<em>italic<\/em>/);
    assert.match(html, /<del>struck<\/del>/);
    assert.match(html, /<code>inline code<\/code>/);
    assert.match(html, /<blockquote>/);
    assert.match(html, /<ul>[\s\S]*<li>one<\/li>/);
    assert.match(html, /<ol>[\s\S]*<li>first<\/li>/);
    assert.match(html, /<pre><code class="language-ts">/);
    assert.match(html, /1 &lt; 2/); // code is escaped, not interpreted
    assert.match(html, /<table>[\s\S]*<th align="center">a<\/th>/);
    assert.match(html, /<td align="right">2<\/td>/);
    assert.match(html, /<figure><img src="\/uploads\/f\.png" alt="F" width="10" height="10" \/>?<figcaption>Cap<\/figcaption><\/figure>/);
    assert.match(html, /<details><summary>More<\/summary>/);
    assert.match(html, /<sup>1<\/sup>/);
    assert.match(html, /<sub>2<\/sub>/);
  });

  test("external links keep target/rel; relative and mailto links work", async () => {
    const { html } = await roundTrip(article);
    assert.match(html, /<a href="https:\/\/example\.org\/a\?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">link<\/a>/);
    assert.match(html, /<a href="\/blog\/other-post">relative link<\/a>/);
    assert.match(html, /<a href="mailto:translation@arybszleger\.com">me<\/a>/);
  });

  test("inline images keep src/alt/title/loading/decoding", async () => {
    const { html } = await roundTrip(article);
    assert.match(html, /<img src="\/uploads\/example\.png" alt="Alt text" title="Caption" loading="lazy" decoding="async" \/>/);
  });

  test("Tibetan and Polish text round-trips byte-for-byte", async () => {
    const tibetan = "བཀྲ་ཤིས་བདེ་ལེགས། ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ།";
    const polish = "Zażółć gęślą jaźń — „cytat” & <em>nie</em> HTML";
    const { reloaded, html } = await roundTrip(`${tibetan}\n\n${polish}`, {
      title: `${tibetan} / ${polish}`,
    });
    assert.equal(reloaded.title, `${tibetan} / ${polish}`);
    assert.ok(html.includes(tibetan), "Tibetan text must be preserved");
    assert.ok(html.includes("Zażółć gęślą jaźń"), "Polish diacritics must be preserved");
    assertSafeHtml(html, "unicode");
  });
});

describe("malicious markdown/HTML is neutralised after save → reload → render", () => {
  const payloads: Record<string, string> = {
    "script tag": `Hi <script>alert(1)</script> there`,
    "script via img onerror": `<img src=x onerror=alert(1)>`,
    "svg onload": `<svg onload=alert(1)><circle/></svg>`,
    "iframe srcdoc": `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
    "iframe src javascript": `<iframe src="javascript:alert(1)"></iframe>`,
    "object/embed": `<object data="javascript:alert(1)"></object><embed src="javascript:alert(1)">`,
    "style tag": `<style>body{background:url(javascript:alert(1))}</style>`,
    "style attribute": `<p style="background:url(javascript:alert(1))">x</p>`,
    "form + button": `<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">x</button></form>`,
    "input autofocus onfocus": `<input autofocus onfocus=alert(1)>`,
    "markdown javascript link": `[click](javascript:alert(1))`,
    "markdown javascript link, entity-obfuscated": `[click](&#106;avascript:alert(1))`,
    "markdown vbscript link": `[click](vbscript:msgbox(1))`,
    "markdown data image": `![x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`,
    "raw anchor javascript": `<a href="javascript:alert(1)">x</a>`,
    "raw anchor tab-obfuscated": `<a href="jav&#x09;ascript:alert(1)">x</a>`,
    "raw anchor newline-obfuscated": `<a href="java\nscript:alert(1)">x</a>`,
    "raw anchor uppercase scheme": `<a href="JaVaScRiPt:alert(1)">x</a>`,
    "raw anchor data": `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
    "protocol-relative link": `<a href="//evil.example/x">x</a><img src="//evil.example/x.png">`,
    "img data svg": `<img src="data:image/svg+xml,<svg onload=alert(1)>">`,
    "base tag hijack": `<base href="https://evil.example/"><a href="/x">x</a>`,
    "meta refresh": `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`,
    "link rel stylesheet": `<link rel="stylesheet" href="https://evil.example/x.css">`,
    "math/mglyph mXSS": `<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=alert(1)&gt;">`,
    "nested form mXSS": `<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>`,
    "on* attribute on allowed tag": `<p onmouseover="alert(1)" onclick="alert(1)">x</p>`,
    "id clobbering attr abuse": `<a href="/x" onfocus="alert(1)" autofocus>x</a>`,
    "unclosed tag at end": `<img src="/x.png" onerror="alert(1)"`,
    "HTML comment smuggling": `<!--><img src=x onerror=alert(1)>-->`,
    "CDATA smuggling": `<![CDATA[<img src=x onerror=alert(1)>]]>`,
    // Regression payloads for the sanitize-html advisories fixed by 2.18.1:
    "GHSA-g8qq SVG SMIL URI-list": `<svg><a><animate attributeName="href" values="javascript:alert(1)"/><text x="10" y="20">click</text></a></svg>`,
    "GHSA-g8qq SVG set/animate href": `<svg><a href="/x"><set attributeName="href" to="javascript:alert(1)"/><text>x</text></a></svg>`,
    "GHSA-jxwj textarea solidus close": `<textarea></textarea/><img src=x onerror=alert(1)></textarea/>`,
    "GHSA-jxwj textarea solidus variant": `<textarea><textarea/><img src=x onerror=alert(1)>`,
    "GHSA-x3q4 noscript region": `<noscript><p title="</noscript><img src=x onerror=alert(1)>">`,
    "GHSA-x3q4 noscript implied close": `<noscript><div></noscript><img src=x onerror=alert(1)></div>`,
    "GHSA-cv27 meta refresh data URL": `<meta http-equiv="refresh" content="0; url=data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">`,
    "GHSA-cv27 meta refresh javascript": `<meta http-equiv="Refresh" content="0;URL='javascript:alert(1)'">`,
  };

  // sanitize-html discards everything after an unclosed <style>/<textarea>;
  // losing the tail of a hostile post is the safe outcome, not a bug.
  const swallowsTail = new Set(["nested form mXSS", "GHSA-jxwj textarea solidus variant"]);

  for (const [name, payload] of Object.entries(payloads)) {
    test(name, async () => {
      const { reloaded, html } = await roundTrip(`before\n\n${payload}\n\nafter`);
      // The author's text is stored verbatim (sanitisation happens at render).
      assert.ok(reloaded.content.includes(payload.trim().slice(0, 12)), "payload persisted");
      assertSafeHtml(html, name);
      assert.ok(!/javascript:|vbscript:/i.test(decodeEntities(html).replace(/[\u0000- ]+/g, "")), `${name}: script URL survived: ${html}`);
      assert.match(html, /before/);
      if (!swallowsTail.has(name)) assert.match(html, /after/);
    });
  }

  test("a hostile title/excerpt is stored as inert data (YAML round trip)", async () => {
    const title = `"><script>alert(1)</script>: {{x}} & 'quotes' — #hash`;
    const excerpt = `</title><img src=x onerror=alert(1)>\nline two`;
    const { reloaded } = await roundTrip("body", { title, excerpt, tags: ["<b>x</b>", "a,b"] });
    assert.equal(reloaded.title, title);
    assert.equal(reloaded.excerpt, excerpt);
    assert.deepEqual(reloaded.tags, ["<b>x</b>", "a,b"]);
    // The raw file keeps the data; frameworks escape it at render time. The
    // rendered body for these fields never goes through renderMarkdown.
    const file = readFileSync(path.join(workDir, "content", "posts", `${reloaded.slug}.md`), "utf8");
    assert.ok(file.startsWith("---\n"));
  });

  test("hostile featured-image URL is rejected by input validation", async () => {
    const { validatePostInput } = await import("../src/lib/posts/validate");
    for (const url of ["javascript:alert(1)", "data:image/svg+xml,<svg onload=alert(1)>", "//evil.example/x.png", "vbscript:x"]) {
      const result = validatePostInput({ title: "t", content: "c", featuredImage: { url, alt: "a" } });
      assert.equal(result.ok, false, `featured image ${url} must be rejected`);
    }
    const ok = validatePostInput({ title: "t", content: "c", featuredImage: { url: "/uploads/a.png", alt: "a" } });
    assert.equal(ok.ok, true);
  });
});

describe("resource exhaustion (GHSA-c9rx unbounded recursion class)", () => {
  test("deeply nested raw HTML renders or fails safely without hanging", async () => {
    const depth = 5000;
    const html = `${"<div>".repeat(depth)}deep${"</div>".repeat(depth)}`;
    const start = Date.now();
    let out = "";
    try {
      out = (await roundTrip(html)).html;
    } catch (error) {
      // A thrown RangeError is acceptable (request fails); a process hang or
      // crash is not. The assertion below is about *time*, not success.
      assert.ok(error instanceof Error);
    }
    assert.ok(Date.now() - start < 10_000, "must finish within 10s");
    if (out) assertSafeHtml(out, "deep nesting");
  });

  test("deeply nested markdown blockquotes/lists render or fail safely", async () => {
    const start = Date.now();
    try {
      const { html } = await roundTrip(`${"> ".repeat(2000)}deep\n\n${"- ".repeat(500)}x`);
      assertSafeHtml(html, "deep markdown");
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    assert.ok(Date.now() - start < 10_000, "must finish within 10s");
  });

  test("fallback/discard content that re-sanitizes does not recurse unboundedly", async () => {
    const hostile = `<nl><li>${"<noscript>".repeat(300)}<img src=x onerror=alert(1)>${"</noscript>".repeat(300)}</li></nl>${"<textarea>".repeat(300)}`;
    const start = Date.now();
    try {
      const { html } = await roundTrip(hostile);
      assertSafeHtml(html, "re-sanitise fallback");
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    assert.ok(Date.now() - start < 10_000);
  });
});
