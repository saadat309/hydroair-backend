/**
 * HydroAir Technologies - Email Templates
 * Professional, branded HTML templates for transactional emails.
 */

const brandColor = '#007bff';
const secondaryColor = '#6c757d';

const header = `
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
    <h1 style="color: ${brandColor}; margin: 0; font-family: sans-serif;">HydroAir Technologies</h1>
    <p style="color: ${secondaryColor}; font-size: 14px; margin: 5px 0;">Pure Air. Pure Water.</p>
  </div>
`;

const footer = `
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 30px; font-size: 12px; color: ${secondaryColor}; font-family: sans-serif;">
    <p>© ${new Date().getFullYear()} HydroAir Technologies. All rights reserved.</p>
    <p>${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/^https?:\/\//, '') : 'hydroairtechnologies.com'}</p>
  </div>
`;

module.exports = {
  // --- ORDER TEMPLATES ---

  orderAdminNotification: (order) => ({
    subject: `New Order Received - #${order.order_id}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        ${header}
        <h2>New Order Notification</h2>
        <p>A new order has been placed on the website.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <strong>Order ID:</strong> ${order.order_id}<br/>
          <strong>Customer:</strong> ${order.first_name} ${order.last_name}<br/>
          <strong>Email:</strong> ${order.email}<br/>
          <strong>Total:</strong> ${order.currency} ${order.total_price?.toLocaleString()}
        </div>
        <p><a href="${process.env.STRAPI_ADMIN_BACKEND_URL}/admin/content-manager/collection-types/api::order.order/${order.documentId}" style="color: ${brandColor};">View order in Dashboard</a></p>
        ${footer}
      </div>
    `
  }),

  orderUserStatusUpdate: (order, status) => {
    let title = 'Order Update';
    let message = '';

    switch (status) {
      case 'confirmed':
        title = 'Order Confirmed';
        message = 'Great news! Your order has been confirmed and is now being prepared.';
        break;
      case 'shipped':
        title = 'Order Shipped';
        message = 'Your order is on the way! It has been handed over to our shipping partner.';
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = 'Your order has been successfully delivered. We hope you enjoy your purchase!';
        break;
      case 'returned':
        title = 'Order Returned';
        message = 'We have received your returned order. We will process your request shortly.';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = 'Your order has been cancelled. If you have questions, please contact our support.';
        break;
    }

    return {
      subject: `${title} - #${order.order_id}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          ${header}
          <h2 style="color: ${brandColor};">${title}</h2>
          <p>Hello ${order.first_name},</p>
          <p>${message}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Order ID:</strong> #${order.order_id}<br/>
            <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${status}</span><br/>
            <strong>Total Amount:</strong> ${order.currency} ${order.total_price?.toLocaleString()}
          </div>
          <p>You can track your order status on our website using your Order ID.</p>
          ${footer}
        </div>
      `
    };
  },

  // --- SUPPORT TICKET TEMPLATES ---

  ticketAdminNotification: (ticket) => ({
    subject: `New Support Ticket - #${ticket.ticketId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        ${header}
        <h2>New Support Ticket</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <strong>Ticket ID:</strong> #${ticket.ticketId}<br/>
          <strong>Subject:</strong> ${ticket.subject}<br/>
          <strong>From:</strong> ${ticket.name} (${ticket.email})
        </div>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${ticket.message}</p>
        <p><a href="${process.env.STRAPI_ADMIN_BACKEND_URL}/admin/content-manager/collection-types/api::support-ticket.support-ticket/${ticket.documentId}" style="color: ${brandColor};">Reply in Dashboard</a></p>
        ${footer}
      </div>
    `
  }),

  ticketUserConfirmation: (ticket) => ({
    subject: `We received your ticket - #${ticket.ticketId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        ${header}
        <h2>Hello ${ticket.name},</h2>
        <p>Thank you for contacting HydroAir Technologies. We have received your support request and our team will get back to you shortly.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <strong>Ticket ID:</strong> #${ticket.ticketId}<br/>
          <strong>Subject:</strong> ${ticket.subject}
        </div>
        <p>You can view your ticket and the conversation using your Ticket ID on our contact page.</p>
        ${footer}
      </div>
    `
  }),

  // --- REVIEW TEMPLATES ---

  reviewAdminNotification: (review, productName) => ({
    subject: `New Product Review - ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        ${header}
        <h2>New Product Review</h2>
        <p>A new review has been submitted for <strong>${productName}</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <strong>Rating:</strong> ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} (${review.rating}/5)<br/>
          <strong>From:</strong> ${review.name} (${review.email})
        </div>
        <p><strong>Review:</strong></p>
        <p style="font-style: italic;">"${review.review}"</p>
        <p><a href="${process.env.STRAPI_ADMIN_BACKEND_URL}/admin/content-manager/collection-types/api::review.review/${review.documentId}" style="color: ${brandColor};">Approve Review in Dashboard</a></p>
        ${footer}
      </div>
    `
  }),

  // --- SUPPORT TICKET REPLIES ---

  ticketReplyNotification: (ticket, reply) => {
    const isFromAdmin = reply.author === 'admin';
    const recipientName = isFromAdmin ? ticket.name : 'Admin';
    const senderName = isFromAdmin ? 'HydroAir Support' : ticket.name;
    const frontendUrl = process.env.FRONTEND_URL;
    const link = isFromAdmin 
      ? `${frontendUrl}/support/ticket/${ticket.ticketId}?token=${ticket.access_token}`
      : `${process.env.STRAPI_ADMIN_BACKEND_URL}/admin/content-manager/collection-types/api::support-ticket.support-ticket/${ticket.documentId}`;

    return {
      subject: `New Reply on Ticket #${ticket.ticketId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          ${header}
          <h2>New Message from ${senderName}</h2>
          <p>Hello ${recipientName},</p>
          <p>You have received a new reply regarding support ticket <strong>#${ticket.ticketId}</strong>.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid ${brandColor};">
            <p style="white-space: pre-wrap; margin: 0; font-style: italic;">"${reply.message}"</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${link}" style="display: inline-block; padding: 10px 20px; background: ${brandColor}; color: white; text-decoration: none; border-radius: 5px;">View Full Conversation</a>
          </p>
          ${footer}
        </div>
      `
    };
  }
};
