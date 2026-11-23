
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "student";

export default function AuthGuard({
  requiredRole,
  children,
}: {
  requiredRole: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          router.replace("/login");
          return;
        }

        const session = data.session;

        const response = await fetch("/api/auth/role", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        const result = await response.json();

        if (!response.ok || !result.authorized) {
          router.replace("/login");
          return;
        }

        if (result.role !== requiredRole) {
          router.replace(result.role === "admin" ? "/admin" : "/");
          return;
        }

        if (!cancelled) {
          setAllowed(true);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);

        if (!cancelled) {
          setAllowed(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [requiredRole, router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b0e14",
          color: "#ffffff",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Checking account...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b0e14",
          color: "#ffffff",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p>Unable to verify your account.</p>
          <button
            onClick={() => router.replace("/login")}
            style={{
              marginTop: 12,
              padding: "12px 24px",
              background: "#ff9d1b",
              color: "#111",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
