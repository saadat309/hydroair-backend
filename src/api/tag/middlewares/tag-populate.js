module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply if no custom populate is specified
    if (!ctx.query.populate) {
      ctx.query.populate = {
        seo: {
          populate: {
            og_image: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
        products: {
          fields: ["name", "slug", "price", "old_price", "SKU", "inStock"],
          populate: {
            images: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
      };
    } else if (ctx.query.populate === '*') {
      ctx.query.populate = {
        seo: {
          populate: {
            og_image: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
        products: {
          fields: ["name", "slug", "price", "old_price", "SKU", "inStock"],
          populate: {
            images: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
      };
    }

    // Limit fields returned by default
    if (!ctx.query.fields) {
      ctx.query.fields = [
        'name',
        'slug',
        'short_description',
        'display_as_Badge'
      ];
    }

    await next();
  };
};
