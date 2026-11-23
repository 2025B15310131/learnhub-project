
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Student = {
  user_id: string;
  email: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export default function StudentsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function loadStudents() {
    setLoading(true);
    setError("");

    const token = await getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/students", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Failed to load students");
      setLoading(false);
      return;
    }

    setStudents(result.students || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const token = await getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        password,
        expiresAt: expiry || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Student creation failed");
      setSaving(false);
      return;
    }

    setEmail("");
    setPassword("");
    setExpiry("");
    await loadStudents();
    setSaving(false);
    alert("Student account created successfully!");
  }

  async function updateStudent(
    student: Student,
    updates: { is_active?: boolean; expires_at?: string | null }
  ) {
    const token = await getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: student.user_id,
        ...updates,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Update failed");
      return;
    }

    await loadStudents();
  }

  const filteredStudents = students.filter((student) =>
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = students.filter((s) => s.is_active).length;
  const blockedCount = students.filter((s) => !s.is_active).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0e14",
      color: "#f4f6fa",
      padding: "30px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto"
      }}>
        <button
          onClick={() => router.push("/admin")}
          style={buttonStyle("#202633")}
        >
          ← Back to Admin
        </button>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          margin: "25px 0"
        }}>
          <div>
            <p style={{ color: "#ff952b", fontSize: 12, fontWeight: 700 }}>
              LEARNHUB ADMIN
            </p>
            <h1 style={{ fontSize: 32, margin: "8px 0" }}>
              Students Management
            </h1>
            <p style={{ color: "#8f9aab" }}>
              Create and manage student access
            </p>
          </div>

          <button onClick={loadStudents} style={buttonStyle("#202633")}>
            ↻ Refresh
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 15,
          marginBottom: 25
        }}>
          <Stat title="Total Students" value={students.length} />
          <Stat title="Active Accounts" value={activeCount} />
          <Stat title="Blocked Accounts" value={blockedCount} />
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>＋ Create Student Account</h2>

          <form onSubmit={createStudent}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 15
            }}>
              <Field label="Student Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Account Expiry (optional)">
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {error && (
              <p style={{
                color: "#ff7f8d",
                background: "#321c24",
                padding: 12,
                borderRadius: 8
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={buttonStyle("#ff952b")}
            >
              {saving ? "Creating..." : "Create Student →"}
            </button>
          </form>
        </div>

        <div style={cardStyle}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
            flexWrap: "wrap"
          }}>
            <h2 style={{ margin: 0 }}>Student Accounts</h2>

            <input
              placeholder="Search student email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 300 }}
            />
          </div>

          {loading ? (
            <p style={{ color: "#9ba7ba", padding: 20 }}>Loading students...</p>
          ) : filteredStudents.length === 0 ? (
            <p style={{ color: "#9ba7ba", padding: 20 }}>No students found.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 20 }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 650
              }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#929eb1" }}>
                    <th style={cellStyle}>Email</th>
                    <th style={cellStyle}>Status</th>
                    <th style={cellStyle}>Expiry</th>
                    <th style={cellStyle}>Created</th>
                    <th style={cellStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.user_id}>
                      <td style={cellStyle}>{student.email}</td>

                      <td style={cellStyle}>
                        <span style={{
                          background: student.is_active ? "#153b2b" : "#421f27",
                          color: student.is_active ? "#62d99a" : "#ff8290",
                          padding: "6px 10px",
                          borderRadius: 20,
                          fontSize: 12
                        }}>
                          {student.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        {student.expires_at
                          ? new Date(student.expires_at).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td style={cellStyle}>
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>

                      <td style={cellStyle}>
                        <button
                          onClick={() => updateStudent(student, {
                            is_active: !student.is_active
                          })}
                          style={buttonStyle(
                            student.is_active ? "#52232c" : "#17412e"
                          )}
                        >
                          {student.is_active ? "Block" : "Unblock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#929eb1", margin: 0 }}>{title}</p>
      <h2 style={{ fontSize: 32, margin: "12px 0 0" }}>{value}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block",
        marginBottom: 8,
        color: "#cbd3df",
        fontSize: 13
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#151a23",
  border: "1px solid #252d3b",
  borderRadius: 16,
  padding: 22,
  marginBottom: 22
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 13,
  borderRadius: 9,
  border: "1px solid #30394a",
  background: "#0d121b",
  color: "#fff",
  outline: "none"
};

const buttonStyle = (background: string): React.CSSProperties => ({
  background,
  color: background === "#ff952b" ? "#111" : "#fff",
  border: "none",
  borderRadius: 9,
  padding: "11px 16px",
  fontWeight: 700,
  cursor: "pointer"
});

const cellStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #293140",
  fontSize: 13
};
