
/**
 * Performs a flood fill operation on the given ImageData.
 * 
 * @param imageData The ImageData to modify
 * @param startX The starting x coordinate
 * @param startY The starting y coordinate
 * @param fillColor The color to fill with [r, g, b, a]
 * @param tolerance Color matching tolerance (0-255)
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number = 30,
  writeToData?: ImageData // Optional: write to this buffer instead of imageData
): void {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const writeData = writeToData ? writeToData.data : data;
  
  // Get starting color
  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];
  
  // Don't fill if start color is same as fill color (unless writing to separate buffer)
  if (!writeToData &&
    Math.abs(startR - fillColor[0]) < 5 &&
    Math.abs(startG - fillColor[1]) < 5 &&
    Math.abs(startB - fillColor[2]) < 5 &&
    Math.abs(startA - fillColor[3]) < 5
  ) {
    return;
  }

  // Stack for DFS
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height); // keep track of visited pixels to avoid loops
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pixelIndex = y * width + x;
    const pos = pixelIndex * 4;

    if (x < 0 || x >= width || y < 0 || y >= height || visited[pixelIndex]) {
      continue;
    }
    
    // Check color match on READ buffer
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const a = data[pos + 3];
    
    // Check if pixel matches start color within tolerance
    const matches = (
      Math.abs(r - startR) <= tolerance &&
      Math.abs(g - startG) <= tolerance &&
      Math.abs(b - startB) <= tolerance &&
      Math.abs(a - startA) <= tolerance
    );

    if (matches) {
      // Fill pixel on WRITE buffer
      writeData[pos] = fillColor[0];
      writeData[pos + 1] = fillColor[1];
      writeData[pos + 2] = fillColor[2];
      writeData[pos + 3] = fillColor[3];
      
      visited[pixelIndex] = 1;

      // Add neighbors
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }
}

/**
 * Helper to convert hex color to RGBA
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        255
      ]
    : [0, 0, 0, 255];
}
