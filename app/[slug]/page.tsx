// =====================================================================
// PÁGINA DE UMA LOJA (endereço: /vitraforma, /gallerie, /chocolate...)
// A pasta se chama [slug] porque o nome entre colchetes é "variável":
// a mesma página serve para TODAS as lojas, e o slug do endereço diz qual.
//
// Ordem da página:
//   1. Cabeçalho com nome e cor da loja
//   2. "Como funciona o pedido" (aviso_pedido)
//   3. Coleções em destaque (ex.: Natal)
//   4. Destaques (produtos marcados como destaque)
//   5. Produtos separados por categoria
// Tudo vem do banco: não precisa mexer aqui para cadastrar produto.
// =====================================================================
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Categoria, Colecao, Loja, Produto } from "@/lib/tipos";

// Next.js entrega o slug do endereço dentro de "params".
type Props = { params: Promise<{ slug: string }> };

export default function PaginaDaLoja({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando loja...</p>}>
      <ConteudoDaLoja params={params} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------
// Busca tudo da loja no banco e monta a página.
// ---------------------------------------------------------------------
async function ConteudoDaLoja({ params }: Props) {
  await connection(); // dados sempre atualizados a cada visita
  const { slug } = await params;

  // 1) A loja pelo slug. Se não existir ou estiver desativada: página 404.
  const { data: loja } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, whatsapp, aviso_pedido")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle<Loja>();
  if (!loja) notFound();

  // 2) Categorias, produtos (com variações e mídias) e coleções, ao mesmo tempo.
  const [catRes, prodRes, colRes] = await Promise.all([
    supabase.from("categorias").select("id, nome, descricao, parent_id, ordem").eq("loja_id", loja.id).order("ordem"),
    supabase
      .from("produtos")
      .select(
        "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, categoria_id, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)"
      )
      .eq("loja_id", loja.id)
      .eq("ativo", true)
      .order("criado_em", { ascending: false }),
    supabase
      .from("colecoes")
      .select("id, nome, descricao, em_destaque, produtos_colecoes(produto_id)")
      .eq("loja_id", loja.id)
      .eq("ativa", true)
      .order("ordem"),
  ]);

  const categorias = (catRes.data ?? []) as Categoria[];
  const produtos = (prodRes.data ?? []) as Produto[];
  const colecoes = (colRes.data ?? []) as Colecao[];
  const cor = loja.cor ?? "#333";

  // Ajudante: pega os produtos de uma lista de ids.
  const porIds = (ids: string[]) => produtos.filter((p) => ids.includes(p.id));

  // Categorias principais (sem "pai") e suas subcategorias.
  const principais = categorias.filter((c) => !c.parent_id);
  const subsDe = (id: string) => categorias.filter((c) => c.parent_id === id);

  // Produtos de uma categoria INCLUINDO os das subcategorias dela.
  const produtosDaCategoria = (cat: Categoria) => {
    const ids = [cat.id, ...subsDe(cat.id).map((s) => s.id)];
    return produtos.filter((p) => p.categoria_id && ids.includes(p.categoria_id));
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {/* 1) Cabeçalho */}
      <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
      <h1 className="mt-2 text-3xl font-bold" style={{ color: cor }}>{loja.nome}</h1>
      {loja.descricao && <p className="text-sm opacity-70">{loja.descricao}</p>}

      {/* 2) Como funciona o pedido (resumo no topo; no carrinho vai aparecer de novo) */}
      {loja.aviso_pedido && (
        <div className="mt-4 whitespace-pre-line rounded-xl border p-4 text-sm" style={{ borderColor: cor }}>
          <b className="mb-1 block">Como funciona o pedido</b>
          {loja.aviso_pedido}
        </div>
      )}

      {produtos.length === 0 && <p className="mt-8 opacity-70">Nenhum produto cadastrado ainda.</p>}

      {/* 3) Coleções em destaque */}
      {colecoes
        .filter((c) => c.em_destaque)
        .map((c) => (
          <Secao key={c.id} titulo={`✨ ${c.nome}`} descricao={c.descricao} cor={cor}
            produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
        ))}

      {/* 4) Produtos marcados como destaque */}
      <Secao titulo="Destaques" cor={cor} produtos={produtos.filter((p) => p.destaque)} />

      {/* 5) Uma seção por categoria (já inclui as subcategorias) */}
      {principais.map((cat) => (
        <Secao key={cat.id} titulo={cat.nome} descricao={cat.descricao} cor={cor}
          subcategorias={subsDe(cat.id).map((s) => s.nome)} produtos={produtosDaCategoria(cat)} />
      ))}

      {/* Coleções que não estão em destaque (ex.: Dia das Crianças, Santos) */}
      {colecoes
        .filter((c) => !c.em_destaque)
        .map((c) => (
          <Secao key={c.id} titulo={`Coleção ${c.nome}`} descricao={c.descricao} cor={cor}
            produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
        ))}
    </main>
  );
}

// ---------------------------------------------------------------------
// Uma seção da página: título + grade de produtos. Se não houver produto, some.
// ---------------------------------------------------------------------
function Secao(props: {
  titulo: string;
  descricao?: string | null;
  subcategorias?: string[];
  cor: string;
  produtos: Produto[];
}) {
  if (props.produtos.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold">{props.titulo}</h2>
      {props.descricao && <p className="text-sm opacity-70">{props.descricao}</p>}
      {props.subcategorias && props.subcategorias.length > 0 && (
        <p className="mt-1 text-xs opacity-60">{props.subcategorias.join(" · ")}</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {props.produtos.map((p) => (
          <CardDoProduto key={p.id} produto={p} cor={props.cor} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Cartão de um produto: foto, nome, preço "a partir de" e situação.
// ---------------------------------------------------------------------
function CardDoProduto({ produto, cor }: { produto: Produto; cor: string }) {
  // Primeira foto, pela ordem definida no cadastro.
  const foto = [...produto.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0];

  // Menor preço entre as variações ativas; se não houver, usa o preço do produto.
  const precos = produto.variacoes.filter((v) => v.ativa && v.preco != null).map((v) => Number(v.preco));
  const menor = precos.length ? Math.min(...precos) : produto.preco;

  return (
    <div className="rounded-xl border p-2" style={{ borderColor: "#0001" }}>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg text-xs opacity-80"
        style={{ background: `${cor}22` }}>
        {foto ? <img src={foto.url} alt={produto.nome} className="h-full w-full object-cover" /> : "sem foto"}
      </div>
      <b className="mt-2 block text-sm">{produto.nome}</b>
      <span className="block text-sm" style={{ color: cor }}>
        {menor != null ? `${precos.length > 1 ? "a partir de " : ""}${formatarPreco(menor)}` : "Sob consulta"}
      </span>
      <span className="block text-xs opacity-60">{textoDisponibilidade(produto.disponibilidade)}</span>
    </div>
  );
}

// Formata número como dinheiro brasileiro: 25 -> "R$ 25,00".
function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Traduz o código do banco para o texto que o cliente vê.
function textoDisponibilidade(d: Produto["disponibilidade"]) {
  if (d === "sob_encomenda") return "Sob encomenda";
  if (d === "esgotado") return "Esgotado";
  return "Pronta entrega";
}