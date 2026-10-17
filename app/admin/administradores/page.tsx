"use client";
// =====================================================================
// PAINEL — ADMINISTRADORES (endereço: /admin/administradores) · só master
//   - Criar acesso: e-mail, senha provisória e lojas que a pessoa cuida
//   - Mudar as lojas de cada um, definir nova senha, tornar master
//   - Remover acesso (apaga a conta)
// As ações passam pela API /api/admin/usuarios (que roda no servidor).
// =====================================================================
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin, { type InfoAdmin } from "@/components/admin/AreaAdmin";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";

type Usuario = { id: string; email: string; master: boolean; lojas: string[]; ultimoAcesso: string | null };
type LojaSimples = { id: string; nome: string; cor: string | null };

// Chama a API mandando o "crachá" de login de quem está usando o painel
async function api(metodo: "GET" | "POST", corpo?: object) {
  const { data } = await supabaseNavegador().auth.getSession();
  const resposta = await fetch("/api/admin/usuarios", {
    method: metodo,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const json = await resposta.json();
  if (!resposta.ok) throw new Error(json.erro ?? "Erro desconhecido");
  return json;
}

// Senha provisória fácil de ditar: ex. "lojas-4821"
const senhaAleatoria = () => `lojas-${Math.floor(1000 + Math.random() * 9000)}`;

export default function PainelAdministradores() {
  return <AreaAdmin>{(info) => (info.master ? <Conteudo info={info} /> : <p>Só o administrador master gerencia acessos.</p>)}</AreaAdmin>;
}

function Conteudo({ info }: { info: InfoAdmin }) {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [lojas, setLojas] = useState<LojaSimples[]>([]);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [novo, setNovo] = useState({ email: "", senha: senhaAleatoria(), lojas: [] as string[], master: false });

  const recarregar = useCallback(async () => {
    try {
      const r = await api("GET");
      setUsuarios(r.usuarios);
    } catch (e) {
      setAviso({ tipo: "erro", texto: (e as Error).message });
      setUsuarios([]);
    }
  }, []);

  useEffect(() => {
    recarregar();
    supabaseNavegador().from("lojas").select("id, nome, cor").order("ordem").then(({ data }: { data: LojaSimples[] | null }) => setLojas(data ?? []));
  }, [recarregar]);

  async function executar(corpo: object, sucesso: string) {
    try {
      await api("POST", corpo);
      setAviso({ tipo: "ok", texto: sucesso });
      recarregar();
      return true;
    } catch (e) {
      setAviso({ tipo: "erro", texto: (e as Error).message });
      return false;
    }
  }

  async function criar() {
    if (!novo.email.includes("@")) return setAviso({ tipo: "erro", texto: "Digite um e-mail válido." });
    if (novo.senha.length < 6) return setAviso({ tipo: "erro", texto: "A senha precisa ter pelo menos 6 caracteres." });
    const ok = await executar({ acao: "criar", ...novo },
      `✓ Acesso criado! Mande para a pessoa: endereço do site /admin · e-mail ${novo.email} · senha ${novo.senha}`);
    if (ok) setNovo({ email: "", senha: senhaAleatoria(), lojas: [], master: false });
  }

  // Botões de loja (marcar/desmarcar)
  const escolhaDeLojas = (marcadas: string[], aoMudar: (l: string[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {lojas.map((l) => {
        const ligada = marcadas.includes(l.id);
        return (
          <button key={l.id} type="button" onClick={() => aoMudar(ligada ? marcadas.filter((x) => x !== l.id) : [...marcadas, l.id])}
            className="rounded-full border px-3 py-1.5 text-sm" style={ligada ? { background: l.cor ?? "#333", color: "white", borderColor: l.cor ?? "#333" } : {}}>
            {ligada ? "✓ " : ""}{l.nome}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <Link href="/admin" className="text-sm opacity-60">← Painel</Link>
      <h1 className="mt-1 mb-4 text-2xl font-bold">👥 Administradores</h1>
      {aviso && <p className={`mb-4 rounded-xl p-3 text-sm ${aviso.tipo === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{aviso.texto}</p>}

      <Bloco titulo="➕ Novo administrador">
        <Campo rotulo="E-mail"><input type="email" className={estiloInput} value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="socia@email.com" /></Campo>
        <Campo rotulo="Senha provisória (a pessoa troca depois em 'Minha conta')">
          <div className="flex gap-2">
            <input className={estiloInput} value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
            <button type="button" className="mt-1 rounded-lg border px-3 text-sm" onClick={() => setNovo({ ...novo, senha: senhaAleatoria() })}>🎲</button>
          </div>
        </Campo>
        <div>
          <span className="text-sm font-semibold">Lojas que vai administrar</span>
          <div className="mt-1">{escolhaDeLojas(novo.lojas, (l) => setNovo({ ...novo, lojas: l }))}</div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={novo.master} onChange={(e) => setNovo({ ...novo, master: e.target.checked })} /> Também é master (mexe em tudo)
        </label>
        <button type="button" onClick={criar} className="w-full rounded-xl bg-stone-900 p-3 font-semibold text-white">Criar acesso</button>
      </Bloco>

      <Bloco titulo="Quem tem acesso">
        {!usuarios ? <p className="opacity-60">Carregando...</p> : usuarios.map((u) => (
          <LinhaUsuario key={u.id} usuario={u} souEu={u.id === info.userId} escolhaDeLojas={escolhaDeLojas} executar={executar} />
        ))}
      </Bloco>
    </>
  );
}

function LinhaUsuario({ usuario, souEu, escolhaDeLojas, executar }: {
  usuario: Usuario; souEu: boolean;
  escolhaDeLojas: (marcadas: string[], aoMudar: (l: string[]) => void) => React.ReactNode;
  executar: (corpo: object, sucesso: string) => Promise<boolean>;
}) {
  const [lojas, setLojas] = useState(usuario.lojas);
  const mudou = lojas.slice().sort().join() !== usuario.lojas.slice().sort().join();

  return (
    <div className="space-y-2 rounded-xl bg-stone-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <b className="min-w-0 flex-1 truncate">{usuario.email}{souEu && " (você)"}</b>
        {usuario.master && <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs text-white">master</span>}
      </div>
      <p className="text-xs opacity-60">
        Último acesso: {usuario.ultimoAcesso ? new Date(usuario.ultimoAcesso).toLocaleString("pt-BR") : "nunca entrou"}
      </p>
      {escolhaDeLojas(lojas, setLojas)}
      <div className="flex flex-wrap gap-2 pt-1">
        {mudou && (
          <button type="button" className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white"
            onClick={() => executar({ acao: "lojas", userId: usuario.id, lojas }, "✓ Lojas atualizadas.")}>Salvar lojas</button>
        )}
        <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => {
          const senha = prompt(`Nova senha para ${usuario.email} (mínimo 6 caracteres):`);
          if (senha && senha.length >= 6) executar({ acao: "senha", userId: usuario.id, senha }, `✓ Senha trocada. Nova senha: ${senha}`);
        }}>🔑 Nova senha</button>
        {!souEu && (
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm"
            onClick={() => executar({ acao: "master", userId: usuario.id, master: !usuario.master }, "✓ Permissão atualizada.")}>
            {usuario.master ? "Tirar master" : "Tornar master"}
          </button>
        )}
        {!souEu && (
          <button type="button" className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600" onClick={() => {
            if (confirm(`Remover o acesso de ${usuario.email}? A conta será apagada.`)) executar({ acao: "remover", userId: usuario.id }, "✓ Acesso removido.");
          }}>Remover acesso</button>
        )}
      </div>
    </div>
  );
}
