// =====================================================================
// CONFIGURAÇÃO DA PÁGINA INICIAL (tabela "site_config")
// Se a tabela ainda não existir ou estiver vazia, usa os valores padrão.
// =====================================================================
import { supabase } from "@/lib/supabase";
import type { ConfigSite } from "@/lib/tipos";
import { SITE } from "@/lib/config";

export const CONFIG_PADRAO: ConfigSite = {
  titulo: SITE.nome,
  subtitulo: "Escolha uma loja para ver o catálogo",
  cor: "#3B1260",
  cor_secundaria: "#C9B3EE",
  banner_url: null,
  efeito: "nenhum",
  parceiros_na_home: 6,
};

export async function buscarConfigSite(): Promise<ConfigSite> {
  const { data } = await supabase.from("site_config").select("*").eq("id", 1).maybeSingle();
  return { ...CONFIG_PADRAO, ...(data ?? {}) };
}
