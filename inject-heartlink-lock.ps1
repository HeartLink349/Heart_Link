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

$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
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

  $relative = [System.IO.Path]::GetRelativePath($resolvedRoot, $file.FullName).Replace("\", "/")
  $url = if ($BaseUrl) { $BaseUrl.TrimEnd("/") + "/" + $relative } else { $relative }
  $name = Get-HtmlTitle $content ([System.IO.Path]::GetFileNameWithoutExtension($file.Name))
  $gifts[$giftId] = [ordered]@{
    name = $name
    url = $url
    status = "open"
    lockMessage = "عفواً، تم قفل هذه الهدية نهائياً من قبل المطور HeartLink ولا يمكن الوصول إليها أو استخدامها بعد الآن."
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
