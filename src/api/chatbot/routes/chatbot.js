module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chatbot',
      handler: 'chatbot.chat',
      config: {
        auth: false, // Public access
      },
    },
    {
      method: 'GET',
      path: '/chatbot/test-gemini',
      handler: 'chatbot.testGemini',
      config: {
        auth: false, // Public access
      },
    },
  ],
};
