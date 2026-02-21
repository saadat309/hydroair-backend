module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply if no custom populate is specified
    if (!ctx.query.populate) {
      ctx.query.populate = {
        category: {
          fields: ['name', 'slug']
        },
        images: {
          fields: ['url', 'alternativeText', 'formats']
        },
        addFeatures: true,
        seo: true,
        tags: {
          fields: ['name', 'slug']
        }
      };
    }

    // Limit fields returned by default
    if (!ctx.query.fields) {
      ctx.query.fields = [
        'name',
        'slug',
        'SKU',
        'shortDescription',
        'description',
        'price',
        'old_price',
        'inStock',
        'international_currency'
      ];
    }

    await next();
  };
};
