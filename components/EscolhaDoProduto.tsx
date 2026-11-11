"use client";
// =====================================================================
// ESCOLHA DO PRODUTO — o cliente vai escolhendo, em ordem:
//   1. Unidade ou Kit           (se o produto tiver os dois)
//   2. Opção/modelo             (ex.: "Clipes de coração", "Kit 9 sortidos")
//   3. Tamanho
//   4. Cor                      (só as que existem para as escolhas acima;
//                                cor "A escolher" = o cliente diz a cor e a loja confirma)
// Preço, prazo, situação e o texto da opção vêm da variação escolhida.
// Ao adicionar: confete 🎉, a miniatura voa até o carrinho e ele abre.
// =====================================================================
import { estoqueDa, semEstoque } from "@/lib/estoque";
import { comPromocao, promocaoAtiva, textoFimPromocao } from "@/lib/promocao";
import { linkWhatsApp } from "@/lib/whatsapp";
import { useEffect, useState, type MouseEvent } from "react";
import { adicionarAoCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formato";
import { explodirConfete, ondinha, voarParaCarrinho } from "@/lib/efeitos";
import { corDoNome } from "@/lib/cores";
import { emOrdem } from "@/lib/opcoes";
import Magnetico from "@/components/Magnetico";
import type { Produto, Variacao } from "@/lib/tipos";

const UNICO = "Único";
const COR_A_ESCOLHER = "🎨 Escolher cor (consultar disponibilidade)";

type Props = {
  produto: Produto;
  slug: string;
  cor: string;
  foto?: string; // miniatura usada na animação de "voar"
  aoAdicionar?: () => void; // ex.: fechar o popup
  sincronizarUrl?: boolean; // página do produto: guarda as escolhas no endereço (link compartilhável)
  whatsapp?: string | null; // para o "me avise quando chegar" (produto esgotado)
};

// Valor de cada "nível" de uma variação (vazio vira um rótulo padrão)
const tipoDe = (v: Variacao) => (v.tipo === "kit" ? "kit" : "unidade");
const nomeDe = (v: Variacao) => v.nome?.trim() || UNICO;
const tamanhoDe = (v: Variacao) => v.tamanho?.trim() || UNICO;
// Cor: vazio = produto sem cor · "A escolher" = cliente escolhe (consultar)
export const VALOR_COR_A_ESCOLHER = "A escolher";
const corDe = (v: Variacao) => {
  const c = v.cor?.trim() ?? "";
  return c.toLowerCase() === VALOR_COR_A_ESCOLHER.toLowerCase() ? COR_A_ESCOLHER : c;
};

export default function EscolhaDoProduto({ produto, slug, cor, foto, aoAdicionar, sincronizarUrl, whatsapp }: Props) {
  const variacoes = produto.variacoes.filter((v) => v.ativa).sort((a, b) => a.ordem - b.ordem);

  // Nível 1: unidade ou kit
  const tipos = [...new Set(variacoes.map(tipoDe))];
  const [tipo, setTipo] = useState(tipos[0] ?? "unidade");
  const doTipo = variacoes.filter((v) => tipoDe(v) === tipo);

  // Nível 2: opção/modelo
  const nomes = [...new Set(doTipo.map(nomeDe))];
  const [nome, setNome] = useState(nomes[0] ?? UNICO);
  const nomeValido = nomes.includes(nome) ? nome : nomes[0] ?? UNICO;
  const doNome = doTipo.filter((v) => nomeDe(v) === nomeValido);

  // Nível 3: tamanho
  const tamanhos = [...new Set(doNome.map(tamanhoDe))];
  const [tamanho, setTamanho] = useState(tamanhos[0] ?? UNICO);
  const tamanhoValido = tamanhos.includes(tamanho) ? tamanho : tamanhos[0] ?? UNICO;
  const doTamanho = doNome.filter((v) => tamanhoDe(v) === tamanhoValido);

  // Nível 4: cor (em ordem alfabética; "a escolher" por último)
  const coresReais = emOrdem(doTamanho.map(corDe).filter((c) => c && c !== COR_A_ESCOLHER));
  const cores = [...coresReais, ...(doTamanho.some((v) => corDe(v) === COR_A_ESCOLHER) ? [COR_A_ESCOLHER] : [])];
  const [corEscolhida, setCorEscolhida] = useState(cores[0] ?? "");
  const corValida = cores.includes(corEscolhida) ? corEscolhida : cores[0] ?? "";

  // A variação escolhida (se o produto não tem cor, pega a primeira do tamanho)
  const variacao = cores.length ? doTamanho.find((v) => corDe(v) === corValida) : doTamanho[0];
  const precoCheio = variacao?.preco ?? produto.preco;
  const emPromocao = promocaoAtiva(produto) && precoCheio != null;
  const preco = precoCheio != null ? comPromocao(Number(precoCheio), produto) : null;
  const disponibilidade = variacao?.disponibilidade ?? produto.disponibilidade;
  const prazo = variacao?.prazo ?? produto.prazo;
  const estoque = estoqueDa(produto, variacao);
  const esgotado = disponibilidade === "esgotado" || semEstoque(estoque);

  // Link com ?opcao=&tamanho=&cor= já abre com a variação escolhida
  useEffect(() => {
    if (!sincronizarUrl) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("kit") === "1" && tipos.includes("kit")) setTipo("kit");
    if (q.get("opcao")) setNome(q.get("opcao")!);
    if (q.get("tamanho")) setTamanho(q.get("tamanho")!);
    if (q.get("cor")) setCorEscolhida(q.get("cor")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A cada escolha: avisa a galeria (foto da cor) e atualiza o endereço
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cor-escolhida", { detail: { produto: produto.id, cor: !corValida || corValida === COR_A_ESCOLHER ? null : corValida } }));
    if (!sincronizarUrl || variacoes.length === 0) return;
    const q = new URLSearchParams(window.location.search);
    const definir = (chave: string, valor: string | null) => (valor ? q.set(chave, valor) : q.delete(chave));
    definir("kit", tipo === "kit" ? "1" : null);
    definir("opcao", nomeValido !== UNICO ? nomeValido : null);
    definir("tamanho", tamanhoValido !== UNICO ? tamanhoValido : null);
    definir("cor", corValida && corValida !== COR_A_ESCOLHER ? corValida : null);
    const busca = q.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${busca ? `?${busca}` : ""}`);
  }, [tipo, nomeValido, tamanhoValido, corValida, produto.id, sincronizarUrl, variacoes.length]);

  const [quantidade, setQuantidade] = useState(1);
  // 🎨 Tocou numa cor no provador → escolhe essa cor aqui
  useEffect(() => {
    const ouvir = (e: Event) => { const d = (e as CustomEvent<{ produto: string; cor: string }>).detail; if (d.produto === produto.id) setCorEscolhida(d.cor); };
    window.addEventListener("provador-cor", ouvir);
    return () => window.removeEventListener("provador-cor", ouvir);
  }, [produto.id]);
  // ✍️ Personalização: o texto aparece na foto (prévia) e vai no pedido
  const pers = produto.personalizacao;
  const [textoPers, setTextoPers] = useState("");
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("personalizacao-texto", { detail: { produto: produto.id, texto: textoPers } }));
  }, [textoPers, produto.id]);
  const [observacao, setObservacao] = useState("");

  function adicionar(e: MouseEvent<HTMLButtonElement>) {
    const origem = e.currentTarget.getBoundingClientRect(); // de onde a miniatura sai voando
    const opcao = [tipo === "kit" ? "Kit" : null, variacao?.nome?.trim() || null].filter(Boolean).join(" · ") || null;
    adicionarAoCarrinho(slug, {
      chave: `${produto.id}|${variacao?.id ?? "unico"}${textoPers.trim() ? `|${textoPers.trim()}` : ""}`,
      personalizacao: textoPers.trim() || null,
      produtoId: produto.id,
      nome: produto.nome,
      opcao,
      tamanho: variacao?.tamanho ?? null,
      cor: corValida === COR_A_ESCOLHER ? "A escolher (ver observação)" : corValida || null,
      preco: preco != null ? Number(preco) : null,
      promocao: emPromocao ? produto.promocao_pct : null,
      foto: foto ?? produto.midias.filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url ?? null,
      quantidade: estoque != null ? Math.min(quantidade, estoque) : quantidade,
      observacao: observacao.trim(),
      prazo,
    });
    setObservacao("");
    setQuantidade(1);
    explodirConfete(origem, [cor, "#f5c542", "#ef5350", "#42a5f5", "#66bb6a"]); // festinha no botão 🎉
    aoAdicionar?.();
    voarParaCarrinho(origem, foto, cor);
  }

  // Botãozinho de opção. Marcado = borda grossa na cor da loja; onda ao clicar.
  const opcao = (texto: string, marcado: boolean, aoClicar: () => void, ehCor = false) => {
    const bolinha = ehCor ? corDoNome(texto) : null;
    return (
      <button key={texto} type="button" onClick={aoClicar} onPointerDown={(e) => ondinha(e, cor)}
        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border px-3 py-2 text-sm"
        style={marcado ? { borderColor: cor, borderWidth: 2, fontWeight: 600 } : { borderColor: "#0003" }}>
        {bolinha && <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: bolinha }} />}
        {texto}
      </button>
    );
  };
  // Um grupo de opções (só aparece se houver o que escolher)
  const grupo = (titulo: string, itens: string[], atual: string, mudar: (v: string) => void, ehCor = false) =>
    itens.length > 1 || (ehCor && itens.length === 1) || (itens.length === 1 && itens[0] !== UNICO) ? (
      <>
        <p className="mt-4 mb-2 text-sm font-semibold">{titulo}</p>
        <div className="flex flex-wrap gap-2">{itens.map((t) => opcao(t, t === atual, () => mudar(t), ehCor))}</div>
      </>
    ) : null;

  return (
    <div className="mt-4">
      {/* Preço e situação */}
      {emPromocao && (
        <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          🔥 Promoção -{produto.promocao_pct}% {textoFimPromocao(produto) && `· ${textoFimPromocao(produto)}`}
        </p>
      )}
      <p className="texto-cor text-2xl font-bold" style={{ color: cor }}>
        {emPromocao && <s className="mr-2 text-base font-normal opacity-50">{formatarPreco(Number(precoCheio))}</s>}
        {preco != null ? formatarPreco(Number(preco)) : "Sob consulta"}
      </p>
      <p className="text-sm opacity-70">
        {esgotado ? "Esgotado" : disponibilidade === "sob_encomenda" ? "Sob encomenda" : "Pronta entrega"}
        {prazo ? ` · prazo: ${prazo}` : ""}
      </p>

      {/* 1. Unidade ou kit */}
      {tipos.length > 1 && (
        <div className="mt-4 inline-flex rounded-xl border p-1" style={{ borderColor: `${cor}55` }}>
          {tipos.map((t) => (
            <button key={t} type="button" onClick={() => setTipo(t)} className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
              style={t === tipo ? { background: cor, color: "white" } : {}}>
              {t === "kit" ? "🎁 Kit" : "1️⃣ Unidade"}
            </button>
          ))}
        </div>
      )}

      {/* 2. Opção / 3. Tamanho / 4. Cor */}
      {grupo(tipo === "kit" ? "Escolha o kit" : "Opção", nomes, nomeValido, setNome)}
      {grupo("Tamanho", tamanhos, tamanhoValido, setTamanho)}
      {grupo("Cor", cores, corValida, setCorEscolhida, true)}
      {corValida === COR_A_ESCOLHER && (
        <p className="mt-2 text-xs opacity-70">Diga a cor que você quer na observação 👇 e a gente confirma se tem disponível.</p>
      )}

      {/* Texto da opção escolhida (ex.: o que vem no kit) */}
      {variacao?.descricao && (
        <p className="mt-3 whitespace-pre-line rounded-xl p-3 text-sm" style={{ background: `${cor}12` }}>📝 {variacao.descricao}</p>
      )}

      {/* Quantidade */}
      {/* ✍️ Personalização com prévia na foto */}
      {pers && (
        <label className="mt-4 block text-sm font-semibold">✍️ {pers.rotulo || "Texto para personalizar"}
          <input value={textoPers} maxLength={pers.max || 20} onChange={(e) => setTextoPers(e.target.value)}
            placeholder="Digite e veja na foto 👀" className="mt-1 w-full rounded-lg border bg-white/70 px-3 py-2 text-base" />
          <span className="text-xs font-normal opacity-60">Prévia aproximada na foto · até {pers.max || 20} letras</span>
        </label>
      )}

      <p className="mt-4 mb-2 text-sm font-semibold">Quantidade</p>
      <div className="flex items-center gap-3">
        <button type="button" className="h-10 w-10 rounded-lg border text-lg" onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
        <span className="w-6 text-center">{quantidade}</span>
        <button type="button" className="h-10 w-10 rounded-lg border text-lg" disabled={estoque != null && quantidade >= estoque}
          onClick={() => setQuantidade((q) => (estoque != null ? Math.min(estoque, q + 1) : q + 1))}>+</button>
        {estoque != null && estoque > 0 && estoque <= 5 && <span className="text-sm font-semibold text-orange-600">⏳ Só {estoque === 1 ? "resta 1" : `restam ${estoque}`}!</span>}
      </div>

      {/* Observação livre */}
      <label className="mt-4 mb-2 block text-sm font-semibold" htmlFor={`obs-${produto.id}`}>Observação</label>
      <textarea id={`obs-${produto.id}`} rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)}
        placeholder="Cor desejada, nome para personalizar, detalhes..." className="w-full rounded-lg border bg-white/70 p-3 text-sm" />

      {/* Botão "magnético": é puxado de leve na direção do mouse */}
      <Magnetico className="mt-4" forca={0.12}>
        <button type="button" disabled={esgotado} onClick={adicionar}
          className="w-full rounded-xl p-4 font-semibold text-white shadow-lg disabled:opacity-40" style={{ background: cor }}>
          {esgotado ? "Esgotado" : "🛒 Adicionar ao carrinho"}
        </button>
      </Magnetico>
      {/* Esgotado: o cliente pede para ser avisado quando voltar */}
      {esgotado && whatsapp && (
        <a href={linkWhatsApp(whatsapp, `Oi! Quero ser avisado(a) quando o *${produto.nome}* voltar a ter 😊`)} target="_blank" rel="noopener noreferrer"
          className="mt-2 block rounded-xl border-2 p-3 text-center font-semibold" style={{ borderColor: cor, color: cor }}>
          🔔 Me avise quando chegar
        </a>
      )}
    </div>
  );
}
