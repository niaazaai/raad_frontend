import DOMPurify from "dompurify";

/**
 * Allow-list matches TipTap StarterKit + Link + Image output.
 * DOMPurify drops scripts, event handlers, and `javascript:` / `data:` URLs.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "a",
  "img",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

/** https, mailto, tel, and same-document or site-relative paths. No `javascript:` or `data:`. */
const SAFE_URI =
  /^(?:(?:https?|mailto|tel):|\/(?!\/)|#|[a-z0-9][a-z0-9+.-]*[^a-z0-9+.-:])/i;

const hooked = new WeakSet<object>();

function ensureHooks(purify: typeof DOMPurify): void {
  if (hooked.has(purify)) return;
  hooked.add(purify);

  purify.addHook("afterSanitizeAttributes", (node) => {
    const tag = node.nodeName.toUpperCase();

    if (tag === "A") {
      const href = node.getAttribute("href") ?? "";
      if (href !== "" && !SAFE_URI.test(href.trim())) {
        node.removeAttribute("href");
      }
      if (node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      } else {
        node.removeAttribute("target");
      }
    }

    if (tag === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (src === "" || !SAFE_URI.test(src.trim())) {
        node.removeAttribute("src");
      }
    }
  });
}

export function sanitizeHtml(dirty: string, purify: typeof DOMPurify = DOMPurify): string {
  ensureHooks(purify);
  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // `target` and `rel` are not URLs. Without this, DOMPurify drops them
    // because their values do not match ALLOWED_URI_REGEXP.
    ADD_URI_SAFE_ATTR: ["target", "rel"],
    ALLOWED_URI_REGEXP: SAFE_URI,
  });
}
