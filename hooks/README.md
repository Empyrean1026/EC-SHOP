# Hooks

Reusable client-side React hooks live here.

`use-cart-operations.ts` provides add, quantity, remove, and clear actions. Guest actions stay local; account actions use optimistic updates and roll back if the protected cart API rejects the mutation.
