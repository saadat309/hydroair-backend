module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (!ctx.query.populate) {
      ctx.query.populate = {
        cartItems: {
          populate: {
            product: true,
          },
        },
      };
    } else if (ctx.query.populate === '*') {
      ctx.query.populate = {
        cartItems: {
          populate: {
            product: true,
          },
        },
      };
    }

    await next();
  };
};
