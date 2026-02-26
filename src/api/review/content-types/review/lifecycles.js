const { reviewAdminNotification } = require('../../../../lib/email-templates');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const adminEmail = process.env.ADMIN_EMAIL;

    try {
      // Fetch the product to get its name
      const reviewWithProduct = await strapi.documents('api::review.review').findOne({
        documentId: result.documentId,
        populate: ['product']
      });

      const productName = reviewWithProduct?.product?.name || 'Unknown Product';

      if (adminEmail) {
        const template = reviewAdminNotification(result, productName);
        await strapi.plugin('email').service('email').send({
          to: adminEmail,
          subject: template.subject,
          html: template.html,
        });
        strapi.log.info(`[Email] Admin notified for new review on ${productName}`);
      }
    } catch (error) {
      strapi.log.error(`[Email] Failed to notify admin for new review:`, error);
    }
  }
};
