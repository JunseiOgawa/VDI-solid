# ビルド用PowerShellスクリプト
# .envファイルから環境変数を読み込んでビルド

# .envファイルの読み込み
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2].Trim("'").Trim('"')
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "Set $key"
    }
}

# ビルド実行
npm run tauri build
