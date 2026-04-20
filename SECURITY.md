# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Generally, we support:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

The latest release version is always the most supported.

## Reporting a Vulnerability

**Please do NOT create a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in CONTEKT, please report it privately by emailing:

📧 **[security@contekt.group](mailto:security@contekt.group)**

### What to Include

Please include the following information when reporting a security issue:

1. **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass, etc.)
2. **Location** (file path, component name, or endpoint)
3. **Steps to reproduce** the vulnerability
4. **Potential impact** (what could an attacker do?)
5. **Your suggested fix** (if you have one)

### Response Timeline

- We will acknowledge receipt of your report within 48 hours
- We will provide an initial assessment and timeline within 5 business days
- Security patches will be released as soon as possible depending on the complexity and severity

## Security Best Practices

### For Users

1. **Use Strong Passwords:** Choose complex, unique passwords for your account
2. **Enable OAuth:** Use Google or GitHub OAuth when available for better security
3. **Keep Software Updated:** Always use the latest version of CONTEKT
4. **Secure Your Device:** Use trusted devices and enable device security features
5. **Report Suspicious Activity:** If you notice unusual activity, please contact us immediately

### For Developers & Self-Hosters

1. **Environment Variables:** Keep `.env.local` and environment variables secure and never commit them
2. **Database Security:**
   - Use strong database passwords
   - Enable Row Level Security (RLS) in Supabase
   - Regularly backup your database
3. **Authentication:**
   - Use HTTPS in production
   - Rotate OAuth secrets periodically
   - Implement proper CORS policies
4. **Dependencies:**
   - Regularly update dependencies using `pnpm update`
   - Review security advisories for dependencies
5. **Deployment:**
   - Use environment-specific configurations
   - Enable database encryption at rest
   - Use firewalls to restrict access
   - Implement rate limiting on API endpoints

## Security Features in CONTEKT

### Authentication & Authorization

- **Supabase Auth:** Industry-standard authentication with Supabase
- **OAuth Integration:** Secure sign-in with Google and GitHub
- **Row Level Security (RLS):** Database-level access control
- **Protected Routes:** Client-side route protection for authorized pages
- **Admin Role System:** Granular permission management through admin roles

### Data Protection

- **Image Compression:** Automatic image compression to reduce attack surface
- **Password Hashing:** All passwords handled by Supabase's secure authentication
- **Encrypted Connections:** All data transmitted over HTTPS in production
- **Database Encryption:** Supabase provides encryption at rest

### Access Control

- **User Isolation:** Users can only see their own items and profile
- **Admin Dashboard:** Restricted access to admin-only features
- **Invite System:** Controlled user registration through invite codes
- **Permission Checking:** Server-side validation of all user actions

## Known Vulnerabilities

We currently have no known unpatched security vulnerabilities.

If a vulnerability is discovered:
1. It will be privately disclosed to the reporter
2. A patch will be developed and tested
3. The patch will be released as soon as possible
4. This document will be updated with disclosure details after patching

## Responsible Disclosure

We practice responsible disclosure and appreciate your help in keeping CONTEKT secure. 

**Please note:**
- We will not take legal action against security researchers who responsibly disclose vulnerabilities
- We ask that you give us reasonable time to patch before public disclosure
- Maintain confidentiality of the vulnerability until we've released a fix

## Security Audit

CONTEKT is an open-source project. While we maintain security best practices, we recommend:

1. Reviewing the source code before deployment
2. Conducting security audits appropriate to your use case
3. Testing in a staging environment before production deployment

## Dependencies & Vulnerabilities

We use the following security tools:

- **npm audit / pnpm audit:** Regular dependency audits
- **Dependabot:** Automated dependency updates
- **ESLint:** Code quality and security checks

To audit dependencies yourself:

```bash
pnpm audit
```

## Contact & Questions

- **General Security Questions:** [security@contekt.group](mailto:security@contekt.group)
- **Bug Reports (Non-Security):** [GitHub Issues](https://github.com/yourusername/contekt/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/yourusername/contekt/discussions)

---

**Thank you for helping keep CONTEKT secure!**

Last Updated: February 2026
