# 維護者發布流程

公開 repo 只接受已完成公開審查的學員材料。內部講稿、錄影提示、私人網址、帳號、聯絡資料與未授權素材不得匯入。

## 單集發布順序

1. 在製作環境完成該集內容與驗收。
2. 準備一個只含公開資料的 episode 資料夾。
3. 先執行匯入工具的預演，確認沒有拒絕項目。
4. 使用 `--write` 正式匯入。
5. 更新 `episodes/manifest.json` 與首頁進度。
6. 執行全庫檢查，並以瀏覽器驗收桌機與手機畫面。
7. 產生單集壓縮檔、建立版本標籤與 GitHub Release。

```bash
node scripts/import-public-ready-episode.mjs /path/to/public-ready-episode
node scripts/import-public-ready-episode.mjs /path/to/public-ready-episode --write
node scripts/validate-repo.mjs
node scripts/package-episode.mjs ep01-cafe v1.0.0
```

匯入工具只處理公開白名單檔案，並預設不寫入。它不是隱私審查的替代品；發布前仍需人工檢查每一份文字、圖片與連結。
