// =====================================================================
// POLÍTICA DE PRIVACIDADE (endereço: /privacidade) — texto da LGPD.
// Revise e ajuste se mudar algo no funcionamento do site.
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import { DESENVOLVEDOR, SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Política de Privacidade · ${SITE.nome}` };

export default function Privacidade() {
  const h = "mt-6 text-lg font-bold";
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 leading-relaxed">
        <Link href="/" className="text-sm opacity-70">← Voltar</Link>
        <h1 className="mt-2 text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-sm opacity-60">{SITE.nome} · atualizada em outubro de 2026</p>

        <p className="mt-4">
          A {SITE.nome} reúne lojas parceiras que vendem pelo WhatsApp. Respeitamos a sua privacidade e seguimos a
          Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Aqui explicamos, de forma simples, o que acontece
          com as suas informações.
        </p>

        <h2 className={h}>1. O que coletamos</h2>
        <p>
          Você navega sem precisar de cadastro. Quando envia um pedido ou orçamento, guardamos os itens escolhidos e,
          se você preencher, o seu nome, a data desejada e se é urgente. Isso serve para a loja preparar o pedido e para
          você acompanhar o andamento pelo link enviado.
        </p>

        <h2 className={h}>1.0. WhatsApp para avisos do pedido (opcional)</h2>
        <p>
          Se você quiser, pode informar seu WhatsApp no carrinho. Ele fica guardado junto do pedido e é usado <b>só</b> pela
          loja para te avisar do andamento (aceito, em produção, pronto, enviado...).
        </p>

        <h2 className={h}>1.1. Quem cuida dos seus dados do pedido</h2>
        <p>
          Quando você envia um pedido, a conversa e os dados que você passar (nome, endereço, telefone) ficam com a{" "}
          <b>loja escolhida</b>, que é a responsável por eles (controladora, nos termos da LGPD). Os dados de cada loja
          (razão social e CNPJ ou CPF) aparecem no rodapé da página dela. Veja também os{" "}
          <Link href="/termos" className="underline">Termos de Uso</Link>.
        </p>

        <h2 className={h}>2. Estatísticas anônimas</h2>
        <p>
          Contamos, de forma anônima, visitas, produtos vistos, itens colocados ou tirados do carrinho e favoritos, para as
          lojas saberem o que mais agrada. Não guardamos nome, telefone nem o endereço de internet (IP) de ninguém: o IP é
          transformado num código embaralhado, usado só para evitar abusos (como robôs enviando pedidos falsos).
        </p>

        <h2 className={h}>2.1. Carrinho e favoritos</h2>
        <p>O carrinho e os favoritos ficam salvos apenas no seu próprio aparelho (navegador).</p>

        <h2 className={h}>3. WhatsApp</h2>
        <p>
          O pedido é finalizado na conversa do WhatsApp com a loja. A partir daí, valem também os termos e a política de
          privacidade do próprio WhatsApp.
        </p>

        <h2 className={h}>4. Com quem compartilhamos</h2>
        <p>
          Com ninguém além da loja que você escolheu. Usamos serviços de hospedagem e banco de dados confiáveis para o
          site funcionar. Não vendemos nem cedemos seus dados.
        </p>

        <h2 className={h}>5. Seus direitos</h2>
        <p>
          Você pode pedir a qualquer momento para ver, corrigir ou apagar os dados de um pedido seu. Basta falar com a
          loja pelo WhatsApp ou com o responsável pelo site.
        </p>

        <h2 className={h}>6. Contato</h2>
        <p>
          Responsável pelo site: {DESENVOLVEDOR.nome}
          {DESENVOLVEDOR.email && <> · <a className="underline" href={`mailto:${DESENVOLVEDOR.email}`}>{DESENVOLVEDOR.email}</a></>}
        </p>
      </main>
      <Rodape />
    </div>
  );
}
