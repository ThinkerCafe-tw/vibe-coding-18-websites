# EP01 山風咖啡

第一集不是從背一大段提示詞開始，而是從一段自然對話開始。你會把「我想做什麼」說清楚，請 AI 回述、補問、整理成規格，批准後才施工，最後親自驗收網站。

## 這一集會完成

1. 用自然對話說出網站需求。
2. 請 AI 回述理解與缺漏，不急著寫程式。
3. 把確認過的內容整理成施工規格。
4. 批准施工後，檢查手機與桌機版。
5. 用截圖指出問題，再做最小幅度修正。

## 直接開始

- [開啟完成版網站](site/)
- [先看施工規格](SPEC.md)
- [跟著對話卡操作](PROMPT-CARD.md)
- [使用驗收清單](VERIFY.md)
- [核對圖片來源](site/assets/ATTRIBUTION.md)

網站中的店名、故事、地址、電話與價格皆為課程示意資料，請勿當成真實店家資訊。

`site/assets/` 已放入本集使用的三張固定練習圖片。手邊沒有照片時，先用這組素材完成練習，就不必讓 AI 在施工中臨時找圖。做自己的網站時，再換成自己的照片、AI 生成圖，或已確認授權的素材。

## 檔案結構

```text
ep01-cafe/
├── README.md
├── PROMPT-CARD.md
├── SPEC.md
├── VERIFY.md
└── site/
    ├── index.html
    └── assets/
        ├── hero-coffee.jpg
        ├── about-coffee.jpg
        ├── workspace-coffee.jpg
        └── ATTRIBUTION.md
```

## 在自己的電腦開啟

下載本集壓縮檔並解壓縮後，直接打開 `site/index.html` 即可。也可以把整個資料夾交給 Codex，從 `PROMPT-CARD.md` 的第一步開始對話。
