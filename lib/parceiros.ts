// =====================================================================
// BUSCA DE PARCEIROS NO BANCO (página inicial e /parceiros)
// Parceiros em DESTAQUE vêm primeiro; depois, pela ordem.
// =====================================================================
import { supabase } from "@/lib/supabase";
import type { Parceiro } from "@/lib/tipos";

export const COLUNAS_PARCEIRO =
  "id, slug, nome, categoria, descricao, horarios, endereco, whatsapp, instagram, site, logo_url, foto_url, cor, efeito, destaque, selo";

// limite: quantos trazer (0 ou vazio = todos)
export async function buscarParceiros(limite?: number): Promise<Parceiro[]> {
  let consulta = supabase.from("parceiros").select(COLUNAS_PARCEIRO).eq("ativo", true)
    .order("destaque", { ascending: false }).order("ordem");
  if (limite && limite > 0) consulta = consulta.limit(limite);
  const { data } = await consulta;
  return (data ?? []) as Parceiro[];
}
