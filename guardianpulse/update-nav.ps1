$files = Get-ChildItem -Path '.' -Filter '*.html' | Where-Object { $_.Name -ne 'adopt.html' }
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch 'href="adopt.html"') {
        $content = $content -replace '(<a href="about\.html" class="nav-link"[^>]*>About Us</a>)', "`$1`n        <a href=`"adopt.html`" class=`"nav-link`">Adopt</a>"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
