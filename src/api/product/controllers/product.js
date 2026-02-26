const { createCoreController } = require('@strapi/strapi').factories;

function transformImage(img, fallbackAlt = null) {
  if (!img) return null;

  const formats = img.formats || {};
  const safeFormats = {};

  for (const key of ['thumbnail', 'small', 'medium']) {
    if (formats[key]) {
      safeFormats[key] = formats[key].url || null;
    }
  }

  return {
    url: img.url || null,
    alt: img.alternativeText || fallbackAlt,
    formats: safeFormats,
  };
}

function transformImages(images, fallbackAlt = null) {
  if (!Array.isArray(images)) return [];
  return images.map(img => transformImage(img, fallbackAlt)).filter((img) => img !== null);
}

module.exports = createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    // We use the Document Service directly because the REST API validation layer 
    // incorrectly blocks filtering by relation fields like 'category' and 'tags' 
    // with an 'Invalid key' error in Strapi 5 for this specific configuration.
    
    const entries = await strapi.documents('api::product.product').findMany(ctx.query);
    
    // In Strapi 5 findMany returns the data directly. 
    // To get pagination meta, we'd normally use the core find, but it's bugged for filters.
    // For now, we manually enhance and return.
    
    const data = Array.isArray(entries) ? entries : [entries];

    const enhancedData = data.map((product) => ({
      ...product,
      images: transformImages(product.images, product.name),
      seo: product.seo ? {
        ...product.seo,
        og_image: transformImage(product.seo.og_image, product.name),
      } : undefined,
    }));

    // Re-fetch meta if needed, or provide a default
    const total = await strapi.documents('api::product.product').count(ctx.query);

    return { 
      data: enhancedData, 
      meta: {
        pagination: {
          total
        }
      } 
    };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);

    if (!response) {
      return ctx.notFound();
    }

    const { data, meta } = response;

    if (!data) {
      return { data, meta };
    }

    const enhancedData = {
      ...data,
      images: transformImages(data.images, data.name),
      seo: data.seo ? {
        ...data.seo,
        og_image: transformImage(data.seo.og_image, data.name),
      } : undefined,
    };

    return { data: enhancedData, meta };
  },
}));
