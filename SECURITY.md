# Security Policy

## Supported Versions

Teddy is currently pre-1.0 software. Security fixes are normally made against the latest released version only.

| Version | Supported |
|---|---|
| Latest release | Yes |
| Older releases | No |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, please use GitHub's **Private Vulnerability Reporting** feature:

1. Navigate to the **Security** tab of this repository.
2. Click on **Vulnerabilities** under the "Reporting" header.
3. Click **Report a vulnerability** to privately submit your report.

Please include as much detail as possible, including:

- the affected Teddy version or commit
- the affected file, feature, theme, or build option
- steps to reproduce the issue
- the expected and actual behavior
- any proof-of-concept input, Markdown, configuration, template, or generated output
- whether the issue affects build-time code, generated static output, or client-side runtime code

## Scope

Security issues may include, but are not limited to:

- cross-site scripting in generated pages, themes, templates, or client-side assets
- unsafe handling of Markdown, frontmatter, taxonomy, contributor, or language data
- path traversal or unsafe filesystem operations during builds
- unsafe deletion, copying, or deployment of files
- unsafe loading of search indexes or generated client-side data
- dependency vulnerabilities that affect Teddy builds or generated sites

## Out of Scope

The following are usually out of scope:

- vulnerabilities in third-party hosting platforms
- issues caused by manually modified generated output
- denial-of-service reports that require unrealistic local access or intentionally malicious repository control
- vulnerabilities in third-party dependencies that do not affect Teddy in practice

## Disclosure Process

After receiving a report, I will try to:

1. Acknowledge receipt within 28 days.
2. Investigate and confirm the issue.
3. Prepare a fix where appropriate.
4. Release the fix and document the impact.
5. Credit the reporter if requested.

Please allow reasonable time for investigation and remediation before public disclosure.
