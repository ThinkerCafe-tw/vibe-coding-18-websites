# 共用講次素材格式（v1）

每講以 `episodes/<slug>/materials.json` 為唯一手動維護的資料來源。課程網站與 `thinker.cafe/classroom/jacky` 可讀取同一份檔案，依各自頁面呈現；不要各自維護提示詞副本。JSON 與檔案採 UTF-8。

```json
{
  "schemaVersion": 1,
  "episode": "ep13-auto",
  "materials": [],
  "missing": []
}
```

`materials` 的陣列順序就是教學取用順序；未整理講次使用空陣列，不代表沒有影片素材。`episode` 必須與資料夾名稱一致。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | string | 本講內穩定且唯一的識別碼，使用小寫字母、數字、連字號。 |
| label | string | 學員能理解的中文名稱。 |
| kind | string | `prompt`、`image`、`starter-html` 或 `other`。 |
| text | string | 提示詞或文字素材全文；包含所有換行、空白、HTML。 |
| file | string | 相對於這份 JSON 的檔案路徑，例如 `materials/index-before.html`；不可為絕對路徑、外部 URL 或包含 `..`。與 text 二選一。 |
| sha256 | string | 64 字元小寫十六進位。text 使用原字串的 UTF-8 bytes；file 使用下載檔原始 bytes。不得 trim、改換行或重新序列化後再核對。 |
| usedInVideoAt | string[] | 影片段落 cue 編號，如 `006`、`027a`，依旁白順序排列；不是秒數。 |
| imagePrompt | string | 圖片必填。另附的同類示意圖生成建議，要求圖片標示「示意圖，待換店家照片」。不表示這是原圖的生成紀錄。 |
| description | string | 可選；說明該用哪份、何時貼上及先備條件。 |
| missingDependencies | object[] | 可選；原始 HTML 有引用而來源未提供的依賴。每筆 `file` 相對該 HTML，`reason` 說明缺件。不能用來隱藏一般連結錯誤。 |

prompt 必須提供 text；image 與 starter-html 必須提供 file。HTML 內嵌於提示詞時保留原文；另抽出的 HTML 檔案仍要獨立計算 sha256。影片使用的前後版要分開列出，保留原本問題，不能以目前完成版冒充修改前素材。

頂層 `missing` 列出已查證但拿不到的來源，每筆包含 `id`、`label`、`usedInVideoAt`、`reason`。缺件不能用自行編寫的內容補成「影片原文」。示意圖片的說明放在頁面與生成建議中，原圖下載 bytes 保持不變。

## 網站與離線使用

線上消費端可以 fetch 此 JSON，使用 `new URL(item.file, jsonUrl)` 解析下載地址。複製文字直接使用 `item.text`；不得由摘要、HTML 渲染文字或 Markdown 反向還原。圖片提示使用 `item.imagePrompt`。

本站用 `python3 scripts/build-materials.py` 產生靜態區塊與離線 copy payload。payload 的 `materials` 必須等於來源陣列，`fileTexts` 是檔案 bytes 解碼後的完整文字。JSON 嵌入頁面時跳脫 HTML 分隔字元，避免素材內的 script 標籤被當成頁面程式執行。生成內容不能手改；`--check` 會核對是否過期。

ZIP 包含 JSON、素材原檔、圖片、共用樣式與複製程式、貼上預覽工具。解壓後雙擊最外層 index.html 即可使用，讀取與複製素材不需要網路或登入。需要 AI 產生新內容時，另使用自己的 AI 工具。

```bash
python3 scripts/build-materials.py
python3 scripts/build-downloads.py
node scripts/validate-repo.mjs
python3 scripts/build-materials.py --check
```
