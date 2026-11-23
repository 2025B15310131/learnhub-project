"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VideoPlayer() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("url");
  const title = searchParams.get("title") || "LearnHub Video Player";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0e14",
        color: "#fff",
        padding: "30px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <a
          href="/"
          style={{
            color: "#ff9d18",
            textDecoration: "none",
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 25,
          }}
        >
          ← Back to LearnHub
        </a>

        <h1 style={{ fontSize: 28, marginBottom: 10 }}>LearnHub Player</h1>

        <p style={{ color: "#8c98aa", marginBottom: 25 }}>{title}</p>

        {!videoUrl ? (
          <div
            style={{
              padding: 30,
              background: "#151c28",
              borderRadius: 15,
              border: "1px solid #293244",
            }}
          >
            <h3>Video not found</h3>
            <p style={{ color: "#8995a8" }}>
              Please open a lecture from the Student Dashboard.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#151c28",
              border: "1px solid #293244",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              style={{
                display: "block",
                width: "100%",
                maxHeight: "75vh",
                background: "#000",
              }}
            >
              Your browser does not support video playback.
            </video>

            <div style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 10px" }}>{title}</h3>

              <p style={{ color: "#8995a8", fontSize: 13, margin: 0 }}>
                LearnHub Video Lecture
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function TestVideo() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "#0b0e14", color: "white", minHeight: "100vh", padding: 30 }}>
          Loading player...
        </div>
      }
    >
      <VideoPlayer />
    </Suspense>
  );
}