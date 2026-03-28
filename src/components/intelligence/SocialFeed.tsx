import type { SocialPost } from "@/lib/intelligence/types";
import { timeAgo, platformIcon, platformColor } from "./utils";
import { ExternalLink } from "lucide-react";

interface SocialFeedProps {
  posts: SocialPost[];
}

export function SocialFeed({ posts }: SocialFeedProps) {
  if (posts.length === 0) return null;

  return (
    <aside>
      <h3 className="font-['Geist',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#006828] mb-4">
        Social Pulse
      </h3>
      <div className="space-y-0">
        {posts.map((post, i) => {
          const Wrapper = post.url ? "a" : "div";
          const wrapperProps = post.url
            ? { href: post.url, target: "_blank" as const, rel: "noopener noreferrer", className: "block group" }
            : {};

          return (
            <div key={post.id}>
              {i > 0 && <div className="border-b border-black/[0.06] my-3" />}
              <Wrapper {...wrapperProps}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-['Geist',sans-serif] text-[10px] font-bold uppercase ${platformColor(post.platform)}`}
                    >
                      {platformIcon(post.platform)}
                    </span>
                    <span className={`text-xs font-medium text-[#1c1c1c] ${post.url ? "group-hover:text-[#006828] transition-colors" : ""}`}>
                      {post.author}
                    </span>
                    {post.url && (
                      <ExternalLink className="h-2.5 w-2.5 text-black/40 group-hover:text-[#006828] transition-colors" />
                    )}
                  </div>
                  <span className="text-[10px] text-black/40">{timeAgo(post.publishedAt)}</span>
                </div>
                <p className="text-xs text-black/40 leading-relaxed line-clamp-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-black/40">{post.engagement.likes.toLocaleString()} likes</span>
                  <span className="text-[10px] text-black/40">{post.engagement.comments} comments</span>
                </div>
              </Wrapper>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
