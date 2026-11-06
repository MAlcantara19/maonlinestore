// =====================================================================
// PÁGINA INICIAL (endereço: /)
//   1. Topo colorido com título, subtítulo, arte de fundo e efeito
//      animado (tudo configurável no painel: Página inicial)
//   2. Um círculo para cada loja ATIVA ("Em breve" aparece apagadinha)
//   3. Faixa de parceiros (quantidade configurável)
// =====================================================================
import MenusDaHome from "@/components/MenusDaHome";
import BotaoSacola from "@/components/BotaoSacola";
import { linkWhatsApp } from "@/lib/whatsapp";
import ImagemLogo from "@/components/ImagemLogo";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ConfigSite, Loja } from "@/lib/tipos";
import { buscarConfigSite, CONFIG_PADRAO } from "@/lib/site";
import { buscarParceiros } from "@/lib/parceiros";
import Rodape from "@/components/Rodape";
import CartaoParceiro from "@/components/CartaoParceiro";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import ParallaxMouse from "@/components/ParallaxMouse";
import FundoDaPagina from "@/components/FundoDaPagina";
import BotaoTema from "@/components/BotaoTema";
import BuscaGlobal from "@/components/BuscaGlobal";
import Inclinar3D from "@/components/Inclinar3D";
import ContagemRegressiva from "@/components/ContagemRegressiva";
import ContadorAnimado from "@/components/ContadorAnimado";
import CardDoProduto from "@/components/CardDoProduto";
import { DESENVOLVEDOR } from "@/lib/config";
import type { Produto } from "@/lib/tipos";

export default function PaginaInicial() {
  return (
    // flex-col + min-h-screen: o rodapé fica sempre no fim da tela
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <BotaoSacola />
      <Suspense fallback={null}>
        <MenusLaterais />
      </Suspense>
      <Suspense fallback={<div className="h-56 animate-pulse bg-black/10" />}>
        <Topo />
      </Suspense>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Suspense fallback={<p className="text-sm opacity-70">Carregando lojas...</p>}>
          <ListaDeLojas />
        </Suspense>
        <Suspense fallback={null}>
          <FaixaEspecial />
        </Suspense>
        <Suspense fallback={null}>
          <VitrineDoDia />
        </Suspense>
        <Suspense fallback={null}>
          <FaixaDeMarcas />
        </Suspense>
        <Suspense fallback={null}>
          <FaixaDeParceiros />
        </Suspense>
        <Suspense fallback={null}>
          <Numeros />
        </Suspense>
      </main>
      <Rodape />
    </div>
  );
}

// ---------------------------------------------------------------------
// Topo: degradê nas cores do site + bolhas de arte + imagem (opcional)
// + efeito animado. Tudo vem da tabela "site_config".
// ---------------------------------------------------------------------
async function Topo() {
  await connection();
  const c: ConfigSite = await buscarConfigSite().catch(() => CONFIG_PADRAO);
  const { data: lojasBusca } = await supabase.from("lojas").select("slug, nome, cor").eq("ativa", true).eq("em_breve", false);
  const cor = c.cor ?? "#3B1260";
  const cor2 = c.cor_secundaria ?? cor;
  const bolhas =
    "radial-gradient(circle at 10% 30%, rgb(255 255 255 / 0.18) 0 70px, transparent 71px)," +
    "radial-gradient(circle at 90% 15%, rgb(255 255 255 / 0.14) 0 110px, transparent 111px)," +
    "radial-gradient(circle at 70% 120%, rgb(255 255 255 / 0.12) 0 150px, transparent 151px)";

  return (
    <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}>
      {c.banner_url && <img src={c.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      {/* Bolhas: parallax ao rolar + se mexem com o mouse / giro do celular */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="parallax-fundo absolute inset-0">
          <ParallaxMouse forca={30} className="absolute -inset-12"><div className="absolute inset-0" style={{ backgroundImage: bolhas }} /></ParallaxMouse>
        </div>
      </div>
      {/* Modo claro / escuro */}
      <BotaoTema className="clicavel absolute right-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1.5 text-lg hover:bg-white/25" />
      {/* Fundo da página inteira (foto, logo repetida ou vídeo) */}
      <FundoDaPagina tipo={c.fundo_tipo} url={c.fundo_url} logo={c.logo_url} opacidade={c.fundo_opacidade} animacao={c.fundo_animacao}
        corMosaico={c.fundo_cor} borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }} />
      <div className="parallax-conteudo relative mx-auto max-w-5xl px-4 py-14 text-center">
        {/* Logo redonda da MA Online Store AO LADO do título (no celular fica em cima) */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {c.logo_url && (
            <span className="animar-entrada block h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white shadow-2xl sm:h-32 sm:w-32"
              style={{ border: `${c.logo_borda ?? 3}px solid ${c.logo_borda_cor ?? "#ffffff"}` }}>
              <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
            </span>
          )}
          <h1 className="animar-entrada text-4xl font-bold drop-shadow sm:text-5xl">{c.titulo}</h1>
        </div>
        {c.subtitulo && (
          <p className="animar-entrada mt-3 text-lg opacity-90" style={{ animationDelay: "120ms" }}>{c.subtitulo}</p>
        )}
        <BuscaGlobal lojas={((lojasBusca ?? []) as Loja[]).map((l) => ({ slug: l.slug, nome: l.nome, cor: l.cor }))} />
        <Link href="/parceiros" className="animar-entrada clicavel mt-6 inline-block rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25"
          style={{ animationDelay: "240ms" }}>
          🤝 Conheça nossos parceiros
        </Link>
      </div>
      {c.efeito !== "nenhum" && <EfeitoFestivo tipo={c.efeito} cor={cor} logo={c.logo_url} borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }} />}
    </header>
  );
}

// ---------------------------------------------------------------------
// Busca as lojas no banco e desenha os círculos.
// ---------------------------------------------------------------------
async function ListaDeLojas() {
  await connection(); // dados novos a cada visita
  const { data: lojas, error } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, em_breve, whatsapp, lancamento_em")
    .eq("ativa", true)
    .order("ordem");

  if (error) return <p className="text-red-600">Erro ao carregar as lojas: {error.message}</p>;
  if (!lojas || lojas.length === 0) return <p>Nenhuma loja cadastrada ainda.</p>;

  return (
    <section>
      <h2 className="mb-4 text-center text-2xl font-bold">Nossas lojas</h2>
      {/* Celular: 2 colunas · tablet (sm): 3 · computador (lg): 5 */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {(lojas as Loja[]).map((loja, i) => {
          const circulo = (
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white text-3xl font-bold shadow-md"
              style={{ borderColor: loja.cor ?? "#999", color: loja.cor ?? "#333" }}>
              {loja.logo_url ? <ImagemLogo src={loja.logo_url} alt={loja.nome} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
            </div>
          );
          const atraso = { animationDelay: `${i * 70}ms` };

          // Loja "em breve": apagadinha, com selo, sem abrir
          if (loja.em_breve) {
            return (
              <div key={loja.id} className="animar-entrada relative cursor-default p-2 text-center" style={atraso} title="Em breve">
                {circulo}
                <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-white">Em breve</span>
                <b className="mt-2 block">{loja.nome}</b>
                <span className="block text-xs opacity-70">{loja.descricao}</span>
                {loja.lancamento_em && <ContagemRegressiva ate={loja.lancamento_em} cor={loja.cor ?? "#333"} />}
                {/* "Me avise": abre o WhatsApp da loja (ou o seu) pedindo para ser avisado */}
                <a href={linkWhatsApp((loja.whatsapp ?? DESENVOLVEDOR.whatsapp).replace(/\D/g, ""), `Oi! Quero ser avisado(a) quando a ${loja.nome} lançar 😊`)}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-semibold shadow backdrop-blur" style={{ color: loja.cor ?? "#333" }}>
                  🔔 Me avise
                </a>
              </div>
            );
          }

          return (
            <div key={loja.id} className="animar-entrada" style={atraso}>
              <Inclinar3D graus={10}>
              <Link href={`/${loja.slug}`} className="clicavel block rounded-xl p-2 text-center">
                {circulo}
                <b className="mt-2 block">{loja.nome}</b>
                <span className="block text-xs opacity-70">{loja.descricao}</span>
              </Link>
              </Inclinar3D>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Faixa "Parceiros": quantidade definida no painel (0 = todos).
// ---------------------------------------------------------------------
async function FaixaDeParceiros() {
  await connection();
  const config = await buscarConfigSite().catch(() => CONFIG_PADRAO);
  const parceiros = await buscarParceiros(config.parceiros_na_home);
  if (parceiros.length === 0) return null;
  return (
    <section className="mt-14">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">🤝 Parceiros</h2>
          <p className="text-sm opacity-70">Gente e lugares que a gente conhece, confia e indica.</p>
        </div>
        <Link href="/parceiros" className="shrink-0 text-sm font-semibold underline">Ver todos →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parceiros.map((p, i) => <CartaoParceiro key={p.id} parceiro={p} indice={i} />)}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Faixa infinita: logos/nomes das lojas e dos parceiros passando sem
// parar (para ao passar o mouse). A lista é repetida 2x para não ter "pulo".
// ---------------------------------------------------------------------
async function FaixaDeMarcas() {
  await connection();
  const [{ data: lojas }, parceiros] = await Promise.all([
    supabase.from("lojas").select("slug, nome, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, em_breve").eq("ativa", true).order("ordem"),
    buscarParceiros(),
  ]);
  const itens = [
    ...((lojas ?? []) as Loja[]).filter((l) => !l.em_breve).map((l) => ({ chave: `l-${l.slug}`, href: `/${l.slug}`, nome: l.nome, cor: l.cor, img: l.logo_url, l })),
    ...parceiros.map((p) => ({ chave: `p-${p.slug}`, href: `/parceiros/${p.slug}`, nome: p.nome, cor: p.cor, img: p.logo_url, l: null })),
  ];
  if (itens.length < 3) return null;
  const lista = [...itens, ...itens];

  return (
    <section className="mt-12 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]" aria-label="Lojas e parceiros">
      <div className="faixa-infinita flex w-max gap-4">
        {lista.map((i, n) => (
          <Link key={`${i.chave}-${n}`} href={i.href} aria-hidden={n >= itens.length} tabIndex={n >= itens.length ? -1 : undefined}
            className="clicavel flex shrink-0 items-center gap-2 rounded-full border bg-white/70 py-1.5 pl-1.5 pr-4 text-sm font-semibold shadow-sm"
            style={{ borderColor: `${i.cor ?? "#999"}55`, color: i.cor ?? "#333" }}>
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white font-bold" style={{ color: i.cor ?? "#333" }}>
              {i.img ? (i.l ? <ImagemLogo src={i.img} ajuste={i.l.logo_ajuste} zoom={i.l.logo_zoom} fundo={i.l.logo_fundo} /> : <img src={i.img} alt="" className="h-full w-full object-cover" />) : i.nome.charAt(0)}
            </span>
            {i.nome}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// VITRINE DO DIA: os produtos em DESTAQUE de todas as lojas, numa fileira
// que desliza para o lado. Quem entrou por uma loja descobre as outras.
// ---------------------------------------------------------------------
async function VitrineDoDia() {
  await connection();
  const { data } = await supabase.from("produtos")
    .select("id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor), lojas!inner(slug, nome, cor, ativa, em_breve, ordem)")
    .eq("destaque", true).eq("ativo", true).eq("lojas.ativa", true).eq("lojas.em_breve", false).limit(80);
  type ItemVitrine = Produto & { lojas: { slug: string; nome: string; cor: string | null; ordem: number | null } };
  const todos = (data ?? []) as unknown as ItemVitrine[];
  if (todos.length === 0) return null;

  // Separa por loja (na ordem das lojas) e "gira" a lista de cada uma conforme o dia:
  // cada dia a vitrine começa por um produto diferente de cada loja.
  const dia = Math.floor(Date.now() / 86400000);
  const porLoja = new Map<string, ItemVitrine[]>();
  [...todos].sort((a, b) => (a.lojas.ordem ?? 0) - (b.lojas.ordem ?? 0) || a.id.localeCompare(b.id))
    .forEach((p) => porLoja.set(p.lojas.slug, [...(porLoja.get(p.lojas.slug) ?? []), p]));
  const filas = [...porLoja.values()].map((lista) => { const k = dia % lista.length; return [...lista.slice(k), ...lista.slice(0, k)]; });

  // Alterna: 1 de cada loja, na ordem (VitraForma, Gallerie, VitraForma, Gallerie...)
  const produtos: ItemVitrine[] = [];
  for (let rodada = 0; produtos.length < 16 && filas.some((f) => f.length > rodada); rodada++) {
    filas.forEach((f) => { if (f[rodada] && produtos.length < 16) produtos.push(f[rodada]); });
  }
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold">🌟 Vitrine do dia</h2>
      <p className="text-sm opacity-70">Os queridinhos de cada loja</p>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-3">
        {produtos.map((p, i) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <span className="mb-1 block truncate text-xs font-bold" style={{ color: p.lojas.cor ?? "#333" }}>{p.lojas.nome}</span>
            <CardDoProduto produto={p} cor={p.lojas.cor ?? "#333"} slug={p.lojas.slug} indice={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// NÚMEROS: contam até o valor quando aparecem na tela
// ---------------------------------------------------------------------
async function Numeros() {
  await connection();
  const { data } = await supabase.rpc("estatisticas_publicas");
  const n = (data as { lojas: number; parceiros: number; produtos: number; pedidos: number }[] | null)?.[0];
  if (!n) return null;
  const itens = [
    { valor: Number(n.lojas), rotulo: "lojas", icone: "🏬" },
    { valor: Number(n.produtos), rotulo: "produtos", icone: "📦" },
    { valor: Number(n.parceiros), rotulo: "parceiros", icone: "🤝" },
    { valor: Number(n.pedidos), rotulo: "pedidos pelo WhatsApp", icone: "💬" },
  ].filter((i) => i.valor > 0);
  if (itens.length === 0) return null;
  return (
    <section className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {itens.map((i) => (
        <div key={i.rotulo} className="rounded-2xl border bg-white/70 p-4 text-center shadow-sm">
          <span className="text-2xl">{i.icone}</span>
          <b className="block text-3xl"><ContadorAnimado valor={i.valor} /></b>
          <span className="text-xs opacity-70">{i.rotulo}</span>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------
// FAIXA ESPECIAL (Natal, Páscoa, Dia das Mães...): junta os produtos das
// coleções de TODAS as lojas cujo nome tem a palavra escolhida no painel,
// alternando uma loja de cada vez. Liga/desliga em Painel → Página inicial.
// ---------------------------------------------------------------------
async function FaixaEspecial() {
  await connection();
  const c = await buscarConfigSite().catch(() => CONFIG_PADRAO);
  const termo = c.especial_termo?.trim();
  if (!c.especial_ativo || !termo) return null;
  const { data: cols } = await supabase.from("colecoes")
    .select("id, produtos_colecoes(produto_id), lojas!inner(slug, ativa, em_breve)")
    .ilike("nome", `%${termo}%`).eq("ativa", true).eq("lojas.ativa", true).eq("lojas.em_breve", false);
  const ids = [...new Set(((cols ?? []) as unknown as { produtos_colecoes: { produto_id: string }[] }[]).flatMap((x) => x.produtos_colecoes.map((p) => p.produto_id)))];
  if (!ids.length) return null;
  const { data } = await supabase.from("produtos")
    .select("id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor), lojas!inner(slug, nome, cor, ordem)")
    .in("id", ids.slice(0, 200)).eq("ativo", true);
  type Item = Produto & { lojas: { slug: string; nome: string; cor: string | null; ordem: number | null } };
  const porLoja = new Map<string, Item[]>();
  ((data ?? []) as unknown as Item[]).sort((a, b) => (a.lojas.ordem ?? 0) - (b.lojas.ordem ?? 0) || (a.ordem ?? 0) - (b.ordem ?? 0))
    .forEach((p) => porLoja.set(p.lojas.slug, [...(porLoja.get(p.lojas.slug) ?? []), p]));
  const filas = [...porLoja.values()];
  const produtos: Item[] = [];
  for (let r = 0; produtos.length < 20 && filas.some((f) => f.length > r); r++) filas.forEach((f) => { if (f[r] && produtos.length < 20) produtos.push(f[r]); });
  if (!produtos.length) return null;
  const cor = c.cor ?? "#3B1260";
  return (
    <section className="relative mt-14 overflow-hidden rounded-3xl p-5 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${cor}, ${c.cor_secundaria ?? cor})` }}>
      <h2 className="text-2xl font-bold drop-shadow">{c.especial_titulo || termo}</h2>
      <p className="text-sm opacity-90">Os produtos da época em todas as lojas</p>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-3 text-stone-900">
        {produtos.map((p, i) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <span className="mb-1 block truncate text-xs font-bold text-white">{p.lojas.nome}</span>
            <CardDoProduto produto={p} cor={p.lojas.cor ?? "#333"} slug={p.lojas.slug} indice={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// MENUS LATERAIS: lojas (esquerda) e parceiros (direita)
// ---------------------------------------------------------------------
async function MenusLaterais() {
  await connection();
  const [{ data: lojas }, parceiros] = await Promise.all([
    supabase.from("lojas").select("id, slug, nome, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, em_breve, descricao").eq("ativa", true).order("ordem"),
    buscarParceiros().catch(() => []),
  ]);
  return <MenusDaHome lojas={lojas ?? []} parceiros={parceiros} />;
}
