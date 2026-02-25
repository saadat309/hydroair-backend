'use strict';

/**
 * tag controller
 */

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

module.exports = createCoreController('api::tag.tag', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);

    if (!data) {
      return { data, meta };
    }

    const enhancedData = data.map((tag) => ({
      ...tag,
      seo: tag.seo ? {
        ...tag.seo,
        og_image: transformImage(tag.seo.og_image, tag.name),
      } : undefined,
      products: tag.products?.map(p => ({
        ...p,
        images: transformImages(p.images, p.name)
      }))
    }));

    return { data: enhancedData, meta };
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
      seo: data.seo ? {
        ...data.seo,
        og_image: transformImage(data.seo.og_image, data.name),
      } : undefined,
      products: data.products?.map(p => ({
        ...p,
        images: transformImages(p.images, p.name)
      }))
    };

    return { data: enhancedData, meta };
  },
}));
