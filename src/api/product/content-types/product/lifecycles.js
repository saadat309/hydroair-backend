const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const { documentId } = event.params; // documentId is present when creating a new locale version
    
    // 1. If we have a documentId, it's a new locale for an existing document.
    // We SHOULD inherit the SKU from the base document if not provided.
    // If provided (Strapi 5 often sends all non-localized fields), we DON'T want to null it.
    if (documentId) {
      strapi.log.debug(`Creating new locale for document ${documentId}. SKU logic skipped to allow inheritance/sync.`);
      return; 
    }

    // 2. Handle SKU uniqueness during creation or cloning (New Document)
    if (data.SKU) {
      try {
        const existing = await strapi.documents('api::product.product').findFirst({
          filters: { SKU: { $eq: data.SKU } },
          locale: SOURCE_LOCALE
        });
        
        // If SKU exists in a DIFFERENT document, it's a clone. Regenerate.
        if (existing) {
          strapi.log.debug(`Duplicate SKU ${data.SKU} detected in another document. Regenerating for clone...`);
          data.SKU = null;
        }
      } catch (error) {
        strapi.log.error('Error checking SKU uniqueness:', error);
      }
    }

    // 3. Generate new SKU if missing (Base English entry)
    if (!data.SKU) {
      try {
        const products = await strapi.documents('api::product.product').findMany({
          fields: ['SKU'],
          sort: { SKU: 'desc' },
          limit: 1,
          locale: SOURCE_LOCALE
        });

        let nextSkuNumber = 1;
        if (products && products.length > 0) {
          const latestSku = products[0].SKU;
          const match = latestSku ? latestSku.match(/HAT-(\d{5})/) : null;
          if (match && match[1]) {
            nextSkuNumber = parseInt(match[1], 10) + 1;
          }
        }

        data.SKU = `HAT-${String(nextSkuNumber).padStart(5, '0')}`;
        strapi.log.debug(`Generated new SKU: ${data.SKU}`);
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
