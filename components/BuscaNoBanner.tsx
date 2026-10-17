"use client";
// =====================================================================
// BUSCA NO BANNER (todas as páginas da loja)
//   - Enquanto digita, mostra sugestões com foto e preço, buscando
//     só pelo NOME do produto.
//   - Na página da loja, a grade de produtos também vai sendo filtrada
//     ao vivo (avisa a grade pelo evento "busca-loja").
//   - Na página do produto ou do carrinho, Enter leva para a loja já
//     com a busca aplicada (/vitraforma?busca=dado).
// =====================================================================
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";

type Sugestao = { id: string; nome: string; preco: number | null; foto?: string };

export default function BuscaNoBanner({ slug, lojaId }: { slug: string; lojaId: string }) {
  const caminho = usePathname();
  const router = useRouter();
  const naLoja = caminho === `/${slug}`;
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[] | null>(null);
  const [aberto, setAberto] = useState(false);

  // Ao abrir a loja com ?busca=..., já começa com o texto
  useEffect(() => {
    const inicial = new URLSearchParams(window.location.search).get("busca");
    if (inicial) setTexto(inicial);
  }, []);

  // Se a grade limpar a busca ("limpar"), a caixa também limpa
  useEffect(() => {
    const ouvir = (e: Event) => setTexto((e as CustomEvent<string>).detail);
    window.addEventListener("busca-loja", ouvir);
    return () => window.removeEventListener("busca-loja", ouvir);
  }, []);

  // Espera 0,25 s depois que a pessoa para de digitar (debounce) e busca no banco
  useEffect(() => {
    const termo = texto.trim();
    const t = setTimeout(async () => {
      if (naLoja) window.dispatchEvent(new CustomEvent("busca-loja", { detail: texto }));
      if (!termo) return setSugestoes(null);
      const { data } = await supabaseNavegador().from("produtos")
        .select("id, nome, preco, midias(url, tipo, ordem), variacoes(preco, ativa)")
        .eq("loja_id", lojaId).eq("ativo", true).is("excluido_em", null).ilike("nome", `%${termo}%`).limit(6);
      setSugestoes((data ?? []).map((p: { id: string; nome: string; preco: number | null; midias: { url: string; tipo: string; ordem: number }[]; variacoes: { preco: number | null; ativa: boolean }[] }) => {
        const precos = p.variacoes.filter((v) => v.ativa && v.preco != null).map((v) => Number(v.preco));
        return {
          id: p.id, nome: p.nome,
          preco: precos.length ? Math.min(...precos) : p.preco != null ? Number(p.preco) : null,
          foto: [...p.midias].sort((a, b) => a.ordem - b.ordem).find((m) => m.tipo === "foto")?.url,
        };
      }));
    }, 250);
    return () => clearTimeout(t);
  }, [texto, lojaId, naLoja]);

  function confirmar() {
    setAberto(false);
    if (!naLoja && texto.trim()) router.push(`/${slug}?busca=${encodeURIComponent(texto.trim())}`);
  }

  return (
    <div className="relative w-full sm:w-72">
      <input type="search" value={texto} placeholder="🔍 Buscar produto..."
        onChange={(e) => { setTexto(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") setAberto(false); }}
        className="w-full rounded-full border border-white/30 bg-white/95 px-4 py-2 text-sm text-stone-900 shadow outline-none focus:ring-2 focus:ring-white/60" />

      {aberto && texto.trim() && sugestoes && (
        <div className="deslizar absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-xl bg-white text-stone-900 shadow-2xl">
          {sugestoes.length === 0 ? (
            <p className="p-4 text-sm opacity-60">Nenhum produto com “{texto.trim()}” no nome 😕</p>
          ) : (
            <ul>
              {sugestoes.map((s, i) => (
                <li key={s.id} className="animar-entrada" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link href={`/${slug}/p/${s.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-black/5">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-200">
                      {s.foto && <img src={s.foto} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.nome}</span>
                    <span className="text-sm font-semibold">{s.preco != null ? formatarPreco(s.preco) : "Consulte"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
