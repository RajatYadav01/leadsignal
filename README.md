# LeadSignal

LeadSignal is a web application that ingests lead datasets (CSV), cleans and validates them, evaluates each lead against a configurable Ideal Customer Profile (ICP), detects buying signals, calculates an explainable LeadSignal Score, and presents a prioritized list of sales‑ready prospects – all with transparent reasoning and recommended next actions.

## Features

- **Project Management** – Create and manage multiple lead analysis projects.
- **CSV Import** – Upload lead datasets with validation, duplicate detection, and import summaries.
- **Data Quality Copilot** – Automatically normalize, validate, and score data completeness.
- **ICP Builder** – Configure your ideal customer profile (industries, countries, employee/revenue ranges, technologies, job titles) in under a minute.
- **Explainable Scoring** – Each lead receives a 0–100 score with a detailed breakdown and natural‑language explanation (optional LLM enhancement via OpenRouter).
- **Buying Signal Detection** – Identify hiring, employee growth, recent funding, and technology matches.
- **Recommended Next Action** – Rule‑based, actionable suggestions for high‑priority leads.
- **Prioritized Lead List** – Filter, sort, and paginate leads; view key intelligence at a glance.
- **Lead Detail Page** – Dive deep into a lead’s profile, score breakdown, signals, and recommended action.
- **Dashboard Overview** – See total leads, valid records, ICP matches, high‑priority leads, and a funnel chart.
- **Export** – Download filtered lead lists as CSV.
- **Responsive UI** – Works on desktop and mobile with a left sidebar and dark/light theme toggle.
- **API‑First** – Well‑documented REST API for future integrations.

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Web app** | React.js, Tailwind CSS, TypeScript |
| **API app** | Python, Django, Django REST Framework, PostgreSQL, pytest |
| **Database** | PostgreSQL |
| **DevOps** | Docker, Docker Compose, GitHub Actions (CI/CD), Turborepo, pnpm |
| **AI** | OpenRouter API |
| **Testing** | Playwright (E2E), pytest (backend), Vitest (frontend) |
| **Deployment** | [Vercel](https://vercel.com) (Web), [Vercel](https://vercel.com) (API) + [Neon](https://neon.com) (database) |

## Project Structure

```text
leadsignal/
├── apps/
│   ├── web/                           # React frontend
│   │   ├── src/
│   │   │   ├── components/            # Reusable UI components
│   │   │   ├── features/              # Feature modules
│   │   │   ├── contexts/              # Theme, etc.
│   │   │   ├── hooks/                 # Custom hooks
│   │   │   ├── services/              # API client
│   │   │   ├── types/                 # TypeScript definitions
│   │   │   ├── utils/                 # Utilities
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── routes.tsx
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── vite.setup.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   └── api/                           # Django backend
│       ├── config/                    # Django project settings, urls
│       ├── apps/                      # Django apps
│       │   ├── projects/              
│       │   ├── leads/                 
│       │   ├── data_quality/          
│       │   ├── scoring/               
│       │   └── intelligence/          
│       ├── pyproject.toml             # Python dependencies (uv)
│       ├── requirements.txt
│       ├── package.json               # For Turborepo
│       └── Dockerfile
├── packages/
│   ├── e2e-tests/                     # Playwright E2E tests
│   │   ├── playwright.config.ts
│   │   ├── tests/
│   │   └── package.json
│   ├── eslint-config/                 # Shared ESLint config
│   └── tsconfig/                      # Shared TypeScript config
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Working

1. **Create a Project** – Give your analysis a name and description.
2. **Upload CSV** – Drag or select a CSV file with company and contact data. The system validates the schema, normalizes values, detects duplicates, and reports an import summary.
3. **Configure ICP** – Define your target industries, countries, employee/revenue ranges, technologies, and job titles.
4. **Analyze Leads** – Click “Analyze Leads” on the dashboard. The backend:
   - Calculates data quality scores.
   - Matches each lead against the ICP.
   - Detects buying signals (hiring, growth, funding, tech).
   - Computes the LeadSignal Score (0–100) with a granular breakdown.
   - Generates a recommended next action.
   - (Optional) Uses OpenRouter to produce a natural‑language explanation.
5. **Review** – The dashboard shows summary stats and a funnel chart. The lead list is filterable and sortable. Open any lead to see all intelligence.
6. **Export** – Download the filtered list as CSV.

## Development

### Prerequisites

- Node.js (preferably, version >= v24.x)
- Python (preferably, version >= v3.13.x)
- PostgreSQL (preferably, version >= v18.x)
- uv (preferably, version >= v0.11.20)
- pnpm (preferably, version >= v11.5.2)
- Docker (preferably the latest version)
- Git (preferably the latest version)

### Setup

To modify and use this project locally on your system, follow these steps:

1. Clone the project's repository.

   ```shell
   git clone https://github.com/rajatyadav01/leadsignal.git
   ```

2. Go to the project folder using the CLI.

   ```shell
   cd leadsignal
   ```

3. Install all dependencies in the root of the monorepo using pnpm.

   ```shell
   pnpm install
   ```

4. Rename the `.env.example` file to `.env` in both `./apps/api/` and `./apps/web/` directories to use the environment variables in the apps.

5. Create a `user` with `password` and a `database` using the created `user` as owner in the PostgreSQL database since those are required to connect to the database. For this, you can either use the default values from the `env.example` file or use different values. Also, values of other variables can also be either used from the `env.example` file or different values based on your preference.

6. Install all the dependencies and apply the default migrations to setup the `Django REST Framework` app in `./apps/api` directory using `uv` package manager.

   ```shell
   pnpm --filter "./apps/api/v1" setup
   ```

7. Generate the migration files to update the database schema based on changes to the models.

   ```shell
   pnpm --filter "./apps/api/v1" db:makemigrations
   ```

8. Apply the migration files to update the database.

   ```shell
   pnpm --filter "./apps/api/v1" db:migrate
   ```

9. Run the `Django REST Framework` app.

   ```shell
   pnpm dev:api
   ```

10. Open a different instance of the CLI that you are using or another instance of the code editor to run the `React.js` app.

    ```shell
    pnpm dev:web
    ```

11. After both the apps have been started, open any browser and go to `http://localhost:5173` to access the web application.<br /><br />

To setup the project using Docker:

1. Clone the project's repository.

   ```shell
   git clone https://github.com/rajatyadav01/pathistics.git
   ```

2. Go to the project folder using the CLI.

   ```shell
   cd pathistics
   ```

3. Run the project using docker-compose.

   ```shell
   docker-compose up --build
   ```

4) After all the containers have been started, open any browser and go to `http://localhost:5173` to access the web application.

### Testing

To run a test suite, run the script at the root of the monorepo.

#### All Tests

```shell
pnpm test
```

#### Unit Tests

```shell
pnpm test:unit
```

#### Integration Tests

```shell
pnpm test:integration
```

#### E2E (End-to-end) Tests

```shell
pnpm test:e2e
```