const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = ({ strapi }) => ({
  async generateWithPrompt(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      strapi.log.warn("GEMINI_API_KEY not found. Skipping generation.");
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || "gemma-3-12b-it";
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      strapi.log.error("Gemini generation error:", error);
      return null;
    }
  },

  async translateBatch(texts, targetLocale = "ru") {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    
    const localeNames = { 'ru': 'Russian', 'uz': 'Uzbek', 'en': 'English' };
    const targetLang = localeNames[targetLocale] || targetLocale;

    // Use a more forceful and detailed prompt
    const prompt = `You are a professional translator. 
    Translate the following JSON array of strings from English into ${targetLang}.
    
    CRITICAL RULES:
    1. Translate the CONTENT of the strings. DO NOT leave them in English.
    2. Maintain the EXACT same array length (${texts.length}).
    3. Maintain the EXACT same order.
    4. Return ONLY the translated JSON array. 
    5. NO markdown formatting, NO code blocks, NO introductory text.
    
    Input JSON: ${JSON.stringify(texts)}`;

    const responseText = await this.generateWithPrompt(prompt);
    if (!responseText) return texts;

    try {
      // Clean up potential markdown code blocks or extra text
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const translatedArray = JSON.parse(jsonMatch[0]);
        if (Array.isArray(translatedArray) && translatedArray.length === texts.length) {
          strapi.log.debug(`[Translate] Successfully batch translated ${texts.length} strings.`);
          return translatedArray;
        }
      }
      
      strapi.log.warn("[Translate] Batch result format mismatch. Length expected:", texts.length);
      return texts;
    } catch (e) {
      strapi.log.error("[Translate] Batch JSON parse error. Response was:", responseText);
      return texts;
    }
  },

  async translateObject(obj, targetLocale = "ru") {
    if (!obj || typeof obj !== 'object') return obj;

    // Step 1: Collect all translatable strings and their paths
    const stringsToTranslate = [];
    const skipFields = ['id', 'documentId', 'locale', 'path', 'slug', 'url', 'createdAt', 'updatedAt', 'publishedAt', 'type', 'mime'];

    const collect = (item) => {
      if (!item) return;
      if (typeof item === 'string' && item.trim().length > 0) {
        stringsToTranslate.push(item);
      } else if (Array.isArray(item)) {
        item.forEach(collect);
      } else if (typeof item === 'object') {
        for (const [key, value] of Object.entries(item)) {
          if (!skipFields.includes(key)) collect(value);
        }
      }
    };

    collect(obj);

    if (stringsToTranslate.length === 0) return obj;

    // Step 2: Translate all strings in one batch
    strapi.log.info(`[Translate] Batch translating ${stringsToTranslate.length} strings to ${targetLocale}`);
    const translatedStrings = await this.translateBatch(stringsToTranslate, targetLocale);

    // Step 3: Map them back to a new object
    let index = 0;
    const mapBack = (item) => {
      if (!item) return item;
      if (typeof item === 'string' && item.trim().length > 0) {
        return translatedStrings[index++] || item;
      } else if (Array.isArray(item)) {
        return item.map(mapBack);
      } else if (typeof item === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(item)) {
          if (skipFields.includes(key)) {
            newObj[key] = value;
          } else {
            newObj[key] = mapBack(value);
          }
        }
        return newObj;
      }
      return item;
    };

    return mapBack(obj);
  }
});
