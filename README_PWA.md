# Dozer — PWA 初期化メモ

フェーズ1の PWA 初期化の構成と手順です。

## 構成

- `public/manifest.json` — Web App Manifest（`metadata.manifest` と併用）
- `public/icons/icon-192.png`, `public/icons/icon-512.png` — マニフェスト用アイコン（現状は開発用プレースホルダ。本番ではブランド用に差し替えてください）
- `next.config.js` — `next-pwa` により本番ビルドで Service Worker（`public/sw.js`）を生成。開発時（`next dev`）は無効です
- `app/layout.tsx` — `metadata` で `manifest` / `themeColor` / `appleWebApp` を指定

## ローカル確認

```bash
npm install
npm run dev
```

本番相当の PWA 挙動（Service Worker 登録など）を確認する場合:

```bash
npm run build
npm start
```

## Git（main とは別ブランチで作業）

```bash
git checkout main
git pull
git checkout -b feat/task/<短いタスク名>
# 変更後
git add -A
git status   # .env や秘密情報が混ざっていないか確認
git commit -m "feat: 変更内容の要約"
git push -u origin HEAD
```

作業用ブランチ例: `feat/task/pwa-phase1`

## 環境変数（Supabase）

`.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください（未設定でもアプリは起動しますが、クライアントの Supabase は `null` になります）。
