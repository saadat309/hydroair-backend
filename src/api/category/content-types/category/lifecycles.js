const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const { locale, documentId, name } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::category.category').findFirst({
          documentId: documentId,
          locale: targetLocale,
          status: 'draft'
        });

        if (!existing) {
          // 'name' is required and unique. 
          // Since it's localized, unique constraint applies per locale.
          await strapi.documents('api::category.category').create({
            documentId: documentId,
            data: {
              name: `${name} (${targetLocale})`,
              locale: targetLocale,
            },
            status: 'draft'
          });
          
          strapi.log.info(`Auto-created ${targetLocale} draft for category ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error(`Failed to auto-create category locales for ${documentId}:`, error);
    }
  }
};
