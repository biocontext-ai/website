# Contributing to BioContextAI

Thank you for your interest in contributing to BioContextAI! We welcome contributions from all backgrounds and experience levels. This document provides guidelines for contributing to the BioContextAI website and infrastructure.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Community Governance](#community-governance)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](/docs/community/conduct). By participating, you are expected to uphold this code. We are committed to fostering an inclusive environment where diverse perspectives strengthen our collective impact on biomedical research.

## How Can I Contribute?

### Reporting Bugs

- **Search existing issues** first to avoid duplicates
- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Provide detailed reproduction steps, environment details, and screenshots if applicable
- Include relevant error messages and console output

### Suggesting Features

- **Check the [roadmap](/docs/community/roadmap)** to see if it's already planned
- Open a GitHub issue with a clear description of the feature
- Explain the use case and why it would benefit the community
- Be open to discussion and feedback from maintainers

### Security Vulnerabilities

- **Do not report security vulnerabilities through public issues**
- Use GitHub's private vulnerability reporting feature
- See our [Security Policy](SECURITY.md) for detailed reporting instructions

### Submitting MCP Servers to the Registry

- Follow the [Registry Contributing Guide](/docs/registry/contributing)
- Ensure your MCP server meets metadata and licensing requirements
- MCP servers should be open source and free for academic use

### Contributing Code

We welcome code contributions including:

- Bug fixes
- Feature implementations
- Performance improvements
- Documentation improvements
- Test additions
- UI/UX enhancements

## Development Setup

### Prerequisites

- **Node.js**: Use the version specified in `.nvmrc` (use `nvm use` to switch)
- **npm**: Comes with Node.js
- **PostgreSQL**: A Postgres database for development
- **Git**: For version control

### Setup Instructions

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/website.git
cd website
```

2. **Install dependencies:**

```bash
nvm use  # Use the correct Node.js version
npm install
```

3. **Configure environment variables:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your configuration:

- Database connection (`DATABASE_URL`, `SHADOW_DATABASE_URL`)
- Authentication providers (GitHub, LinkedIn OAuth credentials)
- API keys (Gemini, GitHub token)
- Other required secrets

4. **Set up the database:**

```bash
npx prisma migrate dev
```

**Note:** Prisma migrations should always be created with `--create-only` and cannot be applied directly in this project.

5. **Start the development server:**

```bash
npm run dev
```

Visit `http://localhost:3000` to see your local instance.

## Contribution Workflow

### 1. Create a Branch

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring
- `test/` for test additions

### 2. Make Your Changes

- Follow the [code guidelines](#code-guidelines) below
- Write clean, maintainable code
- Comment complex logic
- Update documentation if needed
- Add tests for new functionality

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Build the project
npm run build

# Run tests (requires test database)
npm run test

# Run tests in UI mode
npm run test:ui
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add user profile page"
# or
git commit -m "fix: resolve authentication redirect issue"
```

Follow conventional commit format:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` test additions/changes
- `chore:` maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub using the [PR template](.github/pull_request_template.md).

## Code Guidelines

### Technology Stack

This project uses:
- **React** with **Next.js 15** (App Router)
- **TypeScript** for type safety
- **Prisma** for database ORM
- **shadcn/ui** + **Tailwind CSS** for styling
- **Auth.js (NextAuth.js v5)** for authentication
- **Playwright** for E2E testing

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code is automatically formatted (configured in `.prettierrc.json`)
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Components**: Use functional components with hooks

### Best Practices

1. **Clean Code**: Focus on maintainable, readable code
2. **Performance**: Consider performance and scalability implications
3. **Security**: 
   - Never hardcode secrets or API keys
   - Use environment variables for sensitive data
   - Sanitize user inputs
   - Follow security guidelines in [SECURITY.md](SECURITY.md)
4. **Accessibility**: Ensure UI components are accessible
5. **Responsive Design**: Test on multiple screen sizes
6. **Error Handling**: Implement proper error handling and user feedback

### UI/UX Guidelines

- Use **shadcn/ui** components for consistency
- Follow **Tailwind CSS** design patterns
- Ensure responsive design (mobile-first)
- Maintain consistent spacing and typography
- Use semantic HTML elements

### Database Changes

When making database changes:

1. Create migrations with `npx prisma migrate dev --create-only --name descriptive_name`
2. Review the generated migration files
3. Test migrations on development database
4. Include migration files in your PR
5. Document breaking changes

### API Routes

- Use Zod for request validation
- Implement proper error handling
- Apply rate limiting where appropriate
- Require authentication for sensitive endpoints
- Return appropriate HTTP status codes
- Follow REST principles

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed

# Debug tests
npm run test:debug
```

### Writing Tests

- Write **Playwright** tests for E2E functionality
- Place tests in the `tests/` directory
- Test critical user flows and API endpoints
- Include both happy path and error scenarios
- Use descriptive test names

Example test structure:

```typescript
test('should display user profile after login', async ({ page }) => {
  // Test implementation
});
```

### Test Coverage

For larger features, implement Playwright tests once everything works. Focus on:

- Authentication flows
- Critical user actions
- API endpoint behavior
- Error states
- Edge cases

## Submitting Changes

### Pull Request Guidelines

1. **Fill out the PR template** completely
2. **Link related issues** using `Fixes #123` or `Closes #456`
3. **Provide clear description** of what changes and why
4. **Include screenshots/videos** for UI changes
5. **Check all boxes** in the PR checklist
6. **Ensure tests pass** before submitting
7. **Keep PRs focused** - one feature/fix per PR
8. **Be responsive** to review feedback

### Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be acknowledged!

### What Happens After Merge?

- Your changes will be deployed to production
- You'll be added to the contributors list
- Repeat contributors may be invited to join the GitHub organization

## Community Governance

### Project Structure

BioContextAI has a clear governance structure:

- **Maintainers**: Maintain infrastructure and review contributions
- **Contributors**: Anyone who submits code, docs, or helps the community
- **Advisory Committee**: Provides strategic guidance

Learn more in our [Governance Documentation](/docs/community/governance).

### Decision Making

- **Routine changes**: Approved by any maintainer
- **Technical decisions**: Simple majority among maintainers
- **Major changes**: May involve Advisory Committee consultation

### Becoming a Maintainer

Repeat contributors with demonstrated commitment may be nominated as maintainers by existing maintainers.

## Getting Help

- **Questions?** Open a GitHub issue or discussion
- **Stuck?** Check existing documentation in `/docs`
- **Need guidance?** Ask in your PR or issue
- **General inquiries:** Contact us at contact@biocontext.ai

## Additional Resources

- [Project Documentation](/docs)
- [Registry Guide](/docs/registry)
- [Community Roadmap](/docs/community/roadmap)
- [Governance Structure](/docs/community/governance)
- [Security Policy](SECURITY.md)

## Recognition

All contributors will be recognized for their contributions. We value every contribution, no matter how small!

## License

By contributing to BioContextAI, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

---

Thank you for contributing to BioContextAI! Together, we're building better tools for biomedical research. 🧬🤖
