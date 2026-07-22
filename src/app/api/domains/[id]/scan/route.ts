import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { analyzeCsp } from "@/lib/scanners/csp";
import { analyzeCookies } from "@/lib/scanners/cookies";
import { calculateScore, type Severity } from "@/lib/scanners/scoring";
import { analyzeSsl } from "@/lib/scanners/ssl";

type HeaderCheck = {
  header: string;
  severity: "high" | "medium" | "low";
  description: string;
};

// content-security-policy foi removido daqui de propósito: ele agora
// tem análise própria em analyzeCsp (presença + conteúdo), então não
// deve mais ser tratado como um simples "existe ou não existe".
const SECURITY_HEADERS: HeaderCheck[] = [
  {
    header: "strict-transport-security",
    severity: "high",
    description: "HSTS ausente: o site pode ser vulnerável a downgrade de HTTPS para HTTP.",
  },
  {
    header: "x-frame-options",
    severity: "medium",
    description: "X-Frame-Options ausente: o site pode ser vulnerável a clickjacking.",
  },
  {
    header: "x-content-type-options",
    severity: "medium",
    description:
      "X-Content-Type-Options ausente: o navegador pode interpretar arquivos de forma incorreta (MIME sniffing).",
  },
  {
    header: "referrer-policy",
    severity: "low",
    description: "Referrer-Policy ausente: dados da URL de origem podem vazar para sites de destino.",
  },
  {
    header: "permissions-policy",
    severity: "low",
    description:
      "Permissions-Policy ausente: sem controle explícito sobre APIs sensíveis do navegador (câmera, geolocalização etc).",
  },
];

type ScanResultInput = {
  scanId: string;
  checkType: string;
  severity: string;
  description: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  // Confirma que o domínio pertence ao usuário autenticado.
  // Isso evita que um usuário dispare scan em domínio de outro,
  // só adivinhando/testando IDs.
  const domain = await prisma.domain.findFirst({
    where: { id, userId: user.userId },
  });

  if (!domain) {
    return NextResponse.json({ error: "domínio não encontrado" }, { status: 404 });
  }

  const scan = await prisma.scan.create({
    data: {
      domainId: domain.id,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const targetUrl = domain.domain.startsWith("http")
      ? domain.domain
      : `https://${domain.domain}`;

    // fetch (headers/cookies) e a checagem de SSL/TLS são independentes
    // entre si — rodar em paralelo com Promise.all evita que o tempo total
    // do scan seja a SOMA dos dois, e sim o tempo do mais lento dos dois.
    const [response, sslFindings] = await Promise.all([
      fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000), // evita travar em domínios lentos/maliciosos
      }),
      analyzeSsl(domain.domain.replace(/^https?:\/\//, "")),
    ]);

    const results: ScanResultInput[] = [];

    for (const f of sslFindings) {
      results.push({
        scanId: scan.id,
        checkType: "ssl_tls",
        severity: f.severity,
        description: f.description,
      });
    }

    // Headers simples: presença/ausência
    for (const check of SECURITY_HEADERS) {
      const headerValue = response.headers.get(check.header);
      if (!headerValue) {
        results.push({
          scanId: scan.id,
          checkType: check.header,
          severity: check.severity,
          description: check.description,
        });
      }
    }

    // CSP: análise de conteúdo, não só presença
    const cspFindings = analyzeCsp(response.headers.get("content-security-policy"));
    for (const f of cspFindings) {
      results.push({
        scanId: scan.id,
        checkType: "content-security-policy",
        severity: f.severity,
        description: f.description,
      });
    }

    // Cookies de sessão: HttpOnly / Secure / SameSite
    const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
    const cookieFindings = analyzeCookies(setCookieHeaders);
    for (const f of cookieFindings) {
      results.push({
        scanId: scan.id,
        checkType: "cookie",
        severity: f.severity,
        description: f.description,
      });
    }

    if (results.length === 0) {
      results.push({
        scanId: scan.id,
        checkType: "all_checks_passed",
        severity: "info",
        description: "Nenhum problema encontrado nas verificações realizadas.",
      });
    }

    await prisma.scanResult.createMany({ data: results });

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "completed", finishedAt: new Date() },
    });

    const finalResults = await prisma.scanResult.findMany({
      where: { scanId: scan.id },
    });

    // A nota é derivada dos findings reais salvos no banco (não do array
    // em memória) para garantir que o score sempre reflita exatamente o
    // que está persistido e será mostrado depois no histórico.
    const { score, grade, breakdown } = calculateScore(
      finalResults.map((r) => ({ severity: r.severity as Severity }))
    );

    return NextResponse.json(
      { scan, results: finalResults, score, grade, breakdown },
      { status: 201 }
    );
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "failed", finishedAt: new Date() },
    });

    return NextResponse.json(
      { error: "falha ao acessar o domínio", details: (error as Error).message },
      { status: 502 }
    );
  }
}