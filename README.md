# BioContextAI Web Application

This is the website for the BioContextAI project, a community intitiative to organize and extend biomedical MCP servers. The website is based on Next.js with Auth.js authentication. It contains the BioContextAI Registry frontend, which builds on the [BioContextAI Registry repository](https://github.com/biocontext-ai/registry) and follows Schema.org ontologies. It also hosts BioContextAI Chat, a Vercel AI SDK-based chatbot with flexible MCP server functionality.

## Getting Started

### 1. Clone the repository and install dependencies

```
git clone https://github.com/biocontext-ai/website.git
cd website
npm install
```

### 2. Configure your local environment

Copy the .env.local.example file in this directory to .env.local (which will be ignored by Git):

```
cp .env.local.example .env.local
```

Add details for one or more providers (e.g. Google, Twitter, GitHub, Email, etc).

#### Database

A Postgres database is needed to persist data.

### 4. Start the application

To run your site locally, use:

```
npm run dev
```

To run it in production mode, use:

```
npm run build
npm run start
```

## Initial Data Import (Development)

1. Copy the example environment file:

	```bash
	cp .env.local.example .env
	```

2. Edit `.env` and set a valid `CRON_SECRET` value.

3. Start your dev server:

	```bash
	npm run dev
	```

4. Import initial registry and GitHub data:

	```bash
	./import-registry.sh
	./import-github-data.sh
	```

These scripts require a valid `CRON_SECRET` in your `.env` and will POST to your local server at `http://localhost:3000` using Bearer authentication.

You also need to generate a GitHub token with `gh auth token` and adjust the `GITHUB_TOKEN` environment variable.

If you need to re-import or reset data, simply re-run these scripts after starting your dev server.

## Acknowledgements

Partly based on the Auth.js Next.js example (licensed under the [ISC License](https://github.com/nextauthjs/next-auth/blob/main/LICENSE)).

## License

Apache 2.0
