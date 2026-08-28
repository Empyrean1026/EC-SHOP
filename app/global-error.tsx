"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[ui/global-error] Root layout failed", error);
  }, [error]);

  return (
    <html lang="ja-JP">
      <head>
        <title>ページを表示できません | EC Site</title>
      </head>
      <body style={{ margin: 0 }}>
        <main className="global-error-shell">
          <section className="global-error-card">
            <span className="global-error-mark" aria-hidden="true">
              !
            </span>
            <p className="global-error-label">Critical error</p>
            <h1>サイトを表示できません</h1>
            <p>
              ページで予期しないエラーが発生しました。再読み込みしても解決しない場合は、下記のエラーIDをお知らせください。
            </p>
            {error.digest ? <code>エラーID：{error.digest}</code> : null}
            <button onClick={retry} type="button">
              再読み込み
            </button>
          </section>
        </main>
        <style>{`
          :root { color-scheme: light dark; font-family: Arial, sans-serif; }
          .global-error-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f5f5f4; color: #1c1917; }
          .global-error-card { width: min(100%, 520px); box-sizing: border-box; padding: 40px; text-align: center; border: 1px solid #fecaca; border-radius: 28px; background: #fff; box-shadow: 0 16px 45px rgba(28,25,23,.08); }
          .global-error-mark { display: grid; place-items: center; width: 56px; height: 56px; margin: 0 auto; border-radius: 50%; background: #fef2f2; color: #b91c1c; font-size: 24px; font-weight: 700; }
          .global-error-label { margin: 24px 0 0; color: #b91c1c; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
          h1 { margin: 12px 0; font-size: clamp(28px, 6vw, 40px); letter-spacing: -.04em; }
          p { line-height: 1.7; color: #78716c; }
          code { display: block; margin: 16px 0; font-size: 12px; color: #a8a29e; }
          button { min-height: 44px; margin-top: 12px; padding: 0 28px; border: 0; border-radius: 999px; background: #1c1917; color: #fff; font-weight: 700; cursor: pointer; }
          button:hover { background: #ea580c; }
          @media (prefers-color-scheme: dark) {
            .global-error-shell { background: #12100f; color: #fafaf9; }
            .global-error-card { background: #1c1917; border-color: #7f1d1d; }
            p { color: #a8a29e; }
          }
        `}</style>
      </body>
    </html>
  );
}
