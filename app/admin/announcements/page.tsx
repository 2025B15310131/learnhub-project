"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
};

export default function AnnouncementsPage() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAnnouncement() {
    const { data, error } = await supabase
      .from("learnhub_announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      alert("Announcement loading error: " + error.message);
    } else if (data && data.length > 0) {
      setAnnouncement(data[0]);
      setTitle(data[0].title);
      setMessage(data[0].message);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncement();
  }, []);

  async function publishAnnouncement() {
    if (!title.trim() || !message.trim()) {
      alert("Title aur message dono enter karo.");
      return;
    }

    setSaving(true);

    if (announcement) {
      const { error } = await supabase
        .from("learnhub_announcements")
      .update({
        title: title.trim(),
        message: message.trim(),
        is_active: true,
      })
      .eq("id", announcement.id);

      if (error) {
        alert("Update error: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("learnhub_announcements")
        .insert({
          title: title.trim(),
          message: message.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        alert("Publish error: " + error.message);
        setSaving(false);
        return;
      }

      setAnnouncement(data);
    }

    await loadAnnouncement();
    alert("Announcement published successfully!");
    setSaving(false);
  }

  async function hideAnnouncement() {
    if (!announcement) return;

    const { error } = await supabase
      .from("learnhub_announcements")
      .update({ is_active: false })
      .eq("id", announcement.id);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    setAnnouncement({ ...announcement, is_active: false });
    alert("Announcement hidden from students.");
  }

  async function deleteAnnouncement() {
    if (!announcement) return;
    if (!confirm("Delete announcement permanently?")) return;

    const { error } = await supabase
      .from("learnhub_announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      alert("Delete error: " + error.message);
      return;
    }

    setAnnouncement(null);
    setTitle("");
    setMessage("");
    alert("Announcement deleted.");
  }

  if (loading) {
    return (
      <div style={{ background: "#0b0e14", color: "white", minHeight: "100vh", padding: 30 }}>
        Loading announcements...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0e14",
        color: "#fff",
        padding: "35px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 850, margin: "auto" }}>
        <button
          onClick={() => (window.location.href = "/admin")}
          style={{
            background: "#202632",
            color: "#fff",
            border: "1px solid #303846",
            borderRadius: 10,
            padding: "12px 18px",
            cursor: "pointer",
            marginBottom: 25,
          }}
        >
          ← Back to Admin Dashboard
        </button>

        <h1 style={{ fontSize: 30, marginBottom: 8 }}>
          📢 Announcements
        </h1>

        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Publish messages that students will see on their dashboard.
        </p>

        <div
          style={{
            background: "#151a23",
            border: "1px solid #252d3b",
            borderRadius: 18,
            padding: 25,
          }}
        >
          <label style={{ display: "block", marginBottom: 10, fontWeight: 700 }}>
            Announcement Title
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Version Coming Soon!"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0b0e14",
              color: "white",
              border: "1px solid #303846",
              borderRadius: 10,
              padding: 14,
              marginBottom: 22,
            }}
          />

          <label style={{ display: "block", marginBottom: 10, fontWeight: 700 }}>
            Announcement Message
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement for students..."
            rows={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              background: "#0b0e14",
              color: "white",
              border: "1px solid #303846",
              borderRadius: 10,
              padding: 14,
              marginBottom: 22,
            }}
          />

          <button
            onClick={publishAnnouncement}
            disabled={saving}
            style={{
              background: "#ff9d1b",
              color: "#111",
              border: "none",
              borderRadius: 10,
              padding: "14px 22px",
              fontWeight: 800,
              cursor: "pointer",
              marginRight: 10,
            }}
          >
            {saving ? "Publishing..." : "📢 Publish Announcement"}
          </button>

          {announcement && (
            <>
              <button
                onClick={hideAnnouncement}
                style={{
                  background: "#303846",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 20px",
                  cursor: "pointer",
                  marginRight: 10,
                }}
              >
                Hide from Students
              </button>

              <button
                onClick={deleteAnnouncement}
                style={{
                  background: "#7f1d1d",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 20px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>

        {announcement && (
          <div style={{ marginTop: 25 }}>
            <h3 style={{ marginBottom: 12 }}>Current Announcement</h3>

            <div
              style={{
                background: "#172554",
                border: "1px solid #1e40af",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
                📢 {announcement.title}
              </div>

              <p style={{ color: "#dbeafe", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {announcement.message}
              </p>

              <div
                style={{
                  marginTop: 15,
                  fontWeight: 700,
                  color: announcement.is_active ? "#86efac" : "#fca5a5",
                }}
              >
                {announcement.is_active ? "● Published" : "● Hidden"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}