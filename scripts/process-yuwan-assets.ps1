param(
  [Parameter(Mandatory = $true)]
  [string]$AtlasPath,
  [Parameter(Mandatory = $true)]
  [string]$ReferenceSheetOnePath
)

$ErrorActionPreference = 'Stop'
$taskOutputRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'src\assets\yuwan'
$taskCore = Join-Path $taskOutputRoot 'core'
$taskStates = Join-Path $taskOutputRoot 'states'
New-Item -ItemType Directory -Force -Path $taskCore, $taskStates | Out-Null

Add-Type -AssemblyName System.Drawing
$taskDrawingCommon = [System.Drawing.Bitmap].Assembly.Location
$taskDrawingPrimitives = [System.Drawing.Color].Assembly.Location
$taskDrawingDirectory = [System.IO.Path]::GetDirectoryName($taskDrawingCommon)
$taskDrawingAssemblies = @(
  $taskDrawingCommon,
  $taskDrawingPrimitives,
  (Join-Path $taskDrawingDirectory 'System.Private.Windows.GdiPlus.dll'),
  (Join-Path $taskDrawingDirectory 'System.Private.Windows.Core.dll'),
  (Join-Path $taskDrawingDirectory 'System.Collections.dll'),
  (Join-Path $taskDrawingDirectory 'System.Runtime.dll'),
  (Join-Path $taskDrawingDirectory 'System.Runtime.InteropServices.dll'),
  [System.Runtime.InteropServices.Marshal].Assembly.Location
)
Add-Type -ReferencedAssemblies $taskDrawingAssemblies -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class YuwanAssetProcessor
{
    public static Bitmap LoadArgb(string path)
    {
        using (var source = new Bitmap(path))
        {
            var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.DrawImageUnscaled(source, 0, 0);
            }
            return bitmap;
        }
    }

    public static void RemoveConnectedNearWhiteBackground(Bitmap bitmap)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = data.Stride;
            byte[] pixels = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            bool[] visited = new bool[bitmap.Width * bitmap.Height];
            int[] queue = new int[bitmap.Width * bitmap.Height];
            int head = 0, tail = 0;

            for (int x = 0; x < bitmap.Width; x++)
            {
                TryEnqueue(pixels, visited, queue, ref tail, x, 0, bitmap.Width, bitmap.Height, stride);
                TryEnqueue(pixels, visited, queue, ref tail, x, bitmap.Height - 1, bitmap.Width, bitmap.Height, stride);
            }
            for (int y = 0; y < bitmap.Height; y++)
            {
                TryEnqueue(pixels, visited, queue, ref tail, 0, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueue(pixels, visited, queue, ref tail, bitmap.Width - 1, y, bitmap.Width, bitmap.Height, stride);
            }

            while (head < tail)
            {
                int key = queue[head++];
                int x = key % bitmap.Width;
                int y = key / bitmap.Width;
                int offset = y * stride + x * 4;
                pixels[offset] = 0;
                pixels[offset + 1] = 0;
                pixels[offset + 2] = 0;
                pixels[offset + 3] = 0;
                TryEnqueue(pixels, visited, queue, ref tail, x - 1, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueue(pixels, visited, queue, ref tail, x + 1, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueue(pixels, visited, queue, ref tail, x, y - 1, bitmap.Width, bitmap.Height, stride);
                TryEnqueue(pixels, visited, queue, ref tail, x, y + 1, bitmap.Width, bitmap.Height, stride);
            }

            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static void TryEnqueue(
        byte[] pixels,
        bool[] visited,
        int[] queue,
        ref int tail,
        int x,
        int y,
        int width,
        int height,
        int stride)
    {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        int key = y * width + x;
        if (visited[key]) return;
        int offset = y * stride + x * 4;
        int b = pixels[offset];
        int g = pixels[offset + 1];
        int r = pixels[offset + 2];
        int min = Math.Min(r, Math.Min(g, b));
        int max = Math.Max(r, Math.Max(g, b));
        if (min < 234 || max - min > 14) return;
        visited[key] = true;
        queue[tail++] = key;
    }

    public static void SaveCell(Bitmap source, int columns, int rows, int column, int row, string outputPath, int inset)
    {
        int left = (column * source.Width + columns / 2) / columns;
        int right = ((column + 1) * source.Width + columns / 2) / columns;
        int top = (row * source.Height + rows / 2) / rows;
        int bottom = ((row + 1) * source.Height + rows / 2) / rows;
        var cellRect = Rectangle.FromLTRB(left, top, right, bottom);
        if (inset > 0) cellRect.Inflate(-inset, -inset);
        SaveRegion(source, cellRect.X, cellRect.Y, cellRect.Width, cellRect.Height, outputPath);
    }

    public static void SaveRegion(Bitmap source, int left, int top, int width, int height, string outputPath)
    {
        var cellRect = new Rectangle(left, top, width, height);
        using (var cell = source.Clone(cellRect, PixelFormat.Format32bppArgb))
        {
            ClearLowAlpha(cell, 36);
            RemoveSmallComponents(cell, 140);
            Rectangle bounds = FindAlphaBounds(cell);
            if (bounds.Width == 0 || bounds.Height == 0) throw new InvalidOperationException("No artwork found in " + outputPath);

            using (var canvas = new Bitmap(512, 512, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(canvas))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;

                const int maxArtwork = 448;
                double scale = Math.Min((double)maxArtwork / bounds.Width, (double)maxArtwork / bounds.Height);
                int renderWidth = Math.Max(1, (int)Math.Round(bounds.Width * scale));
                int renderHeight = Math.Max(1, (int)Math.Round(bounds.Height * scale));
                int x = (512 - renderWidth) / 2;
                int y = (512 - renderHeight) / 2;
                graphics.DrawImage(cell, new Rectangle(x, y, renderWidth, renderHeight), bounds, GraphicsUnit.Pixel);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                canvas.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    private static void RemoveBorderConnectedAlpha(Bitmap bitmap)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = data.Stride;
            byte[] pixels = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            bool[] visited = new bool[bitmap.Width * bitmap.Height];
            int[] queue = new int[bitmap.Width * bitmap.Height];
            int head = 0, tail = 0;
            for (int x = 0; x < bitmap.Width; x++)
            {
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x, 0, bitmap.Width, bitmap.Height, stride);
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x, bitmap.Height - 1, bitmap.Width, bitmap.Height, stride);
            }
            for (int y = 0; y < bitmap.Height; y++)
            {
                TryEnqueueAlpha(pixels, visited, queue, ref tail, 0, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueueAlpha(pixels, visited, queue, ref tail, bitmap.Width - 1, y, bitmap.Width, bitmap.Height, stride);
            }
            while (head < tail)
            {
                int key = queue[head++];
                int x = key % bitmap.Width;
                int y = key / bitmap.Width;
                pixels[y * stride + x * 4 + 3] = 0;
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x - 1, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x + 1, y, bitmap.Width, bitmap.Height, stride);
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x, y - 1, bitmap.Width, bitmap.Height, stride);
                TryEnqueueAlpha(pixels, visited, queue, ref tail, x, y + 1, bitmap.Width, bitmap.Height, stride);
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static void TryEnqueueAlpha(
        byte[] pixels,
        bool[] visited,
        int[] queue,
        ref int tail,
        int x,
        int y,
        int width,
        int height,
        int stride)
    {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        int key = y * width + x;
        if (visited[key]) return;
        if (pixels[y * stride + x * 4 + 3] == 0) return;
        visited[key] = true;
        queue[tail++] = key;
    }

    private static void ClearLowAlpha(Bitmap bitmap, byte threshold)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = data.Stride;
            byte[] pixels = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int y = 0; y < bitmap.Height; y++)
            for (int x = 0; x < bitmap.Width; x++)
            {
                int offset = y * stride + x * 4;
                if (pixels[offset + 3] < threshold)
                {
                    pixels[offset] = 0;
                    pixels[offset + 1] = 0;
                    pixels[offset + 2] = 0;
                    pixels[offset + 3] = 0;
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static void RemoveSmallComponents(Bitmap bitmap, int minimumArea)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = data.Stride;
            byte[] pixels = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            bool[] visited = new bool[bitmap.Width * bitmap.Height];
            int[] queue = new int[bitmap.Width * bitmap.Height];

            for (int startY = 0; startY < bitmap.Height; startY++)
            for (int startX = 0; startX < bitmap.Width; startX++)
            {
                int startKey = startY * bitmap.Width + startX;
                if (visited[startKey] || pixels[startY * stride + startX * 4 + 3] == 0) continue;
                int head = 0, tail = 0;
                visited[startKey] = true;
                queue[tail++] = startKey;
                while (head < tail)
                {
                    int key = queue[head++];
                    int x = key % bitmap.Width;
                    int y = key / bitmap.Width;
                    for (int offsetY = -1; offsetY <= 1; offsetY++)
                    for (int offsetX = -1; offsetX <= 1; offsetX++)
                    {
                        if (offsetX == 0 && offsetY == 0) continue;
                        int nextX = x + offsetX;
                        int nextY = y + offsetY;
                        if (nextX < 0 || nextX >= bitmap.Width || nextY < 0 || nextY >= bitmap.Height) continue;
                        int nextKey = nextY * bitmap.Width + nextX;
                        if (visited[nextKey] || pixels[nextY * stride + nextX * 4 + 3] == 0) continue;
                        visited[nextKey] = true;
                        queue[tail++] = nextKey;
                    }
                }
                if (tail >= minimumArea) continue;
                for (int index = 0; index < tail; index++)
                {
                    int key = queue[index];
                    int x = key % bitmap.Width;
                    int y = key / bitmap.Width;
                    int pixelOffset = y * stride + x * 4;
                    pixels[pixelOffset] = 0;
                    pixels[pixelOffset + 1] = 0;
                    pixels[pixelOffset + 2] = 0;
                    pixels[pixelOffset + 3] = 0;
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static Rectangle FindAlphaBounds(Bitmap bitmap)
    {
        int minX = bitmap.Width, minY = bitmap.Height, maxX = -1, maxY = -1;
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            int stride = data.Stride;
            byte[] pixels = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int y = 0; y < bitmap.Height; y++)
            for (int x = 0; x < bitmap.Width; x++)
            {
                if (pixels[y * stride + x * 4 + 3] == 0) continue;
                minX = Math.Min(minX, x); minY = Math.Min(minY, y);
                maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
            }
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
        return maxX < minX ? Rectangle.Empty : Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

$taskAtlas = [YuwanAssetProcessor]::LoadArgb((Resolve-Path -LiteralPath $AtlasPath))
try {
  [YuwanAssetProcessor]::RemoveConnectedNearWhiteBackground($taskAtlas)
  $taskAtlasMap = @(
    @{ Path = (Join-Path $taskCore 'idle.png'); Col = 0; Row = 0 },
    @{ Path = (Join-Path $taskCore 'think.png'); Col = 1; Row = 0 },
    @{ Path = (Join-Path $taskStates 'search.png'); Col = 2; Row = 0 },
    @{ Path = (Join-Path $taskStates 'run.png'); Col = 3; Row = 0 },
    @{ Path = (Join-Path $taskStates 'spin.png'); Col = 4; Row = 0 },
    @{ Path = (Join-Path $taskCore 'happy.png'); Col = 0; Row = 1 },
    @{ Path = (Join-Path $taskCore 'point.png'); Col = 1; Row = 1 },
    @{ Path = (Join-Path $taskCore 'rest.png'); Col = 2; Row = 1 },
    @{ Path = (Join-Path $taskStates 'empty.png'); Col = 3; Row = 1 },
    @{ Path = (Join-Path $taskStates 'favorite.png'); Col = 4; Row = 1 }
  )
  foreach ($taskAsset in $taskAtlasMap) {
    [YuwanAssetProcessor]::SaveCell($taskAtlas, 5, 2, $taskAsset.Col, $taskAsset.Row, $taskAsset.Path, 0)
  }
}
finally {
  $taskAtlas.Dispose()
}

$taskSheetOne = [YuwanAssetProcessor]::LoadArgb((Resolve-Path -LiteralPath $ReferenceSheetOnePath))
try {
  [YuwanAssetProcessor]::SaveCell($taskSheetOne, 2, 4, 1, 1, (Join-Path $taskStates 'ticket.png'), 30)
  [YuwanAssetProcessor]::SaveRegion($taskSheetOne, 60, 680, 500, 350, (Join-Path $taskStates 'map.png'))
}
finally {
  $taskSheetOne.Dispose()
}

Get-ChildItem -LiteralPath $taskOutputRoot -Recurse -Filter *.png |
  Sort-Object FullName |
  Select-Object FullName, Length
