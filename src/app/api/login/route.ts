import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email e password são obrigatórios" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Mensagem genérica de propósito: não revela se o email existe ou não
  if (!user) {
    return NextResponse.json(
      { error: "credenciais inválidas" },
      { status: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "credenciais inválidas" },
      { status: 401 }
    );
  }

  const token = signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({
    id: user.id,
    email: user.email,
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60, // 1 hora, em segundos
    path: "/",
  });

  return response;
}