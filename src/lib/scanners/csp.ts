export type CspFinding = {
  severity: "high" | "medium" | "low" | "info";
  description: string;
};

type CspRule = {
  check: (directives: Record<string, string[]>) => boolean;
  severity: "high" | "medium" | "low";
  description: string;
};

const CSP_RULES: CspRule[] = [
  {
    check: (d) => (d["script-src"] || d["default-src"] || []).includes("'unsafe-inline'"),
    severity: "high",
    description:
      "CSP permite 'unsafe-inline' em script-src: a proteção contra XSS fica praticamente anulada.",
  },
  {
    check: (d) => (d["script-src"] || d["default-src"] || []).includes("'unsafe-eval'"),
    severity: "medium",
    description:
      "CSP permite 'unsafe-eval': possibilita execução de código via eval(), amplia superfície de ataque.",
  },
  {
    check: (d) => (d["script-src"] || d["default-src"] || []).includes("*"),
    severity: "high",
    description:
      "CSP permite scripts de qualquer origem (*): a política não restringe fontes de script de forma eficaz.",
  },
  {
    check: (d) => !d["object-src"],
    severity: "low",
    description:
      "Diretiva object-src ausente: recomenda-se 'object-src none' para bloquear vetores via plugins legados.",
  },
];

export function analyzeCsp(cspValue: string | null): CspFinding[] {
  if (!cspValue) {
    return [
      {
        severity: "high",
        description: "CSP ausente: risco elevado de XSS (Cross-Site Scripting).",
      },
    ];
  }

  const directives = parseCspDirectives(cspValue);

  const findings: CspFinding[] = CSP_RULES.filter((rule) => rule.check(directives)).map(
    (rule) => ({ severity: rule.severity, description: rule.description })
  );

  if (findings.length === 0) {
    findings.push({
      severity: "info",
      description: "CSP presente e sem os problemas mais comuns verificados.",
    });
  }

  return findings;
}

function parseCspDirectives(value: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const parts = value
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const [name, ...values] = part.split(/\s+/);
    result[name.toLowerCase()] = values;
  }

  return result;
}