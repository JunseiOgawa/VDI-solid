---
mode: agent
---
あなたはこの指示をされた場合以下のことを行ってバージョンアップを自動化し、githubactionsで実行されるようにします。

scripts/update-version.js
これは、`src-tauri/tauri.conf.json`・`package.json`のバージョンを更新するスクリプトです。
そのためまずnpmでこのスクリプトを実行してください。
```bash
node scripts/update-version.js <new-version>
```
`<new-version>`には新しいバージョン番号を指定します。例: `0.2.15`
このスクリプトでは現在のバージョンの次例えば、`0.2.14`なら`0.2.15`に更新されます。
こちらが特殊な指示をしない限りは0.0.xの範囲で更新してください。そのためx.x.0やx.0.0のような更新は行わないでください。

このスクリプトを実行後

以下のGit操作を自動化してください：

1. 変更されたファイルをステージング：
```bash
git add .
```

2. コミットを作成：
```bash
git commit -m "chore: bump version to <new-version>"
```

3. 現在のブランチをリモートにプッシュ：
```bash
git push origin $(git branch --show-current)
```

4. 新しいバージョンタグを作成：
```bash
git tag v<new-version>
```

5. タグをリモートにプッシュ：
```bash
git push origin v<new-version>
```

`<new-version>`にはスクリプト実行時に指定したバージョン番号を使用してください。

そしてこの1~5はまとめて1つのコマンドとしてbashスクリプトで実行されるようにしてください。


これらを踏まえて以下の流れ
1. `scripts/update-version.js`を実行してバージョンを更新
2. 変更をステージング、コミット、プッシュ
3. 新しいバージョンタグを作成し、プッシュ以上です