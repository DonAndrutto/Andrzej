const prefix = "app-library-";
const release = prefix + "__RELEASE__";
const pages = ["/", "/pl"];
const artwork = "/library-app/";
const local = path => new URL(path, self.location.origin).href;
const fresh = url => new Request(url, { cache: "reload" });

async function saveLibrary() {
  const cache = await caches.open(release);
  try {
    const resources = new Set([
      artwork + "gangtey.webp", artwork + "icon.svg", artwork + "icon-180.png",
      artwork + "icon-192.png", artwork + "icon-512.png",
    ].map(local));
    // Collect resources from both rendered editions. This includes the hidden
    // experiment tiles and the exact script URLs served for this deployment.
    for (const path of pages) {
      const response = await fetch(fresh(local(path)));
      if (!response.ok) throw Error("Library page unavailable");
      const html = await response.clone().text();
      if (!html.includes('id="experimental-apps"')) throw Error("Unexpected library page");
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const url = new URL(match[1].replaceAll("&amp;", "&"), local(path));
        if (url.origin === self.location.origin && /^\/(?:_next\/static\/|launcher-icons\/|library-app\/|icon\.svg$)/.test(url.pathname)) {
          resources.add(url.href);
        }
      }
      await cache.put(local(path), response);
    }
    await cache.addAll([...resources].map(fresh));
    const fonts = new Set();
    for (const url of resources) {
      if (!new URL(url).pathname.endsWith(".css")) continue;
      const css = await (await cache.match(url)).text();
      for (const match of css.matchAll(/url\(\s*["']?([^)'"]+\.woff2(?:\?[^)'"]*)?)["']?\s*\)/g)) {
        const font = new URL(match[1], url);
        if (font.origin === self.location.origin && !resources.has(font.href)) fonts.add(font.href);
      }
    }
    await cache.addAll([...fonts].map(fresh));
  } catch (error) {
    await caches.delete(release);
    throw error;
  }
}

self.addEventListener("install", event => event.waitUntil(saveLibrary()));
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== release) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const path = url.pathname.replace(/\/$/, "") || "/";
  const navigation = request.mode === "navigate" && pages.includes(path);
  if (!navigation && !/^\/(?:_next\/static\/|launcher-icons\/|library-app\/|icon\.svg$)/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(release);
    return await cache.match(navigation ? local(path) : request, { ignoreSearch: true, ignoreVary: true }) || fetch(request);
  })());
});
