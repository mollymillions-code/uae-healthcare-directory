import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize an HTML string to prevent XSS attacks.
 *
 * Uses DOMPurify under the hood, which works in both server (Node/JSDOM)
 * and client (browser) environments via `isomorphic-dompurify`.
 *
 * Allowed by default: standard HTML tags, links, images, iframes (for
 * YouTube/social embeds), and common formatting. Strips `<script>`,
 * `onerror`, `onclick`, `javascript:` URIs, and all other XSS vectors.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // Allow iframes for YouTube/social embeds embedded in article bodies
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "data-tweet-url",
      "data-instagram-url",
      "data-instgrm-permalink",
    ],
  });
}
