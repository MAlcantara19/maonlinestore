// =====================================================================
// 🤖 ASSISTENTE DE IA DO PAINEL — roda NO SERVIDOR (a chave da IA nunca
// vai para o navegador).
//   POST { slug, tipo, entrada }  (com o login de quem pediu)
//   tipo: "descricao" | "legenda" | "resposta" | "nomes" | "livre"
// Confere se a pessoa cuida da loja e tem um limite por hora (para a
// conta da IA não subir sem querer).
// Precisa de ANTHROPIC_API_KEY no .env.local e na Vercel.
// =====================================================================
import { NextResponse } from "next/server";
import { clienteSecreto } from "@/lib/push";

const LIMITE_POR_HORA = 40;
const MODELO = process.env.IA_MODELO || "claude-haiku-5-5";

const PEDIDOS: Record<string, (e: Record<string, string>) => string> = {
  descricao: (e) => `Escreva a DESCRIÇÃO para a página do produto "${e.nome}".
Informações que tenho: ${e.detalhes || "(nenhuma além do nome)"}
${e.atual ? `Descrição atual (pode melhorar): ${e.atual}` : ""}
Formato: 1 parágrafo curto e encantador (2 a 3 frases) + uma lista de 3 a 5 detalhes começando com "• ". Sem título, sem markdown, sem hashtags.`,
  legenda: (e) => `Escreva uma LEGENDA para post no Instagram do produto/tema "${e.nome}".
Informações: ${e.detalhes || "(nenhuma)"}
Formato: gancho na 1ª linha, 2 a 4 linhas curtas com emojis na medida, chamada para pedir pelo WhatsApp (link na bio) e no fim 8 a 12 hashtags em português relevantes. Sem markdown.`,
  resposta: (e) => `Um cliente mandou esta mensagem no WhatsApp:
"""${e.mensagem}"""
${e.detalhes ? `O que eu quero responder / informações: ${e.detalhes}` : ""}
Escreva a RESPOSTA, pronta para copiar e colar: simpática, curta, natural de WhatsApp, sem markdown. Se faltar informação (preço, prazo), deixe [entre colchetes] para eu preencher.`,
  nomes: (e) => `Sugira 10 NOMES criativos e vendáveis para: ${e.detalhes || e.nome}. Um por linha, numerados, com no máximo 5 palavras cada. Sem explicações.`,
  livre: (e) => e.detalhes || "",
};

export async function POST(req: Request) {
  try {
    const chave = process.env.ANTHROPIC_API_KEY;
    if (!chave) return NextResponse.json({ erro: "O assistente ainda não foi ligado: falta a ANTHROPIC_API_KEY na Vercel (veja o LEIA-ME da atualização)." }, { status: 500 });
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ erro: "Entre no painel primeiro." }, { status: 401 });
    const sb = clienteSecreto();
    const { data: quem } = await sb.auth.getUser(token);
    if (!quem.user) return NextResponse.json({ erro: "Entre no painel primeiro." }, { status: 401 });

    const corpo = (await req.json()) as { slug?: string; tipo?: string; entrada?: Record<string, string> };
    const tipo = corpo.tipo && PEDIDOS[corpo.tipo] ? corpo.tipo : "livre";
    const entrada = Object.fromEntries(Object.entries(corpo.entrada ?? {}).map(([k, v]) => [k, String(v ?? "").slice(0, 2500)]));
    const { data: loja } = await sb.from("lojas").select("id, nome, descricao, sobre, instagram").eq("slug", corpo.slug ?? "").maybeSingle();
    if (!loja) return NextResponse.json({ erro: "Loja não encontrada." }, { status: 404 });

    // Só quem cuida da loja (ou o master)
    const [{ data: dono }, { data: master }] = await Promise.all([
      sb.from("loja_admins").select("user_id").eq("user_id", quem.user.id).eq("loja_id", loja.id).maybeSingle(),
      sb.from("master_admins").select("user_id").eq("user_id", quem.user.id).maybeSingle(),
    ]);
    if (!dono && !master) return NextResponse.json({ erro: "Você não cuida desta loja." }, { status: 403 });

    // Limite por hora
    const umaHora = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await sb.from("ia_uso").select("id", { count: "exact", head: true }).eq("user_id", quem.user.id).gt("criado_em", umaHora);
    if ((count ?? 0) >= LIMITE_POR_HORA) return NextResponse.json({ erro: `Limite de ${LIMITE_POR_HORA} pedidos por hora atingido. Tente daqui a pouco 😉` }, { status: 429 });

    const pedido = PEDIDOS[tipo](entrada).trim();
    if (!pedido) return NextResponse.json({ erro: "Escreva o que você precisa." }, { status: 400 });

    const sistema = `Você é o assistente de vendas e redação da loja "${loja.nome}"${loja.descricao ? ` (${loja.descricao})` : ""}, que vende pelo site MA Online Store e fecha os pedidos pelo WhatsApp.
${loja.sobre ? `Sobre a loja: ${String(loja.sobre).slice(0, 800)}` : ""}
Regras: escreva sempre em português do Brasil, tom acolhedor, próximo e profissional (pequeno negócio artesanal). Nunca invente preço, prazo, material ou medida que não foi informado. Respostas curtas e prontas para usar. Não use markdown (nada de **, # ou tabelas).`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 900, system: sistema, messages: [{ role: "user", content: pedido }] }),
    });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ erro: `A IA não respondeu (${j?.error?.message ?? r.status}).` }, { status: 502 });
    const texto = ((j.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();

    await sb.from("ia_uso").insert({ user_id: quem.user.id, loja_id: loja.id, tipo });
    return NextResponse.json({ texto });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
