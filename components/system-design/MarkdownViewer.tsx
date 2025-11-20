'use client';

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";

// Helpers for Embeds
function toYouTubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  let m = trimmed.match(/^https?:\/\/youtu\.be\/([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = trimmed.match(/[?&]v=([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return null;
}

function toSpotifyEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.trim().match(/open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/i);
  if (m) return `https://open.spotify.com/embed/episode/${m[1]}?theme=0`;
  return null;
}

interface MarkdownViewerProps {
  content: string;
  folderName: string;
  videoUrl?: string | null;
  podcastUrl?: string | null;
}

export default function MarkdownViewer({ content, folderName, videoUrl, podcastUrl }: MarkdownViewerProps) {
  const embedUrl = toYouTubeEmbed(videoUrl);
  const podcastEmbed = toSpotifyEmbed(podcastUrl);

  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-li:my-1 prose-img:rounded-lg prose-img:border">
      {/* Render Content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={{
          // Custom H1 to include Embeds immediately after title if present
          h1: ({ children }) => (
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold mb-6">{children}</h1>
              
              {embedUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border bg-zinc-100 dark:bg-zinc-900 mb-6">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              
              {podcastEmbed && (
                <div className="mb-6">
                  <iframe
                    src={podcastEmbed}
                    className="w-full rounded-xl border shadow-sm"
                    height={152}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ),
          // Fix Image Paths
          img: (props) => {
            const rawSrc = (props.src ?? "").toString();
            const isAbsolute = /^([a-z]+:)?\/\//i.test(rawSrc) || rawSrc.startsWith("/");
            const normalized = rawSrc.replace(/^\.\/?/, "");
            const finalSrc = isAbsolute
              ? rawSrc
              : `/system-design/${encodeURIComponent(folderName)}/${normalized}`;
            
            // eslint-disable-next-line @next/next/no-img-element
            return <img {...props} src={finalSrc} alt={props.alt || "Article Image"} className="rounded-lg shadow-md" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}