"use client";
// =====================================================================
// PAINEL — CONFIGURAR UMA LOJA (endereço: /admin/vitraforma)
// Tudo que define a cara e o funcionamento da loja, sem mexer no código:
// nome, contatos, aviso do pedido, cores, fonte, efeito, "em breve" e
// ativa/inativa. Mostra uma prévia do banner enquanto edita.
// Quem pode salvar é decidido pelo banco (regras RLS).
// =====================================================================
import EditorFundo from "@/components/admin/EditorFundo";
import { TAMANHOS } from "@/lib/tamanhos";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin, { type InfoAdmin } from "@/components/admin/AreaAdmin";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { OPCOES_EFEITO, OPCOES_FONTE, OPCOES_UNIDADE } from "@/lib/opcoes";
import type { EfeitoPersonalizado, Loja } from "@/lib/tipos";
import { Bloco, Campo, Interruptor, BarraSalvar, type Mensagem } from "@/components/admin/Campos";
import AbasLoja from "@/components/admin/AbasLoja";
import CampoImagem from "@/components/admin/CampoImagem";
import AjusteLogo from "@/components/admin/AjusteLogo";

const COLUNAS =
  "id, slug, nome, descricao, cor, cor_secundaria, cor_fundo, fonte, efeito, logo_url, logo_ajuste, logo_zoom, logo_fundo, sobre, unidade_tamanho, prazo_padrao, lancamento_em, efeito_personalizado_id, fundo_tipo, fundo_url, fundo_opacidade, whatsapp, instagram, aviso_pedido, em_breve, ativa";

export default function PainelLoja() {
  return <AreaAdmin>{(info) => <FormularioDaLoja info={info} />}</AreaAdmin>;
}

function FormularioDaLoja({ info }: { info: InfoAdmin }) {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [naoAchou, setNaoAchou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [personalizados, setPersonalizados] = useState<{ id: string; nome: string }[]>([]);

  // Carrega a loja do banco
  useEffect(() => {
    supabaseNavegador().from("lojas").select(COLUNAS).eq("slug", slug).maybeSingle()
      .then(({ data }: { data: Loja | null }) => (data ? setLoja(data) : setNaoAchou(true)));
  }, [slug]);

  // Efeitos personalizados desta loja (para escolher na Aparência)
  useEffect(() => {
    if (!loja?.id) return;
    supabaseNavegador().from("efeitos_personalizados").select("id, nome").eq("loja_id", loja.id)
      .then(({ data }: { data: Pick<EfeitoPersonalizado, "id" | "nome">[] | null }) => setPersonalizados(data ?? []));
  }, [loja?.id]);

  if (naoAchou) return <p>Loja não encontrada. <Link href="/admin" className="underline">Voltar</Link></p>;
  if (!loja) return <p className="opacity-60">Carregando...</p>;

  // Atualiza um campo no formulário (ainda não salva no banco)
  const mudar = <K extends keyof Loja>(campo: K, valor: Loja[K]) => { setLoja({ ...loja, [campo]: valor }); setMensagem(null); };

  async function salvar() {
    if (!loja) return;
    setSalvando(true);
    const { id, slug: _slug, ...campos } = loja; // id e slug não mudam por aqui
    const { data, error } = await supabaseNavegador().from("lojas").update(campos).eq("id", id).select("id");
    if (error) setMensagem({ tipo: "erro", texto: `Não deu para salvar: ${error.message}` });
    else if (!data || data.length === 0) setMensagem({ tipo: "erro", texto: "Sua conta não tem permissão para alterar esta loja." });
    else setMensagem({ tipo: "ok", texto: "✓ Salvo! Atualize a loja para ver." });
    setSalvando(false);
  }

  const cor = loja.cor ?? "#333333";
  const input = "mt-1 w-full rounded-lg border bg-white px-3 py-2";

  return (
    <>
      <AbasLoja slug={loja.slug} nome={loja.nome} cor={cor} />

      {/* Prévia do banner: muda na hora conforme as cores */}
      <div className="mb-6 overflow-hidden rounded-2xl shadow">
        <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
          <b className="text-2xl">{loja.nome}</b>
          <p className="text-sm opacity-90">{loja.descricao}</p>
        </div>
        <div className="flex gap-2 p-2" style={{ background: loja.cor_secundaria ?? "#eee" }}>
          <span className="rounded-full border bg-white/70 px-3 py-1 text-sm" style={{ borderColor: cor, color: cor }}>⭐ Destaques</span>
          <span className="rounded-full border bg-white/70 px-3 py-1 text-sm" style={{ borderColor: cor, color: cor }}>Categoria</span>
        </div>
        <div className="p-3 text-sm" style={{ background: loja.cor_fundo ?? "#fff" }}>Fundo da página</div>
      </div>

      <Bloco titulo="📝 Informações">
        <Campo rotulo="Nome da loja"><input className={input} value={loja.nome} onChange={(e) => mudar("nome", e.target.value)} /></Campo>
        <Campo rotulo="Descrição curta"><input className={input} value={loja.descricao ?? ""} onChange={(e) => mudar("descricao", e.target.value)} /></Campo>
        <CampoImagem rotulo="Logo (fica redonda; ideal: imagem quadrada)" valor={loja.logo_url} aoMudar={(url) => mudar("logo_url", url)} pasta="logos" redonda dica={TAMANHOS.logo} />
        <AjusteLogo src={loja.logo_url}
          valor={{ logo_ajuste: loja.logo_ajuste ?? "cobrir", logo_zoom: Number(loja.logo_zoom ?? 1), logo_fundo: loja.logo_fundo ?? "#ffffff" }}
          aoMudar={(v) => { setLoja({ ...loja, ...v }); setMensagem(null); }} />
      </Bloco>

      <Bloco titulo="📞 Contato">
        <Campo rotulo="WhatsApp que recebe os pedidos (55 + DDD + número)">
          <input className={input} inputMode="numeric" value={loja.whatsapp ?? ""} onChange={(e) => mudar("whatsapp", e.target.value)} placeholder="5524999999999" />
        </Campo>
        <Campo rotulo="Instagram (pode ser @loja, loja ou o link)">
          <input className={input} value={loja.instagram ?? ""} onChange={(e) => mudar("instagram", e.target.value || null)} placeholder="@minhaloja" />
        </Campo>
        <Campo rotulo="Sobre a loja (página 'Sobre nós': história, quem faz, valores...)">
          <textarea rows={5} className={input} value={loja.sobre ?? ""} onChange={(e) => mudar("sobre", e.target.value || null)} />
        </Campo>
        <Campo rotulo="Como funciona o pedido (aparece na loja e no carrinho)">
          <textarea rows={4} className={input} value={loja.aviso_pedido ?? ""} onChange={(e) => mudar("aviso_pedido", e.target.value || null)} />
        </Campo>
      </Bloco>

      <Bloco titulo="🎨 Aparência">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Cor principal"><input type="color" className="mt-1 h-11 w-full rounded-lg" value={loja.cor ?? "#333333"} onChange={(e) => mudar("cor", e.target.value)} /></Campo>
          <Campo rotulo="Cor secundária (mais clara)"><input type="color" className="mt-1 h-11 w-full rounded-lg" value={loja.cor_secundaria ?? "#eeeeee"} onChange={(e) => mudar("cor_secundaria", e.target.value)} /></Campo>
          <Campo rotulo="Cor de fundo">
            <input type="color" className="mt-1 h-11 w-full rounded-lg" value={loja.cor_fundo ?? "#ffffff"} onChange={(e) => mudar("cor_fundo", e.target.value)} />
            <label className="mt-1 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!loja.cor_fundo} onChange={(e) => mudar("cor_fundo", e.target.checked ? null : "#ffffff")} /> Usar o fundo padrão do site
            </label>
          </Campo>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Fonte dos títulos">
            <select className={input} value={loja.fonte ?? "moderna"} onChange={(e) => mudar("fonte", e.target.value as Loja["fonte"])}>
              {OPCOES_FONTE.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Efeito animado da loja (tem prioridade sobre o das coleções; Nenhum = usa o da coleção em destaque)">
            <select className={input} value={loja.efeito ?? "nenhum"} onChange={(e) => mudar("efeito", e.target.value as Loja["efeito"])}>
              {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="🌄 Fundo da página da loja">
        <EditorFundo cor={cor} pasta={`${loja.slug}/fundo`} logo={loja.logo_url}
          valor={{ fundo_tipo: loja.fundo_tipo ?? "nenhum", fundo_url: loja.fundo_url ?? null, fundo_opacidade: loja.fundo_opacidade ?? 15 }}
          aoMudar={(v) => { setLoja({ ...loja, ...v }); setMensagem(null); }} />
      </Bloco>

      <Bloco titulo="✨ Efeito personalizado (com as suas imagens)">
        <Campo rotulo="Efeito na loja toda (tem prioridade sobre os efeitos prontos)">
          <select className={input} value={loja.efeito_personalizado_id ?? ""} onChange={(e) => mudar("efeito_personalizado_id", e.target.value || null)}>
            <option value="">Nenhum (usa o efeito pronto acima)</option>
            {personalizados.map((e) => <option key={e.id} value={e.id}>✨ {e.nome}</option>)}
          </select>
        </Campo>
        <p className="text-xs opacity-60">Crie efeitos na aba ✨ Efeitos. Para usar só numa categoria ou coleção, escolha lá em Categorias e coleções.</p>
      </Bloco>

      <Bloco titulo="⏱️ Prazo padrão">
        <Campo rotulo="Já vem preenchido em todo produto novo (ex.: 10 dias)">
          <input list="lista-prazo-loja" className={input} value={loja.prazo_padrao ?? ""} onChange={(e) => mudar("prazo_padrao", e.target.value || null)} placeholder="10 dias" />
          <datalist id="lista-prazo-loja">{["3 dias", "5 dias", "7 dias", "10 dias", "15 dias", "20 dias", "30 dias"].map((x) => <option key={x} value={x} />)}</datalist>
        </Campo>
      </Bloco>

      <Bloco titulo="📏 Tamanhos">
        <Campo rotulo="Unidade padrão (digitou só o número, o sistema completa: 20 → 20 cm)">
          <select className={input} value={loja.unidade_tamanho ?? "cm"} onChange={(e) => mudar("unidade_tamanho", e.target.value)}>
            {OPCOES_UNIDADE.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        </Campo>
      </Bloco>

      <Bloco titulo="👀 Visibilidade">
        {loja.em_breve && (
          <Campo rotulo="⏳ Data e hora da inauguração (mostra a contagem regressiva na página inicial)">
            <input type="datetime-local" className={input}
              value={loja.lancamento_em ? new Date(new Date(loja.lancamento_em).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
              onChange={(e) => mudar("lancamento_em", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </Campo>
        )}
        <Interruptor rotulo="Em breve" ajuda="Aparece apagadinha na página inicial, sem abrir. Pelo link direto continua abrindo."
          ligado={!!loja.em_breve} aoMudar={(v) => mudar("em_breve", v)} />
        {/* Só o master desativa uma loja inteira */}
        {info.master && (
          <Interruptor rotulo="Loja ativa" ajuda="Desligado: a loja some do site inteiro."
            ligado={loja.ativa !== false} aoMudar={(v) => mudar("ativa", v)} />
        )}
      </Bloco>

      <BarraSalvar mensagem={mensagem} salvando={salvando} aoSalvar={salvar} cor={cor} />
    </>
  );
}
