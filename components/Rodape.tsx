// =====================================================================
// RODAPÉ — aparece no fim de todas as páginas.
//   Dentro de uma loja: nome e descrição, contato da loja (WhatsApp e
//   Instagram com ícone) e atalhos.
//   Faixa final (em todas as páginas): "© 2026 MA Online Store" e o
//   crédito do desenvolvedor com WhatsApp, e-mail e Instagram.
// Os dados do site e do desenvolvedor ficam em lib/config.ts.
// =====================================================================
import { linkWhatsApp } from "@/lib/whatsapp";
import { BolinhaTelefone, IconeCoracao } from "@/components/Icones";
import Link from "next/link";
import type { Loja } from "@/lib/tipos";
import { DESENVOLVEDOR, SITE } from "@/lib/config";
import { documentoBonito, telefoneBonito, usuarioInstagram } from "@/lib/formato";
import IconeInstagram from "@/components/IconeInstagram";

export default function Rodape({ loja }: { loja?: Loja }) {
  const cor = loja?.cor ?? "#1c1917";
  const link = "inline-flex items-center gap-1.5 opacity-90 hover:underline hover:opacity-100";
  const instaLoja = usuarioInstagram(loja?.instagram);
  const instaDev = usuarioInstagram(DESENVOLVEDOR.instagram);
  const zapDev = linkWhatsApp(DESENVOLVEDOR.whatsapp, 
    `Olá, ${DESENVOLVEDOR.nome.split(" ")[0]}! Vi o site da ${SITE.nome} e quero saber mais 😊`
  );

  return (
    <>
    {/* Espaço mínimo entre o conteúdo e o rodapé */}
    <div aria-hidden className="h-12 shrink-0" />
    {/* mt-auto = empurra o rodapé para o fim da tela quando a página tem pouco conteúdo */}
    <footer className="mt-auto text-white" style={{ background: `linear-gradient(180deg, ${cor}, ${cor}e6)` }}>
      {/* Parte de cima: só dentro de uma loja */}
      {loja && (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <b className="text-lg">{loja.nome}</b>
            {loja.descricao && <p className="mt-1 text-sm opacity-80">{loja.descricao}</p>}
            {/* Dados legais (lei do comércio eletrônico) */}
            {(loja.razao_social || loja.documento) && (
              <p className="mt-3 text-xs leading-relaxed opacity-75">
                {loja.razao_social && <>{loja.razao_social}<br /></>}
                {loja.documento && <>{(loja.documento.replace(/\D/g, "").length === 14 ? "CNPJ " : "CPF ") + documentoBonito(loja.documento)}<br /></>}
                {loja.endereco && <>{loja.endereco}<br /></>}
                {loja.email_contato && <a href={`mailto:${loja.email_contato}`} className="underline">{loja.email_contato}</a>}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 text-sm">
            <b>Fale com a gente</b>
            {loja.whatsapp && (
              <a className={link} target="_blank" rel="noopener noreferrer"
                href={linkWhatsApp(loja.whatsapp.replace(/\D/g, ""), `Olá! Vim pelo site da ${loja.nome} 😊`)}>
                <BolinhaTelefone tamanho={18} /> WhatsApp
              </a>
            )}
            {instaLoja && (
              <a className={link} target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${instaLoja}`}>
                <IconeInstagram /> @{instaLoja}
              </a>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 text-sm">
            <b>Navegue</b>
            <Link href={`/${loja.slug}`} className={link}>🏠 Início da loja</Link>
            <Link href={`/${loja.slug}/carrinho`} className={link}>🛒 Carrinho</Link>
            <Link href="/" className={link}>🏬 Todas as lojas</Link>
            <Link href="/parceiros" className={link}>🤝 Parceiros</Link>
            <Link href={`/${loja.slug}/sobre`} className={link}><IconeCoracao cor="currentColor" /> Sobre a loja</Link>
          </div>
        </div>
      )}

      {/* Selos de confiança */}
      <div className="border-t border-white/15">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 py-4 text-xs opacity-90">
          <li>🔒 Site seguro (HTTPS)</li>
          <li>📄 Lojas identificadas com CNPJ/CPF</li>
          <li>💬 Atendimento direto pelo WhatsApp</li>
          <li>🛡️ Dados protegidos (LGPD)</li>
          <li><Link href="/sacola" className="hover:underline">🛍️ Minha sacola</Link></li>
          <li><Link href="/meus-pedidos" className="hover:underline">🧾 Meus pedidos</Link></li>
        </ul>
      </div>

      {/* Faixa final: direitos + crédito do desenvolvedor.
          pb-24 = espaço para os botões flutuantes não taparem o texto */}
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 pt-5 pb-24 text-center text-xs sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="opacity-85">© {SITE.ano} {SITE.nome}. Todos os direitos reservados.</span>
            <span className="flex gap-3 opacity-80">
              <Link href="/privacidade" className="hover:underline">Política de Privacidade</Link>
              <Link href="/termos" className="hover:underline">Termos de Uso</Link>
              <Link href="/admin" className="hover:underline">🔐 Área do lojista</Link>
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:items-end">
            <span className="opacity-85">
              Desenvolvido por <b>{DESENVOLVEDOR.nome}</b> 💻
            </span>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {DESENVOLVEDOR.whatsapp && (
                <a href={zapDev} target="_blank" rel="noopener noreferrer" className={link}><BolinhaTelefone tamanho={16} /> {telefoneBonito(DESENVOLVEDOR.whatsapp)}</a>
              )}
              {DESENVOLVEDOR.email && (
                <a href={`mailto:${DESENVOLVEDOR.email}`} className={link}>✉️ {DESENVOLVEDOR.email}</a>
              )}
              {instaDev && (
                <a href={`https://instagram.com/${instaDev}`} target="_blank" rel="noopener noreferrer" className={link}>
                  <IconeInstagram tamanho={14} /> @{instaDev}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
