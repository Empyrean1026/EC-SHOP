# EC Site

[日本語](#日本語) · [English](#english)

Next.js App Router、MongoDB、Stripeで構築した、レスポンシブ対応のフルスタックECサイトです。商品検索、カート、購入手続き、Webhookで検証する決済、マイページ、管理画面、売上分析までを一つのリポジトリで提供します。

---

## 日本語

### 主な機能

- JWTをHttpOnly Cookieに保存する新規登録・ログイン・ログアウト
- 商品一覧、商品詳細、カテゴリー、絞り込み、並び替え、ページ送り
- MongoDB全文検索、検索候補、あいまい検索、ブラウザ内の検索履歴
- ゲスト用ローカルカートと、ログイン後のMongoDB同期
- お気に入り、プロフィール、既定のお届け先、注文履歴
- Stripe Payment Element、Payment Intent、署名付きWebhookによる決済確定
- 商品・在庫・注文・ユーザーを管理するRBAC対応の管理画面
- 日次・月次売上、人気商品などの管理者向け分析
- レスポンシブUI、ダークモード、スケルトン、Toast、Modal、エラー画面
- Zod入力検証、CSRF対策、CSPなどのセキュリティヘッダー、レート制限
- Docker Compose、Node.js/Vitest/Playwrightによる自動テスト

### 技術スタック

| 分類            | 技術                                                   |
| --------------- | ------------------------------------------------------ |
| Web             | Next.js 16、React 19、TypeScript、App Router           |
| UI              | Tailwind CSS 4、React Hook Form、Recharts              |
| State           | Zustand                                                |
| API / DB        | Next.js Route Handlers、MongoDB 8、Mongoose 9          |
| Auth / Security | JWT（jose）、bcrypt、Zod、HttpOnly Cookie、CSRF        |
| Payment         | Stripe Payment Element、Payment Intent、Webhook        |
| Quality         | ESLint、Prettier、Node Test Runner、Vitest、Playwright |
| Deployment      | Docker、Docker Compose、Next.js standalone output      |

### 必要環境

- Node.js 20.19以上（`.nvmrc`ではNode.js 22を指定）
- npm
- MongoDB 8、またはDocker Desktop
- Stripeテストアカウント（オンライン決済を検証する場合）

### ローカルセットアップ

```bash
git clone <repository-url>
cd ec-site
npm ci
cp .env.example .env.local
```

`.env.local`を編集したあと、設定とデータベースを準備します。

```bash
npm run env:check
npm run db:indexes
npm run db:seed
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。`npm`コマンドは、`package.json`がある`ec-site`ディレクトリで実行してください。

### 環境変数

| 変数                                 | 用途                                       |
| ------------------------------------ | ------------------------------------------ |
| `MONGODB_URI`                        | MongoDB接続URI                             |
| `APP_URL`                            | アプリの公開URL                            |
| `AUTH_SECRET`                        | JWT署名用シークレット（32バイト以上）      |
| `CSRF_SECRET`                        | CSRFトークン用シークレット（32バイト以上） |
| `BCRYPT_SALT_ROUNDS`                 | bcryptのコスト（10〜14）                   |
| `TRUST_PROXY`                        | 信頼できるリバースプロキシ配下のみ`true`   |
| `STRIPE_SECRET_KEY`                  | Stripeシークレットキー                     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe公開可能キー                         |
| `STRIPE_WEBHOOK_SECRET`              | Stripe Webhook署名シークレット             |

シークレットはリポジトリへコミットしないでください。Stripe関連の3変数は、すべて設定するか、すべて未設定にします。

### Stripeテストモード

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

表示された`whsec_...`を`STRIPE_WEBHOOK_SECRET`へ設定し、開発サーバーを再起動します。Stripeのテストカード`4242 4242 4242 4242`、任意の将来日、有効なCVCを使用できます。決済成功はブラウザの戻り値ではなく、`payment_intent.succeeded` Webhookの署名検証後に注文へ反映されます。

### サンプル商品

商品とカテゴリーは`scripts/catalog-seed-data.ts`で管理しています。商品画像は`public/products/`内の、文字やブランド要素を含まないローカルSVGです。再投入は何度実行してもslug単位で更新されます。

```bash
npm run db:seed
```

### 管理者権限

アカウント登録後、次のコマンドで管理者へ変更します。変更後は再ログインしてください。

```bash
npm run user:role -- --email=user@example.com --role=admin
```

### Docker

```bash
docker compose up -d --build
docker compose run --rm db-init npm run db:seed
docker compose ps
```

停止は`docker compose down`、MongoDBボリュームも削除する場合のみ`docker compose down -v`を使用します。

### 品質チェック

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run check`は環境変数、フォーマット、lint、型、単体・結合テストをまとめて検証します。Playwrightの初回実行前は`npx playwright install chromium`を実行してください。

### 主な画面

- `/products` 商品一覧
- `/search` 商品検索
- `/cart` カート
- `/checkout` 購入手続き
- `/account` マイページ
- `/account/orders` 注文履歴
- `/account/address` お届け先管理
- `/account/wishlist` お気に入り
- `/admin` 管理画面
- `/admin/analytics` 売上分析

### ディレクトリ構成

```text
app/             画面、レイアウト、Route Handlers
components/      UIと機能別コンポーネント
e2e/             Playwright E2E/APIテスト
hooks/           React hooks
lib/             認証、検証、API、共通処理
models/          Mongooseモデルとスキーマ
public/products/ ローカル商品画像
scripts/         seed、index、migration、運用スクリプト
services/        サーバー・クライアントサービス
store/           Zustandストア
tests/           Node.jsテスト
tests-vitest/    Vitestテスト
types/           共有TypeScript型
```

セキュリティ上の問題は公開Issueに機密情報を掲載せず、[SECURITY.md](SECURITY.md)の手順で報告してください。コントリビューション手順は[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

---

## English

### Overview

EC Site is a responsive full-stack commerce application built with Next.js App Router, MongoDB, and Stripe. It includes catalog discovery, cart and checkout flows, webhook-verified payments, customer account pages, administration, and sales analytics in a single repository.

### Features

- Registration, login, and logout with JWT stored in an HttpOnly cookie
- Catalog, product details, categories, filters, sorting, and pagination
- MongoDB full-text search, suggestions, fuzzy fallback, and local search history
- Local guest cart with MongoDB persistence after login
- Wishlist, profile, default shipping address, and order history
- Stripe Payment Element and Payment Intents confirmed by signed webhooks
- RBAC-protected product, inventory, order, and user administration
- Daily and monthly revenue analytics and top-product reporting
- Responsive UI, dark mode, skeletons, toasts, modals, and error states
- Zod validation, CSRF protection, security headers, and rate limiting
- Docker Compose and automated Node.js, Vitest, and Playwright tests

### Requirements and setup

- Node.js 20.19 or newer (`.nvmrc` selects Node.js 22)
- npm
- MongoDB 8 or Docker Desktop
- A Stripe test account when testing online payments

```bash
git clone <repository-url>
cd ec-site
npm ci
cp .env.example .env.local
npm run env:check
npm run db:indexes
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run all `npm` commands from the `ec-site` directory containing `package.json`. Never commit secrets; configure all three Stripe variables together, or leave all three unset.

### Stripe test mode

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Set the displayed `whsec_...` value as `STRIPE_WEBHOOK_SECRET`, then restart the development server. Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any valid CVC. The order becomes paid only after the signed `payment_intent.succeeded` webhook is verified; the browser redirect is not trusted as payment proof.

### Seed data and administrator access

Catalog data lives in `scripts/catalog-seed-data.ts`, while text-free, brand-free local SVG assets live in `public/products/`. Re-running the seed updates records by slug:

```bash
npm run db:seed
npm run user:role -- --email=user@example.com --role=admin
```

Sign in again after changing a role.

### Docker

```bash
docker compose up -d --build
docker compose run --rm db-init npm run db:seed
docker compose ps
```

Use `docker compose down` to stop the stack. Add `-v` only when you intentionally want to delete the MongoDB volume.

### Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run check` validates environment configuration, formatting, lint, types, and the Node.js/Vitest suites. Before the first Playwright run, install Chromium with `npx playwright install chromium`.

### Project layout

```text
app/             Pages, layouts, and Route Handlers
components/      UI and feature components
e2e/             Playwright browser and API tests
hooks/           React hooks
lib/             Authentication, validation, API, and shared logic
models/          Mongoose models and schemas
public/products/ Local product assets
scripts/         Seed, index, migration, and operational scripts
services/        Server and client services
store/           Zustand stores
tests/           Node.js tests
tests-vitest/    Vitest tests
types/           Shared TypeScript types
```

For security reporting, see [SECURITY.md](SECURITY.md). For contribution workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No open-source license has been selected. All rights are reserved until the repository owner adds a license.
