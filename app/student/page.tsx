"use client";

import { useEffect, useState } from "react";

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

export default function StudentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    const loadCourses = () => {
      const saved = localStorage.getItem("learnhub_courses");
      if (saved) setCourses(JSON.parse(saved));
    };

    loadCourses();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080b12",
      color: "#fff",
      padding: "40px 6%",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800 }}>
          LearnHub <span style={{ color: "#ff8a00" }}>Learning</span>
        </h1>
        <p style={{ color: "#9299a8" }}>
          Learn at your own pace. Explore your courses and lectures.
        </p>
      </header>

      {!selectedCourse ? (
        <>
          <h2 style={{ fontSize: 25, marginBottom: 20 }}>My Courses</h2>

          {courses.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No courses available yet.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 20
            }}>
              {courses.map(course => (
                <div key={course.id} style={{
                  background: "#131a27",
                  border: "1px solid #263244",
                  borderRadius: 18,
                  padding: 24
                }}>
                  <div style={{
                    color: "#ff9900",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 12
                  }}>
                    {course.category}
                  </div>

                  <h3 style={{ fontSize: 23, marginBottom: 10 }}>
                    {course.name}
                  </h3>

                  <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
                    {course.description}
                  </p>

                  <div style={{
                    color: "#aab2c0",
                    margin: "18px 0"
                  }}>
                    📚 {course.chapters.length} Chapters
                    {" · "}
                    🎬 {course.chapters.reduce(
                      (total, chapter) => total + chapter.lectures.length, 0
                    )} Lectures
                  </div>

                  <button
                    onClick={() => setSelectedCourse(course)}
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg,#ff9a00,#ff6b00)",
                      color: "#111",
                      border: "none",
                      padding: 14,
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Explore Course →
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setSelectedLecture(null);
            }}
            style={{
              background: "#172131",
              color: "#fff",
              border: "1px solid #29374b",
              padding: "12px 18px",
              borderRadius: 10,
              cursor: "pointer",
              marginBottom: 25
            }}
          >
            ← Back to Courses
          </button>

          <h1 style={{ fontSize: 30, marginBottom: 8 }}>
            {selectedCourse.name}
          </h1>

          <p style={{ color: "#9ca3af", marginBottom: 30 }}>
            {selectedCourse.description}
          </p>

          {selectedLecture && (
            <div style={{
              background: "#131a27",
              border: "1px solid #29374b",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 35
            }}>
              <div style={{ padding: 20 }}>
                <h2 style={{ fontSize: 21 }}>{selectedLecture.title}</h2>
              </div>

              <video
                key={selectedLecture.id}
                controls
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  maxHeight: 650,
                  background: "#000"
                }}
              >
                <source src={selectedLecture.videoUrl} />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          <h2 style={{ fontSize: 23, marginBottom: 20 }}>Course Content</h2>

          {selectedCourse.chapters.map((chapter, index) => (
            <div key={chapter.id} style={{
              background: "#131a27",
              border: "1px solid #263244",
              borderRadius: 14,
              marginBottom: 16,
              overflow: "hidden"
            }}>
              <div style={{ padding: 20 }}>
                <p style={{
                  color: "#ff9800",
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  CHAPTER {index + 1}
                </p>

                <h3 style={{ fontSize: 19, marginTop: 8 }}>
                  {chapter.title}
                </h3>

                <p style={{ color: "#9ca3af", marginTop: 8 }}>
                  {chapter.lectures.length} Lectures
                </p>
              </div>

              {chapter.lectures.map((lecture, lectureIndex) => (
                <button
                  key={lecture.id}
                  onClick={() => setSelectedLecture(lecture)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 15,
                    width: "100%",
                    textAlign: "left",
                    background: selectedLecture?.id === lecture.id
                      ? "#202c3f"
                      : "#101722",
                    borderTop: "1px solid #263244",
                    color: "#fff",
                    padding: 20,
                    cursor: "pointer"
                  }}
                >
                  <div style={{
                    background: "#253247",
                    color: "#ff9800",
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17
                  }}>
                    ▶
                  </div>

                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Lecture {lectureIndex + 1}: {lecture.title}
                    </div>
                    <div style={{
                      color: "#929daf",
                      fontSize: 13,
                      marginTop: 5
                    }}>
                      Watch Lecture
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </>
      )}
    </main>
  );
}