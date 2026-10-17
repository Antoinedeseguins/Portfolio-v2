$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$encoding = New-Object System.Text.UTF8Encoding($false)
$template = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'index.html'))
$template = $template.Replace('<head>', '<head>' + "`n" + '        <base href="../" />')
$contentFiles = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'Assets') -Filter content.json -Recurse
$slugs = @{}
foreach ($file in $contentFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName) | ConvertFrom-Json
    $title = $content.en.title
    $normalized = $title.Normalize([System.Text.NormalizationForm]::FormD)
    $slug = [regex]::Replace($normalized, '[\u0300-\u036f]', '')
    $slug = [regex]::Replace($slug, '[^a-zA-Z0-9]+', '-').Trim('-')
    if ($slug -eq 'Necromunda-Underhive-Wars') { $slug = 'Necromunda' }
    if ($slug -eq 'Age-of-Sigmar-Storm-Ground') { $slug = 'Age-of-Sigmar' }
    if (!$slug -or $slugs.ContainsKey($slug)) { throw "Invalid or duplicate route: $slug" }
    $slugs[$slug] = $true
    $directory = Join-Path $projectRoot $slug
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $directory 'index.html'), $template, $encoding)
    Write-Output "/$slug"
}
