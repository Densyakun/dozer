# Dozer — PWA初期化メモ

このファイルはフェーズ1のPWA初期化に関する最小構成を記録します。

追加済みファイル:
- `public/manifest.json`
- `app/page.tsx`

次の手順:
1. アイコン `public/icons/icon-192.png` と `icon-512.png` を配置してください（現状は参照のみ）。
2. `next-pwa` を使用する場合は `npm install next-pwa` を行い、`next.config.js` を調整してください。
3. 開発サーバを起動して確認:

```bash
npm install
npm run dev
```

Git ブランチ・コミット手順（タスクごと）:

1. 新しいタスク用ブランチを作成:

```bash
./scripts/branch-and-commit.sh "task-name"
```

2. 変更を行ったらコミット:

```bash
./scripts/branch-and-commit.sh commit "短いコミットメッセージ"
git push -u origin feat/task/task-name
```

