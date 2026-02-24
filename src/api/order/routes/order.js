'use strict';

/**
 * order router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::order.order', {
  config: {
    find: {
      middlewares: ['api::order.order-populate'],
    },
    findOne: {
      middlewares: ['api::order.order-populate'],
    },
  }
});
