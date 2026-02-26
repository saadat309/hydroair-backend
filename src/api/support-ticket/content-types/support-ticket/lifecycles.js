const { ticketAdminNotification, ticketUserConfirmation, ticketReplyNotification } = require('../../../../lib/email-templates');

module.exports = {
  async afterCreate(event) {
    // ... same as before
    const { result } = event;
    const adminEmail = process.env.ADMIN_EMAIL;

    try {
      // 1. Notify Admin
      if (adminEmail) {
        const adminTemplate = ticketAdminNotification(result);
        await strapi.plugin('email').service('email').send({
          to: adminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        });
      }

      // 2. Send Confirmation to User
      const userTemplate = ticketUserConfirmation(result);
      await strapi.plugin('email').service('email').send({
        to: result.email,
        subject: userTemplate.subject,
        html: userTemplate.html,
      });

      strapi.log.info(`[Email] Ticket notifications sent for #${result.ticketId}`);
    } catch (error) {
      strapi.log.error(`[Email] Failed to send ticket notifications for #${result.ticketId}:`, error);
    }
  },

  async beforeUpdate(event) {
    // We fetch the current state to compare later in afterUpdate
    const { params } = event;
    event.state = await strapi.documents('api::support-ticket.support-ticket').findOne({
      documentId: params.documentId,
      populate: ['conversation']
    });
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const previousConversation = state?.conversation || [];
    const currentConversation = result.conversation || [];

    // If a new reply was added
    if (currentConversation.length > previousConversation.length) {
      const newReply = currentConversation[currentConversation.length - 1];
      const adminEmail = process.env.ADMIN_EMAIL;

      try {
        // Only trigger if not already handled by custom controller logic 
        // (or just let lifecycle handle everything for consistency)
        
        // Notify User if Admin replied
        if (newReply.author === 'admin') {
          const userTemplate = ticketReplyNotification(result, newReply);
          await strapi.plugin('email').service('email').send({
            to: result.email,
            subject: userTemplate.subject,
            html: userTemplate.html,
          });
          strapi.log.info(`[Email] User notified of admin reply on #${result.ticketId}`);
        }
        
        // Notify Admin if User replied (e.g. via direct API without controller)
        else if (newReply.author === 'user' && adminEmail) {
          const adminTemplate = ticketReplyNotification(result, newReply);
          await strapi.plugin('email').service('email').send({
            to: adminEmail,
            subject: adminTemplate.subject,
            html: adminTemplate.html,
          });
          strapi.log.info(`[Email] Admin notified of user reply on #${result.ticketId}`);
        }
      } catch (error) {
        strapi.log.error(`[Email] Failed to send reply notification for #${result.ticketId}:`, error);
      }
    }
  }
};
