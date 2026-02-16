const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreController('api::support-ticket.support-ticket', ({ strapi }) => ({
  // Core actions (create, find, findOne, etc.) are handled by Strapi
  // We can still override them if needed, but for 'create' we'll let the lifecycle hook do its job

  // Custom endpoint to get ticket by ticketId (for public access)
  async getByTicketId(ctx) {
    try {
      const { ticketId } = ctx.params;
      
      if (!ticketId) {
        return ctx.badRequest('Ticket ID is required');
      }

      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { ticketId: { $eq: ticketId.toUpperCase() } },
        populate: ['conversation']
      });

      if (!ticket) {
        return ctx.notFound('Ticket not found');
      }

      return ctx.send({ data: ticket });
    } catch (error) {
      strapi.log.error('Get ticket by ID error:', error);
      return ctx.internalServerError('Failed to fetch ticket');
    }
  },

  // Custom endpoint to add reply to a ticket (public access)
  async addReply(ctx) {
    try {
      const { ticketId } = ctx.params;
      const { message, author = 'user' } = ctx.request.body;
      
      if (!ticketId) {
        return ctx.badRequest('Ticket ID is required');
      }

      if (!message || message.trim() === '') {
        return ctx.badRequest('Message is required');
      }

      // Find the ticket
      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { ticketId: { $eq: ticketId.toUpperCase() } },
        populate: ['conversation']
      });

      if (!ticket) {
        return ctx.notFound('Ticket not found');
      }

      // Add new reply (Strapi components automatically have createdAt)
      const newReply = {
        message: message.trim(),
        author: author === 'admin' ? 'admin' : 'user'
      };

      const existingReplies = ticket.conversation || [];
      
      // Update ticket with new reply
      const updatedTicket = await strapi.documents('api::support-ticket.support-ticket').update({
        documentId: ticket.documentId,
        data: {
          conversation: [...existingReplies, newReply]
        },
        populate: ['conversation']
      });

      return ctx.send({ 
        data: updatedTicket,
        message: 'Reply added successfully'
      });
    } catch (error) {
      strapi.log.error('Add reply error:', error);
      return ctx.internalServerError('Failed to add reply');
    }
  }
}));
