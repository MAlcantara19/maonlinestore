"use client";
// =====================================================================
// PAINEL — CRIAR / EDITAR PRODUTO (endereço: /admin/vitraforma/produtos/<id>)
// "/novo" abre vazio (com o prazo padrão da loja). Tudo numa tela só:
//   📷 fotos e vídeos (com a cor de cada foto)
//   📝 informações · 💰 preço e situação
//   🗂️ categorias (VÁRIAS) e coleções
//   📏 variações: Unidade ou Kit · opção/modelo · tamanho · cor · preço ·
//      situação · prazo · texto da opção. Com gerador "várias cores de uma vez".
// Ao salvar um produto NOVO, a tela limpa para cadastrar o próximo.
// =====================================================================
import { TAMANHOS } from "@/lib/tamanhos";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco, Campo, Interruptor, BarraSalvar, estiloInput, type Mensagem } from "@/components/admin/Campos";
import ListaSugestoes from "@/components/admin/ListaSugestoes";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, paraNumero, type LojaResumo } from "@/lib/admin";
import { enviarArquivo } from "@/lib/upload";
import { SUGESTOES_COR, SUGESTOES_PRAZO, SUGESTOES_SELO, SUGESTOES_TAMANHO, comMaiuscula, emOrdem, prazoComDias, tamanhoComUnidade } from "@/lib/opcoes";
import { VALOR_COR_A_ESCOLHER } from "@/components/EscolhaDoProduto";
import type { Categoria, Disponibilidade } from "@/lib/tipos";

// Formatos usados só nesta tela (preço como texto para digitar "25,90")
type Dados = {
  nome: string; descricao: string; restricoes: string; preco: string; disponibilidade: Disponibilidade;
  prazo: string; selo: string; destaque: boolean; ativo: boolean;
  promocao_pct: string; promocao_ate: string; giro_360: boolean; // promoção (%) até a data · fotos em 360°
  estoque: string; // vazio = não controla
};
type LinhaVariacao = {
  id?: string; tipo: "unidade" | "kit"; nome: string; descricao: string; tamanho: string; cor: string;
  preco: string; disponibilidade: Disponibilidade | ""; prazo: string; ativa: boolean; estoque: string;
};
type LinhaMidia = { id?: string; tipo: "foto" | "video"; url: string; cor?: string | null };
type ColecaoSimples = { id: string; nome: string };

const SITUACOES: { valor: Disponibilidade; rotulo: string }[] = [
  { valor: "pronta_entrega", rotulo: "Pronta entrega" },
  { valor: "sob_encomenda", rotulo: "Sob encomenda" },
  { valor: "esgotado", rotulo: "Esgotado" },
];
const vazio = (prazo: string): Dados => ({ nome: "", descricao: "", restricoes: "", preco: "", disponibilidade: "pronta_entrega", prazo, selo: "", destaque: false, ativo: true, promocao_pct: "", promocao_ate: "", giro_360: false, estoque: "" });
const variacaoVazia = (preco: string): LinhaVariacao => ({ tipo: "unidade", nome: "", descricao: "", tamanho: "", cor: "", preco, disponibilidade: "", prazo: "", ativa: true, estoque: "" });
const precoTexto = (v: unknown) => (v != null ? String(v).replace(".", ",") : "");

export default function PainelProduto() {
  return <AreaAdmin>{() => <Formulario />}</AreaAdmin>;
}

function Formulario() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const novo = id === "novo";

  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [dados, setDados] = useState<Dados>(vazio(""));
  const [variacoes, setVariacoes] = useState<LinhaVariacao[]>([]);
  const [midias, setMidias] = useState<LinhaMidia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colecoes, setColecoes] = useState<ColecaoSimples[]>([]);
  const [catsMarcadas, setCatsMarcadas] = useState<string[]>([]); // categorias do produto (várias)
  const [marcadas, setMarcadas] = useState<string[]>([]); // coleções do produto
  const [usados, setUsados] = useState<{ tamanhos: string[]; cores: string[] }>({ tamanhos: [], cores: [] });
  const originais = useRef<{ variacoes: string[]; midias: string[] }>({ variacoes: [], midias: [] });
  const [carregado, setCarregado] = useState(false);
  const [autoria, setAutoria] = useState<{ criado_por?: string; criado_em?: string; atualizado_por?: string; atualizado_em?: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(0);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [gerador, setGerador] = useState<{ aberto: boolean; base: LinhaVariacao; cores: string[]; aEscolher: boolean }>({ aberto: false, base: variacaoVazia(""), cores: [], aEscolher: false });
  const entradaArquivos = useRef<HTMLInputElement>(null);

  // Carrega loja, categorias, coleções, cores/tamanhos e (se for edição) o produto
  useEffect(() => {
    (async () => {
      const supabase = supabaseNavegador();
      const l = await lojaPeloSlug(slug);
      setLoja(l);
      if (!l) return;
      const [cat, col, ops] = await Promise.all([
        supabase.from("categorias").select("id, nome, descricao, parent_id, ordem").eq("loja_id", l.id).order("nome"),
        supabase.from("colecoes").select("id, nome").eq("loja_id", l.id).order("ordem"),
        supabase.from("opcoes_loja").select("tipo, valor").eq("loja_id", l.id),
      ]);
      setCategorias((cat.data ?? []) as Categoria[]);
      setColecoes((col.data ?? []) as ColecaoSimples[]);
      const lista = (ops.data ?? []) as { tipo: string; valor: string }[];
      setUsados({ tamanhos: lista.filter((o) => o.tipo === "tamanho").map((o) => o.valor), cores: emOrdem(lista.filter((o) => o.tipo === "cor").map((o) => o.valor)) });

      if (novo) {
        setDados(vazio(l.prazo_padrao ?? "10 dias")); // prazo padrão da loja já preenchido
      } else {
        const { data: p } = await supabase.from("produtos")
          .select("*, variacoes(*), midias(*), produtos_colecoes(colecao_id), produtos_categorias(categoria_id)").eq("id", id).maybeSingle();
        if (p) {
          setDados({
            nome: p.nome, descricao: p.descricao ?? "", restricoes: p.restricoes ?? "", preco: precoTexto(p.preco),
            disponibilidade: p.disponibilidade, prazo: p.prazo ?? "", selo: p.selo ?? "", destaque: p.destaque, ativo: p.ativo,
            promocao_pct: p.promocao_pct ? String(p.promocao_pct) : "", promocao_ate: p.promocao_ate ? String(p.promocao_ate).slice(0, 10) : "", giro_360: !!p.giro_360,
            estoque: p.estoque != null ? String(p.estoque) : "",
          });
          const vs = [...p.variacoes].sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem);
          setVariacoes(vs.map((v: Record<string, unknown>) => ({
            id: v.id as string, tipo: (v.tipo as "unidade" | "kit") ?? "unidade", nome: (v.nome as string) ?? "", descricao: (v.descricao as string) ?? "",
            tamanho: (v.tamanho as string) ?? "", cor: (v.cor as string) ?? "", preco: precoTexto(v.preco),
            disponibilidade: (v.disponibilidade as Disponibilidade) ?? "", prazo: (v.prazo as string) ?? "", ativa: v.ativa as boolean,
            estoque: v.estoque != null ? String(v.estoque) : "",
          })));
          const ms = [...p.midias].sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem);
          setMidias(ms.map((m: { id: string; tipo: "foto" | "video"; url: string; cor: string | null }) => ({ id: m.id, tipo: m.tipo, url: m.url, cor: m.cor })));
          setMarcadas(p.produtos_colecoes.map((pc: { colecao_id: string }) => pc.colecao_id));
          const cats = (p.produtos_categorias as { categoria_id: string }[]).map((x) => x.categoria_id);
          setCatsMarcadas([...new Set([...cats, ...(p.categoria_id ? [p.categoria_id] : [])])]);
          setAutoria({ criado_por: p.criado_por, criado_em: p.criado_em, atualizado_por: p.atualizado_por, atualizado_em: p.atualizado_em });
          originais.current = { variacoes: vs.map((v: { id: string }) => v.id), midias: ms.map((m: { id: string }) => m.id) };
        }
      }
      setCarregado(true);
    })();
  }, [slug, id, novo]);

  if (!loja || !carregado) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const mudar = <K extends keyof Dados>(campo: K, valor: Dados[K]) => { setDados({ ...dados, [campo]: valor }); setMensagem(null); };
  const alternar = (lista: string[], valor: string) => (lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]);

  // ---- Variações ----
  const mudarVariacao = (i: number, campo: keyof LinhaVariacao, valor: string | boolean) =>
    setVariacoes(variacoes.map((v, j) => (j === i ? { ...v, [campo]: valor } : v)));
  const novaVariacao = (tipo: "unidade" | "kit" = "unidade") => setVariacoes([...variacoes, { ...variacaoVazia(dados.preco), tipo }]);

  // Gerador: cria uma variação para CADA cor marcada (e/ou "a escolher")
  function gerarVariacoes() {
    const coresEscolhidas = [...gerador.cores, ...(gerador.aEscolher ? [VALOR_COR_A_ESCOLHER] : [])];
    if (!coresEscolhidas.length) return setMensagem({ tipo: "erro", texto: "Marque pelo menos uma cor (ou \"Cor a escolher\")." });
    setVariacoes([...variacoes, ...coresEscolhidas.map((c) => ({ ...gerador.base, cor: c }))]);
    setGerador({ aberto: false, base: variacaoVazia(dados.preco), cores: [], aEscolher: false });
    setMensagem({ tipo: "ok", texto: `✓ ${coresEscolhidas.length} variações criadas. Confira e salve.` });
  }

  // ---- Fotos e vídeos ----
  async function adicionarArquivos(lista: FileList | null) {
    if (!lista || !loja) return;
    const arquivos = Array.from(lista);
    setEnviando((n) => n + arquivos.length);
    for (const arquivo of arquivos) {
      try {
        const enviado = await enviarArquivo(arquivo, loja.slug);
        setMidias((atual) => [...atual, enviado]);
      } catch (e) {
        setMensagem({ tipo: "erro", texto: (e as Error).message });
      }
      setEnviando((n) => n - 1);
    }
    if (entradaArquivos.current) entradaArquivos.current.value = "";
  }
  const moverMidia = (i: number, direcao: -1 | 1) => {
    const j = i + direcao;
    if (j < 0 || j >= midias.length) return;
    const nova = [...midias];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setMidias(nova);
  };

  // ---- Salvar tudo ----
  async function salvar() {
    if (!loja) return;
    if (!dados.nome.trim()) return setMensagem({ tipo: "erro", texto: "Coloque pelo menos o nome do produto." });
    if (enviando > 0) return setMensagem({ tipo: "erro", texto: "Espere as fotos terminarem de enviar." });
    setSalvando(true);
    const supabase = supabaseNavegador();
    try {
      // 1) O produto (a 1ª categoria marcada fica como "principal")
      const linha = {
        loja_id: loja.id, nome: dados.nome.trim(), descricao: dados.descricao || null, restricoes: dados.restricoes || null,
        preco: paraNumero(dados.preco), disponibilidade: dados.disponibilidade, prazo: prazoComDias(dados.prazo), selo: dados.selo.trim() || null,
        destaque: dados.destaque, ativo: dados.ativo, categoria_id: catsMarcadas[0] ?? null,
        promocao_pct: Number(dados.promocao_pct) >= 1 && Number(dados.promocao_pct) <= 90 ? Math.round(Number(dados.promocao_pct)) : null,
        promocao_ate: dados.promocao_pct && dados.promocao_ate ? new Date(`${dados.promocao_ate}T23:59:59`).toISOString() : null,
        giro_360: dados.giro_360,
        estoque: dados.estoque.trim() === "" ? null : Math.max(0, Math.round(Number(dados.estoque)) || 0),
      };
      const r = novo
        ? await supabase.from("produtos").insert(linha).select("id").single()
        : await supabase.from("produtos").update(linha).eq("id", id).select("id").single();
      if (r.error) throw r.error;
      const produtoId: string = r.data.id;

      // 2) Variações: apaga as removidas, atualiza as antigas e cria as novas
      const vMantidas = variacoes.filter((v) => v.id).map((v) => v.id!);
      const vApagar = originais.current.variacoes.filter((x) => !vMantidas.includes(x));
      if (vApagar.length) { const e = await supabase.from("variacoes").delete().in("id", vApagar); if (e.error) throw e.error; }
      const paraBanco = (v: LinhaVariacao, ordem: number) => ({
        produto_id: produtoId, tipo: v.tipo, nome: v.nome.trim() || null, descricao: v.descricao.trim() || null,
        tamanho: tamanhoComUnidade(v.tamanho, loja.unidade_tamanho) || null, cor: comMaiuscula(v.cor) || null,
        preco: paraNumero(v.preco), disponibilidade: v.disponibilidade || null, prazo: prazoComDias(v.prazo), ativa: v.ativa, ordem,
        estoque: v.estoque.trim() === "" ? null : Math.max(0, Math.round(Number(v.estoque)) || 0),
      });
      const vExistentes = variacoes.map((v, i) => ({ v, i })).filter(({ v }) => v.id).map(({ v, i }) => ({ id: v.id, ...paraBanco(v, i) }));
      const vNovas = variacoes.map((v, i) => ({ v, i })).filter(({ v }) => !v.id).map(({ v, i }) => paraBanco(v, i));
      if (vExistentes.length) { const e = await supabase.from("variacoes").upsert(vExistentes); if (e.error) throw e.error; }
      if (vNovas.length) { const e = await supabase.from("variacoes").insert(vNovas); if (e.error) throw e.error; }

      // 3) Fotos e vídeos, na ordem da tela
      const mMantidas = midias.filter((m) => m.id).map((m) => m.id!);
      const mApagar = originais.current.midias.filter((x) => !mMantidas.includes(x));
      if (mApagar.length) { const e = await supabase.from("midias").delete().in("id", mApagar); if (e.error) throw e.error; }
      const mExistentes = midias.map((m, i) => ({ m, i })).filter(({ m }) => m.id).map(({ m, i }) => ({ id: m.id, produto_id: produtoId, tipo: m.tipo, url: m.url, ordem: i, cor: m.cor ?? null }));
      const mNovas = midias.map((m, i) => ({ m, i })).filter(({ m }) => !m.id).map(({ m, i }) => ({ produto_id: produtoId, tipo: m.tipo, url: m.url, ordem: i, cor: m.cor ?? null }));
      if (mExistentes.length) { const e = await supabase.from("midias").upsert(mExistentes); if (e.error) throw e.error; }
      if (mNovas.length) { const e = await supabase.from("midias").insert(mNovas); if (e.error) throw e.error; }

      // 3b) Cor/tamanho novos entram na lista de opções da loja
      const novasOpcoes = [
        ...variacoes.map((v) => comMaiuscula(v.cor)).filter((c) => c && c !== VALOR_COR_A_ESCOLHER).map((valor) => ({ loja_id: loja.id, tipo: "cor", valor })),
        ...variacoes.map((v) => tamanhoComUnidade(v.tamanho, loja.unidade_tamanho)).filter(Boolean).map((valor) => ({ loja_id: loja.id, tipo: "tamanho", valor })),
      ];
      if (novasOpcoes.length) await supabase.from("opcoes_loja").upsert(novasOpcoes, { onConflict: "loja_id,tipo,valor", ignoreDuplicates: true });

      // 4) Categorias (várias) e coleções: apaga as ligações e cria de novo
      await supabase.from("produtos_categorias").delete().eq("produto_id", produtoId);
      if (catsMarcadas.length) {
        const e = await supabase.from("produtos_categorias").insert(catsMarcadas.map((c) => ({ produto_id: produtoId, categoria_id: c })));
        if (e.error) throw e.error;
      }
      await supabase.from("produtos_colecoes").delete().eq("produto_id", produtoId);
      if (marcadas.length) {
        const e = await supabase.from("produtos_colecoes").insert(marcadas.map((c) => ({ produto_id: produtoId, colecao_id: c })));
        if (e.error) throw e.error;
      }

      if (novo) {
        // Produto novo: limpa a tela para cadastrar o próximo (mantém categorias e coleções)
        setDados(vazio(loja.prazo_padrao ?? "10 dias"));
        setVariacoes([]);
        setMidias([]);
        setSalvando(false);
        setMensagem({ tipo: "ok", texto: `✓ "${linha.nome}" salvo! Pode cadastrar o próximo.` });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.location.reload(); // pega os ids novos (evita duplicar ao salvar de novo)
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: `Não deu para salvar: ${(e as Error).message}` });
      setSalvando(false);
    }
  }

  // DUPLICAR: cria uma cópia (oculta) com fotos, variações, categorias e coleções
  async function duplicar() {
    if (novo || !loja) return;
    if (!confirm(`Criar uma cópia de "${dados.nome}"? (Salve antes, se mudou algo.)`)) return;
    const supabase = supabaseNavegador();
    const { data: p } = await supabase.from("produtos").select("*, variacoes(*), midias(*), produtos_colecoes(colecao_id), produtos_categorias(categoria_id)").eq("id", id).single();
    if (!p) return;
    const { id: _id, criado_em: _c, criado_por: _cp, atualizado_por: _ap, atualizado_em: _ae, variacoes: vs, midias: ms, produtos_colecoes: pcs, produtos_categorias: pcats, ...resto } = p;
    const { data: copia, error } = await supabase.from("produtos").insert({ ...resto, nome: `${p.nome} (cópia)`, ativo: false, excluido_em: null }).select("id").single();
    if (error || !copia) return setMensagem({ tipo: "erro", texto: `Não deu para duplicar: ${error?.message}` });
    const semId = <T extends Record<string, unknown>>(lista: T[]) => lista.map(({ id: _i, ...x }) => ({ ...x, produto_id: copia.id }));
    if (vs.length) await supabase.from("variacoes").insert(semId(vs));
    if (ms.length) await supabase.from("midias").insert(semId(ms));
    if (pcs.length) await supabase.from("produtos_colecoes").insert(pcs.map((x: { colecao_id: string }) => ({ produto_id: copia.id, colecao_id: x.colecao_id })));
    if (pcats.length) await supabase.from("produtos_categorias").insert(pcats.map((x: { categoria_id: string }) => ({ produto_id: copia.id, categoria_id: x.categoria_id })));
    router.push(`/admin/${slug}/produtos/${copia.id}`);
  }

  // Excluir = mandar para a LIXEIRA (fica 15 dias e dá para restaurar)
  async function excluir() {
    if (novo || !confirm(`Mandar "${dados.nome}" para a lixeira? Ele some da loja e fica 15 dias na Lixeira, onde dá para restaurar.`)) return;
    const { error } = await supabaseNavegador().from("produtos").update({ excluido_em: new Date().toISOString() }).eq("id", id);
    if (error) setMensagem({ tipo: "erro", texto: error.message });
    else router.replace(`/admin/${slug}/produtos`);
  }

  const principais = categorias.filter((c) => !c.parent_id);
  const coresDasVariacoes = emOrdem(variacoes.map((v) => comMaiuscula(v.cor)).filter((c) => c && c !== VALOR_COR_A_ESCOLHER));
  const todasAsCores = emOrdem([...usados.cores, ...SUGESTOES_COR]);
  const celula = "w-full rounded-lg border bg-white px-2 py-1.5 text-sm";
  const chip = (ligado: boolean) => (ligado ? { background: cor, color: "white", borderColor: cor } : {});

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <Link href={`/admin/${slug}/produtos`} className="text-sm opacity-60">← Produtos</Link>
      <h2 className="mt-1 text-xl font-bold">{novo ? "Novo produto" : dados.nome}</h2>
      {autoria && (
        <p className="mb-4 text-xs opacity-60">
          🕓 Criado{autoria.criado_por ? ` por ${autoria.criado_por}` : ""}{autoria.criado_em ? ` em ${new Date(autoria.criado_em).toLocaleString("pt-BR")}` : ""}
          {autoria.atualizado_em ? ` · última alteração${autoria.atualizado_por ? ` por ${autoria.atualizado_por}` : ""} em ${new Date(autoria.atualizado_em).toLocaleString("pt-BR")}` : ""}
        </p>
      )}
      {!autoria && <div className="mb-4" />}
      {mensagem?.tipo === "ok" && novo && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{mensagem.texto}</p>}

      <Bloco titulo="📷 Fotos e vídeos">
        <p className="text-xs opacity-60">{TAMANHOS.produto}</p>
        <p className="text-xs opacity-60">A primeira é a capa. Fotos são diminuídas sozinhas. Vídeos curtos (até 20 MB).
          Depois de criar as variações, escolha embaixo de cada foto a <b>cor</b> que ela mostra: na loja, a foto troca sozinha.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {midias.map((m, i) => (
            <div key={m.url} className="relative overflow-hidden rounded-xl border bg-stone-100">
              {m.tipo === "video"
                ? <video src={m.url} muted loop autoPlay playsInline className="aspect-square w-full object-cover" />
                : <img src={m.url} alt="" className="aspect-square w-full object-cover" />}
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white">Capa</span>}
              {coresDasVariacoes.length > 0 && (
                <select value={m.cor ?? ""} onChange={(e) => setMidias(midias.map((x, j) => (j === i ? { ...x, cor: e.target.value || null } : x)))}
                  className="w-full border-t bg-white px-1 py-1 text-xs" aria-label="Cor desta foto">
                  <option value="">🎨 Todas as cores</option>
                  {coresDasVariacoes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <div className="flex justify-between bg-white text-sm">
                <button type="button" onClick={() => moverMidia(i, -1)} className="px-2 py-1" aria-label="Mover para a esquerda">◀</button>
                <button type="button" onClick={() => setMidias(midias.filter((_, j) => j !== i))} className="px-2 py-1 text-red-600" aria-label="Remover">🗑️</button>
                <button type="button" onClick={() => moverMidia(i, 1)} className="px-2 py-1" aria-label="Mover para a direita">▶</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => entradaArquivos.current?.click()}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm opacity-70">
            <span className="text-2xl">＋</span>{enviando > 0 ? `Enviando ${enviando}...` : "Adicionar"}
          </button>
        </div>
        <input ref={entradaArquivos} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => adicionarArquivos(e.target.files)} />
      </Bloco>

      <Bloco titulo="📝 Informações">
        <Campo rotulo="Nome"><input className={estiloInput} value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} /></Campo>
        <Campo rotulo="Descrição (pode usar emojis 😊)"><textarea rows={4} className={estiloInput} value={dados.descricao} onChange={(e) => mudar("descricao", e.target.value)} /></Campo>
        <Campo rotulo="📌 Importante saber (destaque para o cliente: cores, prazo maior para personalizados...)">
          <textarea rows={2} className={estiloInput} value={dados.restricoes} onChange={(e) => mudar("restricoes", e.target.value)} />
        </Campo>
        <Campo rotulo="Selo no cartão (escolha na lista ou escreva outro)">
          <input list="lista-selo" className={estiloInput} value={dados.selo} onChange={(e) => mudar("selo", e.target.value)} placeholder="Clique para ver a lista" />
        </Campo>
        <ListaSugestoes id="lista-selo" opcoes={SUGESTOES_SELO} />
      </Bloco>

      <Bloco titulo="💰 Preço e situação">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Preço (vazio = sob consulta)"><input className={estiloInput} inputMode="decimal" value={dados.preco} onChange={(e) => mudar("preco", e.target.value)} placeholder="25,90" /></Campo>
          <Campo rotulo="Situação">
            <select className={estiloInput} value={dados.disponibilidade} onChange={(e) => mudar("disponibilidade", e.target.value as Disponibilidade)}>
              {SITUACOES.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Prazo (padrão da loja já preenchido)"><input list="lista-prazo" className={estiloInput} value={dados.prazo} onChange={(e) => mudar("prazo", e.target.value)} placeholder="10 dias" /></Campo>
        </div>
        <Campo rotulo="📦 Estoque (quantidade disponível · vazio = não controlar)">
          <input className={estiloInput} inputMode="numeric" value={dados.estoque} placeholder="Ex.: 10"
            onChange={(e) => mudar("estoque", e.target.value.replace(/\D/g, ""))} />
        </Campo>
        <p className="text-xs opacity-60">
          Se o produto tiver variações com preço, o cartão mostra &quot;a partir de&quot; o menor preço delas. Tem variações? Use o estoque de cada variação.
          O estoque baixa sozinho quando você muda o pedido para &quot;Em produção&quot; e volta se cancelar. Chegou a 0 = aparece &quot;Esgotado&quot;.
        </p>
      </Bloco>

      <Bloco titulo="🗂️ Categorias e coleções">
        <div>
          <span className="text-sm font-semibold">Categorias (pode marcar várias)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {principais.map((c) => [
              <button key={c.id} type="button" onClick={() => setCatsMarcadas(alternar(catsMarcadas, c.id))} className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={chip(catsMarcadas.includes(c.id))}>
                {catsMarcadas.includes(c.id) ? "✓ " : ""}{c.nome}
              </button>,
              ...categorias.filter((s) => s.parent_id === c.id).map((s) => (
                <button key={s.id} type="button" onClick={() => setCatsMarcadas(alternar(catsMarcadas, s.id))} className="rounded-full border px-3 py-1.5 text-sm" style={chip(catsMarcadas.includes(s.id))}>
                  {catsMarcadas.includes(s.id) ? "✓ " : "↳ "}{c.nome} › {s.nome}
                </button>
              )),
            ])}
          </div>
        </div>
        {colecoes.length > 0 && (
          <div>
            <span className="text-sm font-semibold">Coleções (pode marcar várias)</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {colecoes.map((c) => (
                <button key={c.id} type="button" onClick={() => setMarcadas(alternar(marcadas, c.id))} className="rounded-full border px-3 py-1.5 text-sm" style={chip(marcadas.includes(c.id))}>
                  {marcadas.includes(c.id) ? "✓ " : ""}{c.nome}
                </button>
              ))}
            </div>
          </div>
        )}
        <Link href={`/admin/${slug}/categorias`} className="inline-block text-xs underline opacity-70">Criar ou editar categorias e coleções →</Link>
      </Bloco>

      <Bloco titulo="📏 Variações (unidade e kits)">
        <p className="text-xs opacity-60">
          Cada linha é uma opção que o cliente escolhe. <b>Opção/modelo</b>: ex. "Clipes de coração", "Kit 9 sortidos".
          <b> Cor</b>: vazia = produto sem cor; <b>"A escolher"</b> = o cliente diz a cor e vocês confirmam.
          <b> Texto da opção</b>: aparece quando o cliente escolhe (ex.: o que vem no kit).
        </p>

        {variacoes.map((v, i) => (
          <div key={v.id ?? `nova-${i}`} className={`space-y-2 rounded-xl border p-3 ${v.ativa ? "" : "opacity-50"}`} style={v.tipo === "kit" ? { borderColor: cor } : {}}>
            <div className="flex flex-wrap items-center gap-2">
              {/* Unidade ou kit */}
              <div className="inline-flex rounded-lg border p-0.5">
                {(["unidade", "kit"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => mudarVariacao(i, "tipo", t)} className="rounded-md px-3 py-1 text-xs font-semibold" style={v.tipo === t ? { background: cor, color: "white" } : {}}>
                    {t === "kit" ? "🎁 Kit" : "1️⃣ Unidade"}
                  </button>
                ))}
              </div>
              <input className={`${celula} min-w-0 flex-1`} placeholder={v.tipo === "kit" ? "Nome do kit (ex.: Kit 9 sortidos)" : "Opção/modelo (opcional)"} value={v.nome} onChange={(e) => mudarVariacao(i, "nome", e.target.value)} />
              <button type="button" onClick={() => mudarVariacao(i, "ativa", !v.ativa)} className="rounded-lg border px-2 py-1 text-xs">{v.ativa ? "Ativa" : "Oculta"}</button>
              <button type="button" onClick={() => setVariacoes(variacoes.filter((_, j) => j !== i))} className="rounded-lg px-2 py-1 text-red-600" aria-label="Remover variação">🗑️</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <input list="lista-tamanho" className={celula} placeholder="Tamanho" value={v.tamanho} onChange={(e) => mudarVariacao(i, "tamanho", e.target.value)} />
              <input list="lista-cor" className={celula} placeholder="Cor" value={v.cor} onChange={(e) => mudarVariacao(i, "cor", e.target.value)} />
              <input className={celula} placeholder="Preço" inputMode="decimal" value={v.preco} onChange={(e) => mudarVariacao(i, "preco", e.target.value)} />
              <select className={celula} value={v.disponibilidade} onChange={(e) => mudarVariacao(i, "disponibilidade", e.target.value)}>
                <option value="">(situação do produto)</option>
                {SITUACOES.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
              </select>
              <input list="lista-prazo" className={celula} placeholder="Prazo (do produto)" value={v.prazo} onChange={(e) => mudarVariacao(i, "prazo", e.target.value)} />
              <input className={celula} inputMode="numeric" placeholder="📦 Estoque" title="Estoque desta opção (vazio = não controlar)" value={v.estoque}
                onChange={(e) => mudarVariacao(i, "estoque", e.target.value.replace(/\D/g, ""))} />
            </div>
            <textarea rows={1} className={celula} placeholder="Texto da opção (opcional) — ex.: 3 corações + 3 estrelas + 3 nuvens" value={v.descricao} onChange={(e) => mudarVariacao(i, "descricao", e.target.value)} />
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => novaVariacao("unidade")} className="rounded-full border px-4 py-2 text-sm">+ Variação (unidade)</button>
          <button type="button" onClick={() => novaVariacao("kit")} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: cor, color: cor }}>+ Kit</button>
          <button type="button" onClick={() => setGerador({ ...gerador, aberto: !gerador.aberto, base: variacaoVazia(dados.preco) })} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>
            🎨 Várias cores de uma vez
          </button>
        </div>

        {/* Gerador: marca as cores e cria uma variação para cada */}
        {gerador.aberto && (
          <div className="space-y-3 rounded-xl border-2 border-dashed p-3" style={{ borderColor: cor }}>
            <b className="text-sm">🎨 Criar uma variação para cada cor marcada</b>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select className={celula} value={gerador.base.tipo} onChange={(e) => setGerador({ ...gerador, base: { ...gerador.base, tipo: e.target.value as "unidade" | "kit" } })}>
                <option value="unidade">1️⃣ Unidade</option><option value="kit">🎁 Kit</option>
              </select>
              <input className={celula} placeholder="Opção/modelo (opcional)" value={gerador.base.nome} onChange={(e) => setGerador({ ...gerador, base: { ...gerador.base, nome: e.target.value } })} />
              <input list="lista-tamanho" className={celula} placeholder="Tamanho" value={gerador.base.tamanho} onChange={(e) => setGerador({ ...gerador, base: { ...gerador.base, tamanho: e.target.value } })} />
              <input className={celula} placeholder="Preço" inputMode="decimal" value={gerador.base.preco} onChange={(e) => setGerador({ ...gerador, base: { ...gerador.base, preco: e.target.value } })} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="rounded-lg border px-3 py-1 text-xs font-semibold" onClick={() => setGerador({ ...gerador, cores: gerador.cores.length === todasAsCores.length ? [] : todasAsCores })}>
                {gerador.cores.length === todasAsCores.length ? "Desmarcar todas" : "✓ Marcar todas"}
              </button>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={gerador.aEscolher} onChange={(e) => setGerador({ ...gerador, aEscolher: e.target.checked })} /> 🎨 Cor a escolher (consultar)</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {todasAsCores.map((c) => (
                <label key={c} className="flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm">
                  <input type="checkbox" checked={gerador.cores.includes(c)} onChange={() => setGerador({ ...gerador, cores: alternar(gerador.cores, c) })} /> {c}
                </label>
              ))}
            </div>
            <button type="button" onClick={gerarVariacoes} className="w-full rounded-xl p-2 text-sm font-semibold text-white" style={{ background: cor }}>Criar variações</button>
          </div>
        )}

        {/* Listas de sugestões (cores em ordem alfabética, com maiúscula) */}
        <ListaSugestoes id="lista-tamanho" opcoes={[...usados.tamanhos, ...SUGESTOES_TAMANHO]} />
        <ListaSugestoes id="lista-cor" opcoes={[VALOR_COR_A_ESCOLHER, ...todasAsCores]} />
        <ListaSugestoes id="lista-prazo" opcoes={SUGESTOES_PRAZO} />
      </Bloco>

      <Bloco titulo="🔥 Promoção">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Desconto (%) — vazio = sem promoção">
            <input className={estiloInput} inputMode="numeric" value={dados.promocao_pct} placeholder="Ex.: 15"
              onChange={(e) => mudar("promocao_pct", e.target.value.replace(/\D/g, "").slice(0, 2))} />
          </Campo>
          <Campo rotulo="Termina em (vazio = sem data)">
            <input type="date" className={estiloInput} value={dados.promocao_ate} onChange={(e) => mudar("promocao_ate", e.target.value)} />
          </Campo>
        </div>
        {Number(dados.promocao_pct) > 0 && paraNumero(dados.preco) != null && (
          <p className="text-sm">Na loja: <s className="opacity-50">{dados.preco}</s> por <b className="text-red-600">
            R$ {(Math.round(Number(paraNumero(dados.preco)) * (100 - Number(dados.promocao_pct))) / 100).toFixed(2).replace(".", ",")}</b> 🔥 (vale também para as variações)</p>
        )}
      </Bloco>

      <Bloco titulo="👀 Visibilidade">
        <Interruptor rotulo="Visível na loja" ajuda="Desligado: o produto some da loja (sem apagar)." ligado={dados.ativo} aoMudar={(v) => mudar("ativo", v)} />
        <Interruptor rotulo="⭐ Destaque" ajuda="Aparece na seção Destaques e na Vitrine do dia." ligado={dados.destaque} aoMudar={(v) => mudar("destaque", v)} />
        <Interruptor rotulo="🔄 Fotos em giro 360°" ajuda="Use quando as fotos forem tiradas girando o produto (12 a 36 fotos, na ordem). Na loja, o cliente arrasta e o produto gira."
          ligado={dados.giro_360} aoMudar={(v) => mudar("giro_360", v)} />
      </Bloco>

      <BarraSalvar mensagem={mensagem} salvando={salvando} aoSalvar={salvar} cor={cor}
        extra={!novo && (
          <>
            <button type="button" onClick={duplicar} className="rounded-xl border px-3 text-sm" title="Duplicar produto">📄 Duplicar</button>
            <button type="button" onClick={excluir} className="rounded-xl border border-red-300 px-3 text-sm text-red-600">🗑️ Lixeira</button>
          </>
        )} />
    </>
  );
}
