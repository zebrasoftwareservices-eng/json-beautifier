const MAX_RESPONSE_BYTES = 1_000_000; // 1 MB

export type LoadUrlResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

export async function fetchJsonUrl(url: string): Promise<LoadUrlResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      message: "Invalid URL — please enter a valid http or https URL.",
    };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      message: `URL scheme "${parsed.protocol}" is not allowed — only http and https are supported.`,
    };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        message: `HTTP ${res.status} — the server returned an error response for this URL.`,
      };
    }
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      return {
        ok: false,
        message: `Response is too large (${(parseInt(contentLength, 10) / 1_000_000).toFixed(1)} MB) — maximum 1 MB. Use the Upload button for large files.`,
      };
    }
    // Stream the body so we can reject oversized responses before buffering them
    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: false, message: "Could not read response body." };
    }
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return {
          ok: false,
          message: `Response is too large (>${(bytes / 1_000_000).toFixed(1)} MB) — maximum 1 MB. Use the Upload button for large files.`,
        };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    try {
      JSON.parse(text);
    } catch {
      return {
        ok: false,
        message:
          "The URL returned a non-JSON response — check that the endpoint serves JSON content.",
      };
    }
    return { ok: true, text };
  } catch {
    // fetch() throws TypeError on both CORS and network failures.
    // Use navigator.onLine as a heuristic to distinguish them.
    if (!navigator.onLine) {
      return {
        ok: false,
        message:
          "Network error — check your internet connection and try again.",
      };
    }
    return {
      ok: false,
      message:
        "Could not fetch the URL — this is likely a CORS restriction. The server must include Access-Control-Allow-Origin headers to allow browser requests. Try a CORS-enabled endpoint or paste the JSON manually.",
    };
  }
}
