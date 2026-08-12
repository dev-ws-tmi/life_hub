import { RawWord, TicketLine } from './ticketTypes';

export function groupWordsIntoLines(words: RawWord[]): TicketLine[] {
  if (words.length === 0) return [];
  
  // Sort words by Y ascending
  const sortedWords = [...words].sort((a, b) => {
    const yCenterA = (a.y0 + a.y1) / 2;
    const yCenterB = (b.y0 + b.y1) / 2;
    return yCenterA - yCenterB;
  });

  const lines: TicketLine[] = [];
  let currentLineWords: RawWord[] = [sortedWords[0]];
  
  for (let i = 1; i < sortedWords.length; i++) {
    const word = sortedWords[i];
    const prevWord = currentLineWords[currentLineWords.length - 1];
    
    const yCenter = (word.y0 + word.y1) / 2;
    const prevYCenter = (prevWord.y0 + prevWord.y1) / 2;
    const avgHeight = ((word.y1 - word.y0) + (prevWord.y1 - prevWord.y0)) / 2;
    
    // Group if within 60% of average height
    if (Math.abs(yCenter - prevYCenter) < (avgHeight * 0.6)) {
      currentLineWords.push(word);
    } else {
      lines.push(createTicketLine(currentLineWords));
      currentLineWords = [word];
    }
  }
  
  if (currentLineWords.length > 0) {
    lines.push(createTicketLine(currentLineWords));
  }
  
  return lines;
}

function createTicketLine(words: RawWord[]): TicketLine {
  const sortedWords = [...words].sort((a, b) => a.x0 - b.x0);
  
  let ySum = 0;
  let hSum = 0;
  for (const w of sortedWords) {
    ySum += (w.y0 + w.y1) / 2;
    hSum += (w.y1 - w.y0);
  }
  
  return {
    words: sortedWords,
    rawText: sortedWords.map(w => w.text).join(' '),
    y: ySum / sortedWords.length,
    height: hSum / sortedWords.length
  };
}

export function detectColumns(lines: TicketLine[]): { descMaxX: number; col1CenterX: number | null; col2CenterX: number } | null {
  const priceRegex = /^\d+[.,]\d{2}$/;
  const priceCenters: number[] = [];
  
  for (const line of lines) {
    for (const word of line.words) {
      if (priceRegex.test(word.text)) {
        priceCenters.push((word.x0 + word.x1) / 2);
      }
    }
  }
  
  if (priceCenters.length === 0) return null;
  
  priceCenters.sort((a, b) => a - b);
  
  // Simple 1D clustering
  const clusters: { center: number, count: number }[] = [];
  let currentCluster = { sum: priceCenters[0], count: 1 };
  
  for (let i = 1; i < priceCenters.length; i++) {
    const val = priceCenters[i];
    const avg = currentCluster.sum / currentCluster.count;
    if (Math.abs(val - avg) < 50) { // 50px tolerance
      currentCluster.sum += val;
      currentCluster.count++;
    } else {
      clusters.push({ center: currentCluster.sum / currentCluster.count, count: currentCluster.count });
      currentCluster = { sum: val, count: 1 };
    }
  }
  clusters.push({ center: currentCluster.sum / currentCluster.count, count: currentCluster.count });
  
  // Sort clusters by X
  clusters.sort((a, b) => a.center - b.center);
  
  // Filter out noise clusters with very few items if we have better ones
  const validClusters = clusters.filter(c => c.count >= 2);
  const activeClusters = validClusters.length > 0 ? validClusters : clusters;
  
  if (activeClusters.length >= 2) {
    // Take the two rightmost significant clusters
    const col1 = activeClusters[activeClusters.length - 2].center;
    const col2 = activeClusters[activeClusters.length - 1].center;
    return {
      descMaxX: col1 - 30, // arbitrary margin
      col1CenterX: col1,
      col2CenterX: col2
    };
  } else {
    // Only 1 column (total price)
    const col2 = activeClusters[0].center;
    return {
      descMaxX: col2 - 30,
      col1CenterX: null,
      col2CenterX: col2
    };
  }
}

/**
 * Fallback: build TicketLine[] from plain text when word bboxes are unavailable.
 * Assigns synthetic X coordinates based on character position so column detection
 * can still work approximately (prices appear at end = high X).
 */
export function textLinesToTicketLines(rawText: string): TicketLine[] {
  const textLines = rawText
    .split('\n')
    .map(l => l.trimEnd())       // keep leading spaces (alignment info)
    .filter(l => l.trim().length > 0);

  return textLines.map((text, lineIdx) => {
    const trimmed = text.trim();
    // Estimate character width: assume ~8px per char, line starts at x=0
    const lineWidth = 320; // typical ticket width in pixels
    const charWidth = text.length > 0 ? Math.min(8, lineWidth / text.length) : 8;

    const words: import('./ticketTypes').RawWord[] = trimmed.split(/\s+/).map(word => {
      // Find position of this word in the original (possibly padded) line
      const idx = text.indexOf(word);
      const x0 = idx * charWidth;
      const x1 = x0 + word.length * charWidth;
      return {
        text: word,
        x0,
        y0: lineIdx * 20,
        x1,
        y1: lineIdx * 20 + 16,
        confidence: 0.85
      };
    });

    return {
      rawText: trimmed,
      words,
      y: lineIdx * 20 + 8,
      height: 16
    };
  });
}
