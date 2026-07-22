"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewDomainForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError("É necessário confirmar que você tem autorização para escanear este domínio.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, consentGiven: consent }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível adicionar o domínio.");
        return;
      }

      setDomain("");
      setConsent(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="exemplo.com.br"
          required
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        Confirmo que tenho autorização para realizar verificações de segurança neste domínio.
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </form>
  );
}