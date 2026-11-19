// =====================================================================
// 🔔 ENVIO DAS NOTIFICAÇÕES PUSH (roda SÓ no servidor)
// Precisa de 3 variáveis no .env.local e na Vercel (veja o LEIA-ME):
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_EMAIL
// Gere as chaves uma vez com:  npx web-push generate-vapid-keys
// =====================================================================
import { sendNotification, setVapidDetails } from "web-push";
import { createClient } from "@supabase/supabase-js";

export function clienteSecreto() {
  const segredo = process.env.SUPABASE_SECRET_KEY;
  if (!segredo) throw new Error("Falta SUPABASE_SECRET_KEY no .env.local (e na Vercel).");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, segredo, { auth: { persistSession: false, autoRefreshToken: false } });
}

let configurado = false;
function configurar() {
  if (configurado) return true;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return false;
  const email = process.env.VAPID_EMAIL || "contato@maonlinestore.com.br";
  setVapidDetails(email.startsWith("mailto:") ? email : `mailto:${email}`, publica, privada);
  configurado = true;
  return true;
}

export type Aviso = { titulo: string; corpo: string; url: string; tag?: string };
type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string };

// Manda para uma lista de aparelhos; apaga os que não existem mais
async function mandar(inscricoes: Inscricao[], aviso: Aviso) {
  if (!configurar() || !inscricoes.length) return 0;
  const sb = clienteSecreto();
  let enviados = 0;
  await Promise.all(inscricoes.map(async (i) => {
    try {
      await sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, JSON.stringify(aviso), { TTL: 60 * 60 * 24, urgency: "high" });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await sb.from("push_inscricoes").delete().eq("id", i.id);
    }
  }));
  return enviados;
}

// Todos os aparelhos de quem cuida da loja (administradores dela + master)
export async function avisarLoja(lojaId: string, aviso: Aviso) {
  const sb = clienteSecreto();
  const [{ data: donos }, { data: masters }] = await Promise.all([
    sb.from("loja_admins").select("user_id").eq("loja_id", lojaId),
    sb.from("master_admins").select("user_id"),
  ]);
  const ids = [...new Set([...(donos ?? []), ...(masters ?? [])].map((d) => d.user_id as string))];
  if (!ids.length) return 0;
  const { data } = await sb.from("push_inscricoes").select("id, endpoint, p256dh, auth").in("user_id", ids);
  return mandar((data ?? []) as Inscricao[], aviso);
}

export async function avisarUsuario(userId: string, aviso: Aviso) {
  const { data } = await clienteSecreto().from("push_inscricoes").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  return mandar((data ?? []) as Inscricao[], aviso);
}

export const pushConfigurado = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
