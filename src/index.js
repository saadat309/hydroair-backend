'use strict';

module.exports = {
  register({ strapi }) {
  },

  async bootstrap({ strapi }) {
    // Ensure Russian and Uzbek locales exist
    try {
      const i18nService = strapi.plugin('i18n').service('locales');
      const locales = await i18nService.find();
      
      const requiredLocales = [
        { code: 'ru', name: 'Russian' },
        { code: 'uz', name: 'Uzbek' }
      ];

      for (const locale of requiredLocales) {
        if (!locales.find(l => l.code === locale.code)) {
          await i18nService.create({
            code: locale.code,
            name: locale.name,
            isDefault: false,
          });
          strapi.log.info(`Created ${locale.name} locale`);
        }
      }
    } catch (error) {
      strapi.log.error('Failed to ensure required locales:', error);
    }
  },
};
