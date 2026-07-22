import { redirect } from "next/navigation";
import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateScore, type Severity } from "@/lib/scanners/scoring";
import Link from "next/link";
import NewDomainForm from "./new-domain-form";
import LogoutButton from "./logout-button";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-lime-100 text-lime-800",
  C: "bg-amber-100 text-amber-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

export default async function DashboardPage() {
  const user = await getAuthUserFromCookies();
  if (!user) {
    redirect("/login");
  }

  const domains = await prisma.domain.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      scans: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { results: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">SecScan</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3">Adicionar domínio</h2>
          <NewDomainForm />
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            Domínios monitorados ({domains.length})
          </h2>

          {domains.length === 0 ? (
            <p className="text-sm text-slate-400 border border-dashed border-slate-300 rounded-md px-4 py-8 text-center">
              Nenhum domínio cadastrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {domains.map((domain) => {
                const lastScan = domain.scans[0];

                return (
                  <li key={domain.id}>
                    <Link
                      href={`/dashboard/${domain.id}`}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-4 py-3 hover:border-slate-400 transition"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{domain.domain}</p>
                        <p className="text-xs text-slate-400">
                          {lastScan
                            ? `Último scan: ${new Date(lastScan.startedAt!).toLocaleString("pt-BR")}`
                            : "Nenhum scan realizado ainda"}
                        </p>
                      </div>

                      {lastScan && lastScan.status === "completed" && (
                        <ScanGradeBadge results={lastScan.results} />
                      )}
                      {lastScan && lastScan.status === "running" && (
                        <span className="text-xs text-slate-400">Em andamento...</span>
                      )}
                      {lastScan && lastScan.status === "failed" && (
                        <span className="text-xs text-red-500">Falhou</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function ScanGradeBadge({
  results,
}: {
  results: { severity: string }[];
}) {
  const { grade } = calculateScore(
    results.map((r) => ({ severity: r.severity as Severity }))
  );

  return (
    <span
      className={`text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center ${GRADE_STYLES[grade]}`}
    >
      {grade}
    </span>
  );
}