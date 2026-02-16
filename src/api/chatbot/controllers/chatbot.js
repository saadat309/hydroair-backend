module.exports = {
  async chat(ctx) {
    const { message, history, locale } = ctx.request.body;

    if (!message) {
      return ctx.badRequest("Message is required");
    }

    try {
      const response = await strapi.service('api::chatbot.chatbot').chat(message, history, locale || 'en');
      ctx.send({ response });
    } catch (error) {
      strapi.log.error("Chatbot error:", error);
      ctx.internalServerError(error.message);
    }
  },

  async testGemini(ctx) {
    try {
      const result = await strapi.service('api::chatbot.chatbot').testGemini();
      ctx.send(result);
    } catch (error) {
      strapi.log.error("Gemini test error:", error);
      ctx.internalServerError(error.message);
    }
  },
};
