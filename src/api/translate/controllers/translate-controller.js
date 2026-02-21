'use strict';

module.exports = {
  async translate(ctx) {
    strapi.log.debug('Translate Request Body:', JSON.stringify(ctx.request.body));
    const { uid, documentId, targetLocale, sourceLocale = 'en' } = ctx.request.body;

    if (!uid || !documentId || !targetLocale) {
      strapi.log.warn('Missing parameters:', { uid, documentId, targetLocale });
      return ctx.badRequest('Missing required parameters', { uid, documentId, targetLocale });
    }

    try {
      strapi.log.info(`[Translate] Starting translation for ${uid} (docId: ${documentId}) to ${targetLocale}`);
      // 1. Get the source document (e.g. English) with relations populated
      const sourceEntry = await strapi.documents(uid).findFirst({
        filters: { documentId: { $eq: documentId }, locale: { $eq: sourceLocale } },
        populate: '*', // Populate components and relations
      });

      if (!sourceEntry) {
        strapi.log.warn(`[Translate] Source document not found: ${uid} ${documentId} ${sourceLocale}`);
        return ctx.notFound(`Source document not found for locale ${sourceLocale}`);
      }

      // 2. Identify fields to translate
      const fieldsToTranslate = {};
      const syncedFields = {};
      
      if (uid === 'api::product.product') {
        fieldsToTranslate.name = sourceEntry.name;
        fieldsToTranslate.description = sourceEntry.description;
        fieldsToTranslate.shortDescription = sourceEntry.shortDescription;
        fieldsToTranslate.addFeatures = sourceEntry.addFeatures; // Repeating component
        fieldsToTranslate.FAQs = sourceEntry.FAQs; // Repeating component
        
        // Sync non-translatable fields or fields that should stay same
        ['slug', 'SKU', 'price', 'old_price', 'inStock', 'international_currency'].forEach(f => { 
          if(sourceEntry[f] !== undefined) syncedFields[f] = sourceEntry[f];
        });
        
        // Sync Media: Images
        if (sourceEntry.images) {
          syncedFields.images = sourceEntry.images.map(img => img.id);
        }

        // Sync Relations
        if (sourceEntry.category) {
          syncedFields.category = sourceEntry.category.documentId;
        }
        
        if (sourceEntry.tags) {
          syncedFields.tags = sourceEntry.tags.map(t => t.documentId);
        }

        if (sourceEntry.related_products) {
          syncedFields.related_products = sourceEntry.related_products.map(p => p.documentId);
        }

      } else if (uid === 'api::category.category') {
        fieldsToTranslate.name = sourceEntry.name;
        fieldsToTranslate.seo = sourceEntry.seo;
        
        ['slug'].forEach(f => { if(sourceEntry[f] !== undefined) syncedFields[f] = sourceEntry[f] });
        
      } else if (uid === 'api::tag.tag') {
        fieldsToTranslate.name = sourceEntry.name;
        
        ['slug'].forEach(f => { if(sourceEntry[f] !== undefined) syncedFields[f] = sourceEntry[f] });
        
      } else {
        // Fallback: try to translate common fields
        ['name', 'title', 'description', 'content'].forEach(field => {
          if (sourceEntry[field]) fieldsToTranslate[field] = sourceEntry[field];
        });
      }

      strapi.log.debug(`[Translate] Fields to translate: ${Object.keys(fieldsToTranslate).join(', ')}`);

      // 3. Translate the fields
      const translateService = strapi.service('api::translate.gemini');
      const translatedData = await translateService.translateObject(fieldsToTranslate, targetLocale);

      // Helper to remove IDs from nested objects (components) to avoid conflicts in new locales
      const removeIds = (obj) => {
        if (Array.isArray(obj)) return obj.map(removeIds);
        if (obj && typeof obj === 'object') {
          const { id, ...rest } = obj;
          const newObj = {};
          for (const key in rest) {
            newObj[key] = removeIds(rest[key]);
          }
          return newObj;
        }
        return obj;
      };

      const cleanTranslatedData = removeIds(translatedData);

      strapi.log.info(`[Translate] Successfully translated fields for ${uid}`);

      // 4. Update or create the target locale entry
      strapi.log.info(`[Translate] Updating/Creating locale ${targetLocale} for document ${documentId}`);
      
      const result = await strapi.documents(uid).update({
        documentId: documentId,
        locale: targetLocale,
        data: {
          ...syncedFields,
          ...cleanTranslatedData,
        },
        status: 'draft',
      });

      return { data: result };
    } catch (error) {
      strapi.log.error('Translation error detailed:', error);
      return ctx.internalServerError(`Failed to translate content: ${error.message}`);
    }
  },
};
