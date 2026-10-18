// =====================================================================
// MAPA DO SITE (sitemap.xml) — a lista de páginas para o Google achar
// as lojas, os produtos e os parceiros.
// =====================================================================
import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { SITE } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // sempre com os dados atuais
  const base = SITE.url;
  const paginas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/parceiros`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/sacola`, changeFrequency: "yearly", priority: 0.1 },
  ];
  try {
    const [{ data: lojas }, { data: produtos }, { data: parceiros }] = await Promise.all([
      supabase.from("lojas").select("id, slug").eq("ativa", true).eq("em_breve", false),
      supabase.from("produtos").select("id, loja_id, atualizado_em, criado_em").eq("ativo", true).limit(5000),
      supabase.from("parceiros").select("slug").eq("ativo", true),
    ]);
    const slugDe = new Map((lojas ?? []).map((l: { id: string; slug: string }) => [l.id, l.slug]));
    (lojas ?? []).forEach((l: { slug: string }) => paginas.push({ url: `${base}/${l.slug}`, changeFrequency: "daily", priority: 0.9 }));
    (produtos ?? []).forEach((p: { id: string; loja_id: string; atualizado_em: string | null; criado_em: string }) => {
      const slug = slugDe.get(p.loja_id);
      if (slug) paginas.push({ url: `${base}/${slug}/p/${p.id}`, lastModified: p.atualizado_em ?? p.criado_em, priority: 0.7 });
    });
    (parceiros ?? []).forEach((p: { slug: string }) => paginas.push({ url: `${base}/parceiros/${p.slug}`, priority: 0.4 }));
  } catch {
    // sem banco: devolve só as páginas fixas
  }
  return paginas;
}
