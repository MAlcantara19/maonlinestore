// =====================================================================
// FRETE EXATO (Melhor Envio) — cota Correios, Jadlog etc. de verdade.
// Só funciona quando:
//   1) a variável MELHOR_ENVIO_TOKEN está na Vercel (token da sua conta)
//   2) a loja tem o "CEP de envio" nas Configurações
//   3) os produtos têm peso e medidas da caixa no cadastro
// Se faltar algo, devolve vazio e o site usa a estimativa por região.
// =====================================================================
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Pedido = { slug: string; cep: string; itens: { produtoId: string; quantidade: number }[] };
type Opcao = { servico: string; preco: number; prazo: number | null; logo?: string };

export async function POST(req: Request) {
  try {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) return NextResponse.json({ opcoes: [] });
    const { slug, cep, itens } = (await req.json()) as Pedido;
    const destino = String(cep ?? "").replace(/\D/g, "");
    if (destino.length !== 8 || !Array.isArray(itens) || !itens.length || itens.length > 30) return NextResponse.json({ opcoes: [] });

    const { data: loja } = await supabase.from("lojas").select("id, cep_origem, pacote_padrao").eq("slug", slug).eq("ativa", true).maybeSingle();
    const origem = String(loja?.cep_origem ?? "").replace(/\D/g, "");
    if (!loja || origem.length !== 8) return NextResponse.json({ opcoes: [] });

    const { data: produtos } = await supabase.from("produtos").select("id, preco, peso_g, altura_cm, largura_cm, comprimento_cm")
      .eq("loja_id", loja.id).in("id", itens.map((i) => i.produtoId));
    // Produto sem peso/medidas → usa a "caixa padrão" da loja (produtos leves)
    const padrao = (loja.pacote_padrao ?? null) as { peso_g?: number; altura_cm?: number; largura_cm?: number; comprimento_cm?: number } | null;
    const lista = itens.map((i) => {
      const p = (produtos ?? []).find((x) => x.id === i.produtoId);
      if (!p) return { ...i, p };
      return { ...i, p: { ...p, peso_g: p.peso_g ?? padrao?.peso_g, altura_cm: p.altura_cm ?? padrao?.altura_cm, largura_cm: p.largura_cm ?? padrao?.largura_cm, comprimento_cm: p.comprimento_cm ?? padrao?.comprimento_cm } };
    });
    if (lista.some((x) => !x.p?.peso_g || !x.p.altura_cm || !x.p.largura_cm || !x.p.comprimento_cm)) return NextResponse.json({ opcoes: [] });

    const base = process.env.MELHOR_ENVIO_SANDBOX === "1" ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
    const r = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`,
        "User-Agent": `MA Online Store (${process.env.MELHOR_ENVIO_EMAIL ?? "contato@maonlinestore.com.br"})`,
      },
      body: JSON.stringify({
        from: { postal_code: origem }, to: { postal_code: destino },
        products: lista.map((x) => ({
          id: x.produtoId, width: Number(x.p!.largura_cm), height: Number(x.p!.altura_cm), length: Number(x.p!.comprimento_cm),
          weight: Number(x.p!.peso_g) / 1000, insurance_value: Number(x.p!.preco ?? 0), quantity: Math.max(1, Math.round(x.quantidade)),
        })),
      }),
    });
    if (!r.ok) return NextResponse.json({ opcoes: [] });
    const resposta = (await r.json()) as { name: string; price?: string; custom_price?: string; delivery_time?: number; custom_delivery_time?: number; error?: string; company?: { name: string; picture?: string } }[];
    const opcoes: Opcao[] = (Array.isArray(resposta) ? resposta : [])
      .filter((o) => !o.error && (o.custom_price ?? o.price))
      .map((o) => ({ servico: `${o.company?.name ?? ""} ${o.name}`.trim(), preco: Number(o.custom_price ?? o.price), prazo: o.custom_delivery_time ?? o.delivery_time ?? null, logo: o.company?.picture }))
      .sort((a, b) => a.preco - b.preco)
      .slice(0, 4);
    return NextResponse.json({ opcoes });
  } catch {
    return NextResponse.json({ opcoes: [] });
  }
}
