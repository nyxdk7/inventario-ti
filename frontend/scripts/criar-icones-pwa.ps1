Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
$IconDir = Join-Path $Root "public\icons"

if (!(Test-Path $IconDir)) {
    New-Item -ItemType Directory -Path $IconDir | Out-Null
}

function New-PwaIcon {
    param (
        [int]$Size,
        [string]$Path,
        [bool]$Maskable = $false
    )

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $background = [System.Drawing.ColorTranslator]::FromHtml("#111827")
    $panel = [System.Drawing.ColorTranslator]::FromHtml("#1F2937")
    $white = [System.Drawing.ColorTranslator]::FromHtml("#FFFFFF")
    $muted = [System.Drawing.ColorTranslator]::FromHtml("#CBD5E1")

    $graphics.Clear($background)

    $safeMargin = if ($Maskable) { [int]($Size * 0.18) } else { [int]($Size * 0.10) }
    $panelX = $safeMargin
    $panelY = $safeMargin
    $panelSize = $Size - ($safeMargin * 2)

    $panelBrush = New-Object System.Drawing.SolidBrush $panel
    $graphics.FillRectangle($panelBrush, $panelX, $panelY, $panelSize, $panelSize)

    $lineBrush = New-Object System.Drawing.SolidBrush $muted

    $lineHeight = [int]($Size * 0.035)
    $lineGap = [int]($Size * 0.055)
    $lineX = [int]($Size * 0.28)
    $lineY = [int]($Size * 0.32)
    $lineW1 = [int]($Size * 0.44)
    $lineW2 = [int]($Size * 0.34)
    $lineW3 = [int]($Size * 0.39)

    $graphics.FillRectangle($lineBrush, $lineX, $lineY, $lineW1, $lineHeight)
    $graphics.FillRectangle($lineBrush, $lineX, $lineY + $lineGap, $lineW2, $lineHeight)
    $graphics.FillRectangle($lineBrush, $lineX, $lineY + ($lineGap * 2), $lineW3, $lineHeight)

    $fontSize = [int]($Size * 0.23)
    $font = New-Object System.Drawing.Font "Arial", $fontSize, ([System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush $white
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF 0, ([int]($Size * 0.53)), $Size, ([int]($Size * 0.30))
    $graphics.DrawString("TI", $font, $textBrush, $textRect, $format)

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

    $format.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    $lineBrush.Dispose()
    $panelBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

New-PwaIcon -Size 192 -Path (Join-Path $IconDir "icon-192.png") -Maskable $false
New-PwaIcon -Size 512 -Path (Join-Path $IconDir "icon-512.png") -Maskable $false
New-PwaIcon -Size 192 -Path (Join-Path $IconDir "icon-maskable-192.png") -Maskable $true
New-PwaIcon -Size 512 -Path (Join-Path $IconDir "icon-maskable-512.png") -Maskable $true

Write-Host "Ícones PWA gerados com sucesso em: $IconDir"