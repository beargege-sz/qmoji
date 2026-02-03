
import JSZip from 'jszip';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper: Check if a pixel is effectively "white" (background)
// Threshold at 250 to catch actual content, ignoring very light compression noise if any
export const isNearWhite = (r: number, g: number, b: number, threshold = 250) => {
  return r > threshold && g > threshold && b > threshold;
};

/**
 * Detects the bounding box of non-white content to remove extra margins.
 * This fixes the issue where the grid is not centered or has large margins.
 */
const getContentBoundingBox = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // If it's NOT white, it's content
      if (!isNearWhite(r, g, b)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return { x: 0, y: 0, w: width, h: height };

  // Padding Logic Adjustment:
  // 0px was too tight, stripping outer margins and causing slice drift (horizontal cuts).
  // 80px was too loose, causing vertical shifts (vertical cuts).
  // 20px is a balanced safety buffer to restore the "outer gap" of the grid cells.
  const padding = 20;
  
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
};

export const sliceGridImage = (base64Image: string, rows: number = 4, cols: number = 6): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64Image}`;
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      // 1. Draw original to canvas to analyze crop
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = img.width;
      fullCanvas.height = img.height;
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) return reject("Canvas error");

      fullCtx.drawImage(img, 0, 0);

      // 2. Auto-Crop: Find the actual grid area (ignoring white margins)
      const crop = getContentBoundingBox(fullCtx, fullCanvas.width, fullCanvas.height);
      
      const pieceWidth = crop.w / cols;
      const pieceHeight = crop.h / rows;
      const pieces: string[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          // Draw slice from the Cropped area
          ctx.drawImage(
            fullCanvas,
            crop.x + c * pieceWidth, // source x (offset by crop)
            crop.y + r * pieceHeight, // source y (offset by crop)
            pieceWidth, 
            pieceHeight, 
            0, 0, pieceWidth, pieceHeight
          );

          // NOTE: Transparency processing removed as requested to preserve white details (shirts, teeth).
          // The background remains the original white from the AI generation.

          pieces.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(pieces);
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Removes white background from an image using Flood Fill from corners.
 * This preserves white colors inside the character (e.g., eyes, shirt) 
 * provided they are separated from the background by an outline.
 */
export const removeBackground = async (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(base64Image);
            return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        // Helper to check pixel white-ness
        const isWhite = (idx: number) => isNearWhite(data[idx], data[idx+1], data[idx+2]);

        // Flood fill state
        const queue: number[] = []; // Stores pixel indices (y * width + x)
        const visited = new Uint8Array(width * height); // 0 = unvisited, 1 = visited

        const pushIfWhite = (x: number, y: number) => {
            if (x < 0 || x >= width || y < 0 || y >= height) return;
            const pos = y * width + x;
            if (visited[pos]) return;
            
            const idx = pos * 4;
            if (isWhite(idx)) {
                queue.push(pos);
                visited[pos] = 1;
            }
        };

        // Initialize queue with all border pixels
        for (let x = 0; x < width; x++) {
            pushIfWhite(x, 0);
            pushIfWhite(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
            pushIfWhite(0, y);
            pushIfWhite(width - 1, y);
        }

        // Processing
        while (queue.length > 0) {
            const pos = queue.pop()!; // Using pop (DFS-like) is slightly faster for JS arrays than shift
            const idx = pos * 4;
            
            // Set alpha to 0 (Transparent)
            data[idx + 3] = 0;

            const cx = pos % width;
            const cy = Math.floor(pos / width);

            // Neighbors (4-connectivity)
            pushIfWhite(cx + 1, cy);
            pushIfWhite(cx - 1, cy);
            pushIfWhite(cx, cy + 1);
            pushIfWhite(cx, cy - 1);
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(base64Image);
  });
};

export const downloadZip = async (images: string[], filename: string = 'emojis.zip') => {
  try {
    const zip = new JSZip();
    const folder = zip.folder("emojis");

    if (!folder) throw new Error("Could not create folder in zip");

    images.forEach((imgDataUrl, i) => {
      const base64Data = imgDataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
      folder.file(`emoji_${i + 1}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);

  } catch (e) {
    console.error("ZIP Generation Error:", e);
    alert("打包下载失败，请尝试单独长按保存图片");
  }
};
