// =====================================================================
// 🔔 ENVIO DAS NOTIFICAÇÕES PUSH (roda SÓ no servidor)
// Precisa de 3 variáveis no .env.local e na Vercel (veja o LEIA-ME):
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_EMAIL
// Gere as chaves uma vez com:  npx web-push generate-vapid-keys
// =====================================================================
import { sendNotification, setVapidDetails } from "web-push";
import { createClient } from "@supabase/supabase-js";

export function clienteSecreto() {
  const segredo = process.env.SUPABASE_SECRET_KEY;
  if (!segredo) throw new Error("Falta SUPABASE_SECRET_KEY no .env.local (e na Vercel).");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, segredo, { auth: { persistSession: false, autoRefreshToken: false } });
}

let configurado = false;
function configurar() {
  if (configurado) return true;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return false;
  const email = process.env.VAPID_EMAIL || "contato@maonlinestore.com.br";
  setVapidDetails(email.startsWith("mailto:") ? email : `mailto:${email}`, publica, privada);
  configurado = true;
  return true;
}

export type Aviso = { titulo: string; corpo: string; url: string; tag?: string };
type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string };

// Manda para uma lista de aparelhos; apaga os que não existem mais
async function mandar(inscricoes: Inscricao[], aviso: Aviso) {
  if (!configurar() || !inscricoes.length) return 0;
  const sb = clienteSecreto();
  let enviados = 0;
  await Promise.all(inscricoes.map(async (i) => {
    try {
      await sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, JSON.stringify(aviso), { TTL: 60 * 60 * 24, urgency: "high" });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await sb.from("push_inscricoes").delete().eq("id", i.id);
    }
  }));
  return enviados;
}

// Todos os aparelhos de quem cuida da loja (administradores dela + master)
export async function avisarLoja(lojaId: string, aviso: Aviso) {
  const sb = clienteSecreto();
  const [{ data: donos }, { data: masters }] = await Promise.all([
    sb.from("loja_admins").select("user_id").eq("loja_id", lojaId),
    sb.from("master_admins").select("user_id"),
  ]);
  const ids = [...new Set([...(donos ?? []), ...(masters ?? [])].map((d) => d.user_id as string))];
  if (!ids.length) return 0;
  const { data } = await sb.from("push_inscricoes").select("id, endpoint, p256dh, auth").in("user_id", ids);
  return mandar((data ?? []) as Inscricao[], aviso);
}

export async function avisarUsuario(userId: string, aviso: Aviso) {
  const { data } = await clienteSecreto().from("push_inscricoes").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  return mandar((data ?? []) as Inscricao[], aviso);
}

export const pushConfigurado = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// ---------------------------------------------------------------------
// 🔔 Avisos para o CLIENTE do pedido (ele ativa no acompanhamento)
// ---------------------------------------------------------------------
export async function avisarCliente(pedidoId: string, aviso: Aviso) {
  if (!configurar()) return 0;
  const sb = clienteSecreto();
  const { data } = await sb.from("push_pedidos").select("id, endpoint, p256dh, auth").eq("pedido_id", pedidoId);
  let enviados = 0;
  await Promise.all(((data ?? []) as Inscricao[]).map(async (i) => {
    try {
      await sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, JSON.stringify(aviso), { TTL: 60 * 60 * 24 * 3 });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await sb.from("push_pedidos").delete().eq("id", i.id);
    }
  }));
  return enviados;
}

// ---------------------------------------------------------------------
// 🎯 META DO MÊS BATIDA (avisa uma vez por mês)
// ---------------------------------------------------------------------
export async function conferirMeta(lojaId: string) {
  const sb = clienteSecreto();
  const { data: loja, error } = await sb.from("lojas").select("slug, nome, meta_mensal, meta_avisada_mes").eq("id", lojaId).maybeSingle();
  if (error || !loja) return;
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const mes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const inicio = new Date(`${mes}-01T00:00:00-03:00`).toISOString();
  const { data: pedidos } = await sb.from("pedidos").select("total, teste, itens").eq("loja_id", lojaId).eq("tipo", "pedido").neq("status", "cancelado").gte("criado_em", inicio);
  const validos = (pedidos ?? []).filter((p) => !p.teste);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // 🎯 Meta da LOJA (em R$)
  if (loja.meta_mensal && loja.meta_avisada_mes !== mes) {
    const soma = validos.reduce((s, p) => s + Number(p.total || 0), 0);
    if (soma >= Number(loja.meta_mensal)) {
      // marca antes de avisar (se dois pedidos chegarem juntos, só um avisa)
      const { data: marcou } = await sb.from("lojas").update({ meta_avisada_mes: mes }).eq("id", lojaId).or(`meta_avisada_mes.is.null,meta_avisada_mes.neq.${mes}`).select("id");
      if (marcou?.length) await avisarLoja(lojaId, { titulo: `🎯 Meta do mês batida! · ${loja.nome}`, corpo: `Já são ${fmt(soma)} em pedidos (meta: ${fmt(Number(loja.meta_mensal))}). Parabéns! 🎉`, url: `/admin/${loja.slug}/financeiro`, tag: `meta-${mes}` });
    }
  }

  // 🎯 Meta de cada PRODUTO (em unidades no mês) — atualização 33
  const vendidos = new Map<string, number>();
  validos.forEach((p) => ((p.itens ?? []) as { produto_id?: string | null; quantidade?: number }[]).forEach((i) => {
    if (i.produto_id) vendidos.set(i.produto_id, (vendidos.get(i.produto_id) ?? 0) + (Number(i.quantidade) || 1));
  }));
  if (!vendidos.size) return;
  const { data: comMeta, error: semColuna } = await sb.from("produtos").select("id, nome, meta_mensal, meta_avisada_mes").eq("loja_id", lojaId).in("id", [...vendidos.keys()]).not("meta_mensal", "is", null);
  if (semColuna) return;
  for (const prod of comMeta ?? []) {
    const qtd = vendidos.get(prod.id as string) ?? 0;
    if (prod.meta_avisada_mes === mes || qtd < Number(prod.meta_mensal)) continue;
    const { data: marcou } = await sb.from("produtos").update({ meta_avisada_mes: mes }).eq("id", prod.id).or(`meta_avisada_mes.is.null,meta_avisada_mes.neq.${mes}`).select("id");
    if (marcou?.length) await avisarLoja(lojaId, { titulo: `🎯 Meta batida: ${prod.nome}`, corpo: `${qtd} vendidos este mês (meta: ${prod.meta_mensal}). Arrasou! 🎉`, url: `/admin/${loja.slug}/produtos`, tag: `meta-${prod.id}-${mes}` });
  }
}

// ---------------------------------------------------------------------
// ⚠️ ESTOQUE BAIXO — depois que o pedido baixou o estoque (ao entrar em
// produção / ficar pronto / ser entregue), confere os produtos dele.
// ---------------------------------------------------------------------
export async function conferirEstoque(pedidoId: string) {
  const sb = clienteSecreto();
  const { data: pedido, error } = await sb.from("pedidos").update({ push_estoque: true })
    .eq("id", pedidoId).eq("estoque_baixado", true).eq("push_estoque", false)
    .select("loja_id, itens, lojas(slug, estoque_alerta)").maybeSingle();
  if (error || !pedido) return;
  const p = pedido as unknown as { loja_id: string; itens: { produto_id?: string | null; variacao_id?: string | null }[] | null; lojas: { slug: string; estoque_alerta: number | null } };
  const limite = p.lojas.estoque_alerta ?? 2;
  const idsProd = [...new Set((p.itens ?? []).map((i) => i.produto_id).filter(Boolean))] as string[];
  const idsVar = [...new Set((p.itens ?? []).map((i) => i.variacao_id).filter(Boolean))] as string[];
  const [prods, vars] = await Promise.all([
    idsProd.length ? sb.from("produtos").select("nome, estoque").in("id", idsProd).not("estoque", "is", null).lte("estoque", limite) : Promise.resolve({ data: [] }),
    idsVar.length ? sb.from("variacoes").select("nome, tamanho, cor, estoque, produtos(nome)").in("id", idsVar).not("estoque", "is", null).lte("estoque", limite) : Promise.resolve({ data: [] }),
  ]);
  const baixos = [
    ...((prods.data ?? []) as { nome: string; estoque: number }[]).map((x) => `${x.nome}: ${x.estoque}`),
    ...((vars.data ?? []) as unknown as { nome: string | null; tamanho: string | null; cor: string | null; estoque: number; produtos: { nome: string } | null }[])
      .map((x) => `${x.produtos?.nome ?? "Produto"} ${[x.nome, x.tamanho, x.cor].filter(Boolean).join(" ")}: ${x.estoque}`),
  ];
  if (!baixos.length) return;
  await avisarLoja(p.loja_id, { titulo: `⚠️ Estoque baixo (${baixos.length})`, corpo: baixos.slice(0, 4).join(" · ") + (baixos.length > 4 ? "…" : ""), url: `/admin/${p.lojas.slug}/produtos`, tag: `estoque-${pedidoId}` });
}
