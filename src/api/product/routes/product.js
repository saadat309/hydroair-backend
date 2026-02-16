const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product.product', {
  config: {
    find: {
      auth: false,
      middlewares: ['api::product.product-populate'],
    },
    findOne: {
      auth: false,
      middlewares: ['api::product.product-populate'],
    },
  }
});
