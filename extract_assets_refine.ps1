Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ASUS\Downloads\ColorBook AI UI Illustration Asset Sheet.png"
$destDir = "C:\Users\ASUS\.gemini\antigravity\scratch\colorbook-ai\extracted_assets"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function Crop-Image($name, $x, $y, $w, $h) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $outPath = Join-Path $destDir "$name.png"
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Saved $name ($w x $h)"
}

# Accurate Icons
Crop-Image "icon-book-3d" 330 1083 115 82
Crop-Image "icon-success-check" 980 885 110 85
Crop-Image "icon-error-circle" 615 1090 70 70
Crop-Image "printer-device" 960 405 240 180
Crop-Image "coloring-astronaut" 490 70 205 260
Crop-Image "coloring-dinosaur-large" 860 65 205 260
Crop-Image "hero-rocket-only" 215 390 190 200

$src.Dispose()
Write-Output "Additional refinement complete!"
