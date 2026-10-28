"use client";
// =====================================================================
// MEUS PEDIDOS — junta os pedidos enviados de TODAS as lojas (guardados
// no aparelho do cliente), com o link para acompanhar cada um.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatarPreco } from "@/lib/formato";

type Pedido = { codigo: string; quando: string; total: number; loja: string };

export default function MeusPedidosTodos() {
  const [lista, setLista] = useState<Pedido[] | null>(null);
  useEffect(() => {
    const todos: Pedido[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i) ?? "";
        if (!chave.startsWith("meus-pedidos:")) continue;
        const loja = chave.slice("meus-pedidos:".length);
        (JSON.parse(localStorage.getItem(chave) ?? "[]") as Omit<Pedido, "loja">[]).forEach((p) => todos.push({ ...p, loja }));
      }
    } catch {}
    setLista(todos.sort((a, b) => b.quando.localeCompare(a.quando)));
  }, []);

  if (!lista) return <p className="mt-6 opacity-60">Carregando...</p>;
  if (!lista.length) {
    return (
      <div className="mt-10 text-center">
        <p className="text-5xl">🧾</p>
        <p className="mt-2 opacity-70">Nenhum pedido enviado deste aparelho ainda.</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">Ver as lojas</Link>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm opacity-70">Pedidos enviados deste aparelho. Toque para ver como está cada um.</p>
      {lista.map((p, i) => (
        <Link key={p.codigo} href={`/pedido/${p.codigo}`} className="animar-entrada clicavel flex items-center gap-3 rounded-2xl border bg-white/80 p-4 shadow-sm" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
          <span className="text-2xl">🧾</span>
          <span className="min-w-0 flex-1">
            <b className="font-mono">#{p.codigo}</b> <span className="text-sm capitalize opacity-70">· {p.loja.replace(/-/g, " ")}</span>
            <span className="block text-xs opacity-60">{new Date(p.quando).toLocaleString("pt-BR")}</span>
          </span>
          <b>{formatarPreco(p.total)}</b>
          <span className="opacity-50">›</span>
        </Link>
      ))}
    </div>
  );
}
