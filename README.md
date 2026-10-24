# 18 個網站學會 Vibe Coding

華視空中進修學院《網頁設計》課程的公開學員資源。這裡提供每一講的可執行網站、依既有教材整理的施工規格、對話提示卡與驗收清單。

[開啟學員網站](https://vibe-coding-18-websites.vercel.app/) · [開始 EP01](episodes/ep01-cafe/README.md) · [查看 EP03](episodes/ep03-photographer/README.md) · [回報問題](https://github.com/ThinkerCafe-tw/vibe-coding-18-websites/issues)

## 這門課怎麼學

不是先背一大段完美 Prompt，也不是看到 AI 說「完成」就結束。

1. 像開會一樣說出需求，請 AI 先回述。
2. 把回述整理成可批准的施工規格，再開始改檔案。
3. 用手機、桌機與實際按鈕驗收；結果可以重做，才算通過。

## 課程內容

本整理版提供 18 講可開啟網站與教學檔；每講的規格仍需由實作者審閱確認。

| 講次 | 主題 | 網站與教學 | 原始碼 |
|---|---|---|---|
| EP01 | 咖啡廳網站 | [進入本講](episodes/ep01-cafe/) | [下載](downloads/ep01-cafe.zip) |
| EP02 | 健身房網站 | [進入本講](episodes/ep02-gym/) | [下載](downloads/ep02-gym.zip) |
| EP03 | 攝影師作品集 | [進入本講](episodes/ep03-photographer/) | [下載](downloads/ep03-photographer.zip) |
| EP04 | 診所預約網站 | [進入本講](episodes/ep04-clinic/) | [下載](downloads/ep04-clinic.zip) |
| EP05 | 美容院會員網站 | [進入本講](episodes/ep05-beauty/) | [下載](downloads/ep05-beauty.zip) |
| EP06 | 法律事務所網站 | [進入本講](episodes/ep06-law/) | [下載](downloads/ep06-law.zip) |
| EP07 | 餐廳訂位網站 | [進入本講](episodes/ep07-restaurant/) | [下載](downloads/ep07-restaurant.zip) |
| EP08 | 瑜伽教室網站 | [進入本講](episodes/ep08-yoga/) | [下載](downloads/ep08-yoga.zip) |
| EP09 | 寵物美容網站 | [進入本講](episodes/ep09-pet/) | [下載](downloads/ep09-pet.zip) |
| EP10 | 個人教練網站 | [進入本講](episodes/ep10-trainer/) | [下載](downloads/ep10-trainer.zip) |
| EP11 | 民宿訂房網站 | [進入本講](episodes/ep11-bnb/) | [下載](downloads/ep11-bnb.zip) |
| EP12 | 家教媒合網站 | [進入本講](episodes/ep12-tutor/) | [下載](downloads/ep12-tutor.zip) |
| EP13 | 汽車保養網站 | [進入本講](episodes/ep13-auto/) | [下載](downloads/ep13-auto.zip) |
| EP14 | 才藝教室網站 | [進入本講](episodes/ep14-talent/) | [下載](downloads/ep14-talent.zip) |
| EP15 | 諮商預約網站 | [進入本講](episodes/ep15-counseling/) | [下載](downloads/ep15-counseling.zip) |
| EP16 | 活動報名網站 | [進入本講](episodes/ep16-event/) | [下載](downloads/ep16-event.zip) |
| EP17 | 顧問預約網站 | [進入本講](episodes/ep17-consultant/) | [下載](downloads/ep17-consultant.zip) |
| EP18 | 總複習 | [進入本講](episodes/ep18-review/) | [下載](downloads/ep18-review.zip) |

## 每集會拿到什麼

- `site/`：可直接開啟的完成版網站。
- `SPEC.md`：依既有教材整理、供人審閱與批准的施工規格。
- `PROMPT-CARD.md`：可照著說、但不必逐字貼上的對話順序。
- `VERIFY.md`：手機、桌機、互動與資料邊界的驗收清單。

網站中的店名、電話、地址、價格與人物資料都屬課程示意。使用於真實專案前，必須替換成有來源且經授權的資料。

## 開啟方式

本整理版先在自己的電腦開啟；公開站仍可能是先前版本。

```bash
python3 -m http.server 8000
```

開啟 `http://localhost:8000` 可使用全課程首頁與下載。各講 `site/index.html` 也能直接雙擊開啟。

也可以下載本 repo：

```bash
git clone https://github.com/ThinkerCafe-tw/vibe-coding-18-websites.git
cd vibe-coding-18-websites
```

每集網站都可直接開啟 `site/index.html`。例如 EP03 位於 `episodes/ep03-photographer/site/index.html`。

## 提問與貢獻

- 程式或連結有問題：建立 [Issue](https://github.com/ThinkerCafe-tw/vibe-coding-18-websites/issues)。
- 學習心得、做法討論與作品分享：使用 [Discussions](https://github.com/ThinkerCafe-tw/vibe-coding-18-websites/discussions)。
- 想提交修正：先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 程式碼採 [MIT License](LICENSE)。
- 教學文字、規格與驗收表採 [CC BY-NC-SA 4.0](LICENSE-CONTENT)。
- 第三方圖片依各自授權，來源記錄在對應的 `ATTRIBUTION.md`。
