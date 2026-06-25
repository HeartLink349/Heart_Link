param(
  [Parameter(Mandatory = $true)]
  [string]$Root,

  [string]$ScriptUrl = "https://heartlink349.github.io/Heart_Link/heartlink-lock.js",
  [string]$BaseUrl = "",
  [int]$StartIndex = 1,
  [string]$OutputSeed = "heartlink-lock-generated-gifts.json",
  [string[]]$Exclude = @("admin.html", "install-snippet.html"),
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Convert-ToGiftId([int]$Number) {
  return "gift-{0:D3}" -f $Number
}

function Get-HtmlTitle([string]$Content, [string]$Fallback) {
  $match = [regex]::Match($Content, "<title[^>]*>(.*?)</title>", "IgnoreCase,Singleline")
  if ($match.Success) {
    $title = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value.Trim())
    if ($title) { return $title }
  }
  return $Fallback
}

function Test-IsExcluded([System.IO.FileInfo]$File) {
  $full = $File.FullName.Replace("\", "/")
  if ($full -match "/\.git/" -or $full -match "/node_modules/" -or $full -match "/dist/" -or $full -match "/build/") {
    return $true
  }
  foreach ($item in $Exclude) {
    if ($File.Name -ieq $item -or $full.EndsWith($item.Replace("\", "/"), [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }
  return $false
}

function Get-RelativePath([string]$BasePath, [string]$TargetPath) {
  $baseUri = New-Object System.Uri (($BasePath.TrimEnd("\", "/") + "\").Replace("\", "/"))
  $targetUri = New-Object System.Uri ($TargetPath.Replace("\", "/"))
  return [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString())
}

$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$defaultLockMessage = [System.Text.Encoding]::UTF8.GetString(
  [Convert]::FromBase64String("2LnZgdmI2KfZi9iMINiq2YUg2YLZgdmEINmH2LDZhyDYp9mE2YfYr9mK2Kkg2YbZh9in2KbZitin2Ysg2YXZhiDZgtio2YQg2KfZhNmF2LfZiNixIEhlYXJ0TGluayDZiNmE2Kcg2YrZhdmD2YYg2KfZhNmI2LXZiNmEINil2YTZitmH2Kcg2KPZiCDYp9iz2KrYrtiv2KfZhdmH2Kcg2KjYudivINin2YTYotmGLg==")
)
$files = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File -Filter "*.html" |
  Where-Object { -not (Test-IsExcluded $_) } |
  Sort-Object FullName

$gifts = [ordered]@{}
$current = $StartIndex

foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  if ($content -match "HEARTLINK_GIFT_ID" -or $content -match "heartlink-lock\.js") {
    Write-Host "SKIP already installed: $($file.FullName)"
    continue
  }

  $giftId = Convert-ToGiftId $current
  $current++
  $snippet = "<script>`n  window.HEARTLINK_GIFT_ID = `"$giftId`";`n</script>`n<script src=`"$ScriptUrl`"></script>"

  if ($content -match "</body>") {
    $updated = [regex]::Replace($content, "</body>", "$snippet`n</body>", "IgnoreCase")
  } else {
    $updated = $content.TrimEnd() + "`n" + $snippet + "`n"
  }

  if (-not $DryRun) {
    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
  }

  $relative = Get-RelativePath $resolvedRoot $file.FullName
  $url = if ($BaseUrl) { $BaseUrl.TrimEnd("/") + "/" + $relative } else { $relative }
  $name = Get-HtmlTitle $content ([System.IO.Path]::GetFileNameWithoutExtension($file.Name))
  $gifts[$giftId] = [ordered]@{
    name = $name
    url = $url
    status = "open"
    lockMessage = $defaultLockMessage
    whatsapp = "201125674359"
    updatedAt = (Get-Date -Format "yyyy-MM-dd")
  }

  Write-Host "ADD $giftId -> $($file.FullName)"
}

$payload = [ordered]@{ gifts = $gifts }
$json = $payload | ConvertTo-Json -Depth 8

if (-not $DryRun) {
  Set-Content -LiteralPath (Join-Path $resolvedRoot $OutputSeed) -Value $json -Encoding UTF8
}

Write-Host "Done. Gifts generated: $($gifts.Count)"
