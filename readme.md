## Ancient-Night

夜フクロウライクなTwitterクライアントになる予定の何か。

## ちゃんと動きますか？

あんまりまともに動きません。

## License
MIT License, except below. (以下を除いて MIT Licenceです)

/app/resources/sound/* 
(Not included yet)

/app/resources/icon/*
FLAT ICON DESIGN http://flat-icon-design.com/

## コンパイル
TwitterのWebサイトから、コンシューマキーとコンシューマシークレットを入手して
/src/shared/GlobalSecret.ts にキーを書いて下さい。
あとは以下の通り。
```
git clone https://github.com/yakumo-saki/ancient-night.git
cd ancient-night

# /src/shared/GlobalSecret.ts 編集

npm install
npm run package
```
