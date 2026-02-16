const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = ({ strapi }) => ({
  async translate(text, targetLocale = "ru") {
    if (!text || typeof text !== 'string') return text;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      strapi.log.warn("GEMINI_API_KEY not found. Skipping translation.");
      return text;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

    const localeNames = {
      'ru': 'Russian',
      'uz': 'Uzbek',
      'en': 'English'
    };

    const targetLang = localeNames[targetLocale] || targetLocale;
    const prompt = `Translate the following text to ${targetLang}. 
    Return ONLY the translated text without any explanations or formatting.
    
    Text: ${text}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      strapi.log.error("Gemini translation error:", error);
      return text;
    }
  },

  async translateBlocks(blocks, targetLocale = "ru") {
    if (!Array.isArray(blocks)) return blocks;
    
    const translatedBlocks = [];
    
    for (const block of blocks) {
      const translatedBlock = { ...block };
      
      // Handle different block types
      if (block.children && Array.isArray(block.children)) {
        translatedBlock.children = await Promise.all(
          block.children.map(async (child) => {
            if (child.text && typeof child.text === 'string' && child.text.trim()) {
              return {
                ...child,
                text: await strapi.service('api::translate.gemini').translate(child.text, targetLocale)
              };
            }
            return child;
          })
        );
      }
      
      translatedBlocks.push(translatedBlock);
    }
    
    return translatedBlocks;
  },

  async translateObject(obj, targetLocale = "ru") {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      // Check if it's a blocks array (Strapi 5 blocks field)
      if (obj.length > 0 && obj[0].type && obj[0].children) {
        return await strapi.service('api::translate.gemini').translateBlocks(obj, targetLocale);
      }
      
      // Otherwise it's a regular array (like repeatable components)
      return await Promise.all(obj.map(item => 
        strapi.service('api::translate.gemini').translateObject(item, targetLocale)
      ));
    }

    const translatedObj = {};
    const skipFields = ['id', 'documentId', 'locale', 'path', 'slug', 'url', 'createdAt', 'updatedAt', 'publishedAt', 'type'];

    for (const [key, value] of Object.entries(obj)) {
      if (skipFields.includes(key)) {
        translatedObj[key] = value;
        continue;
      }

      if (typeof value === "string" && value.length > 0) {
        translatedObj[key] = await strapi.service('api::translate.gemini').translate(value, targetLocale);
      } else if (typeof value === "object" && value !== null) {
        translatedObj[key] = await strapi.service('api::translate.gemini').translateObject(value, targetLocale);
      } else {
        translatedObj[key] = value;
      }
    }
    return translatedObj;
  }
});
