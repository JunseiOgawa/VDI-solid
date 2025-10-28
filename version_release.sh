#!/bin/bash

# バージョン番号を設定
NEW_VERSION="0.2.19"

echo "Starting automated version release process..."

# 1. 変更されたファイルをステージング
echo "Staging changes..."
git add .

# 2. コミットを作成
echo "Creating commit..."
git commit -m "chore: bump version to $NEW_VERSION"

# 3. 現在のブランチをリモートにプッシュ
CURRENT_BRANCH=$(git branch --show-current)
echo "Pushing to origin/$CURRENT_BRANCH..."
git push origin $CURRENT_BRANCH

# 4. 新しいバージョンタグを作成
echo "Creating tag v$NEW_VERSION..."
git tag v$NEW_VERSION

# 5. タグをリモートにプッシュ
echo "Pushing tag v$NEW_VERSION..."
git push origin v$NEW_VERSION

echo "Version release process completed successfully!"
