"use client";
// =====================================================================
// ESCOLHA DO PRODUTO — tamanho, cor, quantidade, observação e o botão
// "Adicionar ao carrinho". Usado na página do produto E no popup de
// "adicionar rápido".
//
// Regra das variações (tabela "variacoes"):
//   - o cliente escolhe o TAMANHO;
//   - aparecem só as CORES que existem para aquele tamanho;
//   - preço, disponibilidade e prazo vêm da variação escolhida
//     (se a variação não tiver, vale o que está no produto).
// Ao adicionar: a miniatura "voa" até o carrinho, que abre de lado.
// =====================================================================
import { useState, type MouseEvent } from "react";
import { adicionarAoCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formato";
import { voarParaCarrinho } from "@/lib/efeitos";
import type { Produto } from "@/lib/tipos";

const TAMANHO_UNICO = "Tamanho único";
const TODAS_AS_CORES = "Todas as cores";

type Props = {
  produto: Produto;
  slug: string;
  cor: string;
  foto?: string; // miniatura usada na animação de "voar"
  aoAdicionar?: () => void; // ex.: fechar o popup
};

export default function EscolhaDoProduto({ produto, slug, cor, foto, aoAdicionar }: Props) {
  // Só variações ativas, na ordem do cadastro.
  const variacoes = produto.variacoes.filter((v) => v.ativa).sort((a, b) => a.ordem - b.ordem);

  // Lista de tamanhos sem repetir.
  const tamanhos = [...new Set(variacoes.map((v) => v.tamanho ?? TAMANHO_UNICO))];
  const [tamanho, setTamanho] = useState(tamanhos[0] ?? TAMANHO_UNICO);

  // Variações (e cores) do tamanho escolhido.
  const doTamanho = variacoes.filter((v) => (v.tamanho ?? TAMANHO_UNICO) === tamanho);
  const cores = [...new Set(doTamanho.map((v) => v.cor ?? TODAS_AS_CORES))];
  const [corEscolhida, setCorEscolhida] = useState(cores[0] ?? TODAS_AS_CORES);
  const corValida = cores.includes(corEscolhida) ? corEscolhida : cores[0];

  // A variação que bate com tamanho + cor (pode não existir se o produto não tem variações).
  const variacao = doTamanho.find((v) => (v.cor ?? TODAS_AS_CORES) === corValida);

  const preco = variacao?.preco ?? produto.preco;
  const disponibilidade = variacao?.disponibilidade ?? produto.disponibilidade;
  const prazo = variacao?.prazo ?? produto.prazo;
  const esgotado = disponibilidade === "esgotado";

  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  function adicionar(e: MouseEvent<HTMLButtonElement>) {
    const origem = e.currentTarget.getBoundingClientRect(); // de onde a miniatura sai voando
    adicionarAoCarrinho(slug, {
      chave: `${produto.id}|${variacao?.id ?? "unico"}`,
      produtoId: produto.id,
      nome: produto.nome,
      tamanho: variacao?.tamanho ?? null,
      cor: variacao ? variacao.cor : null,
      preco: preco != null ? Number(preco) : null,
      quantidade,
      observacao: observacao.trim(),
      prazo,
    });
    setObservacao("");
    setQuantidade(1);
    aoAdicionar?.();
    voarParaCarrinho(origem, foto, cor);
  }

  // Botãozinho de opção (tamanho ou cor). Marcado = borda grossa na cor da loja.
  const opcao = (texto: string, marcado: boolean, aoClicar: () => void) => (
    <button key={texto} type="button" onClick={aoClicar} className="rounded-lg border px-3 py-2 text-sm"
      style={marcado ? { borderColor: cor, borderWidth: 2, fontWeight: 600 } : { borderColor: "#0003" }}>
      {texto}
    </button>
  );

  return (
    <div className="mt-4">
      {/* Preço e situação */}
      <p className="text-2xl font-bold" style={{ color: cor }}>
        {preco != null ? formatarPreco(Number(preco)) : "Sob consulta"}
      </p>
      <p className="text-sm opacity-70">
        {disponibilidade === "sob_encomenda" ? "Sob encomenda" : esgotado ? "Esgotado" : "Pronta entrega"}
        {prazo ? ` · prazo: ${prazo}` : ""}
      </p>

      {/* Tamanhos (só aparece se houver mais de uma opção) */}
      {tamanhos.length > 1 && (
        <>
          <p className="mt-4 mb-2 text-sm font-semibold">Tamanho</p>
          <div className="flex flex-wrap gap-2">{tamanhos.map((t) => opcao(t, t === tamanho, () => setTamanho(t)))}</div>
        </>
      )}

      {/* Cores disponíveis no tamanho escolhido */}
      {variacoes.length > 0 && (cores.length > 1 || cores[0] !== TODAS_AS_CORES) && (
        <>
          <p className="mt-4 mb-2 text-sm font-semibold">Cor</p>
          <div className="flex flex-wrap gap-2">{cores.map((c) => opcao(c, c === corValida, () => setCorEscolhida(c)))}</div>
        </>
      )}
      {corValida === TODAS_AS_CORES && variacoes.length > 0 && (
        <p className="mt-2 text-xs opacity-70">Neste tamanho você escolhe a cor: escreva na observação 👇</p>
      )}

      {/* Quantidade */}
      <p className="mt-4 mb-2 text-sm font-semibold">Quantidade</p>
      <div className="flex items-center gap-3">
        <button type="button" className="h-10 w-10 rounded-lg border text-lg" onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
        <span className="w-6 text-center">{quantidade}</span>
        <button type="button" className="h-10 w-10 rounded-lg border text-lg" onClick={() => setQuantidade((q) => q + 1)}>+</button>
      </div>

      {/* Observação livre */}
      <label className="mt-4 mb-2 block text-sm font-semibold" htmlFor={`obs-${produto.id}`}>Observação</label>
      <textarea id={`obs-${produto.id}`} rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)}
        placeholder="Cor desejada, nome para personalizar, detalhes..." className="w-full rounded-lg border bg-white/70 p-3 text-sm" />

      {/* Adicionar */}
      <button type="button" disabled={esgotado} onClick={adicionar}
        className="mt-4 w-full rounded-xl p-4 font-semibold text-white disabled:opacity-40" style={{ background: cor }}>
        {esgotado ? "Esgotado" : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
