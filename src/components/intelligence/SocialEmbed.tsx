"use client";

import { useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface SocialEmbedProps {
  html: string;
}

/**
 * Renders article body HTML with embedded social content.
 *
 * Detects URLs in the HTML and converts them to rich embeds:
 * - YouTube: iframe player (16:9)
 * - X/Twitter: embedded tweet via platform.twitter.com/widgets.js
 * - Instagram: embedded post via instagram.com/embed.js
 *
 * Also handles pre-existing iframe embeds in the HTML body.
 *
 * All HTML is sanitized via DOMPurify before rendering to prevent XSS
 * from AI-generated or external article content.
 */
export function ArticleBody({ html }: SocialEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load Twitter widget script if tweets are embedded
    if (containerRef.current.querySelector(".twitter-tweet, [data-tweet-url]")) {
      loadScript("https://platform.twitter.com/widgets.js").then(() => {
        if (typeof (window as Window & { twttr?: { widgets: { load: () => void } } }).twttr !== "undefined") {
          (window as Window & { twttr?: { widgets: { load: () => void } } }).twttr?.widgets.load();
        }
      });
    }

    // Load Instagram embed script if IG posts are embedded
    if (containerRef.current.querySelector(".instagram-media, [data-instagram-url]")) {
      loadScript("https://www.instagram.com/embed.js").then(() => {
        if (typeof (window as Window & { instgrm?: { Embeds: { process: () => void } } }).instgrm !== "undefined") {
          (window as Window & { instgrm?: { Embeds: { process: () => void } } }).instgrm?.Embeds.process();
        }
      });
    }
  }, [html]);

  // Process HTML to convert raw URLs into embeds, then sanitize
  const processedHtml = sanitizeHtml(processEmbeds(html));

  return (
    <div
      ref={containerRef}
      className="prose-journal"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

// ─── URL → Embed Conversion ─────────────────────────────────────────────────────

function processEmbeds(html: string): string {
  let processed = html;

  // YouTube: convert URLs to responsive iframes
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  processed = processed.replace(
    /<p>\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*))\s*<\/p>/g,
    (_match, _url, videoId) => `
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:24px 0;">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${videoId}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
          allowfullscreen
          loading="lazy"
          title="Embedded video"
        ></iframe>
      </div>`
  );

  // X/Twitter: convert tweet URLs to embeddable blockquotes
  // Matches: twitter.com/user/status/ID, x.com/user/status/ID
  processed = processed.replace(
    /<p>\s*(https?:\/\/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^\s<]*)\s*<\/p>/g,
    (_match, url) => `
      <blockquote class="twitter-tweet" data-tweet-url="${url}">
        <a href="${url}">View on X</a>
      </blockquote>`
  );

  // Instagram: convert post URLs to embeddable blockquotes
  // Matches: instagram.com/p/CODE/, instagram.com/reel/CODE/
  processed = processed.replace(
    /<p>\s*(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/g,
    (_match, url) => `
      <blockquote class="instagram-media" data-instagram-url="${url}" data-instgrm-permalink="${url}" style="max-width:540px;margin:24px auto;">
        <a href="${url}">View on Instagram</a>
      </blockquote>`
  );

  return processed;
}

// ─── Script Loader ──────────────────────────────────────────────────────────────

const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
