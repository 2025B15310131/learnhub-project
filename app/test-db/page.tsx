
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestDB() {
  const [message, setMessage] = useState("Connecting to database...");

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from("courses")
        .select("*");

      if (error) {
        setMessage("Connection failed: " + error.message);
      } else {
        setMessage("Supabase Connected Successfully! Courses found: " + data.length);
      }
    }

    test();
  }, []);

  return (
    <main style={{ background: "#0b0d14", color: "white", minHeight: "100vh", padding: 40 }}>
      <h1>LearnHub Database Test</h1>
      <p>{message}</p>
    </main>
  );
}
