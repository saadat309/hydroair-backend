const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product.product', {
  config: {
    find: {
      middlewares: ['api::product.product-populate'],
    },
    findOne: {
      middlewares: ['api::product.product-populate'],
    },
  }
});
