// =====================================================================
// CONFIGURAÇÃO DA PÁGINA INICIAL (tabela "site_config")
// Se a tabela ainda não existir ou estiver vazia, usa os valores padrão.
// =====================================================================
import { supabase } from "@/lib/supabase";
import type { ConfigSite } from "@/lib/tipos";

export { CONFIG_PADRAO } from "@/lib/site-padrao";
import { CONFIG_PADRAO } from "@/lib/site-padrao";

export async function buscarConfigSite(): Promise<ConfigSite> {
  const { data } = await supabase.from("site_config").select("*").eq("id", 1).maybeSingle();
  return { ...CONFIG_PADRAO, ...(data ?? {}) };
}
