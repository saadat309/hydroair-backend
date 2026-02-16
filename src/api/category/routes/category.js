const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::category.category', {
  config: {
    find: {
      auth: false,
      middlewares: ['api::category.category-populate'],
    },
    findOne: {
      auth: false,
      middlewares: ['api::category.category-populate'],
    },
  }
});
