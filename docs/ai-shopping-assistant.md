# Grounded DeepSeek Shopping Assistant (AI-P02)

AI-P02 adds a server-only DeepSeek integration for single-message Japanese shopping requests. It does not add a chat UI, conversation storage, streaming, tool calling, or commerce mutations.

## Request flow

```text
POST /api/ai/shopping
  -> strict request validation
  -> DeepSeek intent extraction
  -> untrusted JSON parsing and Zod validation
  -> deterministic normalization
  -> AI-P01 Product Search Service
  -> MongoDB candidate products
  -> DeepSeek candidate selection and reasons
  -> recommendation Zod validation
  -> candidate ID allowlist, deduplication, and limit
  -> server-side hydration from the candidate set
  -> grounded response
```

The final product set is always a subset of the AI-P01 candidate set. Product identity, name, category, price, currency, stock, image, slug, and URL are copied from the database-backed candidate DTO. DeepSeek supplies only a candidate `productId`, a concise Japanese reason, and an internal message that is validated but not trusted as the public response message.

## Configuration

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

The API key is read only by server modules and must never use a `NEXT_PUBLIC_` prefix. The provider uses `/chat/completions`, JSON Output, non-thinking mode, non-streaming responses, a 15-second timeout, and at most one retry for a timeout, network error, upstream 5xx, or empty content. Authentication failures, rate limits, invalid JSON, schema mismatches, and invalid local input are not retried.

## Deterministic policies

- Missing `inStock` becomes `true`.
- Missing `limit` becomes `5`; values above `10` are rejected.
- Empty intent queries are removed.
- Negative prices and inverted price ranges are rejected.
- A model-generated category outside the active database category allowlist is dropped before AI-P01 search.
- No candidates returns a successful empty result without a recommendation call.
- Only the first three unique, candidate-owned recommendation IDs are hydrated.
- A response containing no valid candidate IDs becomes a successful empty recommendation result.

## Public error behavior

Provider configuration, timeout, network, authentication, rate-limit, upstream, empty-content, malformed JSON, and schema failures are logged without prompts or credentials and become the same safe public `503` response. Ordinary catalog, cart, order, account, administration, and Stripe paths do not depend on the AI provider.
