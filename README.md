# BioContextAI Web Application

This is the website for the BioContextAI project, a community intitiative to organize and extend biomedical MCP servers. The website is based on Next.js with Auth.js authentication. It contains the BioContextAI Registry frontend, which builds on the [BioContextAI Registry repository](https://github.com/biocontext-ai/registry) and follows Schema.org ontologies. It also hosts BioContextAI Chat, a Vercel AI SDK-based chatbot with flexible MCP server functionality.

## Publication

You can find our Nature Biotechnology correspondence here: [https://www.nature.com/articles/s41587-025-02900-9](https://www.nature.com/articles/s41587-025-02900-9).

If our work is useful to your research, please cite it as below.

```bibtex
@article{BioContext_AI_Kuehl_Schaub_2025,
  title={BioContextAI is a community hub for agentic biomedical systems},
  url={http://dx.doi.org/10.1038/s41587-025-02900-9},
  urldate = {2025-11-06},
  doi={10.1038/s41587-025-02900-9},
  year = {2025},
  month = nov,
  journal={Nature Biotechnology},
  publisher={Springer Science and Business Media LLC},
  author={Kuehl, Malte and Schaub, Darius P. and Carli, Francesco and Heumos, Lukas and Hellmig, Malte and Fernández-Zapata, Camila and Kaiser, Nico and Schaul, Jonathan and Kulaga, Anton and Usanov, Nikolay and Koutrouli, Mikaela and Ergen, Can and Palla, Giovanni and Krebs, Christian F. and Panzer, Ulf and Bonn, Stefan and Lobentanzer, Sebastian and Saez-Rodriguez, Julio and Puelles, Victor G.},
  year={2025},
  month=nov,
  language={en},
}
```

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
