# Security Policy

## Supported Versions

We actively support the following versions of BioContextAI with security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

We recommend always using the latest version to ensure you have the most recent security patches.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### For Sensitive Security Issues

For security vulnerabilities that could potentially expose user data or compromise system integrity, please use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/biocontext-ai/website/security) of our repository
2. Click "Report a vulnerability"
3. Fill out the private vulnerability report form

### For General Security Concerns

For less sensitive security issues or general security improvements, you can:

1. Create a [security issue](https://github.com/biocontext-ai/website/issues/new?template=security.md) using our security template
2. Email us directly at contact@biocontext.ai

### What to Include

When reporting a security vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: What an attacker could achieve by exploiting this vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Affected Components**: Which parts of the application are affected
- **Suggested Fix**: If you have ideas for how to fix the issue
- **Disclosure Timeline**: Your preferred timeline for public disclosure

## Security Measures

### Application Security

BioContextAI implements several security measures:

- **Authentication**: Secure authentication using Auth.js (NextAuth.js) v5
- **Authorization**: Role-based access control for admin and user features
- **Database Security**: Prisma ORM with parameterized queries to prevent SQL injection
- **Input Validation**: Zod schema validation for all user inputs
- **CSRF Protection**: Built-in CSRF protection with Auth.js
- **Session Security**: Secure session management with HTTP-only cookies
- **Content Security**: Sanitized HTML rendering with sanitize-html
- **HTTPS**: Enforced HTTPS in production environments

### Data Protection

- **Biomedical Data**: Special consideration for sensitive biomedical research data
- **User Privacy**: Minimal data collection with clear privacy policies
- **Data Encryption**: Encryption in transit and at rest for sensitive data
- **Access Logging**: Comprehensive logging of data access and modifications

### MCP Server Security

- **Server Validation**: Validation of MCP server metadata and functionality
- **Sandboxed Execution**: MCP servers run in controlled environments
- **Connection Security**: Secure communication protocols for MCP connections
- **Registry Verification**: Manual review process for new MCP servers

### Infrastructure Security

- **Dependency Management**: Regular dependency updates and vulnerability scanning
- **Environment Isolation**: Separate environments for development, testing, and production
- **Secret Management**: Secure handling of API keys and sensitive configuration
- **Monitoring**: Continuous monitoring for suspicious activities

## Security Best Practices for Contributors

When contributing to BioContextAI, please follow these security guidelines:

### Code Security

- **Input Validation**: Always validate and sanitize user inputs
- **SQL Injection Prevention**: Use Prisma ORM's built-in protections
- **XSS Prevention**: Properly escape output and use React's built-in protections
- **Authentication Checks**: Verify user authentication and authorization for protected routes
- **Error Handling**: Avoid exposing sensitive information in error messages

### Dependencies

- **Regular Updates**: Keep dependencies updated to their latest secure versions
- **Vulnerability Scanning**: Run `npm audit` before submitting PRs
- **Minimal Dependencies**: Only add dependencies that are absolutely necessary
- **License Compliance**: Ensure all dependencies have compatible licenses

### Environment Variables

- **Secret Management**: Never commit secrets or API keys to the repository
- **Environment Separation**: Use different secrets for different environments
- **Access Control**: Limit access to production environment variables

### API Security

- **Rate Limiting**: Implement appropriate rate limiting for API endpoints
- **Input Validation**: Validate all API inputs using Zod schemas
- **Error Responses**: Return generic error messages to prevent information disclosure
- **Authentication**: Require authentication for all sensitive API endpoints

## Incident Response

In the event of a security incident:

1. **Immediate Response**: We will acknowledge your report within 48 hours
2. **Investigation**: Our team will investigate and validate the reported vulnerability
3. **Fix Development**: We will develop and test a fix for confirmed vulnerabilities
4. **Disclosure**: We will coordinate responsible disclosure with the reporter
5. **Deployment**: Security fixes will be deployed as soon as possible
6. **Communication**: We will communicate with affected users as appropriate

## Security Updates

- Security updates are released as soon as fixes are available
- Critical security issues may result in emergency releases
- Users will be notified of security updates through:
  - GitHub security advisories
  - Release notes

## Scope

This security policy covers:

- The main BioContextAI web application
- API endpoints and backend services
- Database security and data protection
- Authentication and authorization systems
- MCP server integration and registry
- Third-party integrations and dependencies

This policy does not cover:

- Individual MCP servers (each has its own security policy)
- User-generated content security (users are responsible for their own data)
- Client-side browser security beyond our application's scope

## Recognition

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities:

- Recognition in our security advisories (with permission)
- Attribution in release notes
- Our sincere gratitude for helping keep BioContextAI secure

## Contact

For security-related questions or concerns:

- **Private Reports**: Use GitHub's private vulnerability reporting
- **General Questions**: Create a security issue on GitHub
- **Direct Contact**: contact@biocontext.ai

## Legal

This security policy is subject to our [Terms of Service](https://biocontext.ai/legal/terms) and [Privacy Policy](https://biocontext.ai/legal/privacy).
