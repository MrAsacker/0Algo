"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Youtube, Loader2 } from "lucide-react";
// Use the '@/lib/db' path alias. 'db.ts' exports all types from 'schema.ts'.
import { VideoSolution } from "@/lib/db"; 

interface VideoDialogProps {
  id: number; // The Question ID (e.g., 2419)
  title: string; // The Question Title
}

/**
 * Extracts the 11-character YouTube video ID from a URL.
 * @param url The full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
 * @returns The video ID (e.g., dQw4w9WgXcQ) or null
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function VideoDialog({ id, title }: VideoDialogProps) {
  const [open, setOpen] = React.useState(false);
  // --- THIS WAS MISSING ---
  const [isLoading, setIsLoading] = useState(false);
  // -------------------------
  const [videoOptions, setVideoOptions] = useState<VideoSolution[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Fetch video options when the dialog is opened
  useEffect(() => {
    // Only fetch if the dialog is open AND we haven't fetched yet
    if (open && videoOptions.length === 0 && !isLoading) {
      setIsLoading(true);
      
      fetch(`/api/videos/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
          }
          return res.json();
        })
        .then((data: VideoSolution[]) => {
          setVideoOptions(data);
          // Set the first video as the default selected one
          if (data.length > 0) {
            setSelectedVideoId(extractVideoId(data[0].videoUrl));
          }
        })
        .catch(err => {
          console.error("Failed to fetch videos:", err);
          setVideoOptions([]);
          setSelectedVideoId(null);
        })
        .finally(() => {
          // --- THIS WAS MISSING ---
          setIsLoading(false);
          // -------------------------
        });
    }
    // --- 'isLoading' WAS MISSING FROM DEPENDENCY ARRAY ---
  }, [id, open, videoOptions.length, isLoading]);

  return (
    // --- JSX WAS INCOMPLETE ---
    <>
      {/* This is the button the user clicks to open the dialog */}
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Youtube className="h-4 w-4 text-red-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title} - Video Solution</DialogTitle>
          </DialogHeader>

          {/* Video Player Section */}
          <div className="aspect-video bg-gray-200 rounded-md">
            {isLoading && (
              <div className="flex flex-col gap-2 items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Finding video solutions...</span>
              </div>
            )}

            {!isLoading && selectedVideoId && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                title={`${title} - Video Solution`}
                frameBorder="0"
                allow="accelerometer;  clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {!isLoading && !selectedVideoId && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                ❌ No video solutions found for this problem.
              </div>
            )}
          </div>

          {/* Video Selection Buttons (only show if there are multiple options) */}
          {!isLoading && videoOptions.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {videoOptions.map((video, index) => {
                const videoId = extractVideoId(video.videoUrl);
                if (!videoId) return null; // Skip if URL is bad
                
                return (
                  <Button
                    key={video.id}
                    variant={selectedVideoId === videoId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVideoId(videoId)}
                  >
                    Option {index + 1}
                  </Button>
                );
              })}
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
    // --- END OF INCOMPLETE JSX ---
  );
}