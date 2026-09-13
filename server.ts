import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Helper to extract a friendly error message from ApiError
function extractFriendlyErrorMessage(err: any): string {
  if (!err) return 'Neznámá chyba při komunikaci s AI modelem.';
  const raw = err?.message || String(err);

  // Check if error contains JSON with error code/message
  const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.code === 503 || parsed?.error?.status === 'UNAVAILABLE' || /high demand/i.test(parsed?.error?.message)) {
        return 'Služba Google Gemini má momentálně vysoké vytížení (kód 503). Automatické opakování proběhlo, ale servery jsou dočasně přetížené. Zkuste to prosím za chviličku znovu kliknutím na tlačítko Zkusit znovu, nebo vložte text z rozpisu ručně.';
      }
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // ignore
    }
  }

  if (/503|high demand|UNAVAILABLE/i.test(raw)) {
    return 'Služba Google Gemini má momentálně vysoké vytížení (kód 503). Zkuste to prosím za několik okamžiků znovu tlačítkem Zkusit znovu, případně zadejte jména textem.';
  }

  return raw;
}

// Generate with retry on 503/429 and fallback to secondary model
async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config: any
) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini OCR] Volám model ${model} (pokus ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient = /503|high demand|UNAVAILABLE|429|RESOURCE_EXHAUSTED/i.test(msg);
        console.warn(`[Gemini OCR] Chyba u modelu ${model} (pokus ${attempt}):`, msg);

        if (isTransient && attempt < 2) {
          // Wait 2 seconds before retry on same model
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        // Fallback to next model if transient or failed
        break;
      }
    }
  }

  throw lastError;
}

// System prompt for operator extraction
const EXTRACTION_PROMPT = `
Jsi asistent pro vedoucího směny v logistickém centru ZF Aftermarket v Ostrově.
Tvým úkolem je z poskytnutého snímku (fotka rozpisu směn, papírová docházka, nástěnka, tabulka na monitoru) nebo textu vytáhnout seznam operátorů pro oddělení PICK.

Oddělení PICK se dělí výhradně na tyto pododdělení:
- 'hovc': HOVC (High-bay Obalové / Vstupní centrum)
- 'hovs': HOVS (High-bay Skladové regály & konsolidace)
- 'putaway': Putaway / Zaskladnění
- 'vas': VAS (Value Added Services / speciální balení)
- 'obwf': OBWF (Outbound Waterfront)
- 'vna': VNA (Very Narrow Aisle - úzké uličky)
- 'obwi': OBWI (Outbound Web & International)
- 'unassigned': Pokud oddělení nelze určit

Stroje/Kvalifikace:
- Pouze 'LL' nebo 'RTR'. Pokud není výslovně uvedeno, odhadni z kontextu (např. VNA/HOVS často RTR, běžný pick LL), výchozí je 'LL'.
- ŽÁDNÉ jiné stroje, žádná osobní čísla, žádné směny.

Zde je referenční seznam známých pracovníků skladu v ZF Ostrov (použij pro přesné rozpoznání i z méně čitelných fotek, zkratek a tabulek):
Andrii Gurkot, Barnóky Roman, Bereš Zbyněk, Bogár Alexander, BOHDAN BAIOV, Burget David, Červeňák Michael, Daduč Imrich, Daniel Šír, DAVID SVOBODA, DEMIANETS D., Faber Dominik, Fiala Ladislav, Gajdoš Slavomír, Györke Ladislav, Halimov Oleh, Havel Zdeněk, Hemzáček Lukáš, Horváth Valentin, Hosszu Radek, Hřava Dominik, Chrastina Atilla, IHOR Pozniak, IHOR Savchenko, JAKUB PFREIMER, JAKUB SKÁLA, Jiří Nečas, Jiří Teplý, Jiří Vašíček, Josef Bartko, Kateřina Novotná, Kochut Yurii, Kovalchuk O., Kryvoruchko Daria, Kurcius David, Máca Filip, Martin Mazánek, Martin Vlček, Merzliakov O., Mika Dominik, Miroslav Havlík, Miroslav Kónya, Mrhal Aleš, Müller Jan, Mykhailchuk M., Nováček M., Pacelt Jakub, Pavelka Vojtěch, Petrus Oleksandr, Popelář Hynek, Pukančík Ota, Robert Trapl, Sebastian Čermák, SIDEI BOGDAN, Simona Pyttlová, Sivák David, Sivák R., Sovadina Václav, Šándor Milan, Tomáš Bartoš, TONDA HORÁK, Velat Petr, VITALII SAVCHENKO, Vít Varga, Vojtěch Hodl.

Vrať POUZE validní JSON pole objektů s touto strukturou:
[
  {
    "name": "Celé Jméno a Příjmení",
    "machineType": "LL" | "RTR",
    "departmentId": "hovc" | "hovs" | "putaway" | "vas" | "obwf" | "vna" | "obwi" | "unassigned",
    "notes": "volitelná krátká poznámka (např. pozice nebo původní údaj z tabulky)"
  }
]
`;

// Extract operators from photo or text
app.post('/api/extract-operators', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', textInput } = req.body;

    if (!imageBase64 && !textInput) {
      return res.status(400).json({ error: 'Nebyly poskytnuty žádné obrazové ani textové údaje.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback parser if Gemini API key is not yet set
      if (textInput) {
        const lines = textInput.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
        const parsed = lines.map((line: string, idx: number) => {
          const lower = line.toLowerCase();
          const machineType: 'LL' | 'RTR' = lower.includes('rtr') ? 'RTR' : 'LL';
          let departmentId = 'hovc';
          if (lower.includes('hovs')) departmentId = 'hovs';
          else if (lower.includes('put') || lower.includes('zasklad')) departmentId = 'putaway';
          else if (lower.includes('vas')) departmentId = 'vas';
          else if (lower.includes('obwf')) departmentId = 'obwf';
          else if (lower.includes('vna')) departmentId = 'vna';
          else if (lower.includes('obwi')) departmentId = 'obwi';

          const cleanName = line
            .replace(/(LL|RTR|HOVC|HOVS|PUTAWAY|VAS|OBWF|VNA|OBWI)/gi, '')
            .replace(/[-,:;|()]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim() || `Operátor ${idx + 1}`;

          return {
            name: cleanName,
            machineType,
            departmentId,
            notes: 'Importováno z textu',
          };
        });
        return res.json({ operators: parsed, source: 'fallback-text' });
      }

      return res.status(503).json({
        error: 'Pro automatické OCR snímků je vyžadován GEMINI_API_KEY v nastavení.',
      });
    }

    const ai = getAIClient();
    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64
        .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
        .replace(/\s+/g, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    if (textInput) {
      parts.push({
        text: `Text k analýze:\n${textInput}`,
      });
    }

    parts.push({
      text: `${EXTRACTION_PROMPT}\nVytáhni všechny operátory z přiloženého materiálu. Vrať striktně čistý JSON array.`,
    });

    const response = await generateContentWithFallback(
      ai,
      [
        {
          role: 'user',
          parts,
        },
      ],
      {
        responseMimeType: 'application/json',
      }
    );

    const responseText = response?.text || '[]';
    let operators = [];
    try {
      operators = JSON.parse(responseText);
    } catch {
      // Clean possible backticks
      const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      operators = JSON.parse(clean);
    }

    if (!Array.isArray(operators)) {
      operators = [];
    }

    // Standardize IDs and fields
    const validDepts = ['hovc', 'hovs', 'putaway', 'vas', 'obwf', 'vna', 'obwi', 'unassigned'];
    const sanitized = operators.map((op: any, i: number) => {
      const dept = validDepts.includes(op.departmentId) ? op.departmentId : 'hovc';
      const mType = op.machineType === 'RTR' ? 'RTR' : 'LL';
      return {
        id: `op-imported-${Date.now()}-${i + 1}`,
        name: String(op.name || `Operátor ${i + 1}`).trim(),
        machineType: mType,
        departmentId: dept,
        isVnaOnly: false,
        status: 'active',
        notes: op.notes ? String(op.notes).trim() : 'Extrahováno ze snímku',
        lastMovedAt: new Date().toISOString(),
      };
    });

    res.json({ operators: sanitized, count: sanitized.length });
  } catch (error: any) {
    console.error('Extraction error:', error);
    const friendlyMsg = extractFriendlyErrorMessage(error);
    const is503 = /503|high demand|UNAVAILABLE/i.test(String(error?.message || error));
    res.status(is503 ? 503 : 500).json({
      error: friendlyMsg,
      isTransient: is503,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
