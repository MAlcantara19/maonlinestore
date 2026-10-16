// =====================================================================
// BUSCA DE PARCEIROS NO BANCO (usada na página inicial e em /parceiros)
// =====================================================================
import { supabase } from "@/lib/supabase";
import type { Parceiro } from "@/lib/tipos";

export const COLUNAS_PARCEIRO =
  "id, slug, nome, categoria, descricao, horarios, endereco, whatsapp, instagram, site, logo_url, foto_url, cor";

export async function buscarParceiros(limite?: number): Promise<Parceiro[]> {
  let consulta = supabase.from("parceiros").select(COLUNAS_PARCEIRO).eq("ativo", true).order("ordem");
  if (limite) consulta = consulta.limit(limite);
  const { data } = await consulta;
  return (data ?? []) as Parceiro[];
}
