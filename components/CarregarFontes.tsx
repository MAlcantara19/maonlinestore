// =====================================================================
// Carrega do Google Fonts só as fontes que a página usa.
// =====================================================================
import { FONTES } from "@/lib/fontes";

export default function CarregarFontes({ fontes }: { fontes: (string | null | undefined)[] }) {
  const links = [...new Set(fontes.map((f) => (f ? FONTES[f]?.link : null)).filter(Boolean))] as string[];
  return <>{links.map((href) => <link key={href} rel="stylesheet" href={href} precedence="default" />)}</>;
}
