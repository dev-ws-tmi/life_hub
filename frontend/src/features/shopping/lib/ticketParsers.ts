import type { TicketLine, TicketItem } from './ticketTypes';

interface LayoutHints {
  descMaxX: number;
  col1CenterX: number | null;
  col2CenterX: number;
}

export const SUPERMARKET_PATTERNS = [
  { pattern: /mercadona/i,   name: 'Mercadona',   parser: 'MercadonaParser' },
  { pattern: /lidl/i,        name: 'Lidl',        parser: 'LidlParser' },
  { pattern: /bonpreu/i,     name: 'Bonpreu',     parser: 'GenericParser' },
  { pattern: /carrefour/i,   name: 'Carrefour',   parser: 'GenericParser' },
  { pattern: /aldi/i,        name: 'Aldi',        parser: 'GenericParser' },
  { pattern: /dia\b/i,       name: 'Dia',         parser: 'GenericParser' },
  { pattern: /condis/i,      name: 'Condis',      parser: 'GenericParser' },
  { pattern: /consum/i,      name: 'Consum',      parser: 'GenericParser' },
  { pattern: /eroski/i,      name: 'Eroski',      parser: 'GenericParser' },
  { pattern: /alcampo/i,     name: 'Alcampo',     parser: 'GenericParser' },
  { pattern: /plusfresc/i,   name: 'Plusfresc',   parser: 'GenericParser' },
  { pattern: /esclat/i,      name: 'Esclat',      parser: 'GenericParser' },
  { pattern: /supermercad/i, name: 'Supermercat', parser: 'GenericParser' },
];

// ── Línies que NO són productes ───────────────────────────────────────────────
const SKIP_LINE_RE = /^\s*(total|subtotal|efectivo|tarjeta|visa|mastercard|cambio|devoluci[oó]n|entrega\s+efectivo|a\s*pagar|importe\s+total|puntos|factura|nif:|cif:|tel[ée]f|www\.|http|gracias|bienvenid|entrada\s+\d|salida\s+\d|base\s+imponible|cuota\s+iva|^\s*iva\s+\d|op\s*n[uú]m|ticket\s*n[uú]m)\b/i;

const ONLY_DIGITS_RE = /^\s*[\d\s.,:/\-]{7,}\s*$/;

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string[]> = {
  'Frutas y Verduras': ['manzana','platano','plátano','tomate','lechuga','cebolla','tubo','patata','naranja','uva','zanahoria','pimiento','menestra','coliflor','verdura','pepino','escarola','melocoton','melocotón','pisto','fruta'],
  'Carnes y Aves': ['pollo','cerdo','ternera','carne','pechuga','pavo','salch','frankfur','jamon','jamón','embut','choped','longan','pate','paté'],
  'Pescadería': ['pescado','salmon','merluza','gamba','atun','bacalao','dorada','sardina','migas'],
  'Lácteos y Huevos': ['leche','queso','yogur','huevo','huevos','mantequilla','nata','batido','copa','chocolate'],
  'Panadería': ['pan','croissant','magdalena','galleta','barra','rustica','tostada','bizcocho','fideo','pasta'],
  'Despensa': ['arroz','aceite','oliva','girasol','sal ','azucar','harina','lenteja','garbanzo','cafe','café','chocolate','cereal','trigo','ketchup','mayones','salsa'],
  'Bebidas': ['agua','mineral','zumo','naranja','refresco','cerveza','vino','coca','fanta','limonada','cola'],
  'Limpieza y Hogar': ['jabon','jabón','detergente','lejia','suavizante','bolsa','basura','papel','higienico','servilleta','discos','activos','wc','plastico'],
  'Cuidado Personal': ['champu','champú','gel','crema','desodorante','cuchilla'],
  'Congelados': ['helado','pizza','congelado','hielo'],
  'Otros': ['parking'],
};

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_MAP)) {
    if (kws.some(kw => lower.includes(kw))) return cat;
  }
  return 'Alimentació';
}

// ── Correccions d'OCR ─────────────────────────────────────────────────────────

/** Corregeix errors d'OCR típics en tokens de preu */
function fixOCRInPrice(s: string): string {
  return s
    .replace(/^[lI]/, '1')   // 'l,40' → '1,40'
    .replace(/^[O]/, '0')    // 'O,80' → '0,80'
    .replace(/[lI](?=\d)/g, '1')
    .replace(/[O](?=\d)/g, '0');
}

/** Parseja un string de preu a float. Retorna null si és invàlid. */
function parsePrice(s: string): number | null {
  if (!s) return null;
  const clean = fixOCRInPrice(s.trim())
    .replace(/[AB]$/i, '')  // sufix IVA de Mercadona
    .replace(',', '.');
  const val = parseFloat(clean);
  if (isNaN(val) || val < 0 || val >= 2000) return null;
  return val;
}

/** Comprova si un string sembla un preu vàlid de tiquet */
function looksLikePrice(s: string): boolean {
  const fixed = fixOCRInPrice(s.trim());
  return /^\d{1,4}[,.]\d{2}[AB]?$/.test(fixed);
}

function hasAbbreviations(name: string): boolean {
  return /\b[A-ZÁÉÍÓÚÑ]{1,3}\.\s/.test(name) ||
    /\b(ALU|EXT|DOB|CAP|ALUM|LF|BO|SIN|CON|EXPR|NAT|QUES)\b/i.test(name) ||
    (name.length < 5 && /^[A-Z]+$/.test(name));
}

// ─────────────────────────────────────────────────────────────────────────────
// PREPROCESSAMENT DE LÍNIES
// ─────────────────────────────────────────────────────────────────────────────

/** Neteja una línia d'OCR: elimina caràcters de soroll inicials */
function cleanLine(raw: string): string {
  // Elimina artefactes OCR inicials: guions, barres, punts, espais
  return raw.replace(/^[\s\-—–|\.·:]+/, '').trimEnd();
}

/** Comprova si una línia és clarament de cap/peu de tiquet (no és producte) */
function isNoiseLine(t: string): boolean {
  if (!t || t.length < 2) return true;
  if (SKIP_LINE_RE.test(t)) return true;
  if (ONLY_DIGITS_RE.test(t)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTRUCTURES DE RESULTAT
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedLine {
  qty: number;
  name: string;
  unitPrice: number | null;
  totalPrice: number | null;
  isWeightItem: boolean;
  isNameOnly: boolean;   // Línia de nom sense preu (producte per pes o continua a la línia seg.)
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSING DE LÍNIES INDIVIDUALS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intenta parsejar UNA línia de tiquet.
 * Retorna null si la línia no sembla un producte.
 * Retorna un ParsedLine amb isNameOnly=true si és un nom sense preu.
 */
function parseRawLine(raw: string): ParsedLine | null {
  const t = cleanLine(raw);
  if (isNoiseLine(t)) return null;

  // ── Format WK: Pes per kg ─────────────────────────────────────────────────
  // Accepta: "0,428 kg  1,88 €/kg  0,80"
  //          "— 0,134 kg  2,05 €/kg  0,27"  (amb guió inicial que cleanLine treu)
  // El cleanLine ja ha eliminat el guió inicial, ara:
  const weightMatch = t.match(/^(\d+[,.]\d{1,3})\s*kg\b.*?(\d{1,3}[,.]\d{2})\s*$/i);
  if (weightMatch) {
    const qty = parseFloat(weightMatch[1].replace(',', '.'));
    const total = parsePrice(weightMatch[2]);
    if (total !== null && qty > 0) {
      return { qty, name: '', unitPrice: null, totalPrice: total, isWeightItem: true, isNameOnly: false };
    }
  }

  // ── Format 2P: QTY NOM PREU_UNIT PREU_TOTAL (dos preus separats) ──────────
  // "2 PACK-4 SALCH.FRANKF  1,75  3,50"
  // "8 COLA  0,92  7,36"
  const twoPrice = t.match(/^(\d{1,2})\s+(.+?)\s{2,}(\d{1,4}[,.]\d{2}[AB]?)\s+(\d{1,4}[,.]\d{2}[AB]?)\s*$/);
  if (twoPrice) {
    const qty = parseInt(twoPrice[1], 10);
    const name = twoPrice[2].trim();
    const unitPrice = parsePrice(twoPrice[3]);
    const totalPrice = parsePrice(twoPrice[4]);
    if (qty > 0 && qty < 200 && name.length > 0 && totalPrice !== null) {
      return { qty, name, unitPrice, totalPrice, isWeightItem: false, isNameOnly: false };
    }
  }

  // ── Format 1P: QTY NOM PREU_TOTAL (un preu) ──────────────────────────────
  // "1 GALLETA CHOCO NEGRO  1,40"
  // "1 12 HUEVOS SUPER GRAN  3,75"  ← nom amb número
  // "1 PARKING  0,00"
  const onePrice = t.match(/^(\d{1,2})\s+(.+?)\s+(\d{1,4}[,.]\d{2}[AB]?)\s*$/);
  if (onePrice) {
    const qty = parseInt(onePrice[1], 10);
    const name = onePrice[2].trim();
    const totalPrice = parsePrice(onePrice[3]);
    // Validació: qty raonable, nom té text, preu vàlid
    if (qty > 0 && qty < 200 && name.length > 0 && totalPrice !== null
      && !/^\d+([,.]\d+)?\s*$/.test(name)  // nom no purament numèric
    ) {
      return { qty, name, unitPrice: null, totalPrice, isWeightItem: false, isNameOnly: false };
    }
  }

  // ── Format NQ: NOM PREU_TOTAL (sense quantitat explícita) ────────────────
  // "PLATANO  0,27" (quan la línia anterior tenia el pes i ja es processà)
  // Primera lletra ha de ser majúscula o lletra
  const noQty = t.match(/^([A-ZÁÉÍÓÚÑ\u00C0-\u00FF][A-Za-záéíóúñÁÉÍÓÚÑ\d\s.,\-\/\'%&+#]+?)\s{2,}(\d{1,4}[,.]\d{2}[AB]?)\s*$/);
  if (noQty) {
    const name = noQty[1].trim();
    const totalPrice = parsePrice(noQty[2]);
    if (name.length >= 2 && totalPrice !== null && !isNoiseLine(name)) {
      return { qty: 1, name, unitPrice: null, totalPrice, isWeightItem: false, isNameOnly: false };
    }
  }

  // ── Format FB: Fallback — preu al final amb qualsevol separació ───────────
  // Per quan l'OCR produeix espais irregulars
  // Busquem l'últim token que sembla un preu
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const last = words[words.length - 1];
    const secondLast = words.length >= 2 ? words[words.length - 2] : '';

    if (looksLikePrice(last)) {
      const totalPrice = parsePrice(last);
      if (totalPrice === null) return null;

      let unitPrice: number | null = null;
      let nameWords: string[];

      if (looksLikePrice(secondLast)) {
        unitPrice = parsePrice(secondLast);
        nameWords = words.slice(0, -2);
      } else {
        nameWords = words.slice(0, -1);
      }

      // Detectar qty al principi del nom
      let qty = 1;
      if (nameWords.length > 0 && /^\d{1,2}$/.test(nameWords[0])) {
        const q = parseInt(nameWords[0], 10);
        if (q > 0 && q < 200) {
          qty = q;
          nameWords = nameWords.slice(1);
        }
      }

      const name = nameWords.join(' ').trim();
      if (name.length < 2 || isNoiseLine(name)) return null;
      if (/^\d+([,.]\d+)?\s*$/.test(name)) return null;

      return { qty, name, unitPrice, totalPrice, isWeightItem: false, isNameOnly: false };
    }
  }

  // ── Format NO: Línia de nom sense preu (possible ítem per pes) ───────────
  // "1 TOMATE CANARIO", "1 PLATANO" — sense preu al final
  const nameOnly = t.match(/^(\d{1,2})\s+([A-ZÁÉÍÓÚÑ\u00C0-\u00FF].{2,})\s*$/);
  if (nameOnly) {
    const qty = parseInt(nameOnly[1], 10);
    const name = nameOnly[2].trim();
    // Acceptem com a "nom only" si el nom NO acaba en número que sembla preu
    if (qty > 0 && qty < 200 && name.length >= 2) {
      return { qty, name: name, unitPrice: null, totalPrice: null, isWeightItem: false, isNameOnly: true };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER CLASSES
// ─────────────────────────────────────────────────────────────────────────────

export abstract class BaseTicketParser {
  abstract get parserName(): string;

  protected computeNameConfidence(name: string): number {
    let conf = 0.80;
    if (hasAbbreviations(name)) conf -= 0.18;
    if (name.length < 4) conf -= 0.25;
    if (name.length > 10 && !hasAbbreviations(name)) conf += 0.10;
    return Math.max(0.15, Math.min(1.0, conf));
  }

  protected validateMath(qty: number, unit: number | null, total: number | null): boolean | null {
    if (total === 0) return false; // gratuït / promoció
    if (unit !== null && total !== null) {
      return Math.abs(qty * unit - total) < 0.03;
    }
    return null;
  }

  parseItems(lines: TicketLine[], _layout: LayoutHints | null): TicketItem[] {
    const items: TicketItem[] = [];
    const usedAsName = new Set<number>(); // índexs de línies ja usades com a nom

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseRawLine(line.rawText);

      // ── Línia de nom-only: la processarem quan la línia de pes arribi ──────
      // No generem un item aquí; esperem la línia de pes
      if (parsed?.isNameOnly) {
        // Mirem si la PRÒXIMA línia no-buida és de pes
        let nextWeightIdx = -1;
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const np = parseRawLine(lines[j].rawText);
          if (np?.isWeightItem) { nextWeightIdx = j; break; }
          if (np && !np.isNameOnly) break; // hi ha un article normal entre mig
        }

        if (nextWeightIdx !== -1) {
          // Combinació nom + pes
          const weightParsed = parseRawLine(lines[nextWeightIdx].rawText)!;
          const name = parsed.name;
          const qty = weightParsed.qty;  // kg

          const nameConf = this.computeNameConfidence(name);
          const mathOk = null; // no podem validar matemàtica per pes
          items.push({
            rawName: name,
            normalizedName: name,
            quantity: qty,
            unitPrice: weightParsed.unitPrice,
            totalPrice: weightParsed.totalPrice,
            category: detectCategory(name),
            confidence: (nameConf + 0.88) / 2,
            nameConfidence: nameConf,
            priceConfidence: 0.88,
            mathematicalConsistency: mathOk,
            needsReview: nameConf < 0.60,
          });
          usedAsName.add(i);
          usedAsName.add(nextWeightIdx);
          i = nextWeightIdx; // Saltem al nextWeightIdx
          continue;
        }

        // Si no té línia de pes propera, ignorem (probablement és header)
        continue;
      }

      // ── Línia de pes ORFE (sense nom a la línia anterior detectat) ─────────
      if (parsed?.isWeightItem && parsed.name === '') {
        if (usedAsName.has(i)) continue; // ja processat

        // Busquem cap enrere una línia de nom no usada
        let foundName = 'Producte per pes';
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          if (usedAsName.has(j)) continue;
          const prevP = parseRawLine(lines[j].rawText);
          // La línia anterior ha de ser de nom-only o text sense preu
          if (prevP?.isNameOnly) {
            foundName = prevP.name;
            usedAsName.add(j);
            break;
          }
          if (!prevP) {
            // No parsejable → pot ser text del producte
            const prevClean = cleanLine(lines[j].rawText);
            if (!isNoiseLine(prevClean) && prevClean.length > 2) {
              foundName = prevClean.replace(/^\d{1,2}\s+/, '').trim();
              usedAsName.add(j);
              break;
            }
          }
        }

        const nameConf = this.computeNameConfidence(foundName);
        items.push({
          rawName: foundName,
          normalizedName: foundName,
          quantity: parsed.qty,
          unitPrice: parsed.unitPrice,
          totalPrice: parsed.totalPrice,
          category: detectCategory(foundName),
          confidence: (nameConf + 0.85) / 2,
          nameConfidence: nameConf,
          priceConfidence: 0.85,
          mathematicalConsistency: null,
          needsReview: foundName === 'Producte per pes' || nameConf < 0.60,
        });
        usedAsName.add(i);
        continue;
      }

      // ── Línia de producte normal ───────────────────────────────────────────
      if (!parsed || parsed.isNameOnly || usedAsName.has(i)) continue;

      const nameConf = this.computeNameConfidence(parsed.name);
      const priceConf = parsed.totalPrice !== null ? 0.88 : 0;
      const mathOk = this.validateMath(parsed.qty, parsed.unitPrice, parsed.totalPrice);
      const needsReview = nameConf < 0.60 || priceConf < 0.5 || mathOk === false;

      items.push({
        rawName: parsed.name,
        normalizedName: parsed.name,
        quantity: parsed.qty,
        unitPrice: parsed.unitPrice,
        totalPrice: parsed.totalPrice,
        category: detectCategory(parsed.name),
        confidence: (nameConf + priceConf) / 2,
        nameConfidence: nameConf,
        priceConfidence: priceConf,
        mathematicalConsistency: mathOk,
        needsReview,
      });
    }

    return items;
  }
}

class MercadonaParser extends BaseTicketParser {
  get parserName() { return 'MercadonaParser'; }
}

class GenericParser extends BaseTicketParser {
  get parserName() { return 'GenericParser'; }
}

class LidlParser extends BaseTicketParser {
  get parserName() { return 'LidlParser'; }
}

export function selectParser(merchantName: string | null): BaseTicketParser {
  if (!merchantName) return new GenericParser();
  const match = SUPERMARKET_PATTERNS.find(p => p.pattern.test(merchantName));
  if (match?.parser === 'MercadonaParser') return new MercadonaParser();
  if (match?.parser === 'LidlParser') return new LidlParser();
  return new GenericParser();
}
