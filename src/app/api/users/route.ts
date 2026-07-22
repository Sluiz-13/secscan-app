import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, termsAccepted } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email e password são obrigatórios" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "senha deve ter no mínimo 8 caracteres" },
      { status: 400 }
    );
  }

  // Aceite dos termos é obrigatório e validado no servidor, não só no
  // front. Um checkbox desabilitado no formulário é só UX — a garantia
  // de verdade (e a evidência, via termsAcceptedAt) precisa existir aqui.
  if (termsAccepted !== true) {
    return NextResponse.json(
      { error: "é necessário aceitar os termos de uso para criar uma conta" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "email já cadastrado" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      termsAcceptedAt: new Date(),
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, createdAt: user.createdAt },
    { status: 201 }
  );
}