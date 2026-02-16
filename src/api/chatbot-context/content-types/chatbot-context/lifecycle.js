const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

// Fields that should be translated (blocks fields)
const TRANSLATABLE_FIELDS = ['systemPrompt', 'orderingGuide', 'customNotes'];

// Fields that should be synced (copied as-is)
const SYNC_FIELDS = ['faqs', 'sitePages'];

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;
    const { locale } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::chatbot-context.chatbot-context').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (!existing) {
          const translatedData = await this.translateChatbotData(params.data, targetLocale);
          const syncedData = this.syncNonTranslatableFields(params.data);
          
          await strapi.documents('api::chatbot-context.chatbot-context').create({
            data: {
              ...translatedData,
              ...syncedData,
              locale: targetLocale,
              publishedAt: null
            },
            status: 'draft'
          });
          
          strapi.log.info(`Created and translated ${targetLocale} draft for chatbot-context ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing chatbot-context locales afterCreate:', error);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const { locale } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::chatbot-context.chatbot-context').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (existing) {
          const translatedData = await this.translateChatbotData(params.data, targetLocale);
          const syncedData = this.syncNonTranslatableFields(params.data);
          
          await strapi.documents('api::chatbot-context.chatbot-context').update({
            documentId: existing.documentId,
            data: {
              ...translatedData,
              ...syncedData,
              locale: targetLocale,
              publishedAt: existing.publishedAt
            }
          });
          
          strapi.log.info(`Updated and translated ${targetLocale} locale for chatbot-context ${documentId}`);
        } else {
          const translatedData = await this.translateChatbotData(params.data, targetLocale);
          const syncedData = this.syncNonTranslatableFields(params.data);
          
          await strapi.documents('api::chatbot-context.chatbot-context').create({
            data: {
              ...translatedData,
              ...syncedData,
              locale: targetLocale,
              publishedAt: null
            },
            status: 'draft'
          });
          
          strapi.log.info(`Created and translated ${targetLocale} draft for chatbot-context ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing chatbot-context locales afterUpdate:', error);
    }
  },

  async afterPublish(event) {
    const { result } = event;
    const { locale } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::chatbot-context.chatbot-context').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (existing) {
          const translatedData = await this.translateChatbotData(result, targetLocale);
          const syncedData = this.syncNonTranslatableFields(result);
          
          await strapi.documents('api::chatbot-context.chatbot-context').update({
            documentId: existing.documentId,
            data: {
              ...translatedData,
              ...syncedData,
              locale: targetLocale,
              publishedAt: existing.publishedAt
            }
          });
          
          strapi.log.info(`Re-translated ${targetLocale} locale for published chatbot-context ${documentId}`);
        } else {
          const translatedData = await this.translateChatbotData(result, targetLocale);
          const syncedData = this.syncNonTranslatableFields(result);
          
          await strapi.documents('api::chatbot-context.chatbot-context').create({
            data: {
              ...translatedData,
              ...syncedData,
              locale: targetLocale,
              publishedAt: null
            },
            status: 'draft'
          });
          
          strapi.log.info(`Created and translated ${targetLocale} draft for published chatbot-context ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing chatbot-context locales afterPublish:', error);
    }
  },

  async translateChatbotData(data, targetLocale) {
    const translatedData = {};
    
    for (const field of TRANSLATABLE_FIELDS) {
      if (data[field] !== undefined) {
        if (Array.isArray(data[field])) {
          // Handle blocks field
          translatedData[field] = await strapi.service('api::translate.gemini').translateBlocks(data[field], targetLocale);
        } else if (typeof data[field] === 'string') {
          translatedData[field] = await strapi.service('api::translate.gemini').translate(data[field], targetLocale);
        } else {
          translatedData[field] = data[field];
        }
      }
    }
    
    return translatedData;
  },

  syncNonTranslatableFields(data) {
    const syncedData = {};
    
    for (const field of SYNC_FIELDS) {
      if (data[field] !== undefined) {
        syncedData[field] = data[field];
      }
    }
    
    return syncedData;
  }
};
