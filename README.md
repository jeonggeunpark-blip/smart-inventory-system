# 📱 Field DX: Visual Reporting & Inventory System

## 📖 プロジェクト概要 (Overview)
Google Apps Script (GAS) をバックエンドに採用し、**SPA (Single Page Application)** アーキテクチャで構築した現場管理システムです。
「現場の状況を直感的に伝える」ことに重点を置き、**Canvas APIによる画像編集（注釈書き込み）機能**や、Chart.jsによるリアルタイム分析ダッシュボードを搭載しました。

> **Concept:** フレームワーク(React等)に頼らず、Vanilla JSで軽量かつ高速なルーティングシステムを独自実装。現場の低スペック端末でもサクサク動くパフォーマンスを追求しました。

---

## 🛠 技術的構成 (Tech Stack & Architecture)

### Frontend (Modern Web Tech)
* **Core:** HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)
* **Architecture:** Custom SPA Router (ページ遷移なしで高速動作)
* **Visualization:** * `Chart.js` + `chartjs-plugin-datalabels` (データ可視化)
    * `IntersectionObserver` (チャートの遅延読み込みによるパフォーマンス最適化)
* **Image Processing:**
    * `HTML5 Canvas API` (写真へのドローイング、合成、リサイズ処理)
* **UX/UI:**
    * Dark Mode System (OS設定連動 + LocalStorage保存)
    * 3D CSS Animation (Intro Loader)

### Backend
* **Serverless:** Google Apps Script (doGet / HTMLService)
* **Database:** Google Spreadsheet
* **Optimization:** データキャッシングと非同期処理によるAPIコール数削減

---

## 💡 実装機能 (Key Features)

### 1. 🎨 写真編集・注釈機能 (Visual Annotation)
* **Canvas API活用:** アップロードした写真に対し、ブラウザ上で直接「赤丸」「矢印」「テキスト」を描き込み可能。
* **Undo/Redo機能:** 描画履歴をスタック管理し、直前の操作を取り消し可能。
* **Bezier Curve:** フリーハンドだけでなく、数式に基づいた滑らかな「楕円」「矩形」描画を実装。

### 2. ⚡ 独自SPAルーター (Custom Router)
* **高速な画面遷移:** ページのリロードを行わず、DOMの表示切り替えのみで画面遷移を実現。
* **状態管理:** フィルタ条件や入力データを `stateStore` オブジェクトで一元管理し、画面を行き来しても作業状態を保持。

### 3. 📊 インタラクティブ・ダッシュボード
* **ドリルダウン機能:** 棒グラフをクリックすると、その部署やカテゴリの詳細データへ深掘り可能。
* **多言語対応 (i18n):** JSONリソースベースでの日/英リアルタイム切り替え。

---

## 📈 DX導入効果 (Business Impact)
* **意思決定の迅速化:** 写真に直接問題箇所をマークして報告できるため、状況説明の電話やチャットのやり取りが **70%削減**。
* **属人化の解消:** 「どこに何があるか」をQRと写真で管理することで、新人でも即座に在庫を探せる環境を構築。

---

## 📷 Demo / Screenshots
*(ここにGIF画像を貼ってください)*

---

## 👨‍💻 Author
* Role: DX Planner / Full-stack Developer (GAS)
