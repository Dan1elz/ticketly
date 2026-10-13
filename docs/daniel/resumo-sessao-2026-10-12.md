# Resumo da sessão — 2026-10-12

O plano completo de setores e assentos está em **`setores-e-assentos.md`** (mesma pasta). Este arquivo é o resumo do chat.

---

## 1. Containers e migrations

| Container | Status |
|---|---|
| postgres | ✅ healthy |
| api | ✅ healthy |
| web | ✅ healthy (5173) |
| storage (Silo) | ✅ healthy |
| fiscal / voucher | ✅ rodando ("Worker iniciado") |
| storage-initial-setup | ✅ depois da correção (`Exited (0)`) |

**Migrations:** não tinham rodado. No dev elas não rodam sozinhas, porque o `Dockerfile.development` só faz `start:dev`; quem roda `migrate` no boot é o `Dockerfile` de staging. As duas (`Migration20261003031230` e `Migration20261009190000`) foram aplicadas com:

```
docker exec ticketly-development-api-1 npm run migration:up
```

A API também foi reconstruída (`docker compose -f compose.development.yaml up -d --build api`). As migrations continuaram aplicadas, porque o banco fica num volume separado.

**storage-initial-setup:** falhava com `set: -: invalid option`. Causa: o `init.sh` estava com quebra de linha do Windows (CRLF).

---

## 2. Quebra de linha (Windows × Linux)

- O Linux termina cada linha com `\n` (LF); o Windows usa `\r\n` (CRLF).
- Com `core.autocrlf=true`, o Git converte tudo pra CRLF no checkout do Windows. Os arquivos são montados nos containers Linux, e lá o `sh` lê `set -e\r` e quebra.
- **Correção:** foi criado o `.gitattributes` na raiz com `* text=auto eol=lf`. A regra viaja com o repositório, então quem clonar no Windows recebe LF independente da configuração do Git.
- Os arquivos locais foram convertidos pra LF. Quatro arquivos do `ticketly-web` já tinham sido commitados com CRLF e aparecem como modificados (só a quebra de linha): `Dockerfile`, `Dockerfile.development`, `nginx.conf`, `.dockerignore`.

**Pendente (você):**
- [ ] Commitar o `.gitattributes` e esses 4 arquivos (sem isso o novo dev não recebe a correção).
- [ ] Documentar no README da API que, no dev, é preciso rodar o `migration:up` na mão.

---

## 3. Setores e assentos — os 3 pontos principais

### Palco não se liga a assento

- Num show com um palco só, todo mundo olha pro mesmo palco.
- Num festival, o ingresso dá acesso ao evento inteiro, não a um palco.
- No mapa, o palco é só um ponto de referência desenhado no topo da grade.

O problema real está no **lineup**: o palco é texto livre, então "Palco Principal" e "palco principal" viram dois palcos. Proposta: tabela `event_stages` (palcos do evento), e o lineup escolhe o palco num select.

### Status mora no assento (muda a decisão antiga)

O plano anterior não guardava o status de venda no assento e apagava os `order_items` quando a reserva expirava. Isso perde histórico, que é o que você não quer.

Agora o assento tem status:

| Status | Significa |
|---|---|
| `AVAILABLE` | livre |
| `RESERVED` | cliente segurou, ainda não pagou |
| `SOLD` | pago |
| `BLOCKED` | fora de venda temporariamente (dá pra voltar) |
| `CANCELLED` | definitivo, com observação ("criado indevidamente") |

Pra impedir venda dupla, a reserva vira um **UPDATE condicional**:

```sql
UPDATE seats SET status = 'RESERVED' WHERE id = :id AND status = 'AVAILABLE'
```

Se dois clientes clicam no mesmo assento ao mesmo tempo, o Postgres executa um de cada vez. O segundo não encontra mais o assento livre, afeta 0 linhas, e a API responde 409.

### Índice único parcial

Exemplo: o admin criou o "C-12" errado e cancelou. Com uma regra de unicidade simples, ele não conseguiria criar o C-12 certo, porque o cancelado ainda ocupa a combinação setor + fileira + número. A solução é um índice único que **só vale pros assentos não cancelados** (`WHERE status <> 'CANCELLED'`). O MikroORM não gera esse tipo de índice, então ele vai escrito à mão na migration.

---

## 4. Dúvidas pra responder (uma por vez)

1. "Sessão" que você citou é o **setor**? - isso mesmo, falei errado.
2. Assento **vendido** pode voltar a livre (reembolso)? -não vamos fazer isso agora, aumenta a complexibilidade. 
3. **Pista**: no mapa não dá pra mostrar 5000 quadradinhos. A loja mostra "escolher quantidade" e a API pega os primeiros livres? - pior que eu tava afim dos quadradinhos mas eu te intendo. vou deixar essa questão de UX na sua mão. 
4. **Pix**: 10 minutos de reserva é pouco pra pagar. Estende pra 30 minutos quando a cobrança é gerada? - pode ser! adiciona esse controle por uma variavel de ambiente, caso a gente queira testar isso funcionando, podemos diminuir para 1 minuto. 
5. Evento que já tem setores pode ser excluído? - não! se a pessoa quiser, pode cancelar esse evento, mas só se não tiver acentos pagos. 
6. Existe setor exclusivo de um palco (ex.: VIP só na frente do Palco Mundo)? não sei, não pensei nisso.
7. Manter o Redis como primeira barreira da reserva, com o Postgres como garantia? - também não sei qual seria o melhor caminho. preciso da sua opinião. 
8. Mapa geral do local: imagem enviada pelo admin ou setores desenhados? não entendi.
9. Regra pra publicar: exigir pelo menos 1 setor com 1 assento livre? também não entendi. 
10. Depois de publicar, o admin pode gerar mais assentos, mudar preço, bloquear? pode sim, mas é complicado mudar preço doque já foi vendido ou reservado. 

---

## 5. Respostas do Claude (rodada 1)

**1. Sessão = setor** ✅ Anotado.

**2. Sem reembolso** ✅ `SOLD` é definitivo. Se um dia entrar reembolso, é uma transição nova (`SOLD → AVAILABLE`) e não muda o banco.

**3. Pista: decidi assim**
- O setor ganha um **tipo**: `SEATED` (assento marcado) ou `GENERAL_ADMISSION` (pista, sem lugar marcado).
- A pista **continua tendo uma linha por ingresso no banco** (números 1…5000, sem fileira). Assim vale tudo que já decidimos: nunca apaga, tem status, tem histórico.
- ~~No admin você tem os quadradinhos~~ → **mudou (pedido do Daniel):** pista não tem grade nem fileira; o admin vê contadores (livres, vendidos…). Grade (`grid_row`/`grid_column`) ficou opcional, só pra setor `SEATED`.
- **Na loja o cliente não escolhe quadradinho** (pista não tem lugar marcado, então não faria sentido): ele escolhe a **quantidade** e a API pega os N primeiros livres.

**4. Tempo da reserva por variável de ambiente** ✅ Duas variáveis na API:
- `RESERVATION_HOLD_MINUTES=10`: tempo pra preencher o checkout.
- `PAYMENT_HOLD_MINUTES=30`: quando a cobrança Pix é gerada, o `expires_at` do pedido passa a ser agora + esse valor.

Pra testar a expiração, coloca `1` nas duas.

**5. Evento não se exclui, se cancela** ✅ Muda assim:
- `events.status` ganha `CANCELLED`: `DRAFT | PUBLISHED | CANCELLED`.
- Excluir de verdade só um evento **sem setores** (um rascunho criado por engano).
- Cancelar só se não houver assento `SOLD`.

❓ **Pergunta nova:** e assento `RESERVED`, com alguém no meio do Pix? Se o evento for cancelado nessa hora e o Pix cair depois, a gente teria que devolver o dinheiro, e não temos reembolso. Sugestão: cancelar exige **zero `SOLD` e zero `RESERVED`**. Na prática o admin primeiro volta o evento pra `DRAFT` (some da loja e ninguém reserva mais), espera as reservas abertas expirarem (no máximo 30 min) e aí cancela. Pode ser?

**6. Setor exclusivo de palco: não fazer agora.** Se um dia precisar, é só adicionar uma coluna opcional `stage_id` em `sectors`, sem quebrar nada. Não vale a pena criar antes de existir o caso.

**7. Redis ou Postgres: minha opinião**

O **Postgres é a garantia** (o UPDATE condicional). Ele sozinho já impede venda dupla, então a pergunta é se o Redis ainda serve pra alguma coisa.

Serve, como **porteiro**. Imagine a abertura das vendas do show: 10 mil pessoas clicando nos mesmos 200 assentos da frente.
- **Sem Redis:** os 10 mil cliques viram 10 mil UPDATEs disputando as mesmas linhas no Postgres. Ele aguenta, mas fica lento pra todo mundo, inclusive pro admin e pros webhooks de pagamento.
- **Com Redis:** cada clique faz primeiro um `SET seat:{id} NX`. O Redis responde "já tem dono" em microssegundos, e só quem ganha a corrida chega no Postgres.

Recomendo **manter o Redis como porteiro e o Postgres como garantia**, cada um com um papel só:
- **Redis:** barra rápido; se ele falhar ou reiniciar, nada quebra, só fica mais lento.
- **Postgres:** decide de verdade e guarda o histórico.
- **Expiração:** um job olha `orders.expires_at` no Postgres. O TTL do Redis só limpa a trava dele, não é ele que devolve o assento.

Bônus: era a decisão original do projeto e você continua aprendendo Redis.

**8. Mapa geral: explicando melhor.** No ingresso.com, antes de escolher o assento, aparece uma **planta do local inteiro**: o palco embaixo, a pista na frente, as cadeiras dos lados e os camarotes em cima, cada setor de uma cor. Você clica no setor e aí abre a grade de quadradinhos. A pergunta é como mostrar essa planta:
- **(a) Imagem:** o admin sobe uma figura da planta (igual à foto do artista) e a loja mostra a imagem com a lista de setores e cores ao lado. Fácil.
- **(b) Desenhada:** o admin desenha cada setor como uma forma clicável no front. Bonito, mas é um editor gráfico; dá muito trabalho.

Recomendo **(a)**.

**9. Regra pra publicar: explicando melhor.** Hoje o admin pode mudar o evento de `DRAFT` pra `PUBLISHED` a qualquer momento, mesmo sem setor nenhum. Aí o evento aparece na loja e o cliente não tem o que comprar. A pergunta é se a API deve **recusar publicar** um evento que não tem pelo menos 1 setor com 1 assento livre. Recomendo que sim (409 com a mensagem "cadastre pelo menos um setor com assentos antes de publicar").

**10. Mudar preço depois de vender: já está resolvido.** Cada `order_item` guarda o `price_cents` do momento da reserva, como uma cópia. Exemplo: o setor custava R$ 100 e o João reservou; o admin muda pra R$ 150; o pedido do João continua R$ 100, e só reservas novas pagam R$ 150. Mudar o preço do setor nunca mexe em quem já reservou ou comprou. Gerar mais assentos e bloquear também pode, com as regras de sempre.

---

## 6. Rodada 2 — decisões do Daniel (registradas)

- **5.** Não dá pra cancelar o evento enquanto houver assento `RESERVED` (nem `SOLD`). ✅
- **7.** Manter o Redis. ✅
- **8.** Sem mapa geral do local. A loja lista os setores (cor, nome, preço); clicou no setor, abre a grade (`SEATED`) ou a quantidade (pista). ✅
- **9.** Pra publicar, o evento precisa ter pelo menos 1 assento livre (`AVAILABLE`); senão a API responde 409. ✅

### ❓ Dúvida sobre o 7: "não sabemos se vamos manter o Postgres"

Não entendi qual dessas duas você quis dizer:

- **(a) Não sabe se o UPDATE condicional no Postgres continua como garantia contra venda dupla.** Minha sugestão é manter: custa quase nada, porque a coluna `seats.status` vai existir de qualquer jeito (o admin precisa dela pra ver livre/vendido/cancelado). E cobre o dia em que o Redis cair ou perder a trava (ex.: reiniciou sem salvar em disco). Sem ele, nesse dia dá pra vender o mesmo assento 2x.
- **(b) Não sabe se o projeto continua usando Postgres como banco.** Aí é outra conversa: a API inteira (artistas, eventos, admins, pedidos) está no Postgres. O Redis não substitui banco, porque guarda tudo na memória e foi feito pra dado temporário (como a trava de 10 min).

Por enquanto deixei registrado: **Redis como porteiro + Postgres como rede de segurança**.
