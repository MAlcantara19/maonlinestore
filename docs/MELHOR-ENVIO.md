# 📮 Ligar o frete exato (Melhor Envio)

1. Crie uma conta grátis em **melhorenvio.com.br** (pode usar CPF ou CNPJ).
2. No painel do Melhor Envio: **Integrações → Permissões de acesso → Gerar novo token**.
   Marque as permissões de **cotação de frete** ("shipping-calculate") e copie o token (é bem comprido).
3. Na **Vercel → Settings → Environment Variables**, crie:
   - `MELHOR_ENVIO_TOKEN` = o token copiado
   - `MELHOR_ENVIO_EMAIL` = o seu e-mail (o Melhor Envio pede para identificar quem está usando)
   - (para testar sem gastar nada: `MELHOR_ENVIO_SANDBOX` = `1`, usando um token da conta de testes **sandbox.melhorenvio.com.br**)
4. Faça um novo deploy (ou um `git push`).
5. No painel da loja: **Configurações → 📮 Frete exato → CEP de onde a loja envia**.
6. Em cada produto: **💵 Custo e embalagem → peso com embalagem e medidas da caixa**.

Pronto: no produto e no carrinho, o cliente digita o CEP e vê as opções reais (PAC, SEDEX, Jadlog...)
com preço e prazo. Produto sem medidas continua usando a estimativa por região.

⚠️ O token é como uma senha: **nunca** coloque no código nem no GitHub — só na Vercel e no `.env.local`.
