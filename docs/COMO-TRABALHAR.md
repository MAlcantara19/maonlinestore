# 🧭 Como trabalhar no código sem quebrar o site no ar

## A ideia em uma frase
Você mexe numa **cópia** (branch `dev` + banco de testes), confere num endereço de **prévia**, e só quando estiver tudo certo
leva para o **site oficial** (branch `main` + banco oficial).

```
                 CÓDIGO (GitHub)                 BANCO (Supabase)          ENDEREÇO (Vercel)
  Testes  →  branch  dev                 →   projeto "maonlinestore-teste" →  prévia (link que muda)
  Oficial →  branch  main                →   projeto "maonlinestore"       →  maonlinestore.vercel.app
```

---

## Parte 1 — Criar o banco de testes (uma vez só)
1. No Supabase, crie um **novo projeto** chamado `maonlinestore-teste` (região São Paulo).
2. No **SQL Editor** dele, rode **todos** os arquivos da pasta `supabase/`, **em ordem**:
   `banco-loja.sql`, depois `atualizacao-01...`, `atualizacao-02...` até o último.
   (Se quiser produtos de exemplo, rode também o `exemplo-vitraforma.sql`.)
3. Em **Authentication → Users**, crie o seu usuário de teste e torne-o master
   (o comando está no fim do `banco-loja.sql`).
4. Anote a **URL**, a **publishable key** e a **secret key** desse projeto de teste.

> O plano grátis do Supabase permite 2 projetos ativos: um oficial e um de teste. ✔️

## Parte 2 — Ligar o localhost ao banco de testes
No seu `.env.local` (no PC), troque as 3 chaves pelas do **projeto de teste**.
Assim, tudo que você testar no `localhost` mexe só nos dados de teste. 🎉

## Parte 3 — Ensinar a Vercel a usar o banco certo em cada lugar
Na Vercel: **Settings → Environment Variables**. Cada variável pode valer para:
- **Production** (site oficial) → chaves do banco **oficial**
- **Preview** (prévias da branch dev) → chaves do banco **de teste**

Cadastre as 3 variáveis duas vezes: uma marcada só em *Production* (oficial) e outra marcada só em *Preview* (teste).

## Parte 4 — O dia a dia
```bash
git checkout dev            # 1. vai para a branch de testes (a 1ª vez: git checkout -b dev)
# ... mexe no código, testa no localhost ...
git add .
git commit -m "o que mudou"
git push -u origin dev      # 2. a Vercel cria um link de PRÉVIA (veja em Deployments)
```
Testou a prévia no celular e está tudo certo?
```bash
git checkout main
git merge dev               # 3. junta as mudanças testadas
git push                    # 4. o site OFICIAL atualiza
git checkout dev            # 5. volta para a branch de testes
```

## E as atualizações de banco (os SQL numerados)?
1. Rode primeiro no **banco de teste** e teste na prévia.
2. Deu tudo certo? Rode o **mesmo arquivo** no **banco oficial** — de preferência logo antes do `git push` na `main`.
3. Guarde o arquivo na pasta `supabase/` (assim você sabe o que já foi rodado).

## Deu ruim no site oficial? 🚑
- **Código:** Vercel → Deployments → escolha a última versão boa → **Promote to Production**. Volta em segundos.
- **Dados:** painel → **💾 Baixar backup** (faça toda semana!). O arquivo tem tudo, tabela por tabela.

## Dica de ouro
Nunca use o painel do **localhost** achando que está mexendo na loja de verdade:
olhe o endereço — `localhost` = testes, `maonlinestore.vercel.app` = oficial.
