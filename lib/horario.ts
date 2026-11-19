// =====================================================================
// 🟢 LOJA ABERTA AGORA — calcula, pelo horário de Brasília, se a loja
// está atendendo. horario vazio = sempre aberta (não mostra nada).
// Formato: { "0": null, "1": ["09:00","18:00"], ... }  (0 = domingo)
// =====================================================================
export type Horario = Record<string, [string, string] | null>;
export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function agoraEmBrasilia(data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(data);
  const pega = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(pega("weekday"));
  return { dia, minutos: Number(pega("hour")) * 60 + Number(pega("minute")) };
}
const min = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

export function situacao(horario: Horario | null | undefined, pausada?: boolean, data = new Date()): { aberta: boolean; texto: string } | null {
  if (pausada) return { aberta: false, texto: "Pausada no momento" };
  if (!horario || !Object.values(horario).some(Boolean)) return null; // sem horário = sempre aberta
  const { dia, minutos } = agoraEmBrasilia(data);
  const hoje = horario[String(dia)];
  if (hoje && minutos >= min(hoje[0]) && minutos < min(hoje[1])) return { aberta: true, texto: `Aberta agora · até ${hoje[1]}` };
  // Próxima abertura
  for (let i = 0; i < 7; i++) {
    const d = (dia + i) % 7, h = horario[String(d)];
    if (!h) continue;
    if (i === 0 && minutos < min(h[0])) return { aberta: false, texto: `Fechada · abre hoje às ${h[0]}` };
    if (i === 1) return { aberta: false, texto: `Fechada · abre amanhã às ${h[0]}` };
    if (i > 1) return { aberta: false, texto: `Fechada · abre ${DIAS[d].toLowerCase()} às ${h[0]}` };
  }
  return { aberta: false, texto: "Fechada no momento" };
}
