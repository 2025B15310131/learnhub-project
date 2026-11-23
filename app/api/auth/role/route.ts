
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { authorized: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { authorized: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const user = userData.user;
    const adminEmail = process.env.LEARNHUB_ADMIN_EMAIL?.toLowerCase();

    if (user.email?.toLowerCase() === adminEmail) {
      return NextResponse.json({
        authorized: true,
        role: "admin",
      });
    }

    const { data: license, error: licenseError } =
      await supabaseAdmin
        .from("learnhub_licenses")
        .select("is_active, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (licenseError || !license) {
      return NextResponse.json(
        { authorized: false, role: "unauthorized" },
        { status: 403 }
      );
    }

    if (!license.is_active) {
      return NextResponse.json(
        { authorized: false, role: "blocked" },
        { status: 403 }
      );
    }

    if (
      license.expires_at &&
      new Date(license.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { authorized: false, role: "expired" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authorized: true,
      role: "student",
    });
  } catch (error) {
    console.error("Role verification error:", error);

    return NextResponse.json(
      { authorized: false, error: "Role verification failed" },
      { status: 500 }
    );
  }
}
