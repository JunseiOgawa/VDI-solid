#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESモジュールで __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// コマンドライン引数からバージョンを取得
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('エラー: バージョンを指定してください');
  console.error('使用方法: node scripts/update-version.js 0.1.7');
  process.exit(1);
}

// バージョン形式の検証
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('エラー: バージョンは MAJOR.MINOR.PATCH の形式で指定してください（例: 0.1.7）');
  process.exit(1);
}

console.log(`バージョンを ${newVersion} に更新しています...`);

// 1. package.json を更新
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✓ package.json を更新しました');

// 2. tauri.conf.json を更新
const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log('✓ tauri.conf.json を更新しました');

// 3. Cargo.toml を更新
const cargoTomlPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log('✓ Cargo.toml を更新しました');

console.log(`\n完了！ すべてのファイルのバージョンを ${newVersion} に更新しました。`);
console.log('\n次のステップ:');
console.log('  git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml');
console.log(`  git commit -m "chore: bump version to ${newVersion}"`);
console.log('  git push origin main');
console.log(`  git tag v${newVersion}`);
console.log(`  git push origin v${newVersion}`);
