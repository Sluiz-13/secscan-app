import sslChecker from "ssl-checker";
import * as tls from "node:tls";

export type SslFinding = {
  severity: "high" | "medium" | "low" | "info";
  description: string;
};

// Abaixo desse limite de dias restantes, o certificado é tratado como
// risco operacional
const EXPIRY_WARNING_DAYS = 15;

// TLS 1.0 e 1.1 são considerados fracos (vulneráveis a BEAST/POODLE e
// desaconselhados por PCI-DSS).
const WEAK_PROTOCOLS = new Set(["TLSv1", "TLSv1.1"]);

function checkNegotiatedProtocol(domain: string): Promise<SslFinding[]> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain, // necessário para SNI em hosts com múltiplos certificados
        timeout: 8000,
      },
      () => {
        const protocol = socket.getProtocol();
        socket.end();

        if (protocol && WEAK_PROTOCOLS.has(protocol)) {
          resolve([
            {
              severity: "high",
              description: `Servidor negociou protocolo TLS fraco (${protocol}): vulnerável a ataques conhecidos como BEAST/POODLE.`,
            },
          ]);
        } else {
          resolve([]);
        }
      }
    );

    socket.on("error", () => resolve([])); // falha aqui já é reportada pelo ssl-checker
    socket.on("timeout", () => {
      socket.destroy();
      resolve([]);
    });
  });
}

export async function analyzeSsl(domain: string): Promise<SslFinding[]> {
  const findings: SslFinding[] = [];

  let result;
  try {
    // ssl-checker abre a conexão TLS e lê os detalhes do certificado.
    // method/port default já cobrem o caso comum (HTTPS na porta 443).
    result = await sslChecker(domain, { method: "GET", port: 443 });
  } catch (error) {
    // Falha de conexão TLS aqui geralmente significa que o domínio não
    // tem HTTPS configurado corretamente
    return [
      {
        severity: "high",
        description: `Não foi possível estabelecer conexão TLS com o domínio: ${(error as Error).message}`,
      },
    ];
  }

  if (!result.valid) {
    findings.push({
      severity: "high",
      description: "Certificado SSL/TLS inválido ou não confiável.",
    });
  }

  if (result.daysRemaining < 0) {
    findings.push({
      severity: "high",
      description: "Certificado SSL/TLS expirado.",
    });
  } else if (result.daysRemaining < EXPIRY_WARNING_DAYS) {
    findings.push({
      severity: "medium",
      description: `Certificado SSL/TLS expira em ${result.daysRemaining} dia(s): risco de expiração sem monitoramento.`,
    });
  }

  const protocolFindings = await checkNegotiatedProtocol(domain);
  findings.push(...protocolFindings);

  if (findings.length === 0) {
    findings.push({
      severity: "info",
      description: `Certificado SSL/TLS válido, expira em ${result.daysRemaining} dia(s).`,
    });
  }

  return findings;
}