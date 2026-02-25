const SYNC_LOCALES = ['ru', 'uz'];
const SOURCE_LOCALE = 'en';

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const { locale, documentId, name } = result;

    if (locale !== SOURCE_LOCALE) return;

    try {
      // Refetch source entry with relations if any (Tag owns the products relation)
      const sourceEntry = await strapi.documents('api::tag.tag').findOne({
        documentId: documentId,
        locale: SOURCE_LOCALE,
        populate: ['products']
      });

      for (const targetLocale of SYNC_LOCALES) {
        const existing = await strapi.documents('api::tag.tag').findFirst({
          documentId: documentId,
          locale: targetLocale,
          status: 'draft'
        });

        if (!existing) {
          await strapi.documents('api::tag.tag').create({
            documentId: documentId,
            data: {
              name: `${name} (${targetLocale})`,
              locale: targetLocale,
            },
            status: 'draft'
          });
          
          strapi.log.info(`Auto-created ${targetLocale} draft for tag ${documentId}`);
        }
      }
    } catch (error) {
      strapi.log.error(`Failed to auto-create tag locales for ${documentId}:`, error);
    }
  }
};
