# Rota Econômica

Aplicação responsiva para motoristas de aplicativo acompanharem abastecimentos, eficiência do veículo e resultado operacional. O projeto contém frontend Angular PWA, API REST Spring Boot/Java 21 e PostgreSQL com migrações Flyway.

## O que está pronto

- Registro de abastecimentos com posto, data, tipo de combustível, preço/litro, litros, total e odômetro.
- Cálculo do valor abastecido e consumo km/l entre abastecimentos marcados como tanque cheio.
- Comparação de gasolina comum/aditivada e etanol comum/aditivado pelo custo estimado por quilômetro. O etanol parte de uma estimativa configurável de 70% do consumo da gasolina.
- Lançamentos de receitas e despesas, estimativa de lucro e registro de manutenção.
- Totais e gráficos separados por mês, com comparação de receitas, despesas e lucro contra o mês anterior. A virada mensal inicia os totais do novo mês sem apagar o histórico.
- Ação de excluir individualmente abastecimentos, receitas/despesas e manutenções, com confirmação e preservação dos demais registros.
- Painel responsivo e PWA instalável; os lançamentos do frontend ficam no armazenamento local deste navegador.
- API REST para abastecimentos, consumo, movimentação financeira e resumo operacional.
- Banco PostgreSQL iniciado por Docker Compose e esquema versionado por Flyway.

## Pré-requisitos

- Node.js compatível com Angular 22 e npm.
- JDK 21.
- Maven 3.9 ou superior.
- Docker Desktop com Docker Compose, para usar PostgreSQL local.

## Executar localmente

Inicie o banco na raiz do projeto:

```powershell
docker compose up -d postgres
```

Em outro terminal, inicie a API:

```powershell
Set-Location backend
mvn spring-boot:run
```

A API estará em `http://localhost:8080`. Inicie o frontend em outro terminal:

```powershell
Set-Location frontend
npm install
npm start
```

Abra `http://localhost:4200`. Para gerar uma versão de produção do PWA, execute `npm run build` dentro de `frontend/`; o service worker é habilitado no build de produção e requer HTTPS quando publicado fora de localhost.

## Endpoints da API

- `GET /api/v1/fill-ups` lista abastecimentos.
- `POST /api/v1/fill-ups` cria um abastecimento.
- `GET /api/v1/fill-ups/consumption` calcula o último intervalo tanque-cheio a tanque-cheio.
- `GET /api/v1/ledger` lista receitas e despesas.
- `POST /api/v1/ledger` cria um lançamento financeiro.
- `GET /api/v1/summary` retorna receitas, despesas e lucro estimado.

Os tipos de combustível são `GASOLINE_COMMON`, `GASOLINE_ADDITIVE`, `ETHANOL_COMMON` e `ETHANOL_ADDITIVE`; tipos financeiros são `REVENUE` e `EXPENSE`. Valores monetários usam `BigDecimal` no backend.

Exemplo de abastecimento:

```json
{
  "filledAt": "2026-10-13",
  "stationName": "Posto Avenida",
  "fuelType": "GASOLINE_COMMON",
  "pricePerLiter": 5.79,
  "liters": 37,
  "odometerKm": 32750,
  "fullTank": true
}
```

Configurações podem ser sobrescritas por `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `SERVER_PORT` e `CORS_ALLOWED_ORIGINS`. O Hibernate usa `ddl-auto: validate`; alterações de esquema devem ser novas migrações em `backend/src/main/resources/db/migration`.

## Dados, integrações e limites atuais

O frontend inicia com registros de exemplo claramente identificados e grava novos dados somente no `localStorage` do navegador. Os valores são agrupados pela data de cada lançamento; ao começar um mês novo, os totais mensais começam zerados e os anteriores continuam disponíveis nos relatórios. Para corrigir um erro, use **Excluir** na linha do abastecimento, lançamento ou manutenção; a confirmação remove somente aquele item e preserva os demais meses.

O frontend ainda não sincroniza esses dados com a API; o backend já oferece os endpoints para essa próxima integração. Não há cadastro/login de usuário nem compartilhamento entre dispositivos.

A visualização do mapa é ilustrativa, não contém postos ou preços ao vivo. Busca de postos, geolocalização e cálculo real de rota precisam de um provedor de mapas e uma fonte de preços configurados. Não há afirmação de que gasolina aditivada economiza mais: a comparação usa o custo/km medido ou estimado informado.

O lucro considera apenas receitas, despesas financeiras, abastecimentos e manutenção registrados. Os registros iniciais são dados demonstrativos e não são importados de Uber ou 99.

## Testes

```powershell
# frontend
Set-Location frontend
npm test -- --watch=false
npm run build

# backend
Set-Location ..\backend
mvn test
```
