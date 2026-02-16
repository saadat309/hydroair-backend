const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

// Fields that should be synced (copied as-is)
const SYNC_FIELDS = ['slug', 'price', 'inStock', 'features', 'image', 'category'];

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;
    const { locale } = result;

    // Only sync when creating in source locale (en)
    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::product.product').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (!existing) {
          // Sync non-translatable fields only
          const syncedData = this.syncNonTranslatableFields(params.data);
          
          await strapi.documents('api::product.product').create({
            data: {
              ...syncedData,
              locale: targetLocale,
              publishedAt: null
            },
            status: 'draft'
          });
          
          strapi.log.info(`Created empty ${targetLocale} draft for product ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing product locales afterCreate:', error);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const { locale } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::product.product').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (existing) {
          const syncedData = this.syncNonTranslatableFields(params.data);
          
          await strapi.documents('api::product.product').update({
            documentId: existing.documentId,
            data: {
              ...syncedData,
              locale: targetLocale,
              publishedAt: existing.publishedAt
            }
          });
          
          strapi.log.info(`Synced non-translatable fields for ${targetLocale} product ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing product locales afterUpdate:', error);
    }
  },

  async afterPublish(event) {
    const { result } = event;
    const { locale } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      const documentId = result.documentId;
      
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::product.product').findFirst({
          filters: {
            documentId: { $eq: documentId },
            locale: { $eq: targetLocale }
          }
        });

        if (existing) {
          const syncedData = this.syncNonTranslatableFields(result);
          
          await strapi.documents('api::product.product').update({
            documentId: existing.documentId,
            data: {
              ...syncedData,
              locale: targetLocale,
              publishedAt: existing.publishedAt
            }
          });
        }
      }
    } catch (error) {
      strapi.log.error('Error syncing product locales afterPublish:', error);
    }
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
