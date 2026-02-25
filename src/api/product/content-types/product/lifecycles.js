const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const documentId = event.params.documentId || data.documentId;
    
    strapi.log.debug(`beforeCreate: SKU="${data.SKU}", documentId="${documentId}"`);

    // 1. Handle existing SKU (Inherited from other locales or manual entry)
    if (data.SKU && data.SKU !== '') {
      try {
        // ONLY regenerate if this SKU belongs to a DIFFERENT documentId
        // This prevents incrementing when creating new locales for the same product
        const duplicate = await strapi.documents('api::product.product').findFirst({
          filters: { 
            SKU: data.SKU,
            ...(documentId ? { documentId: { $ne: documentId } } : {})
          },
          status: 'draft'
        });
        
        if (!duplicate) {
          strapi.log.debug(`SKU ${data.SKU} is valid for this document. Keeping it.`);
          return; // Stop here, SKU is fine
        }

        strapi.log.debug(`Duplicate SKU ${data.SKU} detected in ANOTHER document. Regenerating...`);
        data.SKU = null; 
      } catch (error) {
        strapi.log.error('Error checking SKU uniqueness:', error);
      }
    }

    // 2. Generate new SKU if missing or cleared above (New Product or Clone)
    if (!data.SKU || data.SKU === '') {
      try {
        strapi.log.debug('Generating new SKU...');
        const products = await strapi.documents('api::product.product').findMany({
          fields: ['SKU'],
          sort: 'SKU:desc',
          limit: 1,
          locale: SOURCE_LOCALE,
          status: 'draft'
        });

        let nextSkuNumber = 1;
        if (products && products.length > 0) {
          const latestSku = products[0].SKU;
          strapi.log.debug(`Latest SKU found in DB: ${latestSku}`);
          const match = latestSku ? latestSku.match(/HAT-(\d{5})/) : null;
          if (match && match[1]) {
            nextSkuNumber = parseInt(match[1], 10) + 1;
          }
        } else {
          strapi.log.debug('No existing products found for SKU generation base.');
        }

        data.SKU = `HAT-${String(nextSkuNumber).padStart(5, '0')}`;
        strapi.log.info(`Auto-generated SKU: ${data.SKU}`);
      } catch (error) {
        strapi.log.error('Error generating SKU in beforeCreate:', error);
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;
    const { locale, documentId, name } = result;

    // Only auto-create drafts when the source locale (en) is created
    if (locale !== SOURCE_LOCALE) return;

    try {
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::product.product').findFirst({
          documentId: documentId,
          locale: targetLocale,
          status: 'draft'
        });

        if (!existing) {
          await strapi.documents('api::product.product').create({
            documentId: documentId,
            data: {
              name: `${name} (${targetLocale})`,
              locale: targetLocale,
              // Explicitly pass non-localized fields to ensure immediate sync
              SKU: result.SKU,
              slug: result.slug,
              price: result.price,
              old_price: result.old_price,
              inStock: result.inStock,
              international_currency: result.international_currency,
              category: result.category?.documentId,
              images: result.images?.map(img => img.id),
              tags: result.tags?.map(t => t.documentId),
              related_products: result.related_products?.map(p => p.documentId)
            },
            status: 'draft'
          });
          
          strapi.log.info(`Auto-created ${targetLocale} draft for product ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error(`Failed to auto-create locales for ${documentId}:`, error);
    }
  }
};
