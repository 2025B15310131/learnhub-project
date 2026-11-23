
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.LEARNHUB_ADMIN_EMAIL?.trim().toLowerCase();

const adminClient = createClient(url, secret, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAdmin(req: Request): Promise<boolean> {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token || !adminEmail) return false;

    const authClient = createClient(url, anon);

    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) return false;

    return data.user.email?.trim().toLowerCase() === adminEmail;
  } catch (error) {
    console.error("ADMIN VERIFY ERROR:", error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const authorized = await verifyAdmin(req);

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized admin" },
        { status: 401 }
      );
    }

    const { data, error } = await adminClient
      .from("learnhub_licenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("STUDENTS DATABASE ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ students: data ?? [] });
  } catch (error) {
    console.error("STUDENTS API CRASH:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authorized = await verifyAdmin(req);

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized admin" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const expiresAt = body.expiresAt || null;

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Valid email and password of minimum 6 characters required" },
        { status: 400 }
      );
    }

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      console.error("CREATE STUDENT ERROR:", createError);

      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    const { error: licenseError } = await adminClient
      .from("learnhub_licenses")
      .insert({
        user_id: userId,
        email,
        is_active: true,
        expires_at: expiresAt,
      });

    if (licenseError) {
      console.error("CREATE LICENSE ERROR:", licenseError);

      await adminClient.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: licenseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        student: {
          id: userId,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE STUDENT API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authorized = await verifyAdmin(req);

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized admin" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const userId = body.user_id;
    const isActive = body.is_active;
    const expiresAt = body.expires_at;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof isActive === "boolean") {
      updates.is_active = isActive;
    }

    if (expiresAt !== undefined) {
      updates.expires_at = expiresAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from("learnhub_licenses")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("UPDATE STUDENT ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      student: data,
    });
  } catch (error) {
    console.error("UPDATE STUDENT API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}
