$files = Get-ChildItem -Path "C:\Users\srika\.gemini\antigravity\scratch\guardianpulse" -Include "*.js","*.html","*.json" -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    $newContent = $content -replace 'Guardian<span class="logo-accent">Pulse</span>', 'resQ<span class="logo-accent">paws</span>'
    $newContent = $newContent -replace 'Guardian<span style="color:#22C55E;">Pulse</span>', 'resQ<span style="color:#22C55E;">paws</span>'
    $newContent = $newContent -replace 'emergency@guardianpulse\.org', 'emergency@resqpaws.org'
    $newContent = $newContent -replace 'info@guardianpulse\.org', 'info@resqpaws.org'
    
    # Negative lookbehind to skip "window.GuardianPulse"
    $newContent = $newContent -replace '(?<!window\.)GuardianPulse', 'resQpaws'
    $newContent = $newContent -replace '(?<!window\.)guardianpulse', 'resqpaws'
    
    $newContent = $newContent -replace 'Guardian Pulse', 'resQpaws'

    if ($content -cne $newContent) {
        Write-Host "Updated: $($file.FullName)"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}
Write-Host "Done!"
