import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const domains = await prisma.domain.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(domains);
}

export async function POST(request: NextRequest) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { domain, consentGiven } = body;

  if (!domain) {
    return NextResponse.json(
      { error: "domain é obrigatório" },
      { status: 400 }
    );
  }

  const newDomain = await prisma.domain.create({
    data: {
      userId: user.userId, // vem do token, não do body
      domain,
      consentGiven: !!consentGiven,
    },
  });

  return NextResponse.json(newDomain, { status: 201 });
}