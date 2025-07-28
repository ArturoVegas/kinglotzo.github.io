# Script para limpiar console.log statements del proyecto
# Mejora el rendimiento removiendo declaraciones de debug

param(
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

$jsFolder = ".\java"
$backupFolder = ".\java\backup-console-cleanup"

Write-Host "🧹 LIMPIEZA DE CONSOLE.LOG STATEMENTS" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Crear backup si es necesario
if ($Backup -and -not $DryRun) {
    if (-not (Test-Path $backupFolder)) {
        New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
        Write-Host "📁 Backup creado en: $backupFolder" -ForegroundColor Yellow
    }
}

# Patrones de console statements a remover
$consolePatterns = @(
    'console\.log\([^)]*\);?\s*',
    'console\.debug\([^)]*\);?\s*',
    'console\.info\([^)]*\);?\s*',
    'console\.warn\([^)]*\);?\s*'
)

# Procesar archivos JS
$jsFiles = Get-ChildItem $jsFolder -Filter "*.js"
$totalCleaned = 0

foreach ($file in $jsFiles) {
    Write-Host "`n🔍 Procesando: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileCleanCount = 0
    
    # Aplicar cada patrón
    foreach ($pattern in $consolePatterns) {
        $matches = [regex]::Matches($content, $pattern)
        if ($matches.Count -gt 0) {
            $fileCleanCount += $matches.Count
            $content = [regex]::Replace($content, $pattern, '')
        }
    }
    
    # Limpiar líneas vacías extra que pueden quedar
    $content = [regex]::Replace($content, '\n\s*\n\s*\n', "`n`n")
    
    if ($fileCleanCount -gt 0) {
        Write-Host "   ✅ Encontrados $fileCleanCount console statements" -ForegroundColor Green
        $totalCleaned += $fileCleanCount
        
        if (-not $DryRun) {
            # Backup original
            if ($Backup) {
                Copy-Item $file.FullName "$backupFolder\" -Force
            }
            
            # Guardar archivo limpio
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "   💾 Archivo actualizado" -ForegroundColor Green
        } else {
            Write-Host "   🔍 [DRY-RUN] Se removerían $fileCleanCount statements" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✨ Sin console statements encontrados" -ForegroundColor Gray
    }
}

Write-Host "`n📊 RESUMEN DE LIMPIEZA:" -ForegroundColor Magenta
Write-Host "   Total de archivos procesados: $($jsFiles.Count)" -ForegroundColor White
Write-Host "   Console statements encontrados: $totalCleaned" -ForegroundColor Yellow

if ($totalCleaned -gt 0) {
    $estimatedSavings = $totalCleaned * 25 # Estimación ~25 bytes por console.log
    Write-Host "   Bytes ahorrados (estimado): $estimatedSavings" -ForegroundColor Green
}

if ($DryRun) {
    Write-Host "`n⚠️  MODO DRY-RUN: No se realizaron cambios" -ForegroundColor Yellow
    Write-Host "    Para aplicar cambios, ejecuta sin -DryRun" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
    if ($Backup) {
        Write-Host "   📁 Archivos originales en: $backupFolder" -ForegroundColor Cyan
    }
}

Write-Host "`n💡 NOTA: Revisa los archivos para asegurar que no se removieron" -ForegroundColor Blue
Write-Host "   console statements importantes para debugging" -ForegroundColor Blue
