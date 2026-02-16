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
  ],
};
