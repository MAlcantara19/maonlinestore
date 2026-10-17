// =====================================================================
// ROBOTS — diz ao Google o que pode e o que não pode aparecer na busca.
// O painel, a API e o acompanhamento de pedidos ficam de fora.
// =====================================================================
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/pedido"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
