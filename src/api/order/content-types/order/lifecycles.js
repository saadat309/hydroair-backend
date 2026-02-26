const { orderAdminNotification, orderUserStatusUpdate } = require('../../../../lib/email-templates');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const adminEmail = process.env.ADMIN_EMAIL;

    try {
      // 1. Notify Admin immediately on new order
      if (adminEmail) {
        const template = orderAdminNotification(result);
        await strapi.plugin('email').service('email').send({
          to: adminEmail,
          subject: template.subject,
          html: template.html,
        });
        strapi.log.info(`[Email] Admin notified for new order ${result.order_id}`);
      }
    } catch (error) {
      strapi.log.error(`[Email] Failed to notify admin for order ${result.order_id}:`, error);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const { data } = params;

    // Check if order_status was part of the update
    if (!data.order_status) return;

    const targetStatuses = ['confirmed', 'shipped', 'delivered', 'returned', 'cancelled'];
    
    if (targetStatuses.includes(result.order_status)) {
      try {
        const template = orderUserStatusUpdate(result, result.order_status);
        await strapi.plugin('email').service('email').send({
          to: result.email,
          subject: template.subject,
          html: template.html,
        });
        strapi.log.info(`[Email] User notified for order ${result.order_id} status: ${result.order_status}`);
      } catch (error) {
        strapi.log.error(`[Email] Failed to notify user for order ${result.order_id}:`, error);
      }
    }
  }
};
