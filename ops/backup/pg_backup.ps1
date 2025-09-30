param(
  [string]$Conn = $env:PGBACKUP_URL,
  [string]$OutDir = "$PSScriptRoot\out"
)
if (-not $Conn) { Write-Error "PGBACKUP_URL not set"; exit 1 }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = Join-Path $OutDir "hefa_$stamp.dump"
& pg_dump -Fc -Z6 -f $dest $Conn
Get-ChildItem $OutDir -Filter "hefa_*.dump" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item -Force
Write-Host "Backup written to $dest"
