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

# 1. Top Heroes
Crop-Image "hero-child-coloring" 0 0 410 365
Crop-Image "hero-astronaut" 415 15 375 350
Crop-Image "hero-dinosaur-pdf" 800 15 410 350

# 2. Banners
Crop-Image "banner-rocket" 15 380 395 210
Crop-Image "banner-printer" 815 380 395 210

# 3. Age Group Icons (Teddy, Boy, Teen, Controller)
# Age Group box: x: 15 to 600, y: 645 to 835
# Inside it, 4 cards:
Crop-Image "age-kids" 30 655 130 175
Crop-Image "age-children" 172 655 130 175
Crop-Image "age-teens" 314 655 130 175
Crop-Image "age-teen-plus" 456 655 130 175

# Age Icons only (just the icon graphic for flexibility)
Crop-Image "icon-teddy" 45 665 100 95
Crop-Image "icon-boy" 185 665 100 95
Crop-Image "icon-teen" 327 665 100 95
Crop-Image "icon-controller" 470 670 100 90

# 4. Theme Categories (Row 1 & Row 2)
# Row 1: Animals, Space, Nature, Dinosaurs, Vehicles
Crop-Image "theme-animals" 640 650 105 92
Crop-Image "theme-space" 750 650 105 92
Crop-Image "theme-nature" 860 650 105 92
Crop-Image "theme-dinosaurs" 970 650 105 92
Crop-Image "theme-vehicles" 1080 650 105 92

# Row 2: Fantasy, Underwater, Princess, Robots, Custom
Crop-Image "theme-fantasy" 640 748 105 92
Crop-Image "theme-underwater" 750 748 105 92
Crop-Image "theme-princess" 860 748 105 92
Crop-Image "theme-robots" 970 748 105 92
Crop-Image "theme-custom" 1080 748 105 92

# 5. Step Indicator
Crop-Image "step-indicator-ref" 15 875 475 115

# 6. Progress and Success
Crop-Image "progress-state" 510 875 365 115
Crop-Image "success-state" 880 875 330 115

# 7. Bottom elements
Crop-Image "empty-upload" 30 1060 230 195
Crop-Image "empty-books" 270 1060 240 195
Crop-Image "icon-book-3d" 340 1070 100 65
Crop-Image "error-state" 525 1060 245 195

# 8. Example Coloring Pages (pure line art thumbnails)
Crop-Image "coloring-cat" 810 1070 128 185
Crop-Image "coloring-rocket" 943 1070 128 185
Crop-Image "coloring-dinosaur" 1076 1070 128 185

$src.Dispose()
Write-Output "Asset extraction complete!"
