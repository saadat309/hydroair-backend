const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreController('api::support-ticket.support-ticket', ({ strapi }) => ({
  // 0. Override Create to include initial token for seamless UX
  async create(ctx) {
    const { data } = ctx.request.body;
    
    // Generate a unique Ticket ID (e.g., TKT-123456)
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Generate initial access token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 72); // 3 days

    // Add generated fields to data
    ctx.request.body.data = {
      ...data,
      ticketId,
      access_token: token,
      token_expiry: expiry
    };

    // Call the core create action
    const response = await super.create(ctx);

    // Include the token and ticketId in the final response for the frontend to save
    if (response && response.data) {
      response.data.access_token = token;
      // ticketId is already in response.data.attributes/attributes depending on Strapi version, 
      // but Strapi 5 response structure is flattened.
    }

    return response;
  },

  // 1. Request access (Send Magic Link)
  async requestAccess(ctx) {
    const { ticketId, email } = ctx.request.body;

    if (!ticketId || !email) {
      return ctx.badRequest('Ticket ID and Email are required');
    }

    try {
      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { 
          ticketId: { $eq: ticketId.trim().toUpperCase() },
          email: { $eq: email.trim().toLowerCase() }
        }
      });

      if (!ticket) {
        strapi.log.warn(`[Support] Access requested for non-existent ticket or mismatch: ${ticketId} / ${email}`);
        // For security, don't reveal if ticket exists or not
        return ctx.send({ message: 'If the details match, an access link has been sent to your email.' });
      }

      // Generate a secure 32-char token
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 72); // Token valid for 72 hours (3 days)

      await strapi.documents('api::support-ticket.support-ticket').update({
        documentId: ticket.documentId,
        data: {
          access_token: token,
          token_expiry: expiry
        }
      });

      // Send Email
      const frontendUrl = process.env.FRONTEND_URL;
      const magicLink = `${frontendUrl}/support/ticket/${ticket.ticketId}?token=${token}`;

      strapi.log.info(`[Support] Sending magic link for ticket ${ticket.ticketId} to ${email}`);

      await strapi.plugin('email').service('email').send({
        to: email,
        subject: `Access your Support Ticket #${ticket.ticketId}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">Support Ticket Access</h2>
            <p>You requested access to view your support conversation for ticket <strong>#${ticket.ticketId}</strong>.</p>
            <p>Click the button below to view the conversation. This link is valid for 72 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="display: inline-block; padding: 14px 28px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Conversation</a>
            </div>
            <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
              If the button above doesn't work, copy and paste this URL into your browser:<br>
              <span style="color: #007bff;">${magicLink}</span>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      return ctx.send({ message: 'If the details match, an access link has been sent to your email.' });
    } catch (error) {
      strapi.log.error('[Support] Request access error:', error);
      return ctx.internalServerError('Failed to process request');
    }
  },

  // 2. Verify Access & Get Data (Requires Token)
  async getByTicketId(ctx) {
    try {
      const { ticketId } = ctx.params;
      const { token } = ctx.query;
      
      if (!ticketId || !token) {
        return ctx.badRequest('Ticket ID and Token are required');
      }

      strapi.log.info(`[Support] Verifying ticket: ${ticketId}, token received: ${token}`);

      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { 
          ticketId: { $eq: ticketId.toUpperCase() },
          access_token: { $eq: token },
          token_expiry: { $gt: new Date().toISOString() }
        },
        populate: ['conversation']
      });

      strapi.log.info(`[Support] Ticket query result:`, ticket ? 'Found' : 'Not found');

      if (!ticket) {
        return ctx.forbidden('Invalid or expired access token');
      }

      return ctx.send({ data: ticket });
    } catch (error) {
      strapi.log.error('Get ticket error:', error);
      return ctx.internalServerError('Failed to fetch ticket');
    }
  },

  // 3. Add reply (Requires Token)
  async addReply(ctx) {
    try {
      const { ticketId } = ctx.params;
      const { message, author = 'user', token } = ctx.request.body;
      
      if (!ticketId || !token) {
        return ctx.badRequest('Ticket ID and Token are required');
      }

      // Find the ticket with valid token
      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { 
          ticketId: { $eq: ticketId.toUpperCase() },
          access_token: { $eq: token },
          token_expiry: { $gt: new Date().toISOString() }
        },
        populate: ['conversation']
      });

      if (!ticket) {
        return ctx.forbidden('Invalid or expired access token');
      }

      const newReply = {
        message: message.trim(),
        author: author === 'admin' ? 'admin' : 'user'
      };

      const updateData = {
        conversation: [...(ticket.conversation || []), newReply]
      };

      // Mark as unread for admin if user replies
      if (newReply.author === 'user') {
        updateData.read = false;
      }

      const updatedTicket = await strapi.documents('api::support-ticket.support-ticket').update({
        documentId: ticket.documentId,
        data: updateData,
        populate: ['conversation']
      });

      return ctx.send({ data: updatedTicket });
    } catch (error) {
      strapi.log.error('Add reply error:', error);
      return ctx.internalServerError('Failed to add reply');
    }
  }
}));
