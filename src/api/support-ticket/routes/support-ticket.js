module.exports = {
  routes: [
    // Core CRUD routes
    {
      method: 'GET',
      path: '/support-tickets',
      handler: 'support-ticket.find',
      config: {
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/support-tickets/:id',
      handler: 'support-ticket.findOne',
      config: {
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/support-tickets',
      handler: 'support-ticket.create',
      config: {
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/support-tickets/:id',
      handler: 'support-ticket.update',
      config: {
        auth: false,
      }
    },
    {
      method: 'DELETE',
      path: '/support-tickets/:id',
      handler: 'support-ticket.delete',
      config: {
        auth: false,
      }
    },
    // Custom routes
    {
      method: 'GET',
      path: '/support-tickets/by-ticket-id/:ticketId',
      handler: 'support-ticket.getByTicketId',
      config: {
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/support-tickets/by-ticket-id/:ticketId/reply',
      handler: 'support-ticket.addReply',
      config: {
        auth: false,
      }
    }
  ]
};
