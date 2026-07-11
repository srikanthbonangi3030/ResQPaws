# PowerShell script to inject the Donate nav link into all pages
$files = @(
  'index.html', 'about.html', 'contact.html', 'report.html',
  'volunteer.html', 'lost-found.html', 'track.html', 'adopt.html',
  'login.html', 'register.html'
)

$pattern = '<a href="about.html" class="nav-link" data-i18n="navAbout">About Us</a>'
$replacement = '<a href="about.html" class="nav-link" data-i18n="navAbout">About Us</a>
        <a href="donate.html" class="nav-link">Donate ❤️</a>'

$updated = @()
$skipped = @()

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw -Encoding UTF8
    if ($content -match [regex]::Escape($pattern)) {
      $newContent = $content.Replace($pattern, $replacement)
      Set-Content $file -Value $newContent -Encoding UTF8 -NoNewline
      $updated += $file
    } else {
      $skipped += $file
    }
  } else {
    $skipped += "$file (not found)"
  }
}

Write-Host "Updated: $($updated -join ', ')"
Write-Host "Skipped: $($skipped -join ', ')"
