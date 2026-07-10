"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Volume2,
  VolumeX,
  Captions,
} from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string | null;
  lessonId: string;
  lessonTitle: string;
  initialPosition?: number;
}

export function VideoPlayer({
  videoUrl,
  lessonId,
  lessonTitle,
  initialPosition = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const hasVideo = videoUrl && videoUrl.length > 0;

  const savePosition = useCallback(
    (seconds: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("lesson_progress").upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            last_position_seconds: Math.floor(seconds),
          },
          { onConflict: "user_id,lesson_id" }
        );
      }, 2000);
    },
    [lessonId]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    video.currentTime = initialPosition;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      savePosition(video.currentTime);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [hasVideo, initialPosition, savePosition]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const video = videoRef.current;
      if (video && hasVideo) {
        // Fire final save immediately
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          supabase.from("lesson_progress").upsert(
            {
              user_id: user.id,
              lesson_id: lessonId,
              last_position_seconds: Math.floor(video.currentTime),
            },
            { onConflict: "user_id,lesson_id" }
          );
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }

  function cycleSpeed() {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length]!;
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const video = videoRef.current;
    if (video) video.currentTime = ratio * video.duration;
  }

  function resetHideTimer() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Placeholder when no video
  if (!hasVideo) {
    return (
      <div className="relative aspect-video rounded-bloom-sm overflow-hidden bg-botanical">
        <div className="absolute inset-0 bg-dawn-gradient opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="size-8 ml-1" fill="white" />
          </div>
          <p className="text-lg font-display">{lessonTitle}</p>
          <p className="text-white/60 text-sm">Video coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-bloom-sm overflow-hidden bg-botanical group cursor-pointer"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Center play button when paused */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-bloom-rose/90 flex items-center justify-center hover:bg-bloom-rose transition-colors cursor-pointer"
            >
              <Play className="size-7 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8">
          {/* Seek bar */}
          <div
            className="h-1.5 rounded-full bg-white/30 mb-3 cursor-pointer group/seek"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-bloom-rose relative"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm opacity-0 group-hover/seek:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="hover:text-bloom-rose transition-colors cursor-pointer">
                {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
              </button>
              <button onClick={() => skip(-15)} className="hover:text-bloom-rose transition-colors cursor-pointer">
                <RotateCcw className="size-4" />
              </button>
              <button onClick={() => skip(15)} className="hover:text-bloom-rose transition-colors cursor-pointer">
                <RotateCw className="size-4" />
              </button>
              <span className="text-xs text-white/70 ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cycleSpeed}
                className="text-xs px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                {speed}x
              </button>
              <button onClick={() => setMuted(!muted)} className="hover:text-bloom-rose transition-colors cursor-pointer">
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                onClick={() => setCaptionsOn(!captionsOn)}
                className={`hover:text-bloom-rose transition-colors cursor-pointer ${captionsOn ? "text-bloom-rose" : ""}`}
              >
                <Captions className="size-4" />
              </button>
              <button onClick={toggleFullscreen} className="hover:text-bloom-rose transition-colors cursor-pointer">
                <Maximize className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
