'use strict';


module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    strapi.log.info('In global-populate middleware.');
    ctx.query.populate = {
      featured_products: {
        fields: ['name', 'slug'],
      }
    };
    await next();
  };
};
