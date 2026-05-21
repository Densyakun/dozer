# Dozer — Mobile-first AI Development Environment

AI駆動のモバイルファースト開発環境で、自然言語でAIに指示を出し、AIがコード生成・編集・実行・プレビューを行います。

## 技術スタック

- **Frontend**: Next.js (App Router), TypeScript, React, Tailwind CSS, PWA
- **Runtime**: WebContainer API, tsx-safe-eval
- **Backend**: Next.js API Routes
- **Database/Sync**: Supabase, Supabase Realtime
- **AI**: PortKey AI (OpenAI compatible)

## 必要機能 (Phase 1)

1. Next.js PWA初期化 ✓
2. Supabase接続 ✓
3. WebContainer起動 ✓
4. 仮想ファイルツリー ✓
5. tsx-safe-eval preview ✓
6. AI chat panel ✓
7. iframe preview ✓
8. realtime file sync ✓
9. basic action executor ✓
10. mobile-first UI ✓

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local

# 開発サーバーの起動
npm run dev
```

## 環境変数 (.env.local)

```env
# Supabase (リアルタイム同期用)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# PortKey AI (AIエージェント用)
PORTKEY_API_KEY=your_portkey_api_key
PORTKEY_MODEL=gpt-4o-mini
PORTKEY_CONFIG_ID=your_config_id
PORTKEY_BASE_URL=https://api.portkey.ai/v1
```

## AIエージェント如何使用

1. `.env.local`に`PORTKEY_API_KEY`を設定
2. アプリ起動後、**エージェント**タブを選択
3. AIに自然言語で指示を入力（例：「カウンター機能を追加して」）
4. AIがアクション（writeFile等）を返すと自動的に実行
5. ファイルツリーとプレビューで結果を確認

## 機能

### ファイル管理
- 仮想ファイルツリーでファイル一覧表示
- ファイルの選択・編集・作成・削除
- リアルタイム同期（Supabase設定時）

### プレビュー
- **軽量モード**: tsx-safe-evalによる即時プレビュー（React CDN使用）
- **重量モード**: WebContainerによる本格的プレビュー

### AI Chat Panel
- 自然言語での指示入力
- アクションの自動実行（writeFile, runCommand等）
- 実行ログの表示

## モバイルUI

- 大きいタッチターゲット
- 下部ナビゲーション（ファイル/プレビュー/エージェント）
- レスポンシブ対応（モバイル/タブレット以上）

## フォルダ構成

```
/app              - Next.js App Router
/components       - Reactコンポーネント
/features         - 機能別モジュール
/lib              - ユーティリティ・クライアント
/runtime          - WebContainer・evaluator
/agent            - AIエージェント・アクション実行
/supabase         - Realtime同期
/evaluator        - tsx-safe-eval
```

## コーディングルール

- 必ず動作するコードを書く（placeholder禁止）
- `any` 型禁止
- 小さいモジュールへ分割
- 責務分離を徹底
- スマホ性能を考慮した軽い実装

## 開発メモ

- WebContainerはHTTPS環境とsame-originで動作
- localhostでは制限される場合がある
- リアルタイムファイル同期にはSupabaseの設定が必要
- AI接続がない場合はモックモードで動作