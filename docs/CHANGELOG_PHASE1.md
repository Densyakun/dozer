# Dozer — Phase 1 変更ログと注意事項

フェーズ1で追加・変更した主なファイルと注意事項です。

## 変更した主要ファイル

- `app/globals.css` — グローバルスタイル（重複解消、CSS 変数、タッチ向けフォントサイズ）
- `types/css.d.ts` — CSS 副作用インポート用の型宣言
- `app/layout.tsx` — `metadata`（manifest / themeColor / appleWebApp）、viewport
- `next.config.js` — `next-pwa` 統合（本番ビルドで SW 生成）
- `public/manifest.json`, `public/icons/*` — PWA マニフェストとアイコン
- `app/page.tsx`, `app/components/MobileShell.tsx` — モバイル単一ペイン + 下部ナビ、md 以上で分割レイアウト
- `components/FileTree.tsx`, `components/ChatPanel.tsx`, `components/Preview.tsx` — UI と API 連携の整理
- `lib/supabaseClient.ts`, `supabase/realtime.ts` — Supabase クライアント（未設定時は `null`）と Realtime スタブ
- `runtime/webcontainerClient.ts` — WebContainer スタブ
- `app/components/PreviewIframe.tsx` — iframe プレビュー用の小コンポーネント（必要に応じて利用）
- `evaluator/tsxSafeEval.ts` — サーバ側 TSX 評価スタブ（デモ用）
- `app/api/agent/route.ts`, `app/api/action/route.ts` — エージェント応答とアクション実行スタブ

## Git / ブランチ

PWA やフェーズ1の作業は **`main` 以外のブランチ** でコミットしてください。手順の例は `README_PWA.md` を参照してください。

（旧）`scripts/branch-and-commit.sh` は削除済みです。通常の `git checkout -b` で十分です。

## セキュリティと安全性

- `evaluator/tsxSafeEval.ts` はデモ用の簡易実装です。任意コード実行を含むため、本番でそのまま使わないでください。
- WebContainer の実実行はブラウザ内で行う必要があり、`runtime/webcontainerClient.ts` はスタブです。

## Supabase

- `lib/supabaseClient.ts` は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を参照します。`.env.local` に設定してください。未設定時は `supabase` が `null` になり、`subscribeFiles` は no-op です。

## PWA 生成物

`npm run build` 時に `public/sw.js` や `workbox-*.js` が生成されます。リポジトリでは `.gitignore` 済みです。デプロイ先ではビルド時に生成されます。

## 型定義

- `react-dom/server` 用に `@types/react-dom` を devDependencies に含めています。`@types/react` は React 18 に合わせています。

## 次の推奨作業

- 本番用アイコン・スプラッシュの差し替え
- Supabase Realtime の実チャンネル接続
- WebContainer 実装と重量プレビュー
- エージェントの実 API 化と diff / タスクキュー
