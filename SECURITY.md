# Security Policy / セキュリティポリシー

## 脆弱性の報告

脆弱性や認証・決済に関する問題は、公開Issueに投稿しないでください。GitHubリポジトリの **Security → Report a vulnerability** から、非公開のSecurity Advisoryとして報告してください。

次の情報を含めてください。

- 影響を受ける画面、API、コミットまたはバージョン
- 再現手順と想定される影響
- 概念実証（機密情報や実在する決済情報を除く）
- 可能であれば回避策や修正案

確認が完了するまで、詳細の公開は控えてください。Stripeの本番キー、JWT、Cookie、個人情報、実カード情報は送信しないでください。

## Reporting a vulnerability

Do not open a public issue for security, authentication, or payment vulnerabilities. Use **Security → Report a vulnerability** in the GitHub repository to submit a private Security Advisory.

Include affected pages or endpoints, the relevant version or commit, reproduction steps, expected impact, and a safe proof of concept. Do not send live Stripe keys, JWTs, cookies, personal data, or real card details. Please avoid public disclosure until the report has been reviewed.
