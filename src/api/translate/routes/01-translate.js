'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/translate/manual-translate',
      handler: 'api::translate.translate-controller.translate',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/translate/sync-from-source',
      handler: 'api::translate.translate-controller.sync',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/translate/generate-seo',
      handler: 'api::translate.translate-controller.generateSeo',
      config: {
        auth: false,
      },
    },
  ],
};
