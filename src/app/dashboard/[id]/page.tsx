import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateScore, type Severity } from "@/lib/scanners/scoring";
import ScanButton from "./scan-button";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-blue-50 border-blue-200 text-blue-800",
  info: "bg-slate-50 border-slate-200 text-slate-600",
};

const SEVERITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  info: "Info",
};

// Ordem de exibição: mais grave primeiro, sempre. Isso é intencional —
// um relatório de segurança deve levar o leitor ao que importa mais
// antes de qualquer outra coisa, não na ordem em que foi salvo no banco.
const SEVERITY_ORDER = ["high", "medium", "low", "info"];

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const domain = await prisma.domain.findFirst({
    where: { id, userId: user.userId },
    include: {
      scans: {
        orderBy: { startedAt: "desc" },
        include: { results: true },
      },
    },
  });

  // notFound() em vez de um erro genérico: cobre tanto "domínio não
  // existe" quanto "existe mas é de outro usuário" com a mesma resposta
  // visual (404), sem revelar qual dos dois casos é — mesmo raciocínio
  // de não vazar informação que já aplicamos no login.
  if (!domain) {
    notFound();
  }

  const latestScan = domain.scans[0];
  const sortedResults = latestScan
    ? [...latestScan.results].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
      )
    : [];

  const scoreData = latestScan
    ? calculateScore(latestScan.results.map((r) => ({ severity: r.severity as Severity })))
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
            ← Voltar
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 mt-1">{domain.domain}</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-4">
          <div>
            {scoreData ? (
              <>
                <p className="text-sm text-slate-500">Nota geral</p>
                <p className="text-3xl font-bold text-slate-900">
                  {scoreData.grade}{" "}
                  <span className="text-base font-normal text-slate-400">
                    ({scoreData.score}/100)
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Nenhum scan realizado ainda.</p>
            )}
          </div>
          <ScanButton domainId={domain.id} />
        </section>

        {latestScan && (
          <section>
            <h2 className="text-sm font-medium text-slate-700 mb-3">
              Resultado do scan ({new Date(latestScan.startedAt!).toLocaleString("pt-BR")})
            </h2>

            <ul className="space-y-2">
              {sortedResults.map((result) => (
                <li
                  key={result.id}
                  className={`border rounded-md px-4 py-3 ${SEVERITY_STYLES[result.severity]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {SEVERITY_LABELS[result.severity]}
                    </span>
                    <span className="text-xs opacity-60">{result.checkType}</span>
                  </div>
                  <p className="text-sm">{result.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {domain.scans.length > 1 && (
          <section>
            <h2 className="text-sm font-medium text-slate-700 mb-3">Histórico de scans</h2>
            <ul className="space-y-1">
              {domain.scans.slice(1).map((scan) => {
                const historicScore = calculateScore(
                  scan.results.map((r) => ({ severity: r.severity as Severity }))
                );
                return (
                  <li
                    key={scan.id}
                    className="flex items-center justify-between text-sm text-slate-500 bg-white border border-slate-200 rounded-md px-4 py-2"
                  >
                    <span>{new Date(scan.startedAt!).toLocaleString("pt-BR")}</span>
                    <span className="font-medium">{historicScore.grade}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}