"use client";
// =====================================================================
// PAINEL — CONFIGURAR UMA LOJA (endereço: /admin/vitraforma)
// Tudo que define a cara e o funcionamento da loja, sem mexer no código:
// nome, contatos, aviso do pedido, cores, fonte, efeito, "em breve" e
// ativa/inativa. Mostra uma prévia do banner enquanto edita.
// Quem pode salvar é decidido pelo banco (regras RLS).
// =====================================================================
import { NOMES_REGIOES, type Regiao, type RegrasFrete } from "@/lib/frete";
import { documentoBonito, documentoValido } from "@/lib/formato";
import { SITE } from "@/lib/config";
import EditorBordaLogo from "@/components/admin/EditorBordaLogo";
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
  "id, slug, nome, descricao, cor, cor_secundaria, cor_fundo, fonte, efeito, logo_url, logo_ajuste, logo_zoom, logo_fundo, sobre, unidade_tamanho, prazo_padrao, lancamento_em, efeito_personalizado_id, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, fretes, frete_cep, razao_social, documento, endereco, email_contato, responsavel, termos_aceitos_em, termos_aceitos_por, whatsapp, instagram, aviso_pedido, em_breve, ativa";

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
    if (campos.fretes) campos.fretes = campos.fretes.filter((f) => f.nome.trim()).map((f) => ({ nome: f.nome.trim(), valor: Number(f.valor) || 0 }));
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
        <CampoImagem rotulo="Logo (fica redonda; ideal: imagem quadrada)" valor={loja.logo_url} aoMudar={(url) => mudar("logo_url", url)} pasta="logos" redonda dica={TAMANHOS.logo}
          recorte={{ proporcao: 1, largura: 600, cores: [loja.cor, loja.cor_secundaria, loja.cor_fundo] }} />
        <EditorBordaLogo logo={loja.logo_url} cor={loja.logo_borda_cor ?? null} largura={loja.logo_borda ?? 3} corDaLoja={cor}
          aoMudar={(v) => { setLoja({ ...loja, logo_borda_cor: v.cor, logo_borda: v.largura }); setMensagem(null); }} />
        <AjusteLogo src={loja.logo_url}
          valor={{ logo_ajuste: loja.logo_ajuste ?? "cobrir", logo_zoom: Number(loja.logo_zoom ?? 1), logo_fundo: loja.logo_fundo ?? "#ffffff" }}
          aoMudar={(v) => { setLoja({ ...loja, ...v }); setMensagem(null); }} />
      </Bloco>

      <Bloco titulo="📦 Frete aproximado por CEP (o cliente calcula sozinho)">
        <p className="text-xs opacity-60">O cliente digita o CEP no produto ou no carrinho e vê uma estimativa. Deixe vazio o que não quiser usar (aparece “a combinar”). Use valores um pouco acima do real, já que o final é combinado no WhatsApp.</p>
        {(() => {
          const r = loja.frete_cep ?? {};
          const m = (c: Partial<RegrasFrete>) => mudar("frete_cep", { ...r, ...c });
          const valor = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));
          const ler = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")) || 0);
          return (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <Campo rotulo="Sua cidade"><input className={input} value={r.cidade ?? ""} onChange={(e) => m({ cidade: e.target.value })} placeholder="Três Rios" /></Campo>
                <Campo rotulo="Frete na cidade"><input className={input} inputMode="decimal" value={valor(r.cidade_valor)} onChange={(e) => m({ cidade_valor: ler(e.target.value) })} placeholder="0 = grátis" /></Campo>
                <Campo rotulo="Seu estado (UF)"><input className={input} maxLength={2} value={r.uf ?? ""} onChange={(e) => m({ uf: e.target.value.toUpperCase() })} placeholder="RJ" /></Campo>
                <Campo rotulo="Frete no estado"><input className={input} inputMode="decimal" value={valor(r.uf_valor)} onChange={(e) => m({ uf_valor: ler(e.target.value) })} placeholder="20,00" /></Campo>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.keys(NOMES_REGIOES) as Regiao[]).map((k) => (
                  <Campo key={k} rotulo={NOMES_REGIOES[k]}>
                    <input className={input} inputMode="decimal" value={valor(r.regioes?.[k])} onChange={(e) => m({ regioes: { ...(r.regioes ?? {}), [k]: ler(e.target.value) } })} placeholder="a combinar" />
                  </Campo>
                ))}
              </div>
            </div>
          );
        })()}
      </Bloco>

      <Bloco titulo="🚚 Entrega e frete">
        <p className="text-xs opacity-60">Opções que o cliente escolhe no carrinho. O valor entra no total do pedido. Deixe vazio se combinar tudo pelo WhatsApp.</p>
        {(loja.fretes ?? []).map((f, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${input} flex-1`} value={f.nome} placeholder="Ex.: Três Rios - Centro"
              onChange={(e) => mudar("fretes", (loja.fretes ?? []).map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
            <input className={`${input} w-28`} inputMode="decimal" value={String(f.valor).replace(".", ",")} placeholder="0,00"
              onChange={(e) => mudar("fretes", (loja.fretes ?? []).map((x, j) => (j === i ? { ...x, valor: Number(e.target.value.replace(",", ".")) || 0 } : x)))} />
            <button type="button" onClick={() => mudar("fretes", (loja.fretes ?? []).filter((_, j) => j !== i))} className="px-2 text-red-600" aria-label="Remover">🗑️</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => mudar("fretes", [...(loja.fretes ?? []), { nome: "", valor: 0 }])} className="rounded-full border px-4 py-2 text-sm">+ Opção de entrega</button>
          {!(loja.fretes ?? []).some((f) => /retir/i.test(f.nome)) && (
            <button type="button" onClick={() => mudar("fretes", [...(loja.fretes ?? []), { nome: "Retirar com a loja", valor: 0 }])} className="rounded-full border px-4 py-2 text-sm">+ Retirar com a loja (grátis)</button>
          )}
        </div>
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

      <Bloco titulo="🖼️ Banner do topo da loja">
        <CampoImagem rotulo="Imagem do banner (opcional — sem imagem, fica a cor da loja)" valor={loja.banner_url ?? null}
          aoMudar={(url) => mudar("banner_url", url)} pasta={`${loja.slug}/banner`} dica={TAMANHOS.bannerTopo}
          recorte={{ proporcao: 16 / 5, largura: 1920, cores: [loja.cor, loja.cor_secundaria] }} />
        {loja.banner_url && (
          <>
            <label className="block text-sm">Cor da loja por cima da imagem: <b>{loja.banner_escurecer ?? 45}%</b>
              <span className="opacity-60"> (mais alto = texto mais legível)</span>
              <input type="range" min={0} max={90} value={loja.banner_escurecer ?? 45} onChange={(e) => mudar("banner_escurecer", Number(e.target.value))} className="block w-full" />
            </label>
            {/* Prévia do banner */}
            <div className="relative h-28 overflow-hidden rounded-xl text-white">
              <img src={loja.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}aa)`, opacity: (loja.banner_escurecer ?? 45) / 100 }} />
              <b className="absolute bottom-3 left-4 text-2xl drop-shadow">{loja.nome}</b>
            </div>
          </>
        )}
      </Bloco>

      <Bloco titulo="🌄 Fundo da página da loja">
        <EditorFundo cor={cor} pasta={`${loja.slug}/fundo`} logo={loja.logo_url}
          valor={{ fundo_tipo: loja.fundo_tipo ?? "nenhum", fundo_url: loja.fundo_url ?? null, fundo_opacidade: loja.fundo_opacidade ?? 15, fundo_animacao: loja.fundo_animacao ?? "nenhuma", fundo_cor: loja.fundo_cor ?? null }}
          borda={{ cor: loja.logo_borda_cor, largura: loja.logo_borda }}
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

      <Bloco titulo="📄 Dados legais da loja (obrigatório para vender online)">
        {(!loja.documento || !loja.termos_aceitos_em) && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            ⚠️ Antes de divulgar a loja, preencha o CNPJ (ou CPF) e aceite o termo de responsabilidade. A lei do comércio
            eletrônico pede que estes dados apareçam no site (eles vão no rodapé da loja).
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Razão social (ou nome completo, se for CPF)"><input className={input} value={loja.razao_social ?? ""} onChange={(e) => mudar("razao_social", e.target.value || null)} /></Campo>
          <Campo rotulo="CNPJ ou CPF">
            <input className={input} inputMode="numeric" value={documentoBonito(loja.documento)} placeholder="00.000.000/0000-00"
              onChange={(e) => mudar("documento", e.target.value.replace(/\D/g, "").slice(0, 14) || null)} />
            {loja.documento && (
              <span className={`text-xs ${documentoValido(loja.documento) ? "text-green-700" : "text-red-600"}`}>
                {documentoValido(loja.documento) ? "✓ Número válido" : "Número incompleto ou inválido"}
              </span>
            )}
          </Campo>
          <Campo rotulo="Endereço (pode ser só cidade/UF, se não atender no local)"><input className={input} value={loja.endereco ?? ""} onChange={(e) => mudar("endereco", e.target.value || null)} placeholder="Três Rios - RJ" /></Campo>
          <Campo rotulo="E-mail de contato"><input type="email" className={input} value={loja.email_contato ?? ""} onChange={(e) => mudar("email_contato", e.target.value || null)} /></Campo>
          <Campo rotulo="Responsável pela loja"><input className={input} value={loja.responsavel ?? ""} onChange={(e) => mudar("responsavel", e.target.value || null)} /></Campo>
        </div>
        <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
          <input type="checkbox" className="mt-1" checked={!!loja.termos_aceitos_em}
            onChange={async (e) => {
              if (!e.target.checked) return setLoja({ ...loja, termos_aceitos_em: null, termos_aceitos_por: null });
              const { data } = await supabaseNavegador().auth.getUser();
              setLoja({ ...loja, termos_aceitos_em: new Date().toISOString(), termos_aceitos_por: data.user?.email ?? null });
              setMensagem(null);
            }} />
          <span>
            Declaro que esta loja é responsável pelos seus produtos, preços, prazos, entregas, trocas, garantias, emissão de
            nota fiscal (quando exigida) e pelo atendimento e dados dos seus clientes, conforme os{" "}
            <a href="/termos" target="_blank" className="underline">Termos de Uso</a> da {SITE.nome}.
            {loja.termos_aceitos_em && (
              <span className="mt-1 block text-xs opacity-60">
                ✓ Aceito em {new Date(loja.termos_aceitos_em).toLocaleString("pt-BR")}{loja.termos_aceitos_por ? ` por ${loja.termos_aceitos_por}` : ""} (salve para registrar)
              </span>
            )}
          </span>
        </label>
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
