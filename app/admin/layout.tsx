// =====================================================================
// MOLDURA DO PAINEL — dá ao painel um "aplicativo" próprio (MA Painel):
// instale pelo navegador estando em /admin e ele fica separado do app
// das lojas, sempre logado como administrador.
// =====================================================================
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel · MA Online Store",
  manifest: "/admin.webmanifest",
  robots: { index: false },
  appleWebApp: { title: "MA Painel", capable: true, statusBarStyle: "black-translucent" },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return children;
}
