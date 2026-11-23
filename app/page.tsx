
"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


type Lecture = {
  id: string;
  title: string;
  videoUrl: string;
};

type Chapter = {
  id: string;
  title: string;
  lectures: Lecture[];
};

type Course = {
  id: string;
  name: string;
  category: string;
  description: string;
  chapters: Chapter[];
};

type ProgressData = {
  lectureId: string;
  lectureTitle: string;
  courseName: string;
  videoUrl: string;
  currentTime: number;
  duration: number;
};
type Announcement = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
};

const colors = ["orange", "blue", "purple", "green", "pink", "yellow"];

const icons: Record<string, string> = {
  Programming: "💻",
  "AI & ML": "🤖",
  "Web Development": "🌐",
  Projects: "🚀",
  default: "📚",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lastWatched, setLastWatched] = useState<ProgressData | null>(null);
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentCourseName, setCurrentCourseName] = useState("");
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);
  useEffect(() => {
  async function fetchAnnouncement() {
    const { data, error } = await supabase
      .from("learnhub_announcements")
      .select("id, title, message, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Announcement error:", error.message);
      return;
    }

    setAnnouncement(data?.[0] ?? null);
  }

  fetchAnnouncement();
}, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("learnhub_progress");

      if (saved) {
        const data = JSON.parse(saved);
        setLastWatched(data.lastWatched ?? null);
        setCompletedLectures(data.completedLectures ?? []);
      }
    } catch (error) {
      console.error("Progress loading error:", error);
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;

    localStorage.setItem(
      "learnhub_progress",
      JSON.stringify({
        lastWatched,
        completedLectures,
      })
    );
  }, [lastWatched, completedLectures, progressLoaded]);

  async function fetchCourses() {
    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("courses")
        .select(
          "id, name, category, description, chapters(id, name, lectures(id, title, video_url))"
        )
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      const mappedCourses: Course[] = (data ?? []).map((course: any) => ({
        id: course.id,
        name: course.name ?? "Untitled Course",
        category: course.category ?? "Programming",
        description: course.description ?? "",
        chapters: (course.chapters ?? []).map((chapter: any) => ({
          id: chapter.id,
          title: chapter.name ?? "Untitled Chapter",
          lectures: (chapter.lectures ?? []).map((lecture: any) => ({
            id: lecture.id,
            title: lecture.title ?? "Untitled Lecture",
            videoUrl: lecture.video_url ?? "",
          })),
        })),
      }));

      setCourses(mappedCourses);
    } catch (err: any) {
      console.error("Courses error:", JSON.stringify(err, null, 2));
      setError(
  err?.message ||
  err?.details ||
  err?.hint ||
  err?.code ||
  JSON.stringify(err) ||
  "Unable to load courses"
);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  function openLecture(lecture: Lecture, courseName: string) {
    setCurrentCourseName(courseName);
    setSelectedLecture(lecture);

    setLastWatched((previous) => ({
      lectureId: lecture.id,
      lectureTitle: lecture.title,
      courseName,
      videoUrl: lecture.videoUrl,
      currentTime:
        previous?.lectureId === lecture.id ? previous.currentTime : 0,
      duration: previous?.lectureId === lecture.id ? previous.duration : 0,
    }));
  }

  function continueLearning() {
    if (lastWatched?.videoUrl) {
      setCurrentCourseName(lastWatched.courseName || "");
      setSelectedLecture({
        id: lastWatched.lectureId,
        title: lastWatched.lectureTitle,
        videoUrl: lastWatched.videoUrl,
      });
    } else {
      document.getElementById("courses")?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }

  function markCompleted(lectureId: string) {
    setCompletedLectures((previous) =>
      previous.includes(lectureId) ? previous : [...previous, lectureId]
    );
  }

  const categories = [
    "All Courses",
    ...Array.from(new Set(courses.map((course) => course.category))),
  ];

  const filteredCourses = courses.filter((course) => {
    const query = search.toLowerCase();

    const searchMatch =
      course.name.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.category.toLowerCase().includes(query);

    const categoryMatch =
      activeCategory === "All Courses" || course.category === activeCategory;

    return searchMatch && categoryMatch;
  });

  const totalChapters = courses.reduce(
    (sum, course) => sum + course.chapters.length,
    0
  );

  const totalLectures = courses.reduce(
    (sum, course) =>
      sum +
      course.chapters.reduce(
        (chapterSum, chapter) => chapterSum + chapter.lectures.length,
        0
      ),
    0
  );

  const totalCompleted = completedLectures.length;

  const overallProgress =
    totalLectures > 0
      ? Math.min(100, Math.round((totalCompleted / totalLectures) * 100))
      : 0;

  return (
      <AuthGuard requiredRole="student">
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <div>
            <h1>
              LEARN<span>HUB</span>
            </h1>
            <p>YOUR LEARNING SPACE</p>
          </div>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav>
          <button className="nav-item active">
            ⌂ <span>Dashboard</span>
          </button>

          <button className="nav-item">
            ▣ <span>My Learning</span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              document.getElementById("courses")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            ◈ <span>Explore Courses</span>
          </button>

          <button className="nav-item">
            ☆ <span>Wishlist</span>
          </button>
        </nav>

        <div className="sidebar-label">YOUR LIBRARY</div>

        <nav>
          <button className="nav-item" onClick={continueLearning}>
            ▶ <span>Continue Learning</span>
          </button>

          <button className="nav-item">
            ▤ <span>Certificates</span>
          </button>
        </nav>
        <button
  className="nav-item"
  onClick={async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("learnhub_progress");
    window.location.href = "/login";
  }}
>
  🚪 <span>Logout</span>
</button>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student Account</strong>
              <p>Free learner</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="welcome">YOUR LEARNING JOURNEY</p>
            <h2>
              Learn something <span>new today.</span>
            </h2>
          </div>

          <div className="top-actions">
            <button className="icon-button">🔔</button>

            <button className="user-button">
              <div className="avatar small">S</div>
              <span>Student</span>
            </button>
          </div>
        </header>
        {announcement && (
  <div
    style={{
      margin: "0 0 24px",
      padding: "22px 24px",
      borderRadius: 18,
      background: "linear-gradient(135deg, #172554, #1e3a8a, #312e81)",
      border: "1px solid rgba(96,165,250,0.35)",
      boxShadow: "0 8px 30px rgba(30,58,138,0.18)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{ display: "flex", gap: 15, alignItems: "flex-start" }}>
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          background: "rgba(255,255,255,0.12)",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
        }}
      >
        📢
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            color: "#93c5fd",
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 7,
          }}
        >
          LEARNHUB ANNOUNCEMENT
        </div>

        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 0 9px",
          }}
        >
          {announcement.title}
        </h3>

        <p
          style={{
            color: "#dbeafe",
            fontSize: 14,
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {announcement.message}
        </p>
      </div>
    </div>
  </div>
)}

        <section className="hero">
          <div className="hero-text">
            <span className="hero-tag">✦ KEEP GROWING</span>

            <h2>
              Your future starts
              <br />
              with <span>learning.</span>
            </h2>

            <p>
              Learn new skills, explore technology and build your future one
              lesson at a time.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                document.getElementById("courses")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Explore Courses <span>→</span>
            </button>
          </div>

          <div className="hero-art">
            <div className="orb orb1"></div>
            <div className="orb orb2"></div>

            <div className="floating-card">
              <span>✦</span>
              <strong>Keep learning.</strong>
              <small>Keep building.</small>
            </div>

            <div className="hero-circle">🎓</div>
          </div>
        </section>

        <section className="continue-card">
          <div className="continue-icon">▶</div>

          <div className="continue-info">
            <span>YOUR LEARNHUB LIBRARY</span>

            <h3>
              {courses.length} Courses — {totalChapters} Chapters — {totalLectures} Lectures
            </h3>

            {lastWatched && (
              <p style={{ color: "#ff9d18", marginTop: 8, fontSize: 13 }}>
                Last watched: {lastWatched.lectureTitle}
              </p>
            )}

            <div className="continue-progress">
              <div className="progress-track">
                <div style={{ width: `${overallProgress}%` }}></div>
              </div>

              <small>
                {totalCompleted} of {totalLectures} lectures completed · {overallProgress}%
              </small>
            </div>
          </div>

          <button className="resume-button" onClick={continueLearning}>
            {lastWatched ? "Continue Learning →" : "View Courses →"}
          </button>
        </section>

        <section className="courses-section" id="courses">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LIBRARY</p>
              <h2>Explore Courses</h2>
            </div>

            <span className="course-count">{filteredCourses.length} COURSES</span>
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              placeholder="Search courses, subjects and topics..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search !== "" && (
              <button onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${
                  activeCategory === category ? "selected" : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading && (
            <div className="empty-state">
              <h3>Loading courses...</h3>
              <p>Please wait while your courses load.</p>
            </div>
          )}

          {!loading && error !== "" && (
            <div className="empty-state">
              <h3>Unable to load courses</h3>
              <p>{error}</p>

              <button className="primary-button" onClick={fetchCourses}>
                Try Again
              </button>
            </div>
          )}

          {!loading && error === "" && (
            <>
              <div className="course-grid">
                {filteredCourses.map((course, index) => {
                  const lessonCount = course.chapters.reduce(
                    (sum, chapter) => sum + chapter.lectures.length,
                    0
                  );

                  const completedCount = course.chapters.reduce(
                    (sum, chapter) =>
                      sum +
                      chapter.lectures.filter((lecture) =>
                        completedLectures.includes(lecture.id)
                      ).length,
                    0
                  );

                  const courseProgress =
                    lessonCount > 0
                      ? Math.round((completedCount / lessonCount) * 100)
                      : 0;

                  const color = colors[index % colors.length];
                  const icon = icons[course.category] ?? icons.default;

                  return (
                    <article className={`course-card ${color}`} key={course.id}>
                      <div className="course-art">
                        <div className="course-art-top">
                          <span className="course-category">
                            {course.category}
                          </span>

                          <span className="lesson-badge">
                            {lessonCount} Lessons
                          </span>
                        </div>

                        <div className="course-emoji">{icon}</div>

                        <div className="course-art-title">
                          <span>{course.name}</span>
                        </div>

                        <div className="art-decoration">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                      </div>

                      <div className="course-details">
                        <h3>{course.name}</h3>

                        <p>
                          {course.description ||
                            "Explore this course and start learning."}
                        </p>

                        <div className="course-meta">
                          <span>▶ {lessonCount} lessons</span>
                          <span>•</span>
                          <span>{course.chapters.length} Chapters</span>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 11,
                              color: "#8995a8",
                              marginBottom: 6,
                            }}
                          >
                            <span>{completedCount} completed</span>
                            <span>{courseProgress}%</span>
                          </div>

                          <div
                            style={{
                              height: 6,
                              background: "#293244",
                              borderRadius: 20,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${courseProgress}%`,
                                background: "#ff9d18",
                                borderRadius: 20,
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                        </div>

                        <button
                          className="course-button"
                          onClick={() => setSelectedCourse(course)}
                        >
                          Start Learning <span>→</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredCourses.length === 0 && (
                <div className="empty-state">
                  <h3>
                    {courses.length === 0
                      ? "No courses published yet"
                      : "No courses found"}
                  </h3>

                  <p>
                    {courses.length === 0
                      ? "Courses uploaded from Admin Panel will appear here."
                      : "Try searching for another course."}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="footer">
          <span>LEARNHUB</span>
          <p>Learn today. Build tomorrow.</p>
        </footer>
      </section>

      {/* COURSE CONTENT MODAL */}
      {selectedCourse !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedCourse(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 850,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#121722",
              border: "1px solid #293244",
              borderRadius: 20,
              padding: 28,
              color: "#fff",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 20,
                marginBottom: 25,
              }}
            >
              <div>
                <span
                  style={{
                    color: "#ff9d18",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                  }}
                >
                  COURSE CONTENT
                </span>

                <h2 style={{ fontSize: 26, marginTop: 8 }}>
                  {selectedCourse.name}
                </h2>

                <p style={{ color: "#8995a8", marginTop: 8 }}>
                  {selectedCourse.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  padding: "10px 16px",
                  background: "#1b2433",
                  color: "#aab4c5",
                  border: "1px solid #303b4d",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            {selectedCourse.chapters.length === 0 && (
              <p style={{ color: "#8995a8" }}>No chapters added yet.</p>
            )}

            {selectedCourse.chapters.map((chapter, chapterIndex) => (
              <div
                key={chapter.id}
                style={{
                  border: "1px solid #293244",
                  borderRadius: 14,
                  marginBottom: 15,
                  overflow: "hidden",
                  background: "#151e2d",
                }}
              >
                <div style={{ padding: 18 }}>
                  <span
                    style={{
                      color: "#ff9d18",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                    }}
                  >
                    CHAPTER {chapterIndex + 1}
                  </span>

                  <h3 style={{ marginTop: 8, fontSize: 17 }}>
                    {chapter.title}
                  </h3>

                  <p style={{ color: "#8390a4", fontSize: 12, marginTop: 8 }}>
                    {chapter.lectures.length} Lectures
                  </p>
                </div>

                {chapter.lectures.map((lecture, lectureIndex) => (
                  <div
                    key={lecture.id}
                    style={{
                      padding: "15px 18px",
                      borderTop: "1px solid #293244",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 15,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: "#202b3d",
                          display: "grid",
                          placeItems: "center",
                          color: "#ff9d18",
                        }}
                      >
                        {completedLectures.includes(lecture.id) ? "✓" : "▶"}
                      </div>

                      <div>
                        <strong style={{ fontSize: 13 }}>
                          {lectureIndex + 1}. {lecture.title}
                        </strong>

                        <p
                          style={{
                            fontSize: 11,
                            color: completedLectures.includes(lecture.id)
                              ? "#43c994"
                              : "#43c994",
                            marginTop: 5,
                          }}
                        >
                          {completedLectures.includes(lecture.id)
                            ? "✓ Completed"
                            : "Video Lecture"}
                {lastWatched?.lectureId === lecture.id &&
!completedLectures.includes(lecture.id) && (
  <span style={{ color: "#f59e0b" }}> • Last Watched</span>
)}
                      </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openLecture(lecture, selectedCourse.name)}
                      disabled={!lecture.videoUrl}
                      style={{
                        padding: "11px 17px",
                        background: lecture.videoUrl ? "#ff9d18" : "#273142",
                        color: lecture.videoUrl ? "#111" : "#7c8798",
                        border: "none",
                        borderRadius: 9,
                        cursor: lecture.videoUrl ? "pointer" : "not-allowed",
                        fontWeight: 700,
                      }}
                    >
                      ▶ Watch Lecture
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {selectedLecture !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedLecture(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1000,
              background: "#121722",
              border: "1px solid #293244",
              borderRadius: 18,
              overflow: "hidden",
              color: "#fff",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 15,
                padding: "16px 20px",
                borderBottom: "1px solid #293244",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#ff9d18",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2,
                  }}
                >
                  NOW PLAYING
                </span>

                <h3 style={{ marginTop: 6, fontSize: 16 }}>
                  {selectedLecture.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedLecture(null)}
                style={{
                  padding: "9px 14px",
                  background: "#1b2433",
                  color: "#fff",
                  border: "1px solid #303b4d",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background: "#000",
              }}
            >
              <video
                key={selectedLecture.id}
                src={selectedLecture.videoUrl}
                title={selectedLecture.title}
                controls
                autoPlay
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;

                  if (lastWatched?.lectureId === selectedLecture.id) {
                    const savedTime = lastWatched.currentTime || 0;

                    if (savedTime > 0 && savedTime < video.duration) {
                      video.currentTime = savedTime;
                    }
                  }
                }}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;

                  setLastWatched({
                    lectureId: selectedLecture.id,
                    lectureTitle: selectedLecture.title,
                    courseName: currentCourseName,
                    videoUrl: selectedLecture.videoUrl,
                    currentTime: video.currentTime,
                    duration: video.duration || 0,
                  });
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                  display: "block",
                  background: "#000",
                  objectFit: "contain",
                }}
              >
                Your browser does not support video playback.
              </video>
            </div>

            <div
              style={{
                padding: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <p style={{ color: "#8995a8", fontSize: 13 }}>
                {selectedLecture.title}
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => markCompleted(selectedLecture.id)}
                  style={{
                    padding: "11px 17px",
                    background: completedLectures.includes(selectedLecture.id)
                      ? "#173d32"
                      : "#202b3d",
                    color: "#43c994",
                    border: "1px solid #305347",
                    borderRadius: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {completedLectures.includes(selectedLecture.id)
                    ? "✓ Completed"
                    : "✓ Mark as Completed"}
                </button>

                <a
                  href={selectedLecture.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "11px 17px",
                    background: "#202b3d",
                    color: "#ff9d18",
                    border: "1px solid #303b4d",
                    borderRadius: 9,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  ↗ Open / Download Video
                </a>
              
              </div>
               
              
            </div>
          </div>
        </div>
      
      )}
    </main>
     </AuthGuard>
    
    
  );
  
}
