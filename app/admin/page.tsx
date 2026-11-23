
"use client";

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

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [courseName, setCourseName] = useState("");
  const [category, setCategory] = useState("Programming");
  const [description, setDescription] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [lectureName, setLectureName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [manageCourse, setManageCourse] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");

  async function loadCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        description,
        chapters (
          id,
          name,
          lectures (
            id,
            title,
            video_url
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Course loading error: " + error.message);
      return;
    }

    const formatted: Course[] = (data || []).map((course: any) => ({
      id: course.id,
      name: course.name,
      category: course.category || "Programming",
      description: course.description || "",
      chapters: (course.chapters || []).map((chapter: any) => ({
        id: chapter.id,
        title: chapter.name,
        lectures: (chapter.lectures || []).map((lecture: any) => ({
          id: lecture.id,
          title: lecture.title,
          videoUrl: lecture.video_url,
        })),
      })),
    }));

    setCourses(formatted);
    setLoaded(true);
  }
  async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "/login";
}

  useEffect(() => {
    loadCourses();
  }, []);

  const totalChapters = courses.reduce(
    (sum, course) => sum + course.chapters.length,
    0
  );

  const totalLectures = courses.reduce(
    (sum, course) =>
      sum + course.chapters.reduce((a, ch) => a + ch.lectures.length, 0),
    0
  );

  const managedCourse = courses.find((c) => c.id === manageCourse);

  async function createCourse() {
    if (!courseName.trim()) {
      alert("Course name enter karo");
      return;
    }

    const { error } = await supabase.from("courses").insert({
      name: courseName.trim(),
      category,
      description,
    });

    if (error) {
      alert("Course save error: " + error.message);
      return;
    }

    setCourseName("");
    setDescription("");
    await loadCourses();
    setActiveTab("courses");
    alert("Course successfully created!");
  }

  async function createChapter(courseId: string) {
    if (!chapterName.trim()) {
      alert("Chapter name enter karo");
      return;
    }
   

    const { error } = await supabase.from("chapters").insert({
      course_id: courseId,
      name: chapterName.trim(),
    });

    if (error) {
      alert("Chapter save error: " + error.message);
      return;
    }

    setChapterName("");
    await loadCourses();
    alert("Chapter added successfully!");
  }

  async function createLecture(chapterId: string) {
    if (!chapterId) {
      alert("Chapter select karo");
      return;
    }

    if (!lectureName.trim() || !videoUrl.trim()) {
      alert("Lecture name aur video URL required hai");
      return;
    }

    try {
      new URL(videoUrl.trim());
    } catch {
      alert("Valid video URL enter karo");
      return;
    }

    const { error } = await supabase.from("lectures").insert({
      chapter_id: chapterId,
      title: lectureName.trim(),
      video_url: videoUrl.trim(),
    });

    if (error) {
      alert("Lecture save error: " + error.message);
      return;
    }

    setLectureName("");
    setVideoUrl("");
    await loadCourses();
    alert("Lecture successfully added!");
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course permanently?")) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete error: " + error.message);
      return;
    }

    if (manageCourse === id) setManageCourse(null);

    await loadCourses();
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("Delete this chapter?")) return;

    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (error) {
      alert("Chapter delete error: " + error.message);
      return;
    }

    await loadCourses();
  }

  async function deleteLecture(lectureId: string) {
    if (!confirm("Delete this lecture?")) return;

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lectureId);

    if (error) {
      alert("Lecture delete error: " + error.message);
      return;
    }

    await loadCourses();
  }

  function playLecture(lecture: Lecture) {
    setPlayingTitle(lecture.title);
    setPlayingVideo(lecture.videoUrl);
  }

  if (!loaded) {
    return (
      <div style={{ color: "white", padding: 30, background: "#0b0e14" }}>
        Loading LearnHub...
      </div>
    );
  }

  return (
    <div className="lh">
      <aside className="lh-sidebar">
        <div className="lh-brand">
          <div className="lh-logo">L</div>
          <div>
            <h2>LearnHub</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="lh-nav-label">MAIN MENU</div>

        <button
          className={`lh-nav ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("dashboard");
            setManageCourse(null);
          }}
        >
          <span>⌂</span> Dashboard
        </button>

        <button
          className={`lh-nav ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("courses");
            setManageCourse(null);
          }}
        >
          <span>▣</span> Courses
        </button>

        <button
          className={`lh-nav ${activeTab === "create" ? "active" : ""}`}
          onClick={() => {
            setManageCourse(null);
            setActiveTab("create");
          }}
        >
          <span>＋</span> Create Course
        </button>

        <button
          className={`lh-nav ${activeTab === "lectures" ? "active" : ""}`}
          onClick={() => {
            setManageCourse(null);
            setActiveTab("lectures");
          }}
        >
          <span>▷</span> Video Lectures
        </button>
    <button
  className="lh-nav"
  onClick={() => (window.location.href = "/admin/students")}
>
  <span>👥</span> Students
</button>
<button
  className="lh-nav"
  onClick={() => (window.location.href = "/admin/announcements")}
>
  <span>📢</span> Announcements
</button>

<button
  className="lh-nav"
  onClick={async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }}
>
  <span>🚪</span> Logout
</button>

        <div className="lh-sidebar-bottom">
          <div className="lh-profile">
            <div className="lh-avatar">A</div>
            <div>
              <b>Administrator</b>
              <span>Manage LearnHub</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="lh-main">
        <header className="lh-topbar">
          <div>
            <span className="lh-breadcrumb">LearnHub / Admin</span>
            <h1>
              {manageCourse
                ? "Course Management"
                : activeTab === "create"
                ? "Create Course"
                : activeTab === "courses"
                ? "My Courses"
                : activeTab === "lectures"
                ? "Video Library"
                : "Dashboard"}
            </h1>
          </div>
          <div className="lh-top-right">
            <div className="lh-admin-badge">
              <span className="lh-dot" /> Admin
            </div>
          </div>
        </header>

        {!manageCourse && activeTab === "dashboard" && (
          <>
            <div className="lh-welcome">
              <div>
                <span className="lh-orange-label">OVERVIEW</span>
                <h2>Welcome back 👋</h2>
                <p>Manage your courses, chapters and video lectures from here.</p>
              </div>
              <button className="lh-primary" onClick={() => setActiveTab("create")}>
                + Create New Course
              </button>
            </div>

            <div className="lh-stats">
              <div className="lh-stat">
                <div className="lh-stat-icon orange">▣</div>
                <span>Total Courses</span>
                <h2>{courses.length}</h2>
                <small>Your course collection</small>
              </div>

              <div className="lh-stat">
                <div className="lh-stat-icon blue">▤</div>
                <span>Total Chapters</span>
                <h2>{totalChapters}</h2>
                <small>Across all courses</small>
              </div>

              <div className="lh-stat">
                <div className="lh-stat-icon purple">▷</div>
                <span>Total Lectures</span>
                <h2>{totalLectures}</h2>
                <small>Video learning content</small>
              </div>
            </div>

            <div className="lh-section-head">
              <div>
                <h2>Recent Courses</h2>
                <p>Quick access to your course content</p>
              </div>
              <button className="lh-secondary" onClick={() => setActiveTab("courses")}>
                View All →
              </button>
            </div>

            <div className="lh-course-grid">
              {courses.slice(0, 4).map((course) => (
                <div className="lh-course-card" key={course.id}>
                  <div className="lh-course-cover">
                    <div className="lh-cover-icon">▣</div>
                    <span>{course.category}</span>
                  </div>
                  <h3>{course.name}</h3>
                  <p>{course.description || "No description added."}</p>
                  <div className="lh-course-meta">
                    <span>{course.chapters.length} Chapters</span>
                    <span>
                      {course.chapters.reduce((a, ch) => a + ch.lectures.length, 0)} Lectures
                    </span>
                  </div>
                  <button className="lh-manage" onClick={() => setManageCourse(course.id)}>
                    Manage Course →
                  </button>
                </div>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="lh-empty">
                <div className="lh-empty-icon">▣</div>
                <h3>No courses yet</h3>
                <p>Create your first course to get started.</p>
                <button className="lh-primary" onClick={() => setActiveTab("create")}>
                  + Create Course
                </button>
              </div>
            )}
          </>
        )}

        {!manageCourse && activeTab === "courses" && (
          <>
            <div className="lh-section-head">
              <div>
                <h2>All Courses</h2>
                <p>Manage and organize your course content</p>
              </div>
              <button className="lh-primary" onClick={() => setActiveTab("create")}>
                + Add Course
              </button>
            </div>

            <div className="lh-course-grid">
              {courses.map((course) => (
                <div className="lh-course-card" key={course.id}>
                  <div className="lh-course-cover">
                    <div className="lh-cover-icon">▣</div>
                    <span>{course.category}</span>
                  </div>
                  <h3>{course.name}</h3>
                  <p>{course.description || "No description added."}</p>
                  <div className="lh-course-meta">
                    <span>{course.chapters.length} Chapters</span>
                    <span>
                      {course.chapters.reduce((a, ch) => a + ch.lectures.length, 0)} Lectures
                    </span>
                  </div>
                  <button className="lh-manage" onClick={() => setManageCourse(course.id)}>
                    Manage Course →
                  </button>
                  <button className="lh-delete-course" onClick={() => deleteCourse(course.id)}>
                    Delete Course
                  </button>
                </div>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="lh-empty">
                <h3>No courses yet</h3>
                <p>Create your first course.</p>
              </div>
            )}
          </>
        )}

        {!manageCourse && activeTab === "create" && (
          <div className="lh-form-card">
            <div className="lh-form-heading">
              <div className="lh-stat-icon orange">＋</div>
              <div>
                <h2>Create New Course</h2>
                <p>Add a course to your LearnHub library</p>
              </div>
            </div>

            <div className="lh-form">
              <label>Course Name</label>
              <input
                placeholder="e.g. Complete Java Programming"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />

              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Programming</option>
                <option>Web Development</option>
                <option>Data Science</option>
                <option>AI & Machine Learning</option>
                <option>Computer Science</option>
                <option>Other</option>
              </select>

              <label>Description</label>
              <textarea
                placeholder="Write a short description about this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <button className="lh-primary" onClick={createCourse}>
                Create Course →
              </button>
            </div>
          </div>
        )}

        {!manageCourse && activeTab === "lectures" && (
          <>
            <div className="lh-section-head">
              <div>
                <h2>Video Library</h2>
                <p>All video lectures across your courses</p>
              </div>
            </div>

            <div className="lh-lecture-list">
              {courses.flatMap((course) =>
                course.chapters.flatMap((chapter) =>
                  chapter.lectures.map((lecture) => (
                    <div className="lh-lecture-row" key={lecture.id}>
                      <div className="lh-play-icon">▷</div>
                      <div className="lh-lecture-info">
                        <h3>{lecture.title}</h3>
                        <p>{course.name} · {chapter.title}</p>
                      </div>
                      <button className="lh-secondary" onClick={() => playLecture(lecture)}>
                        ▶ Play
                      </button>
                    </div>
                  ))
                )
              )}

              {totalLectures === 0 && (
                <div className="lh-empty">
                  <div className="lh-empty-icon">▷</div>
                  <h3>No lectures found</h3>
                  <p>Add video lectures from your course management.</p>
                </div>
              )}
            </div>
          </>
        )}

        {manageCourse && managedCourse && (
          <div className="lh-manage-panel">
            <button className="lh-secondary" onClick={() => setManageCourse(null)}>
              ← Back to Courses
            </button>

            <div className="lh-section-head">
              <div>
                <span className="lh-orange-label">COURSE CONTENT</span>
                <h2>{managedCourse.name}</h2>
                <p>Organize your chapters and video lectures.</p>
              </div>
            </div>

            <div className="lh-add-grid">
              <div className="lh-mini-form">
                <h3>＋ Add Chapter</h3>
                <input
                  placeholder="Chapter name"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                />
                <button className="lh-primary" onClick={() => createChapter(managedCourse.id)}>
                  Add Chapter
                </button>
              </div>

              <div className="lh-mini-form">
                <h3>▷ Add Lecture</h3>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                >
                  <option value="">Select Chapter</option>
                  {managedCourse.chapters.map((ch) => (
                    <option value={ch.id} key={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Lecture title"
                  value={lectureName}
                  onChange={(e) => setLectureName(e.target.value)}
                />

                <input
                  placeholder="DeepStorage video URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />

                <button className="lh-primary" onClick={() => createLecture(selectedChapter)}>
                  Add Lecture
                </button>
              </div>
            </div>

            {managedCourse.chapters.map((chapter, index) => (
              <div className="lh-chapter" key={chapter.id}>
                <div className="lh-chapter-header">
                  <div>
                    <span className="lh-orange-label">CHAPTER {index + 1}</span>
                    <h3>{chapter.title}</h3>
                    <p>{chapter.lectures.length} lectures</p>
                  </div>
                  <button className="lh-delete-course" onClick={() => deleteChapter(chapter.id)}>
                    Delete Chapter
                  </button>
                </div>

                {chapter.lectures.map((lecture, i) => (
                  <div className="lh-lecture-row" key={lecture.id}>
                    <button className="lh-play-icon clickable" onClick={() => playLecture(lecture)}>
                      ▶
                    </button>
                    <div className="lh-lecture-info">
                      <h3>{String(i + 1).padStart(2, "0")} · {lecture.title}</h3>
                      <p className="lh-green">Video link added</p>
                    </div>
                    <button className="lh-secondary" onClick={() => playLecture(lecture)}>
                      Play Video
                    </button>
                    <button className="lh-delete-course" onClick={() => deleteLecture(lecture.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {playingVideo && (
        <div className="lh-player-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="lh-player-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lh-player-header">
              <div>
                <h3>{playingTitle}</h3>
                <p>LearnHub Video Player</p>
              </div>
              <button onClick={() => setPlayingVideo(null)}>✕</button>
            </div>

            <video
              key={playingVideo}
              src={playingVideo}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", maxHeight: "75vh", background: "#000" }}
            />

            <div style={{ padding: "12px 20px" }}>
              <a
                href={playingVideo}
                target="_blank"
                rel="noopener noreferrer"
                download
                style={{
                  display: "inline-block",
                  padding: "10px 15px",
                  background: "#ff952b",
                  color: "#111",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                ⬇ Download Video
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
