export type CookieFinding = {
  severity: "high" | "medium" | "low" | "info";
  description: string;
};

type CookieRule = {
  id: "httponly" | "secure" | "samesite";
  check: (lowerCookie: string) => boolean;
  severity: "high" | "medium" | "low";
  description: (cookieName: string) => string;
};

const COOKIE_RULES: CookieRule[] = [
  {
    id: "httponly",
    check: (c) => !c.includes("httponly"),
    severity: "high",
    description: (name) =>
      `Cookie "${name}" sem HttpOnly: pode ser lido via JavaScript, ampliando o impacto de um XSS.`,
  },
  {
    id: "secure",
    check: (c) => !c.includes("secure"),
    severity: "high",
    description: (name) =>
      `Cookie "${name}" sem Secure: pode ser transmitido em conexões HTTP não criptografadas.`,
  },
  {
    id: "samesite",
    check: (c) => !c.includes("samesite"),
    severity: "medium",
    description: (name) =>
      `Cookie "${name}" sem SameSite: maior exposição a ataques CSRF.`,
  },
];

const RULES_EXEMPT_FOR_CSRF_TOKENS = new Set<CookieRule["id"]>(["httponly"]);

const SENSITIVE_COOKIE_PATTERN = /session|token|auth|sid/i;

const CSRF_TOKEN_PATTERN = /^(xsrf-token|csrf-token|_csrf|x-csrf-token)$/i;

export function analyzeCookies(setCookieHeaders: string[]): CookieFinding[] {
  const findings: CookieFinding[] = [];

  for (const cookie of setCookieHeaders) {
    const cookieName = cookie.split("=")[0].trim();

    if (!SENSITIVE_COOKIE_PATTERN.test(cookieName)) continue;

    const lowerCookie = cookie.toLowerCase();
    const isCsrfToken = CSRF_TOKEN_PATTERN.test(cookieName);

    for (const rule of COOKIE_RULES) {
      if (isCsrfToken && RULES_EXEMPT_FOR_CSRF_TOKENS.has(rule.id)) continue;

      if (rule.check(lowerCookie)) {
        findings.push({
          severity: rule.severity,
          description: rule.description(cookieName),
        });
      }
    }
  }

  return findings;
}