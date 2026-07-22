"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScanButton({ domainId }: { domainId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/domains/${domainId}/scan`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Falha ao executar o scan.");
        return;
      }

      // O scan roda de forma síncrona no backend (não é um job em fila),
      // então quando a resposta chega o resultado já está salvo no banco.
      // router.refresh() faz o Server Component buscar esse dado novo.
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleScan}
        disabled={loading}
        className="rounded-md bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Escaneando..." : "Rodar novo scan"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}