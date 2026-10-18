-- =====================================================================
-- ATUALIZAÇÃO 19 — VERIFICAÇÃO EM DUAS ETAPAS (2FA) NO PAINEL
-- Quem ATIVAR o código do celular (Google Authenticator, Authy...) só
-- consegue mexer nos dados depois de digitar o código — mesmo que
-- alguém descubra a senha. Quem não ativou continua entrando normal.
-- Rodar UMA vez no SQL Editor (depois da 18).
-- =====================================================================

-- true = pode mexer: já digitou o código nesta sessão, OU não ativou o 2FA
create or replace function mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;
grant execute on function mfa_ok() to authenticated;

-- Regra extra ("restritiva") em todas as tabelas do painel: soma com as que já existem
do $$
declare t text;
begin
  foreach t in array array[
    'lojas', 'produtos', 'variacoes', 'midias', 'categorias', 'colecoes', 'produtos_colecoes', 'produtos_categorias',
    'opcoes_loja', 'cupons', 'pedidos', 'parceiros', 'site_config', 'efeitos_personalizados', 'avaliacoes',
    'loja_admins', 'master_admins', 'eventos', 'historico'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists mfa_obrigatorio on %I', t);
      execute format('create policy mfa_obrigatorio on %I as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok())', t);
    end if;
  end loop;
end $$;

-- Envio de fotos também exige o código (para quem ativou)
drop policy if exists mfa_envio on storage.objects;
create policy mfa_envio on storage.objects as restrictive for insert to authenticated with check (mfa_ok());
