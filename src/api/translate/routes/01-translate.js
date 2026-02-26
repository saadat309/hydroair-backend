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
    {
      method: 'POST',
      path: '/translate/generate-ai-content',
      handler: 'api::translate.translate-controller.generateAiContent',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/translate/dashboard-stats',
      handler: 'api::translate.translate-controller.getUnreadCounts',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/translate/mark-as-read',
      handler: 'api::translate.translate-controller.markAsRead',
      config: {
        auth: false,
      },
    },
  ],
};
