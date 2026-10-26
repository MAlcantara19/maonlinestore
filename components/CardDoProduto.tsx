// =====================================================================
// CARTÃO DE UM PRODUTO — foto (aparece suave e dá zoom com o mouse),
// selo, nome, preço "a partir de", situação e o botão "+" de adicionar
// rápido. Usado na página da loja e no resultado da busca.
// =====================================================================
import { comPromocao, promocaoAtiva } from "@/lib/promocao";
import BotaoFavorito from "@/components/BotaoFavorito";
import Inclinar3D from "@/components/Inclinar3D";
import Link from "next/link";
import type { Produto } from "@/lib/tipos";
import { formatarPreco, precoMinimo, textoDisponibilidade } from "@/lib/formato";
import ImagemSuave from "@/components/ImagemSuave";
import AdicionarRapido from "@/components/AdicionarRapido";

type Props = { produto: Produto; cor: string; slug: string; indice?: number };

export default function CardDoProduto({ produto, cor, slug, indice = 0 }: Props) {
  const foto = [...produto.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0];
  const variosPrecos = produto.variacoes.filter((v) => v.ativa && v.preco != null).length > 1;
  const menor = precoMinimo(produto);
  const esgotado = produto.disponibilidade === "esgotado";
  const emPromocao = promocaoAtiva(produto);

  return (
    // Os cartões aparecem um depois do outro (efeito "cascata")
    <div className="animar-entrada group relative" style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}>
      {/* Inclina em 3D acompanhando o mouse (computador) */}
      <Inclinar3D graus={6}>
      <Link href={`/${slug}/p/${produto.id}`} className="clicavel cartao group block rounded-xl border bg-white/60 p-2" style={{ borderColor: "#0001" }}>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-xs" style={{ background: `${cor}22` }}>
          {foto ? (
            // group-hover:scale-110 = a foto cresce quando o mouse passa no cartão
            <>
              {/* Fundo: a mesma foto, ampliada e desfocada (preenche as sobras) */}
              <img src={foto.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
              {/* Foto inteira, sem cortar, na proporção dela */}
              <ImagemSuave src={foto.url} alt={produto.nome} className="relative h-full w-full object-contain group-hover:scale-105" />
            </>
          ) : (
            <span className="opacity-70">sem foto</span>
          )}

          {/* Selo (fitinha) no canto: vem da coluna "selo" do produto */}
          {produto.selo && (
            <span className="brilho-texto absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: cor }}>
              {produto.selo}
            </span>
          )}

          {/* Promoção: selo vermelho com o desconto */}
          {emPromocao && (
            <span className="pulsar absolute bottom-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">🔥 -{produto.promocao_pct}%</span>
          )}

          {/* Esgotado: véu claro por cima da foto */}
          {esgotado && <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-bold">Esgotado</span>}
        </div>

        <b className="mt-2 block text-sm">{produto.nome}</b>
        {menor != null && emPromocao ? (
          // Promoção: preço antigo riscado + preço novo
          <span className="block text-sm">
            <s className="mr-1 text-xs opacity-50">{formatarPreco(menor)}</s>
            <b className="texto-cor" style={{ color: cor }}>{variosPrecos ? "a partir de " : ""}{formatarPreco(comPromocao(menor, produto))}</b>
          </span>
        ) : (
          <span className="texto-cor block text-sm font-semibold" style={{ color: cor }}>
            {menor != null ? `${variosPrecos ? "a partir de " : ""}${formatarPreco(menor)}` : "Sob consulta"}
          </span>
        )}
        <span className="block text-xs opacity-60">{textoDisponibilidade(produto.disponibilidade)}</span>
      </Link>
      </Inclinar3D>

      {/* ❤️ Favorito (embaixo do "+") */}
      <BotaoFavorito slug={slug} produtoId={produto.id} className="absolute right-3 top-14 z-10 h-10 w-10 rounded-full bg-white/90 text-lg shadow" />

      {/* Botão "+" de adicionar rápido (fora do link, para não abrir a página do produto) */}
      {!esgotado && <AdicionarRapido produto={produto} slug={slug} cor={cor} foto={foto?.url} />}
    </div>
  );
}
