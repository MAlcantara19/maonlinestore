"use client";
// =====================================================================
// PAINEL — ESTATÍSTICAS (endereço: /admin/vitraforma/estatisticas)
// Tudo ANÔNIMO: visitas, produtos vistos, carrinho (entrou/saiu),
// favoritos, cliques no WhatsApp e pedidos. Com gráfico por dia,
// rankings e o "aconteceu agora" em frases.
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { GraficoBarras, GraficoLinhas } from "@/components/admin/Graficos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";

type Dados = {
  totais: Record<string, number>; visitantes: number; pedidos: number; faturamento: number;
  por_dia: { dia: string; tipo: string; n: number }[];
  top: { tipo: string; nome: string; n: number }[];
  recentes: { tipo: string; criado_em: string; nome: string | null }[];
};

const INFO: Record<string, { rotulo: string; icone: string; cor: string; frase: (nome: string | null) => string }> = {
  visita_loja: { rotulo: "Visitas na loja", icone: "👀", cor: "#64748b", frase: () => "Alguém entrou na loja" },
  visita_produto: { rotulo: "Produtos vistos", icone: "🔍", cor: "#2563eb", frase: (n) => `Alguém abriu “${n ?? "um produto"}”` },
  carrinho_add: { rotulo: "Adicionados ao carrinho", icone: "🛒", cor: "#16a34a", frase: (n) => `“${n ?? "Um produto"}” foi para o carrinho` },
  carrinho_remove: { rotulo: "Tirados do carrinho", icone: "↩️", cor: "#d97706", frase: (n) => `“${n ?? "Um produto"}” saiu do carrinho` },
  favorito: { rotulo: "Favoritados", icone: "❤️", cor: "#e11d48", frase: (n) => `“${n ?? "Um produto"}” ganhou um ❤️` },
  whatsapp: { rotulo: "Cliques no WhatsApp", icone: "💬", cor: "#1FA855", frase: () => "Alguém chamou no WhatsApp" },
  pedido: { rotulo: "Pedidos enviados", icone: "✅", cor: "#7c3aed", frase: () => "Um pedido foi enviado! 🎉" },
};

// "há 5 min", "há 2 h", "há 3 dias"
function haQuanto(data: string) {
  const min = Math.round((Date.now() - new Date(data).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  return `há ${Math.round(min / 1440)} dias`;
}

export default function PainelEstatisticas() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [dias, setDias] = useState(30);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  // Histórico de visitas (linha do tempo por visitante)
  type Visita = { criado_em: string; tipo: string; produto: string | null; visitante: string | null; aparelho: string | null; detalhe: string | null; nome: string | null };
  const [historico, setHistorico] = useState<Visita[] | null>(null);
  const [visitante, setVisitante] = useState<string | null>(null);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => { lojaPeloSlug(slug).then(setLoja); }, [slug]);
  useEffect(() => {
    if (!loja) return;
    setDados(null);
    supabaseNavegador().rpc("estatisticas_loja", { p_loja: loja.id, p_dias: dias })
      .then(({ data, error }: { data: Dados | null; error: { message: string } | null }) => (error ? setErro(error.message) : setDados(data)));
  }, [loja, dias, recarregar]);
  useEffect(() => {
    if (!loja) return;
    supabaseNavegador().rpc("historico_visitas", { p_loja: loja.id, p_visitante: visitante, p_limite: visitante ? 500 : 150 })
      .then(({ data }: { data: Visita[] | null }) => setHistorico(data ?? []), () => setHistorico([]));
  }, [loja, visitante, recarregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  // Monta a lista de dias do período (para o gráfico não "pular" dias vazios)
  const listaDias = Array.from({ length: dias }, (_, i) => {
    const d = new Date(Date.now() - (dias - 1 - i) * 86400000);
    return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD
  });
  const serie = (tipo: string) => listaDias.map((d) => dados?.por_dia.find((x) => x.dia === d && x.tipo === tipo)?.n ?? 0);
  const ranking = (tipo: string) => (dados?.top ?? []).filter((t) => t.tipo === tipo).slice(0, 8).map((t) => ({ rotulo: t.nome, valor: Number(t.n) }));
  const total = (tipo: string) => Number(dados?.totais?.[tipo] ?? 0);
  const conversao = total("visita_loja") ? Math.round((Number(dados?.pedidos ?? 0) / total("visita_loja")) * 1000) / 10 : 0;

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setDias(d)} className="rounded-full border px-4 py-1.5 text-sm"
            style={dias === d ? { background: cor, color: "white", borderColor: cor } : { background: "white" }}>Últimos {d} dias</button>
        ))}
      </div>
      {erro && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Rode a atualização 14 no Supabase. ({erro})</p>}
      {!dados && !erro && <div className="brilho-esqueleto h-64 rounded-2xl" />}

      {dados && (
        <>
          {/* Números grandes */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icone: "🧑‍🤝‍🧑", rotulo: "Visitantes", valor: String(dados.visitantes) },
              { icone: "🧾", rotulo: "Pedidos", valor: String(dados.pedidos) },
              { icone: "💰", rotulo: "Total pedido", valor: formatarPreco(Number(dados.faturamento)) },
              { icone: "🎯", rotulo: "Visitas → pedido", valor: `${conversao}%` },
            ].map((c) => (
              <div key={c.rotulo} className="animar-entrada rounded-2xl bg-white p-4 shadow-sm">
                <span className="text-2xl">{c.icone}</span>
                <b className="block text-2xl">{c.valor}</b>
                <span className="text-xs opacity-60">{c.rotulo}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(INFO).map(([tipo, i]) => (
              <div key={tipo} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                <span>{i.icone}</span> <b>{total(tipo)}</b>
                <span className="block text-xs opacity-60">{i.rotulo}</span>
              </div>
            ))}
          </div>

          <Bloco titulo="📈 Por dia">
            <GraficoLinhas dias={listaDias} series={["visita_loja", "visita_produto", "carrinho_add", "pedido"].map((t) => ({ nome: INFO[t].rotulo, cor: INFO[t].cor, valores: serie(t) }))} />
          </Bloco>

          <div className="grid gap-4 md:grid-cols-2">
            <Bloco titulo="🔍 Mais vistos"><GraficoBarras itens={ranking("visita_produto")} cor={INFO.visita_produto.cor} /></Bloco>
            <Bloco titulo="🛒 Mais adicionados ao carrinho"><GraficoBarras itens={ranking("carrinho_add")} cor={INFO.carrinho_add.cor} /></Bloco>
            <Bloco titulo="❤️ Mais favoritados"><GraficoBarras itens={ranking("favorito")} cor={INFO.favorito.cor} /></Bloco>
            <Bloco titulo="↩️ Mais tirados do carrinho"><GraficoBarras itens={ranking("carrinho_remove")} cor={INFO.carrinho_remove.cor} /></Bloco>
          </div>

          <Bloco titulo="⚡ Aconteceu agora há pouco">
            {dados.recentes.length === 0 ? <p className="text-sm opacity-60">Nada ainda.</p> : (
              <ul className="space-y-1">
                {dados.recentes.map((r, n) => (
                  <li key={n} className="animar-entrada flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm" style={{ animationDelay: `${Math.min(n, 10) * 40}ms` }}>
                    <span>{INFO[r.tipo]?.icone}</span>
                    <span className="flex-1">{INFO[r.tipo]?.frase(r.nome) ?? r.tipo}</span>
                    <span className="text-xs opacity-50">{haQuanto(r.criado_em)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
          <Bloco titulo="🕵️ Histórico de visitas">
            <p className="text-xs opacity-60">
              Cada aparelho tem um código anônimo. O nome só aparece se a pessoa mandou um pedido ou dúvida e digitou o nome no carrinho.
              Toque num visitante para ver tudo o que ele viu.
            </p>
            {visitante && (
              <button type="button" onClick={() => setVisitante(null)} className="w-fit rounded-full px-3 py-1 text-sm text-white" style={{ background: cor }}>
                Visitante #{visitante} ✕ (ver todos)
              </button>
            )}
            {!historico ? <p className="text-sm opacity-60">Carregando...</p> : historico.length === 0 ? <p className="text-sm opacity-60">Nada ainda.</p> : (
              <ul className="max-h-[520px] space-y-1 overflow-y-auto pr-1 text-sm">
                {historico.map((h, n) => (
                  <li key={n} className="flex flex-wrap items-center gap-x-2 rounded-lg bg-stone-50 px-3 py-2">
                    <span className="w-24 shrink-0 font-mono text-xs opacity-60">{new Date(h.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    {h.visitante && (
                      <button type="button" onClick={() => setVisitante(h.visitante)} className="rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ borderColor: cor, color: cor }}>
                        {h.nome ? `👤 ${h.nome}` : `#${h.visitante}`}
                      </button>
                    )}
                    <span className="text-xs opacity-60">{h.aparelho}</span>
                    <span className="flex-1">{INFO[h.tipo]?.icone} {INFO[h.tipo]?.frase(h.produto) ?? h.tipo}{h.detalhe ? ` ${h.detalhe}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>

          <Bloco titulo="🧹 Zerar estatísticas">
            <p className="text-sm opacity-70">Apaga visitas, cliques, favoritos e o histórico desta loja (por exemplo, depois dos seus testes). Os pedidos continuam — para tirar pedidos de teste, use “🧪 Marcar como teste” na aba Pedidos.</p>
            <button type="button" className="w-fit rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
              onClick={async () => {
                if (!confirm("Zerar TODAS as estatísticas desta loja? Não dá para desfazer.")) return;
                const { error } = await supabaseNavegador().from("eventos").delete().eq("loja_id", loja.id);
                if (error) return alert(`Não deu: ${error.message}`);
                setVisitante(null); setRecarregar((n) => n + 1);
              }}>
              🧹 Zerar estatísticas
            </button>
          </Bloco>
          <p className="text-xs opacity-50">Não guardamos o endereço de internet (IP) de ninguém: cada aparelho tem só um código anônimo.</p>
        </>
      )}
    </>
  );
}
