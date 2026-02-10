const DYNAMIC_PREFIXES = ["/api", "/dashboard", "/billing", "/academy", "/admin", "/platforms", "/app"];

function hasPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function rewriteDynamicPath(pathname) {
  if (pathname === "/app") return "/app/app";
  if (hasPrefix(pathname, "/app")) return pathname;
  if (hasPrefix(pathname, "/api")) return `/app${pathname}`;
  if (hasPrefix(pathname, "/dashboard")) return `/app${pathname}`;
  if (hasPrefix(pathname, "/billing")) return `/app${pathname}`;
  if (hasPrefix(pathname, "/academy")) return `/app${pathname}`;
  if (hasPrefix(pathname, "/admin")) return `/app${pathname}`;
  if (hasPrefix(pathname, "/platforms")) return `/app${pathname}`;
  return null;
}

function isDynamicRoute(pathname) {
  return DYNAMIC_PREFIXES.some((prefix) => hasPrefix(pathname, prefix));
}

function getBackendOrigin(rawValue) {
  if (!rawValue) return null;

  try {
    return new URL(rawValue).origin;
  } catch {
    return null;
  }
}

function isAssetPath(pathname) {
  return pathname.startsWith("/app/_next/") || /\.[a-z0-9]+$/i.test(pathname);
}

function shouldDisableCache(pathname, method) {
  if (method !== "GET" && method !== "HEAD") return true;
  if (hasPrefix(pathname, "/api")) return true;
  if (!isDynamicRoute(pathname)) return false;
  return !isAssetPath(pathname);
}

async function proxyToBackend(request, env, rewrittenPath, search, originalPathname) {
  const backendOrigin = getBackendOrigin(env.BACKEND_ORIGIN);

  if (!backendOrigin) {
    return new Response("BACKEND_ORIGIN is missing or invalid.", { status: 500 });
  }

  const targetUrl = new URL(rewrittenPath + search, backendOrigin);
  const incomingUrl = new URL(request.url);
  const headers = new Headers(request.headers);

  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));
  headers.delete("host");

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  const upstream = await fetch(targetUrl.toString(), init);
  const responseHeaders = new Headers(upstream.headers);

  if (shouldDisableCache(originalPathname, request.method)) {
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const rewrittenPath = rewriteDynamicPath(url.pathname);

    if (rewrittenPath && isDynamicRoute(url.pathname)) {
      return proxyToBackend(request, env, rewrittenPath, url.search, url.pathname);
    }

    return env.ASSETS.fetch(request);
  }
};
