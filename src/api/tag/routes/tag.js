'use strict';

/**
 * tag router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::tag.tag', {
  config: {
    find: {
      auth: false,
      middlewares: ['api::tag.tag-populate'],
    },
    findOne: {
      auth: false,
      middlewares: ['api::tag.tag-populate'],
    },
  }
});
