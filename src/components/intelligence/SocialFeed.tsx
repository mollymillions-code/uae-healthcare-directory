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
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-4">
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
              {i > 0 && <div className="border-b border-light-200 my-3" />}
              <Wrapper {...wrapperProps}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold uppercase ${platformColor(post.platform)}`}
                    >
                      {platformIcon(post.platform)}
                    </span>
                    <span className={`text-xs font-medium text-dark ${post.url ? "group-hover:text-accent transition-colors" : ""}`}>
                      {post.author}
                    </span>
                    {post.url && (
                      <ExternalLink className="h-2.5 w-2.5 text-muted group-hover:text-accent transition-colors" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted">{timeAgo(post.publishedAt)}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed line-clamp-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted">{post.engagement.likes.toLocaleString()} likes</span>
                  <span className="text-[10px] text-muted">{post.engagement.comments} comments</span>
                </div>
              </Wrapper>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
