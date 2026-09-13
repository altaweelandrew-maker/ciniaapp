import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "user",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    const token = await createSessionToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as "user" | "admin",
    });

    const response = NextResponse.json({
      success: true,
      user: newUser,
      token,
    });

    response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
