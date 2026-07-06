/**
 * Tiny hash router.
 *
 * Routes:
 *   #/           -> home
 *   #/new        -> template picker
 *   #/edit/:id   -> editor
 *
 * Route handlers receive (params, root) and are responsible for painting `root`.
 * Handlers may return a cleanup function that is called before the next route mounts.
 */
const routes = [];
let currentCleanup = null;
let rootEl = null;

export function defineRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

function matchRoute(hash) {
  const path = (hash || "#/").replace(/^#/, "") || "/";
  for (const r of routes) {
    const params = matchPattern(r.pattern, path);
    if (params) return { handler: r.handler, params };
  }
  return null;
}

function matchPattern(pattern, path) {
  const pParts = pattern.split("/").filter(Boolean);
  const aParts = path.split("/").filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(":")) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}

async function dispatch() {
  if (typeof currentCleanup === "function") {
    try {
      currentCleanup();
    } catch (e) {
      console.error(e);
    }
    currentCleanup = null;
  }
  const match = matchRoute(location.hash);
  if (!match) {
    rootEl.innerHTML = `<p>Not found. <a href="#/">Go home</a></p>`;
    return;
  }
  try {
    const result = await match.handler(match.params, rootEl);
    if (typeof result === "function") currentCleanup = result;
  } catch (err) {
    console.error(err);
    rootEl.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

export function startRouter(root) {
  rootEl = root;
  window.addEventListener("hashchange", dispatch);
  if (!location.hash) location.hash = "#/";
  else dispatch();
}

export function navigate(hash) {
  if (location.hash === hash) dispatch();
  else location.hash = hash;
}
