# ⌨️ Colinha de comandos — MA Online Store

Todos rodam no terminal do VS Code, **dentro de `C:\PROJETOS\maonlinestore`** (confira o caminho antes!).

## Dia a dia
| Para quê | Comando |
|---|---|
| Abrir o site no PC (localhost:3000) | `npm run dev` |
| Parar o site | `Ctrl + C` |
| Testar se está tudo certo antes de enviar (o mesmo teste da Vercel) | `npm run build` |
| Ver o que mudou | `git status` |
| Enviar para o site no ar | `git add .` → `git commit -m "o que mudou"` → `git push` |

## Quando algo dá errado
| Problema | Comando |
|---|---|
| Desfazer mudanças que ainda NÃO foram commitadas | `git restore .` |
| Apagar arquivos novos que vieram por engano (veja antes com `-n`) | `git clean -n -d` e depois `git clean -f -d` |
| Ver os últimos envios | `git log --oneline -5` |
| Site estranho no localhost (cache) | pare com `Ctrl + C`, apague a pasta `.next` e rode `npm run dev` |
| "Module not found" depois de atualizar | `npm install` |
| Voltar o site no ar para uma versão anterior | Vercel → Deployments → versão boa → **Promote to Production** |

## Banco de dados (Supabase)
- As atualizações ficam em `supabase/atualizacao-XX-....sql`, **em ordem**. Rode cada uma **uma vez** no SQL Editor.
- Backup: painel → **💾 Baixar backup** (toda semana).

## Atalhos úteis do VS Code
| Atalho | O que faz |
|---|---|
| `Ctrl + P` | Abrir arquivo pelo nome |
| `Ctrl + Shift + F` | Procurar um texto em todo o projeto |
| `Ctrl + F` | Procurar no arquivo aberto |
| `` Ctrl + ` `` | Abrir/fechar o terminal |
| `Alt + Shift + F` | Arrumar o código (formatar) |
