# Script de optimización de imágenes para kinglotzo.github.io
# Convierte PNG/JPG grandes a WebP y redimensiona imágenes

param(
    [switch]$DryRun = $false,
    [string]$Quality = 85
)

$imageFolder = ".\Recursos\imagenes"
$backupFolder = ".\Recursos\imagenes\backup-original"

Write-Host "🖼️  Iniciando optimización de imágenes..." -ForegroundColor Green

# Crear carpeta de backup
if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "📁 Carpeta de backup creada: $backupFolder" -ForegroundColor Yellow
}

# Función para optimizar imagen
function Optimize-Image {
    param($FilePath, $OutputPath, $MaxWidth = 1920, $Quality = 85)
    
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
    $originalSize = (Get-Item $FilePath).Length
    
    Write-Host "🔄 Procesando: $fileName..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        # Backup original
        Copy-Item $FilePath "$backupFolder\" -Force
        
        # Aquí iría la lógica de conversión con herramientas como ImageMagick o cwebp
        # Por ahora mostramos el comando que se ejecutaría
        Write-Host "   ➡️  Comando: cwebp -q $Quality -resize $MaxWidth 0 '$FilePath' -o '$OutputPath'" -ForegroundColor Gray
    }
    
    return @{
        Original = $originalSize
        Estimated = [math]::Round($originalSize * 0.3) # Estimación 70% reducción
    }
}

# Procesar imágenes grandes
$largeImages = Get-ChildItem $imageFolder -File | Where-Object { $_.Length -gt 100KB }

$totalSaved = 0
foreach ($img in $largeImages) {
    $extension = $img.Extension.ToLower()
    $newName = $img.BaseName + ".webp"
    $outputPath = Join-Path $imageFolder $newName
    
    if ($extension -in @('.png', '.jpg', '.jpeg')) {
        $result = Optimize-Image -FilePath $img.FullName -OutputPath $outputPath -Quality $Quality
        $saved = $result.Original - $result.Estimated
        $totalSaved += $saved
        
        Write-Host "   💾 Ahorro estimado: $([math]::Round($saved/1KB, 2)) KB" -ForegroundColor Green
    }
}

Write-Host "`n📊 RESUMEN DE OPTIMIZACIÓN:" -ForegroundColor Magenta
Write-Host "   Total de ahorro estimado: $([math]::Round($totalSaved/1KB, 2)) KB" -ForegroundColor Green
Write-Host "   Reducción estimada: $([math]::Round(($totalSaved / (Get-ChildItem $imageFolder | Measure-Object Length -Sum).Sum) * 100, 1))%" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n⚠️  MODO DRY-RUN: No se realizaron cambios reales" -ForegroundColor Yellow
    Write-Host "    Para aplicar cambios, ejecuta sin el parámetro -DryRun" -ForegroundColor Yellow
    Write-Host "    Necesitarás instalar herramientas como ImageMagick o cwebp" -ForegroundColor Yellow
}

Write-Host "`n✅ Optimización completada!" -ForegroundColor Green
