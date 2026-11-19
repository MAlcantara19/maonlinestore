// =====================================================================
// 🔔 "AJUDANTE" DO NAVEGADOR (service worker) — fica rodando por trás,
// mesmo com o site fechado, só para receber os avisos de pedido novo e
// mostrar a notificação no celular/computador.
// =====================================================================
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let dados = {};
  try { dados = e.data ? e.data.json() : {}; } catch { dados = { corpo: e.data ? e.data.text() : "" }; }
  const titulo = dados.titulo || "🛒 Pedido novo!";
  e.waitUntil(self.registration.showNotification(titulo, {
    body: dados.corpo || "Chegou um pedido novo na loja.",
    icon: "/icones/icone-192.png",
    badge: "/icones/icone-192.png",
    tag: dados.tag || undefined,
    renotify: !!dados.tag,
    vibrate: [120, 60, 120],
    data: { url: dados.url || "/admin" },
  }));
});

// Tocou na notificação: abre (ou traz para frente) o painel no pedido
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/admin";
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Aviso do painel: reaproveita a janela do painel. Aviso do cliente: a do pedido.
    const alvo = url.startsWith("/admin") ? abertas.find((c) => c.url.includes("/admin")) : abertas.find((c) => c.url.includes(url));
    if (alvo && "focus" in alvo) { await alvo.focus(); if ("navigate" in alvo) alvo.navigate(url).catch(() => {}); return; }
    await self.clients.openWindow(url);
  })());
});
