import type { SocialPost } from "@/lib/journal/types";
import { timeAgo, platformIcon, platformColor } from "./utils";

interface SocialFeedProps {
  posts: SocialPost[];
}

export function SocialFeed({ posts }: SocialFeedProps) {
  if (posts.length === 0) return null;

  return (
    <aside>
      <h3 className="font-kicker text-[10px] uppercase tracking-[0.15em] text-gold mb-4">
        Social Pulse
      </h3>
      <div className="space-y-0">
        {posts.map((post, i) => (
          <div key={post.id}>
            {i > 0 && <div className="rule my-3" />}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-kicker text-[10px] font-bold uppercase ${platformColor(post.platform)}`}
                  >
                    {platformIcon(post.platform)}
                  </span>
                  <span className="text-xs font-medium text-ink">{post.author}</span>
                </div>
                <span className="label">{timeAgo(post.publishedAt)}</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                {post.content}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="label">{post.engagement.likes.toLocaleString()} likes</span>
                <span className="label">{post.engagement.comments} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
