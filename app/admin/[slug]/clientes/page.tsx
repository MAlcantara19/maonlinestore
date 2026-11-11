"use client";
// =====================================================================
// PAINEL — CLIENTES (endereço: /admin/vitraforma/clientes)
// Quem já comprou, montado a partir dos pedidos: quantos pedidos, total
// gasto, última compra, por onde chegou e atalho para o WhatsApp.
// (Pedidos de teste e cancelados não entram.)
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco, telefoneBonito } from "@/lib/formato";
import { linkWhatsApp } from "@/lib/whatsapp";
import { CANAIS, rotuloDe } from "@/lib/pagamento";

type PedidoC = { id: string; codigo: string; cliente_nome: string | null; cliente_whatsapp: string | null; total: number | null; valor_pago: number | null; criado_em: string; canal: string | null; itens: { nome: string; quantidade: number }[]; cliente_aniversario?: string | null; indicado_por?: string | null };
type Cliente = { chave: string; nome: string; whatsapp: string | null; pedidos: PedidoC[]; total: number; pago: number; ultima: string; canais: Set<string>; produtos: Map<string, number>; aniversario: string | null };

const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function PainelClientes() {
  return <AreaAdmin>{() => <Clientes />}</AreaAdmin>;
}

function Clientes() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [pedidos, setPedidos] = useState<PedidoC[] | null>(null);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"total" | "recente" | "pedidos">("total");
  const [aberto, setAberto] = useState<string | null>(null);
  // ⭐ Fidelidade
  const [fiel, setFiel] = useState<{ a_cada: number; premio: number } | null>(null);
  const [premios, setPremios] = useState<Record<string, number>>({}); // só fidelidade
  const [outrosPremios, setOutrosPremios] = useState<{ cliente_chave: string; motivo: string; criado_em: string }[]>([]);
  const [extras, setExtras] = useState<{ aniversario: number | null; indicacao: number | null }>({ aniversario: null, indicacao: null });
  const carregarPremios = async (lojaId: string) => {
    const { data } = await supabaseNavegador().from("fidelidade_premios").select("cliente_chave, motivo, criado_em").eq("loja_id", lojaId);
    const lista = (data ?? []) as { cliente_chave: string; motivo: string; criado_em: string }[];
    const m: Record<string, number> = {};
    lista.filter((x) => (x.motivo ?? "fidelidade") === "fidelidade").forEach((x) => { m[x.cliente_chave] = (m[x.cliente_chave] ?? 0) + 1; });
    setPremios(m);
    setOutrosPremios(lista.filter((x) => x.motivo && x.motivo !== "fidelidade"));
  };
  // Cria o cupom, registra o prêmio e abre o WhatsApp com a mensagem
  async function darCupom(c: { nome: string; whatsapp: string | null }, pct: number, motivo: string, prefixo: string, frase: string) {
    if (!loja || !c.whatsapp) return;
    const sb = supabaseNavegador();
    const codigo = `${prefixo}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const validade = new Date(Date.now() + 60 * 86400000).toLocaleDateString("sv-SE");
    const r = await sb.from("cupons").insert({ loja_id: loja.id, codigo, tipo: "porcentagem", valor: pct, validade, ativo: true });
    if (r.error) return alert(r.error.message);
    await sb.from("fidelidade_premios").insert({ loja_id: loja.id, cliente_chave: c.whatsapp.slice(-9), cupom: codigo, motivo });
    carregarPremios(loja.id);
    window.open(linkWhatsApp(c.whatsapp.length <= 11 ? `55${c.whatsapp}` : c.whatsapp,
      `Oi, ${c.nome.split(" ")[0]}! ${frase}\nSeu presente: *${pct}% de desconto* com o cupom *${codigo}* (vale até ${validade.split("-").reverse().join("/")}). 💜 ${loja.nome}`), "_blank");
  }

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => {
      setLoja(l);
      if (l) supabaseNavegador().from("pedidos").select("id, codigo, cliente_nome, cliente_whatsapp, total, valor_pago, criado_em, canal, itens, cliente_aniversario, indicado_por")
        .eq("loja_id", l.id).eq("tipo", "pedido").eq("teste", false).neq("status", "cancelado").order("criado_em", { ascending: false }).limit(2000)
        .then(({ data }: { data: PedidoC[] | null }) => setPedidos(data ?? []));
      if (l) {
        supabaseNavegador().from("lojas").select("fidelidade_a_cada, fidelidade_premio_pct").eq("id", l.id).maybeSingle()
          .then(({ data }: { data: { fidelidade_a_cada: number | null; fidelidade_premio_pct: number | null } | null }) =>
            setFiel(data?.fidelidade_a_cada && data.fidelidade_premio_pct ? { a_cada: Number(data.fidelidade_a_cada), premio: data.fidelidade_premio_pct } : null));
        carregarPremios(l.id);
        supabaseNavegador().from("lojas").select("aniversario_pct, indicacao_pct").eq("id", l.id).maybeSingle()
          .then(({ data }: { data: { aniversario_pct: number | null; indicacao_pct: number | null } | null }) => setExtras({ aniversario: data?.aniversario_pct ?? null, indicacao: data?.indicacao_pct ?? null }));
      }
    });
  }, [slug]);

  // Junta os pedidos da mesma pessoa (pelo WhatsApp; sem WhatsApp, pelo nome)
  const clientes = useMemo(() => {
    const mapa = new Map<string, Cliente>();
    (pedidos ?? []).forEach((p) => {
      const chave = p.cliente_whatsapp ? `w:${p.cliente_whatsapp.slice(-9)}` : p.cliente_nome ? `n:${semAcento(p.cliente_nome)}` : null;
      if (!chave) return;
      const c = mapa.get(chave) ?? { chave, nome: p.cliente_nome ?? "Sem nome", whatsapp: p.cliente_whatsapp, pedidos: [], total: 0, pago: 0, ultima: p.criado_em, canais: new Set<string>(), produtos: new Map<string, number>(), aniversario: null };
      c.pago += Number(p.valor_pago || 0);
      if (!c.aniversario && p.cliente_aniversario) c.aniversario = p.cliente_aniversario;
      c.pedidos.push(p);
      c.total += Number(p.valor_pago || p.total || 0);
      if (p.criado_em > c.ultima) c.ultima = p.criado_em;
      if (!c.whatsapp && p.cliente_whatsapp) c.whatsapp = p.cliente_whatsapp;
      if (p.canal) c.canais.add(p.canal);
      (p.itens ?? []).forEach((i) => c.produtos.set(i.nome, (c.produtos.get(i.nome) ?? 0) + Number(i.quantidade)));
      mapa.set(chave, c);
    });
    return [...mapa.values()];
  }, [pedidos]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const termo = semAcento(busca);
  const lista = clientes
    .filter((c) => !termo || semAcento(c.nome).includes(termo) || (c.whatsapp ?? "").includes(termo.replace(/\D/g, "") || "§"))
    .sort((a, b) => (ordem === "total" ? b.total - a.total : ordem === "pedidos" ? b.pedidos.length - a.pedidos.length : b.ultima.localeCompare(a.ultima)));
  const voltaram = clientes.filter((c) => c.pedidos.length > 1).length;
  const dias = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">👥 Clientes</span><b className="block text-2xl">{clientes.length}</b></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">🔁 Compraram mais de uma vez</span><b className="block text-2xl">{voltaram}</b></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">💰 Média por cliente</span><b className="block text-2xl">{formatarPreco(clientes.length ? clientes.reduce((s, c) => s + c.total, 0) / clientes.length : 0)}</b></div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar por nome ou WhatsApp" className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2" />
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className="rounded-xl border bg-white px-3 py-2">
          <option value="total">💰 Quem mais gastou</option><option value="pedidos">🔁 Mais pedidos</option><option value="recente">🕓 Compra mais recente</option>
        </select>
      </div>
      {/* 🎂 Aniversariantes do mês */}
      {(() => {
        const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
        const ano = String(new Date().getFullYear());
        const aniv = clientes.filter((c) => c.aniversario?.slice(5, 7) === mesAtual).sort((a, b) => a.aniversario!.localeCompare(b.aniversario!));
        if (!aniv.length) return null;
        return (
          <Bloco titulo="🎂 Aniversariantes do mês">
            <ul className="space-y-1 text-sm">
              {aniv.map((c) => {
                const jaGanhou = outrosPremios.some((x) => x.motivo === "aniversario" && x.cliente_chave === c.whatsapp?.slice(-9) && x.criado_em.startsWith(ano));
                return (
                  <li key={c.chave} className="flex flex-wrap items-center gap-2 rounded-lg bg-pink-50 px-3 py-2">
                    <b>{c.aniversario!.slice(8, 10)}/{mesAtual}</b><span className="flex-1">{c.nome}</span>
                    {jaGanhou ? <span className="text-xs text-green-700">✓ cupom enviado</span> : extras.aniversario && c.whatsapp ? (
                      <button type="button" className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => darCupom(c, extras.aniversario!, "aniversario", "NIVER", "🎂 Feliz aniversário! A gente separou um mimo pra você:")}>🎂 Mandar cupom ({extras.aniversario}%)</button>
                    ) : <span className="text-xs opacity-60">configure o % em Configurações</span>}
                  </li>
                );
              })}
            </ul>
          </Bloco>
        );
      })()}

      <Bloco titulo="👥 Clientes">
        {!pedidos ? <p className="opacity-60">Carregando...</p> : lista.length === 0 ? <p className="text-sm opacity-60">Nenhum cliente ainda (aparecem quando o pedido tem nome ou WhatsApp).</p> : (
          <ul className="space-y-2">
            {lista.map((c, n) => (
              <li key={c.chave} className="rounded-xl bg-stone-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {ordem === "total" && n < 3 && <span>{["🥇", "🥈", "🥉"][n]}</span>}
                  <button type="button" onClick={() => setAberto(aberto === c.chave ? null : c.chave)} className="font-bold underline-offset-2 hover:underline">{c.nome}</button>
                  {c.pedidos.length > 1 && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">🔁 {c.pedidos.length} pedidos</span>}
                  {[...c.canais].filter((x) => x !== "site").map((x) => <span key={x} className="rounded-full bg-stone-200 px-2 py-0.5 text-xs">{rotuloDe(CANAIS, x)}</span>)}
                  <b className="ml-auto">{formatarPreco(c.total)}</b>
                </div>
                <p className="text-xs opacity-70">
                  Última compra: {new Date(c.ultima).toLocaleDateString("pt-BR")} ({dias(c.ultima) === 0 ? "hoje" : `há ${dias(c.ultima)} dias`})
                  {c.whatsapp ? ` · 📲 ${telefoneBonito(c.whatsapp)}` : ""}
                </p>
                {c.whatsapp && (
                  <a href={linkWhatsApp(c.whatsapp.length <= 11 ? `55${c.whatsapp}` : c.whatsapp, `Oi, ${c.nome.split(" ")[0]}! 😊 Aqui é da ${loja.nome}.`)} target="_blank" rel="noopener noreferrer"
                    className="mt-1 inline-block rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">💬 Chamar no WhatsApp</a>
                )}
                {/* 🤝 Indicações: amigos que compraram (e pagaram) pelo link dele */}
                {c.whatsapp && (() => {
                  const fone = c.whatsapp.slice(-9);
                  const indicados = (pedidos ?? []).filter((x) => x.indicado_por === fone && Number(x.valor_pago ?? 0) > 0);
                  if (!indicados.length) return null;
                  const dados = outrosPremios.filter((x) => x.motivo === "indicacao" && x.cliente_chave === fone).length;
                  return (
                    <p className="mt-2 text-xs">
                      🤝 Indicou <b>{indicados.length}</b> {indicados.length === 1 ? "amigo que comprou" : "amigos que compraram"}
                      {extras.indicacao && indicados.length > dados ? (
                        <button type="button" className="ml-2 rounded-full bg-green-600 px-3 py-1 font-semibold text-white"
                          onClick={() => darCupom(c, extras.indicacao!, "indicacao", "AMIGO", "🤝 Obrigado por indicar a gente! Seu amigo comprou e você ganhou:")}>🎁 Dar prêmio ({extras.indicacao}%)</button>
                      ) : <span className="ml-1 opacity-60">· prêmios entregues: {dados}</span>}
                    </p>
                  );
                })()}
                {/* ⭐ Fidelidade: progresso e liberar prêmio */}
                {fiel && c.whatsapp && (() => {
                  const fone = c.whatsapp.slice(-9);
                  const saldo = c.pago - (premios[fone] ?? 0) * fiel.a_cada;
                  const pct = Math.max(0, Math.min(100, Math.floor((saldo / fiel.a_cada) * 100)));
                  return (
                    <div className="mt-2 text-xs">
                      ⭐ Fidelidade: {formatarPreco(Math.max(0, saldo))} de {formatarPreco(fiel.a_cada)} ({pct}%)
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-stone-200"><span className="block h-full bg-amber-400" style={{ width: `${pct}%` }} /></span>
                      {saldo >= fiel.a_cada && (
                        <button type="button" className="mt-1 rounded-full bg-amber-400 px-3 py-1 font-bold text-stone-900"
                          onClick={async () => {
                            const sb = supabaseNavegador();
                            const codigo = `FIEL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
                            const validade = new Date(Date.now() + 90 * 86400000).toLocaleDateString("sv-SE");
                            const r = await sb.from("cupons").insert({ loja_id: loja.id, codigo, tipo: "porcentagem", valor: fiel.premio, validade, ativo: true });
                            if (r.error) return alert(r.error.message);
                            await sb.from("fidelidade_premios").insert({ loja_id: loja.id, cliente_chave: fone, cupom: codigo });
                            carregarPremios(loja.id);
                            window.open(linkWhatsApp(c.whatsapp!.length <= 11 ? `55${c.whatsapp}` : c.whatsapp!,
                              `Oi, ${c.nome.split(" ")[0]}! 🎉 Você completou o nosso programa de fidelidade da ${loja.nome}!\nSeu presente: *${fiel.premio}% de desconto* na próxima compra com o cupom *${codigo}* (vale até ${validade.split("-").reverse().join("/")}). Obrigado pela confiança! 💜`), "_blank");
                          }}>🎁 Liberar prêmio ({fiel.premio}%)</button>
                      )}
                    </div>
                  );
                })()}
                {aberto === c.chave && (
                  <div className="mt-2 space-y-1 border-t pt-2 text-xs">
                    <p><b>Mais comprou:</b> {[...c.produtos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, q]) => `${nome} (${q})`).join(" · ")}</p>
                    {c.pedidos.map((p) => (
                      <a key={p.id} href={`/admin/${slug}/pedidos?codigo=${p.codigo}`} className="block underline">#{p.codigo} · {new Date(p.criado_em).toLocaleDateString("pt-BR")} · {formatarPreco(Number(p.total ?? 0))}</a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Bloco>
      <p className="text-xs opacity-50">💡 Use para mandar novidades a quem já comprou, oferecer recompra (“faz 60 dias da sua última peça...”) ou dar um mimo aos melhores clientes.</p>
    </>
  );
}
