module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Always ensure images are populated with the right fields
    if (!ctx.query.populate) {
      ctx.query.populate = {
        category: {
          fields: ["name", "slug"],
        },
        tags: {
          fields: ["name", "slug", "display_as_Badge"],
        },
        images: {
          fields: ["url", "alternativeText", "formats"],
        },
        related_products: {
          fields: ["name", "slug", "price"],
          populate: {
            images: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
        reviews: {
          fields: [
            "name",
            "slug",
            "rating",
            "review",
            "is_approved",
            "createdAt",
          ],
        },
        FAQs: {
          fields: ["Question", "Answer"],
        },
        addFeatures: {
          fields: ["Feature"],
        },
        seo: {
          populate: {
            og_image: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
      };
    } else if (ctx.query.populate === '*') {
      // If populate is '*', add our specific fields for images and SEO
      ctx.query.populate = {
        category: {
          fields: ["name", "slug"],
        },
        tags: {
          fields: ["name", "slug", "display_as_Badge"],
        },
        images: {
          fields: ["url", "alternativeText", "formats"],
        },
        related_products: {
          fields: ["name", "slug", "price"],
          populate: {
            images: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
        reviews: {
          fields: [
            "name",
            "slug",
            "rating",
            "review",
            "is_approved",
            "createdAt",
          ],
        },
        FAQs: {
          fields: ["Question", "Answer"],
        },
        addFeatures: {
          fields: ["Feature"],
        },
        seo: {
          populate: {
            og_image: {
              fields: ["url", "alternativeText", "formats"],
            },
          },
        },
      };
    } else if (Array.isArray(ctx.query.populate)) {
      const populateObj = {};
      ctx.query.populate.forEach(val => {
        populateObj[val] = true;
      });
      ctx.query.populate = {
        ...populateObj,
        images: {
          fields: ["url", "alternativeText", "formats"],
        },
      };
    } else if (typeof ctx.query.populate === 'object') {
      // Merge: ensure images are populated with our fields
      ctx.query.populate = {
        ...ctx.query.populate,
        images: {
          fields: ["url", "alternativeText", "formats"],
        },
      };
    }

    await next();
  };
};
