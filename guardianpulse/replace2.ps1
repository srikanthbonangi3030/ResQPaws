$files = Get-ChildItem -Path '.' -Include '*.js','*.html','*.json','*.md' -Recurse
foreach ($f in $files) {
  $c = [IO.File]::ReadAllText($f.FullName)
  $orig = $c
  
  $c = $c -replace 'Guardian<span class="logo-accent">Pulse</span>', 'resQ<span class="logo-accent">paws</span>'
  $c = $c -replace 'Guardian<span style="color:#22C55E;">Pulse</span>', 'resQ<span style="color:#22C55E;">paws</span>'
  $c = $c -replace 'emergency@guardianpulse\.org', 'emergency@resqpaws.org'
  $c = $c -replace 'info@guardianpulse\.org', 'info@resqpaws.org'
  $c = $c -replace '(?<!window\.)GuardianPulse', 'resQpaws'
  $c = $c -replace '(?<!window\.)guardianpulse', 'resqpaws'
  $c = $c -replace 'Guardian Pulse', 'resQpaws'
  
  if ($c -cne $orig) {
    [IO.File]::WriteAllText($f.FullName, $c)
    Write-Host "Updated $($f.FullName)"
  }
}
Write-Host "Done"
