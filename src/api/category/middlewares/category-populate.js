module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply if no custom populate is specified
    if (!ctx.query.populate) {
      ctx.query.populate = {
        image: {
          fields: ['url', 'alternativeText', 'formats']
        }
      };
    }

    // Limit fields returned by default
    if (!ctx.query.fields) {
      ctx.query.fields = [
        'name',
        'slug',
        'description'
      ];
    }

    await next();
  };
};
