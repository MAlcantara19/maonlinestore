// =====================================================================
// 🎄 CATÁLOGO TEMÁTICO — os "fundos prontos" e o desenho das páginas.
// Cada tema tem cores, fonte do título e enfeites desenhados na hora
// (flocos, bolinhas de Natal, balões, ovos de Páscoa, corações...).
// As páginas são desenhadas num <canvas>: viram imagens (Instagram,
// WhatsApp, Status) e o PDF é feito com essas mesmas imagens.
//
// Para criar um tema novo: copie um da lista TEMAS e mude as cores,
// a fonte e a lista de "enfeites".
// =====================================================================

export type Enfeite = "flocos" | "estrelas" | "bolas" | "pinheiros" | "baloes" | "confete" | "nuvens" | "ovos" | "flores" | "coracoes" | "brilhos" | "listras" | "fogos" | "aboboras" | "morcegos" | "argolas";

export type Tema = {
  id: string;
  nome: string;
  emoji: string;
  fundo: [string, string]; // degradê de cima para baixo
  destaque: string; // cor do preço, faixas e detalhes
  texto: string; // cor dos textos sobre o fundo
  cartao: string; // fundo do cartão de cada produto
  textoCartao: string;
  fonteTitulo: string; // família (as do Google Fonts carregadas na página)
  enfeites: Enfeite[];
  titulo: string; // título sugerido
  subtitulo: string;
  coresFesta?: string[]; // cores dos balões/confete/bolas
};

export const TEMAS: Tema[] = [
  { id: "natal", nome: "Natal clássico", emoji: "🎄", fundo: ["#8b1a1a", "#3d0808"], destaque: "#f5c542", texto: "#fff8e7", cartao: "#ffffff", textoCartao: "#2b1a12",
    fonteTitulo: "'Great Vibes', cursive", enfeites: ["bolas", "flocos", "estrelas", "pinheiros"], titulo: "Catálogo de Natal", subtitulo: "Presentes feitos com carinho ✨",
    coresFesta: ["#f5c542", "#e8e8e8", "#1f7a3f", "#d4af37"] },
  { id: "natal-verde", nome: "Natal verde", emoji: "🌲", fundo: ["#1b5e3a", "#06281a"], destaque: "#f5c542", texto: "#fffdf5", cartao: "#ffffff", textoCartao: "#14261b",
    fonteTitulo: "'Great Vibes', cursive", enfeites: ["bolas", "flocos", "estrelas", "pinheiros"], titulo: "Feliz Natal", subtitulo: "Escolha o presente perfeito 🎁",
    coresFesta: ["#c0262d", "#f5c542", "#ffffff", "#d4af37"] },
  { id: "natal-dourado", nome: "Natal branco e dourado", emoji: "✨", fundo: ["#fffdf7", "#f3e6c8"], destaque: "#b8860b", texto: "#4a3410", cartao: "#ffffff", textoCartao: "#3a2a0c",
    fonteTitulo: "'Cinzel', Georgia, serif", enfeites: ["bolas", "estrelas", "flocos", "brilhos"], titulo: "Natal Dourado", subtitulo: "Elegância para presentear",
    coresFesta: ["#d4af37", "#e9cf7a", "#b8860b", "#f6e7b4"] },
  { id: "crianca", nome: "Criança / Dia das Crianças", emoji: "🎈", fundo: ["#bfe8ff", "#fff3b0"], destaque: "#ff5a8a", texto: "#1d3557", cartao: "#ffffff", textoCartao: "#1d3557",
    fonteTitulo: "'Baloo 2', 'Comic Sans MS', sans-serif", enfeites: ["nuvens", "baloes", "confete", "estrelas"], titulo: "Mundo Kids", subtitulo: "Diversão que vira lembrança 🧸",
    coresFesta: ["#ff5a8a", "#ffb703", "#3a86ff", "#06d6a0", "#8338ec"] },
  { id: "pascoa", nome: "Páscoa", emoji: "🐣", fundo: ["#fde7f3", "#e8f7d4"], destaque: "#8a4fff", texto: "#5a3825", cartao: "#ffffff", textoCartao: "#4a2e1f",
    fonteTitulo: "'Dancing Script', cursive", enfeites: ["ovos", "flores", "brilhos"], titulo: "Especial de Páscoa", subtitulo: "Doçura para toda a família 🐰",
    coresFesta: ["#ffb3d1", "#b5e48c", "#a0c4ff", "#ffd6a5", "#cdb4db"] },
  { id: "maes", nome: "Dia das Mães / Namorados", emoji: "💗", fundo: ["#ffe1ea", "#ffc2d1"], destaque: "#d6336c", texto: "#6b1d3a", cartao: "#ffffff", textoCartao: "#4a1428",
    fonteTitulo: "'Dancing Script', cursive", enfeites: ["coracoes", "flores", "brilhos"], titulo: "Com amor", subtitulo: "Para quem a gente ama 💐",
    coresFesta: ["#ff8fab", "#d6336c", "#ffb3c6", "#ffffff"] },
  { id: "black", nome: "Black Friday / Ofertas", emoji: "🖤", fundo: ["#161616", "#000000"], destaque: "#facc15", texto: "#ffffff", cartao: "#1f1f1f", textoCartao: "#ffffff",
    fonteTitulo: "'Bebas Neue', Impact, sans-serif", enfeites: ["listras", "brilhos"], titulo: "OFERTAS", subtitulo: "Só por tempo limitado ⚡",
    coresFesta: ["#facc15"] },
  { id: "ano-novo", nome: "Ano Novo / Réveillon", emoji: "🥂", fundo: ["#0b1a3a", "#020617"], destaque: "#e9c46a", texto: "#ffffff", cartao: "#ffffff", textoCartao: "#0b1a3a",
    fonteTitulo: "'Cinzel', Georgia, serif", enfeites: ["fogos", "estrelas", "brilhos"], titulo: "Feliz Ano Novo", subtitulo: "Comece o ano com estilo ✨",
    coresFesta: ["#e9c46a", "#ffffff", "#c0c0c0", "#f4a261"] },
  { id: "pais", nome: "Dia dos Pais", emoji: "👔", fundo: ["#1e3a5f", "#0b1726"], destaque: "#d4a373", texto: "#f8f4ee", cartao: "#ffffff", textoCartao: "#1e2a38",
    fonteTitulo: "'Playfair Display', Georgia, serif", enfeites: ["estrelas", "brilhos"], titulo: "Dia dos Pais", subtitulo: "Para o herói da família 💙",
    coresFesta: ["#d4a373", "#ffffff"] },
  { id: "halloween", nome: "Halloween", emoji: "🎃", fundo: ["#2b0f3a", "#0d0512"], destaque: "#ff7b00", texto: "#ffe8cc", cartao: "#ffffff", textoCartao: "#2b0f3a",
    fonteTitulo: "'Righteous', sans-serif", enfeites: ["morcegos", "aboboras", "estrelas"], titulo: "Halloween", subtitulo: "Doces ou travessuras? 👻",
    coresFesta: ["#ff7b00", "#9d4edd", "#ffffff"] },
  { id: "casamento", nome: "Casamento / Noivas", emoji: "💍", fundo: ["#fffaf6", "#f6e3dc"], destaque: "#b07d62", texto: "#5a3e36", cartao: "#ffffff", textoCartao: "#4a332c",
    fonteTitulo: "'Great Vibes', cursive", enfeites: ["argolas", "flores", "brilhos"], titulo: "Para o grande dia", subtitulo: "Lembranças que ficam para sempre 💐",
    coresFesta: ["#e8b4b8", "#f6d6ad", "#ffffff", "#d8a48f"] },
  { id: "loja", nome: "Cores da loja", emoji: "🛍️", fundo: ["#3B1260", "#1a0830"], destaque: "#f5c542", texto: "#ffffff", cartao: "#ffffff", textoCartao: "#1c1917",
    fonteTitulo: "'Playfair Display', Georgia, serif", enfeites: ["brilhos", "estrelas"], titulo: "Nosso catálogo", subtitulo: "Feito à mão, pensado para você",
    coresFesta: ["#ffffff"] },
];

// Fontes que os temas usam (a página carrega todas do Google Fonts)
export const FONTES_CATALOGO = ["cursiva", "classica", "divertida", "manuscrita", "marcante", "elegante", "retro"];

// Sugere o tema pelo nome da coleção/categoria ("Natal" → natal, "Páscoa" → páscoa...)
export function temaPeloNome(nome: string): string | null {
  const n = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/natal|noel/.test(n)) return "natal";
  if (/pascoa|coelh/.test(n)) return "pascoa";
  if (/crianc|kids|infantil|brinquedo|bebe/.test(n)) return "crianca";
  if (/maes|mae|namorad|amor/.test(n)) return "maes";
  if (/black|oferta|promo/.test(n)) return "black";
  if (/ano novo|reveillon|virada/.test(n)) return "ano-novo";
  if (/pais|pai\b|papai(?! noel)/.test(n)) return "pais";
  if (/halloween|bruxa|terror/.test(n)) return "halloween";
  if (/casamento|noiv|bodas|madrinha|padrinho/.test(n)) return "casamento";
  return null;
}

// ---------------------------------------------------------------------
// Sorteio "fixo": a mesma página sempre sai com os enfeites no mesmo lugar
// ---------------------------------------------------------------------
export function sorteio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

export function retanguloRedondo(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ----------------------------- enfeites -------------------------------
function floco(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.5, r / 9); ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.25, -r * 0.8);
    ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.25, -r * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

function estrela(ctx: Ctx, x: number, y: number, r: number, cor: string, pontas = 5) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = cor; ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) {
    const raio = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / pontas) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * raio, Math.sin(a) * raio);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function brilho(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = cor; ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r); ctx.fill(); ctx.restore();
}

function bolaNatal(ctx: Ctx, x: number, yTopo: number, fio: number, r: number, cor: string) {
  const y = yTopo + fio + r;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, yTopo); ctx.lineTo(x, y - r); ctx.stroke();
  ctx.fillStyle = "#c9a227"; ctx.fillRect(x - r * 0.28, y - r - r * 0.22, r * 0.56, r * 0.3);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.25, cor); g.addColorStop(1, escurecer(cor, 0.45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function pinheiro(ctx: Ctx, x: number, base: number, alt: number, cor: string) {
  ctx.save(); ctx.fillStyle = cor;
  for (let i = 0; i < 3; i++) {
    const topo = base - alt + i * alt * 0.25;
    const larg = alt * (0.32 + i * 0.12);
    ctx.beginPath(); ctx.moveTo(x, topo); ctx.lineTo(x - larg, topo + alt * 0.45); ctx.lineTo(x + larg, topo + alt * 0.45); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(x - alt * 0.05, base - alt * 0.08, alt * 0.1, alt * 0.12);
  ctx.restore();
}

function balao(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.bezierCurveTo(x - r * 0.4, y + r * 1.8, x + r * 0.4, y + r * 2.2, x, y + r * 2.8); ctx.stroke();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.2);
  g.addColorStop(0, "rgba(255,255,255,0.85)"); g.addColorStop(0.3, cor); g.addColorStop(1, escurecer(cor, 0.3));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = escurecer(cor, 0.2); ctx.beginPath(); ctx.moveTo(x, y + r * 1.15); ctx.lineTo(x - r * 0.15, y + r * 1.32); ctx.lineTo(x + r * 0.15, y + r * 1.32); ctx.fill();
  ctx.restore();
}

function nuvem(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath();
  [[0, 0, 1], [r * 0.9, r * 0.15, 0.8], [-r * 0.9, r * 0.2, 0.75], [r * 0.4, -r * 0.45, 0.75]].forEach(([dx, dy, k]) => { ctx.moveTo(x + dx + r * k, y + dy); ctx.arc(x + dx, y + dy, r * k, 0, Math.PI * 2); });
  ctx.fill(); ctx.restore();
}

function ovo(ctx: Ctx, x: number, y: number, r: number, cor: string, enfeite: string, ang: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const caminho = () => { ctx.beginPath(); ctx.moveTo(0, -r * 1.3); ctx.bezierCurveTo(r * 0.95, -r * 1.3, r * 1.05, r * 0.95, 0, r); ctx.bezierCurveTo(-r * 1.05, r * 0.95, -r * 0.95, -r * 1.3, 0, -r * 1.3); ctx.closePath(); };
  caminho(); ctx.fillStyle = cor; ctx.fill();
  ctx.save(); caminho(); ctx.clip();
  ctx.strokeStyle = enfeite; ctx.lineWidth = r * 0.14; ctx.beginPath();
  for (let i = -6; i <= 6; i++) { const px = (i * r) / 3; ctx.lineTo(px, i % 2 === 0 ? -r * 0.1 : r * 0.12); }
  ctx.stroke();
  ctx.fillStyle = enfeite; [[-0.4, -0.6], [0.35, -0.7], [0, 0.55], [-0.45, 0.5], [0.45, 0.45]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.1, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.55, r * 0.18, r * 0.32, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function flor(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = cor;
  for (let i = 0; i < 5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.35, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function fogo(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, r / 14);
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, r / 16, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function abobora(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#3a5a1a"; ctx.fillRect(-r * 0.1, -r * 1.15, r * 0.2, r * 0.35);
  [[-0.45, 0.75], [0.45, 0.75], [0, 0.8]].forEach(([dx, k]) => { ctx.fillStyle = dx === 0 ? "#ff8c1a" : "#e66a00"; ctx.beginPath(); ctx.ellipse(dx * r, 0, r * k * 0.75, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = "#2b1200";
  [[-0.35, -0.15], [0.35, -0.15]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(dx * r - r * 0.13, dy * r + r * 0.1); ctx.lineTo(dx * r, dy * r - r * 0.12); ctx.lineTo(dx * r + r * 0.13, dy * r + r * 0.1); ctx.fill(); });
  ctx.beginPath(); ctx.moveTo(-r * 0.45, r * 0.25); ctx.quadraticCurveTo(0, r * 0.65, r * 0.45, r * 0.25); ctx.quadraticCurveTo(0, r * 0.45, -r * 0.45, r * 0.25); ctx.fill();
  ctx.restore();
}

function morcego(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = cor; ctx.beginPath();
  ctx.moveTo(0, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.6, r, -r * 0.3); ctx.quadraticCurveTo(r * 0.8, 0, r * 0.85, r * 0.25);
  ctx.quadraticCurveTo(r * 0.55, r * 0.05, r * 0.4, r * 0.3); ctx.quadraticCurveTo(r * 0.2, r * 0.1, 0, r * 0.35);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.1, -r * 0.4, r * 0.3); ctx.quadraticCurveTo(-r * 0.55, r * 0.05, -r * 0.85, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.8, 0, -r, -r * 0.3); ctx.quadraticCurveTo(-r * 0.5, -r * 0.6, 0, -r * 0.2);
  ctx.fill(); ctx.restore();
}

function argolas(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.strokeStyle = cor; ctx.lineWidth = r * 0.16;
  ctx.beginPath(); ctx.arc(x - r * 0.45, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + r * 0.45, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function coracao(ctx: Ctx, x: number, y: number, r: number, cor: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = cor; ctx.beginPath();
  ctx.moveTo(0, r * 0.35);
  ctx.bezierCurveTo(-r * 1.2, -r * 0.4, -r * 0.5, -r * 1.3, 0, -r * 0.55);
  ctx.bezierCurveTo(r * 0.5, -r * 1.3, r * 1.2, -r * 0.4, 0, r * 0.35);
  ctx.fill(); ctx.restore();
}

export function escurecer(hex: string, quanto: number) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((c) => Math.round(parseInt(c, 16) * (1 - quanto)));
  return `rgb(${r},${g},${b})`;
}

// Fundo + enfeites de uma página inteira (L×A). "seguro" = área do miolo,
// onde os enfeites ficam mais fraquinhos para não brigar com os produtos.
export function desenharFundo(ctx: Ctx, tema: Tema, L: number, A: number, semente: number) {
  const g = ctx.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, tema.fundo[0]); g.addColorStop(1, tema.fundo[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, L, A);
  const rnd = sorteio(semente);
  const cores = tema.coresFesta ?? [tema.destaque];
  const pega = () => cores[Math.floor(rnd() * cores.length)];
  const claro = tema.texto.toLowerCase().startsWith("#f") || tema.texto === "#ffffff";
  const suave = claro ? "rgba(255,255,255," : "rgba(0,0,0,";

  for (const e of tema.enfeites) {
    if (e === "listras") {
      ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = tema.destaque;
      for (let x = -A; x < L; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 40 + A, A); ctx.lineTo(x + A, A); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = tema.destaque; ctx.fillRect(0, 0, L, 14); ctx.fillRect(0, A - 14, L, 14);
    }
    if (e === "flocos") for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.12 + rnd() * 0.3; floco(ctx, rnd() * L, rnd() * A, 8 + rnd() * 22, claro ? "#ffffff" : tema.destaque); }
    if (e === "estrelas") for (let i = 0; i < 14; i++) { ctx.globalAlpha = 0.25 + rnd() * 0.5; estrela(ctx, rnd() * L, rnd() * A * 0.35, 4 + rnd() * 9, tema.destaque); }
    if (e === "brilhos") for (let i = 0; i < 18; i++) { ctx.globalAlpha = 0.2 + rnd() * 0.5; brilho(ctx, rnd() * L, rnd() * A, 5 + rnd() * 14, i % 3 ? tema.destaque : `${suave}0.9)`); }
    if (e === "confete") for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.55; ctx.save(); ctx.translate(rnd() * L, rnd() * A); ctx.rotate(rnd() * Math.PI); ctx.fillStyle = pega(); ctx.fillRect(-6, -2.5, 12, 5); ctx.restore();
    }
    if (e === "nuvens") { ctx.globalAlpha = 1; for (let i = 0; i < 5; i++) nuvem(ctx, rnd() * L, 40 + rnd() * A * 0.9, 30 + rnd() * 30); }
    if (e === "flores") for (let i = 0; i < 12; i++) { ctx.globalAlpha = 0.35 + rnd() * 0.35; flor(ctx, rnd() * L, rnd() * A, 12 + rnd() * 16, pega()); }
    if (e === "fogos") for (let i = 0; i < 7; i++) { ctx.globalAlpha = 0.25 + rnd() * 0.4; fogo(ctx, rnd() * L, rnd() * A * 0.95, 40 + rnd() * 70, pega()); }
    if (e === "morcegos") for (let i = 0; i < 9; i++) { ctx.globalAlpha = 0.35 + rnd() * 0.4; morcego(ctx, rnd() * L, rnd() * A * 0.4, 18 + rnd() * 22, "#000000"); }
    if (e === "argolas") { ctx.globalAlpha = 0.5; argolas(ctx, 90, 95, 30, tema.destaque); argolas(ctx, L - 90, 95, 30, tema.destaque); }
    if (e === "coracoes") for (let i = 0; i < 18; i++) { ctx.globalAlpha = 0.18 + rnd() * 0.35; coracao(ctx, rnd() * L, rnd() * A, 10 + rnd() * 22, pega()); }
    ctx.globalAlpha = 1;
  }
  // Enfeites de "moldura" (desenhados por cima, nas bordas)
  if (tema.enfeites.includes("bolas")) {
    ctx.strokeStyle = claro ? "rgba(255,255,255,0.35)" : `${tema.destaque}66`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(L / 2, 70, L, 8); ctx.stroke();
    [0.07, 0.2, 0.8, 0.93].forEach((p, i) => bolaNatal(ctx, L * p, 8 + Math.sin(p * Math.PI) * 30, 18 + (i % 2) * 34, 20 + (i % 2) * 6, cores[i % cores.length]));
  }
  if (tema.enfeites.includes("pinheiros")) {
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 9; i++) pinheiro(ctx, (L / 8) * i + rnd() * 30, A + 6, 70 + rnd() * 60, claro ? "#ffffff" : tema.destaque);
    ctx.globalAlpha = 1;
  }
  if (tema.enfeites.includes("baloes")) {
    ctx.globalAlpha = 0.9;
    balao(ctx, 70, 120, 34, cores[0]); balao(ctx, 140, 70, 28, cores[2 % cores.length]);
    balao(ctx, L - 80, 110, 34, cores[1 % cores.length]); balao(ctx, L - 150, 60, 26, cores[3 % cores.length]);
    ctx.globalAlpha = 1;
  }
  if (tema.enfeites.includes("aboboras")) {
    ctx.globalAlpha = 1;
    abobora(ctx, 75, 105, 40); abobora(ctx, L - 75, 105, 40); abobora(ctx, 155, 80, 24); abobora(ctx, L - 155, 80, 24);
  }
  if (tema.enfeites.includes("ovos")) {
    // nos cantos de cima (embaixo fica o QR Code)
    ovo(ctx, 70, 100, 38, cores[0], "#ffffff", -0.3); ovo(ctx, 150, 70, 28, cores[1 % cores.length], "#ffffff", 0.25);
    ovo(ctx, L - 75, 100, 38, cores[2 % cores.length], "#ffffff", 0.3); ovo(ctx, L - 152, 68, 26, cores[3 % cores.length], "#ffffff", -0.2);
  }
}

// Quebra o texto em linhas que cabem na largura (com "…" na última)
export function quebrarTexto(ctx: Ctx, texto: string, largura: number, maxLinhas: number): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width <= largura) atual = teste;
    else { if (atual) linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  if (linhas.length > maxLinhas) {
    const corte = linhas.slice(0, maxLinhas);
    let ultima = corte[maxLinhas - 1];
    while (ctx.measureText(`${ultima}…`).width > largura && ultima.length > 1) ultima = ultima.slice(0, -1);
    corte[maxLinhas - 1] = `${ultima.trim()}…`;
    return corte;
  }
  return linhas;
}

// Foto "cobrindo" uma área, sem distorcer (como object-fit: cover)
export function fotoCobrindo(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const e = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, x + (w - img.width * e) / 2, y + (h - img.height * e) / 2, img.width * e, img.height * e);
}
