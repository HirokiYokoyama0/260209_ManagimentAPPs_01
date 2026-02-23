# コミット bdb31ce からシークレットを除くため、修正済みファイルをステージして amend する
# プロジェクトフォルダで実行: .\fix-secret-commit.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git add "Doc/84_イベントログ仕様_管理ダッシュボード開発者向け.md"
git commit --amend --no-edit

Write-Host "Done. Push with: git push origin main" -ForegroundColor Green
