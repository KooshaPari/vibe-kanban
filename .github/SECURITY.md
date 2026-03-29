# Security Policy

## Supported Versions

We actively support the following versions of vibe-kanban with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report privately

Instead, please report vulnerabilities using one of these methods:

- **GitHub Security Advisories**: Use the [Security tab](https://github.com/kooshapari/vibe-kanban/security/advisories) to report vulnerabilities privately
- **Email**: Send details to [security@vibe-kanban.dev](mailto:security@vibe-kanban.dev) (if available)

### 3. Include detailed information

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)
- Your contact information

### 4. Response timeline

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

## Security Measures

### Automated Security

Our repository includes several automated security measures:

- **Dependency Scanning**: Automated dependency vulnerability scanning
- **Code Scanning**: Static Application Security Testing (SAST) with CodeQL
- **Secret Scanning**: Automated detection of committed secrets
- **Container Scanning**: Security scanning of container images
- **SBOM Generation**: Software Bill of Materials for supply chain security

### Security Best Practices

We follow these security best practices:

1. **Dependency Management**: Regular dependency updates and vulnerability patching
2. **Code Review**: All code changes require review before merging
3. **Principle of Least Privilege**: Minimal permissions for all services and deployments
4. **Secure Development**: Security considerations integrated into development process
5. **Regular Audits**: Periodic security assessments and penetration testing

### Deployment Security

- **Blue-Green Deployments**: Zero-downtime deployments with rollback capability
- **Environment Isolation**: Separate staging and production environments
- **Secret Management**: Secure handling of API keys and sensitive configuration
- **Network Security**: Proper firewall and network segmentation
- **Monitoring**: Real-time security monitoring and alerting

## Security Configuration

### Frontend Security

- Content Security Policy (CSP) headers
- Secure HTTP headers implementation
- Input validation and sanitization
- XSS protection measures
- Secure authentication flow

### Backend Security

- Input validation and sanitization
- SQL injection prevention
- Authentication and authorization
- Secure API endpoints
- Rate limiting and DDoS protection

### Infrastructure Security

- HTTPS/TLS encryption
- Secure container configuration
- Regular security updates
- Access logging and monitoring
- Backup and disaster recovery

## Responsible Disclosure

We believe in responsible disclosure and will work with security researchers to:

1. Verify and reproduce reported vulnerabilities
2. Develop and test fixes
3. Coordinate disclosure timeline
4. Credit researchers (if desired) in security advisories

## Bug Bounty

Currently, we do not offer a formal bug bounty program. However, we greatly appreciate security researchers who help improve our security posture.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## Questions

If you have questions about this security policy, please create a [GitHub Discussion](https://github.com/kooshapari/vibe-kanban/discussions) or contact the maintainers.

---

**Last Updated**: January 2025