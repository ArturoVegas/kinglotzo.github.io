# Script simple para limpiar console.log del proyecto

param([switch]$DryRun = $false)

Write-Host "LIMPIEZA DE CONSOLE.LOG STATEMENTS" -ForegroundColor Green
Write-Host "=================================="

$jsFiles = Get-ChildItem ".\java" -Filter "*.js"
$totalCleaned = 0

foreach ($file in $jsFiles) {
    Write-Host "`nProcesando: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    $originalLength = $content.Length
    
    # Contar console statements antes
    $consoleMatches = [regex]::Matches($content, 'console\.(log|debug|info|warn)\([^)]*\);?\s*')
    $count = $consoleMatches.Count
    
    if ($count -gt 0) {
        Write-Host "   Encontrados: $count console statements" -ForegroundColor Yellow
        $totalCleaned += $count
        
        if (-not $DryRun) {
            # Crear backup
            $backupPath = ".\java\backup-$($file.Name)"
            Copy-Item $file.FullName $backupPath -Force
            Write-Host "   Backup creado: $backupPath" -ForegroundColor Gray
            
            # Remover console statements
            $cleanContent = [regex]::Replace($content, 'console\.(log|debug|info|warn)\([^)]*\);?\s*', '')
            $cleanContent = [regex]::Replace($cleanContent, '\n\s*\n\s*\n', "`n`n")
            
            Set-Content -Path $file.FullName -Value $cleanContent -NoNewline
            Write-Host "   Archivo limpiado!" -ForegroundColor Green
            
            $savedBytes = $originalLength - $cleanContent.Length
            Write-Host "   Bytes ahorrados: $savedBytes" -ForegroundColor Green
        } else {
            Write-Host "   [DRY-RUN] Se removerian $count statements" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Sin console statements" -ForegroundColor Gray
    }
}

Write-Host "`nRESUMEN:" -ForegroundColor Magenta
Write-Host "   Archivos procesados: $($jsFiles.Count)"
Write-Host "   Console statements encontrados: $totalCleaned"

if ($DryRun) {
    Write-Host "`nMODO DRY-RUN: No se realizaron cambios" -ForegroundColor Yellow
    Write-Host "Para aplicar cambios ejecuta sin -DryRun" -ForegroundColor Yellow
} else {
    Write-Host "`nLimpieza completada!" -ForegroundColor Green
}
