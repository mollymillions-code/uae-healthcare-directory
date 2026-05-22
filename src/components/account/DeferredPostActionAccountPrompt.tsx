"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PostActionAccountPrompt = dynamic(
  () =>
    import("./PostActionAccountPrompt").then(
      (mod) => mod.PostActionAccountPrompt
    ),
  { ssr: false, loading: () => null }
);

export function DeferredPostActionAccountPrompt() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const enable = () => setEnabled(true);
    const idle = window.setTimeout(enable, 3500);
    const options: AddEventListenerOptions = { once: true, passive: true };

    window.addEventListener("pointerdown", enable, options);
    window.addEventListener("keydown", enable, { once: true });
    window.addEventListener("scroll", enable, options);

    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
      window.removeEventListener("scroll", enable);
    };
  }, [enabled]);

  return enabled ? <PostActionAccountPrompt /> : null;
}
