import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'crypto';

interface AzureTranslationResponse {
  translations: { text: string; to: string }[];
}

@Injectable()
export class TranslationService {
  private endpoint: string;
  private apiKey: string | undefined;
  private region: string | undefined;
  private cache: Map<string, string> = new Map();

  constructor() {
    this.apiKey = process.env.AZURE_TRANSLATOR_KEY;
    this.region = process.env.AZURE_TRANSLATOR_REGION;
    this.endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT?.replace(/\/$/, '') || 'https://api.cognitive.microsofttranslator.com';
  }

  private localeToAzure(lang: string) {
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('es')) return 'es';
    return lang.split('-')[0];
  }

  async translateArray(texts: string[], toLocale: string, fromLocale = 'es-MX'): Promise<string[]> {
    const target = this.localeToAzure(toLocale);
    const source = this.localeToAzure(fromLocale);

    // Si el destino es español y el origen también, retorna original
    if (target === source) return texts;

    // Intentar recuperar del caché en memoria
    const results: string[] = [];
    const toTranslate: { original: string; index: number }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const txt = texts[i];
      const hash = createHash('sha256').update(`${txt}::${toLocale}`).digest('hex');
      const cached = this.cache.get(hash);
      if (cached) {
        results.push(cached);
      } else {
        toTranslate.push({ original: txt, index: i });
        results.push(''); // placeholder
      }
    }

    if (toTranslate.length === 0) {
      return results;
    }

    if (!this.apiKey || !this.region) {
      throw new InternalServerErrorException('Azure Translator API key/region not configured');
    }

    const url = `${this.endpoint}/translate?api-version=3.0&from=${source}&to=${target}`;
    const body = toTranslate.map(t => ({ Text: t.original }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Ocp-Apim-Subscription-Region': this.region!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Azure translation failed: ${response.status} ${text}`);
    }

    const json: AzureTranslationResponse[] = await response.json();
    const translatedBatch = json.map(item => item.translations[0]?.text || '');

    // Guardar en caché y colocar en los resultados
    for (let i = 0; i < toTranslate.length; i++) {
      const item = toTranslate[i];
      const translated = translatedBatch[i];
      const hash = createHash('sha256').update(`${item.original}::${toLocale}`).digest('hex');
      this.cache.set(hash, translated);
      results[item.index] = translated;
    }

    return results;
  }
}
