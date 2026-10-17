// =====================================================================
// CONFIGURAÇÕES GERAIS DO SITE — mude aqui e vale para o site todo.
// =====================================================================
export const SITE = {
  nome: "MA Online Store",
  // Endereço do site no ar (usado pelo Google e nas prévias de link).
  // Quando tiver o domínio próprio, troque aqui ou na variável NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://maonlinestore.vercel.app",
  ano: 2026, // ano de início, usado no "© 2026"
};

// Quem fez o site: aparece na faixa final do rodapé de TODAS as páginas.
// Deixe "" (vazio) no que não quiser mostrar.
export const DESENVOLVEDOR = {
  nome: "Matheus Alcântara",
  whatsapp: "5524992924519", // 55 + DDD + número, só números
  email: "matheusalcan19@gmail.com",
  instagram: "m_alcantara19", // só o usuário, sem @
};
