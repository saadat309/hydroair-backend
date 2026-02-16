const crypto = require('crypto');

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    strapi.log.info('Lifecycle beforeCreate triggered for support-ticket');

    // Generate unique ticketId if not already present
    if (!data.ticketId) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      data.ticketId = `TKT-${date}-${random}`;
      strapi.log.info(`Generated ticketId: ${data.ticketId}`);
    }

    // Ensure ticketStatus is set to 'open' if not provided
    if (!data.ticketStatus) {
      data.ticketStatus = 'open';
      strapi.log.info('Set default ticketStatus to open');
    }
  },
};
