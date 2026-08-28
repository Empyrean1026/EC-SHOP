# Contributing / コントリビューション

## 日本語

1. Issueまたは作業目的を確認し、変更範囲を小さく保ってください。
2. `main`から作業ブランチを作成し、既存のAPI、DBフィールド、URLとの互換性を維持してください。
3. UI文言は自然な日本語、金額は`ja-JP`のJPY形式、日付は`ja-JP`で統一してください。
4. `.env.local`、Stripeキー、Cookie、個人情報などをコミットしないでください。
5. PR前に次を実行してください。

```bash
npm ci
npm run check
npm run build
npm run test:e2e
```

データベース構造を変更する場合は、migration/indexスクリプトと関連ドキュメントを更新してください。決済状態はブラウザの戻り値ではなくStripe Webhookを正とします。

## English

1. Confirm the issue or objective and keep each change focused.
2. Branch from `main` and preserve compatibility with existing APIs, database fields, and URLs.
3. Keep UI copy in natural Japanese and format JPY and dates with the `ja-JP` locale.
4. Never commit `.env.local`, Stripe keys, cookies, or personal data.
5. Run `npm ci`, `npm run check`, `npm run build`, and `npm run test:e2e` before opening a pull request.

Database changes must include the relevant migration/index script and documentation. Stripe webhook events, not browser redirects, are the source of truth for payment status.
