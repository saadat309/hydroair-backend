module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply if no custom populate is specified
    if (!ctx.query.populate) {
      ctx.query.populate = {
        category: {
          fields: ['name', 'slug']
        },
        image: {
          fields: ['url', 'alternativeText', 'formats']
        },
        addFeatures: true
      };
    }

    // Limit fields returned by default
    if (!ctx.query.fields) {
      ctx.query.fields = [
        'name',
        'slug',
        'shortDescription',
        'description',
        'price',
        'inStock'
      ];
    }

    await next();
  };
};
