// =====================================================================
// TERMOS DE USO (endereço: /termos)
// Deixa claro o papel da MA Online Store (vitrine que reúne as lojas) e
// as responsabilidades de cada loja e do cliente.
// ⚠️ Modelo de partida: vale a revisão de um advogado antes do lançamento.
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Termos de Uso · ${SITE.nome}` };

export default function Termos() {
  const h = "mt-6 mb-2 text-lg font-bold";
  return (
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 leading-relaxed">
        <Link href="/" className="text-sm opacity-70">← Voltar</Link>
        <h1 className="mt-3 text-3xl font-bold">Termos de Uso</h1>
        <p className="text-sm opacity-60">Última atualização: {SITE.ano}</p>

        <h2 className={h}>1. O que é a {SITE.nome}</h2>
        <p>
          A {SITE.nome} é uma <b>vitrine on-line</b> que reúne várias lojas independentes. O site mostra os produtos e monta o
          pedido, mas <b>a compra é combinada e fechada diretamente com cada loja, pelo WhatsApp</b>. Não recebemos pagamentos
          pelo site.
        </p>

        <h2 className={h}>2. Responsabilidade de cada loja</h2>
        <p>Cada loja (identificada no rodapé da sua página com razão social e CNPJ ou CPF) é a <b>única responsável</b> por:</p>
        <ul className="ml-5 list-disc">
          <li>os produtos anunciados, suas fotos, descrições, preços e disponibilidade;</li>
          <li>prazos de produção e entrega, frete, trocas, devoluções e garantias;</li>
          <li>o pagamento, a emissão de nota fiscal (quando exigida) e o atendimento ao cliente;</li>
          <li>os dados pessoais que recebe dos clientes pelo WhatsApp, conforme a LGPD;</li>
          <li>cumprir o Código de Defesa do Consumidor, inclusive o direito de arrependimento de 7 dias nas compras feitas fora do estabelecimento (art. 49), quando aplicável.</li>
        </ul>

        <h2 className={h}>3. Papel da {SITE.nome}</h2>
        <p>
          A {SITE.nome} oferece a tecnologia da vitrine e se esforça para manter o site funcionando e seguro, mas <b>não é
          parte da venda</b> entre o cliente e a loja. Os preços do site são estimados: o valor final é confirmado na conversa
          com a loja.
        </p>

        <h2 className={h}>4. Uso do site pelo cliente</h2>
        <ul className="ml-5 list-disc">
          <li>Use o site de boa-fé: não envie pedidos falsos nem tente atrapalhar o funcionamento.</li>
          <li>Confira os detalhes do pedido (tamanho, cor, quantidade) antes de enviar e confirme tudo com a loja.</li>
          <li>Os códigos de acompanhamento de pedido são pessoais: compartilhe só com quem quiser.</li>
        </ul>

        <h2 className={h}>5. Conteúdo e marcas</h2>
        <p>
          As fotos, textos e marcas de cada loja pertencem à própria loja, que declara ter o direito de usá-los. Se você
          acredita que algum conteúdo viola um direito seu, fale com a gente pelo contato do rodapé para análise e remoção.
        </p>

        <h2 className={h}>6. Privacidade</h2>
        <p>O tratamento de dados está explicado na <Link href="/privacidade" className="underline">Política de Privacidade</Link>.</p>

        <h2 className={h}>7. Mudanças nestes termos</h2>
        <p>Estes termos podem ser atualizados. A versão em vigor é sempre a publicada nesta página.</p>
      </main>
      <Rodape />
    </div>
  );
}
