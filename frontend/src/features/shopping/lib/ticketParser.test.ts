import { parseStructuredText } from './ticketParser';

const SAMPLE_TICKET = `
MERCADONA
22/03/2027 19:07

2 AGUA MINERAL              0,63   1,26
1 CEREAL TRIGO ENTERO              2,65
1 C. COLOMBIA ALU                   3,45
1 C. DOB. ESPRESSO ALU              3,40
1 CAP. RISTRETTO ALUM               3,40
1 B.BASURA EXT.C.FACIL              1,70
1 CAP. EXTRAFORTE ALUM              3,40
1 CHOCOLATE PURO                    2,60
2 CHUCO-LECHE ALMENDRA      3,00   6,00
2 CHOCOLATE ALMENDRA         3,00   0,00
1 PECHUGA PAVO HORNO                 1,55
1 MIGAS DE COLIFLOR                  1,50
1 PISTO DE VERDURAS                  1,80
2 MENESTRA                    1,15   2,30
1 DISCOS ACTIVOS                     2,75

TOTAL (EUR) 44,16
`;

export function runTicketParserTests() {
  let passed = 0;
  let failed = 0;
  const results: {name: string; passed: boolean; error?: string}[] = [];

  const runTest = (name: string, fn: () => void) => {
    try {
      fn();
      passed++;
      results.push({ name, passed: true });
    } catch (e: any) {
      failed++;
      results.push({ name, passed: false, error: e.message });
    }
  };

  const parsed = parseStructuredText(SAMPLE_TICKET);

  runTest('detects merchant', () => {
    if (parsed.supermarket !== 'Mercadona') throw new Error(`Expected Mercadona, got ${parsed.supermarket}`);
  });

  runTest('detects date', () => {
    if (parsed.date !== '22/03/2027') throw new Error(`Expected 22/03/2027, got ${parsed.date}`);
  });

  runTest('detects time', () => {
    if (parsed.time !== '19:07') throw new Error(`Expected 19:07, got ${parsed.time}`);
  });

  runTest('parses AGUA MINERAL qty=2 unitPrice=0.63 total=1.26 mathOK', () => {
    const item = parsed.items.find(i => i.rawName.includes('AGUA MINERAL'));
    if (!item) throw new Error('Not found');
    if (item.quantity !== 2) throw new Error(`qty ${item.quantity}`);
    if (item.unitPrice !== 0.63) throw new Error(`unitPrice ${item.unitPrice}`);
    if (item.price !== 1.26) throw new Error(`price ${item.price}`);
    if (item.mathematicalConsistency !== true) throw new Error('math not true');
  });

  runTest('parses CEREAL TRIGO ENTERO qty=1 unitPrice=null total=2.65', () => {
    const item = parsed.items.find(i => i.rawName.includes('CEREAL TRIGO'));
    if (!item) throw new Error('Not found');
    if (item.quantity !== 1) throw new Error(`qty ${item.quantity}`);
    if (item.price !== 2.65) throw new Error(`price ${item.price}`);
  });

  runTest('preserves C. COLOMBIA ALU raw name unchanged', () => {
    const item = parsed.items.find(i => i.rawName === 'C. COLOMBIA ALU');
    if (!item) throw new Error('Not found');
    if (item.needsReview !== true) throw new Error('Should need review due to abbrevs');
  });

  runTest('CHOCOLATE ALMENDRA total=0.00 preserved, mathematicalConsistency=false', () => {
    const item = parsed.items.find(i => i.rawName === 'CHOCOLATE ALMENDRA');
    if (!item) throw new Error('Not found');
    if (item.price !== 0) throw new Error('price should be 0');
    if (item.mathematicalConsistency !== false) throw new Error('math should be false for 0.00');
  });

  runTest('detects total = 44.16', () => {
    if (parsed.total !== 44.16) throw new Error(`Expected 44.16, got ${parsed.total}`);
  });

  return { passed, failed, results };
}
