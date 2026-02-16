const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = ({ strapi }) => ({
  blocksToText(blocks) {
    if (!blocks) return "";
    if (typeof blocks === 'string') return blocks;
    if (!Array.isArray(blocks)) return "";
    
    return blocks
      .map(block => {
        if (block.type === 'paragraph' || block.type === 'heading') {
          return block.children?.map(child => child.text).join("");
        }
        return "";
      })
      .join("\n");
  },

  async testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured on server.");
    }

    try {
      console.log("[Gemini Test] Initializing Gemini API...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

      const prompt = "Say 'Hello from Gemma 3!' and briefly explain what you can do.";
      console.log("[Gemini Test] Sending prompt:", prompt);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("[Gemini Test] Response received:");
      console.log("=".repeat(50));
      console.log(text);
      console.log("=".repeat(50));

      return {
        success: true,
        response: text,
        model: "gemma-3-12b-it"
      };
    } catch (error) {
      console.error("[Gemini Test] Error:", error);
      throw error;
    }
  },

  async chat(message, history = [], locale = 'en') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured on server.");
    }

    // 1. Fetch Chatbot Context (Always in English/default locale)
    const context = await strapi.documents('api::chatbot-context.chatbot-context').findFirst({
      locale: 'en'
    });

    // 2. Fetch Products and Categories (Simplified for context)
    const products = await strapi.documents('api::product.product').findMany({
      locale: locale,
      fields: ['name', 'price', 'shortDescription', 'slug', 'inStock'],
      populate: { category: { fields: ['name'] } }
    });

    const categories = await strapi.documents('api::category.category').findMany({
      locale: locale,
      fields: ['name', 'slug']
    });

    // 3. Detect Ticket ID in message
    let ticketContext = "";
    const ticketMatch = message.match(/TKT-\d{8}-[A-F0-9]{4}/i);
    if (ticketMatch) {
      const ticketId = ticketMatch[0].toUpperCase();
      const ticket = await strapi.documents('api::support-ticket.support-ticket').findFirst({
        filters: { ticketId: { $eq: ticketId } },
        populate: ['replies']
      });
      
      if (ticket) {
        ticketContext = `
          TICKET INFO FOUND:
          ID: ${ticket.ticketId}
          Status: ${ticket.ticketStatus}
          Subject: ${ticket.subject}
          Created At: ${ticket.createdAt}
          Last Reply: ${ticket.replies?.length > 0 ? ticket.replies[ticket.replies.length - 1].message : 'No replies yet'}
          User can view full details here: /contact?ticket=${ticket.ticketId}
        `;
      } else {
        ticketContext = `TICKET ${ticketId} NOT FOUND. Ask user to double check the ID.`;
      }
    }

    // 4. Build System Prompt
    const brandName = context?.brandName || "HydroAir Technologies";
    const contactEmail = context?.contactEmail || "support@hydroair.tech";
    const contactPhone = context?.contactPhone || "+998 90 123 45 67";
    
    // Format contact info as clickable markdown
    const emailLink = `[${contactEmail}](mailto:${contactEmail})`;
    const phoneLink = `[${contactPhone}](tel:${contactPhone.replace(/\D/g, '')})`;
    const productsPageLink = `/products`;
    const contactPageLink = `/contact`;
    
    const systemPromptText = this.blocksToText(context?.systemPrompt) || "You are a helpful customer support assistant for a water filtration store.";
    const orderingGuideText = this.blocksToText(context?.orderingGuide) || "Contact us to place an order.";
    const customNotesText = this.blocksToText(context?.customNotes) || "";

    const langMap = {
      'en': 'English',
      'ru': 'Russian',
      'uz': 'Uzbek'
    };
    const respondLang = langMap[locale] || 'English';

    const systemPrompt = `
      ${systemPromptText}
      
      ${ticketContext}

      Our Products:
      ${products.map(p => `- **${p.name}** ($${p.price}): ${p.shortDescription}`).join('\n')}
      
      Our Categories:
      ${categories.map(c => `- ${c.name}`).join('\n')}
      
      FAQs:
      ${JSON.stringify((context?.faqs || []).map(f => ({ q: f.question, a: f.answer })))}
      
      Ordering Guide:
      ${orderingGuideText}
      
      Admin Notes:
      ${customNotesText}
      
      Website Pages:
      ${JSON.stringify(context?.sitePages || [])}
      
      STRICT INSTRUCTIONS - FOLLOW THESE EXACTLY:
      - Respond in ${respondLang}.
      - You are ONLY allowed to discuss topics related to ${brandName}, water filtration systems, our products, services, orders, support tickets, and general customer service.
      - If the user asks about ANYTHING unrelated (celebrities, sports, politics, general knowledge questions, personal opinions, etc.), you MUST refuse to answer.
      - For unrelated questions, respond ONLY with: "Sorry, I don't have information on that. Do you have any questions related to ${brandName}? You can also contact us at ${emailLink} or ${phoneLink}."
      
      CONVERSATION STYLE:
      - Be warm, friendly, and professional - like a helpful human assistant
      - Acknowledge the user's question before providing the answer
      - When explaining how to do something (like ordering or creating tickets), provide clear step-by-step guidance
      - Always offer to help further at the end of your response
      - Keep responses concise but helpful (3-5 sentences for guidance, use lists when appropriate)
      - Use markdown for formatting: links [text](url), bold **text**, bullet lists
      
      RESPONSE EXAMPLES:
      
      For "How to Order":
      "I'd be happy to help you place an order! You have two convenient options:
      
      **Option 1 - Online:** Browse our [Products page](${productsPageLink}), select what you need, and click 'Add to Cart' to checkout securely.
      
      **Option 2 - By Phone:** Call us directly at ${phoneLink} and our team will assist you personally.
      
      Which option works better for you?"
      
      For "Create Support Ticket":
      "I'll help you create a support ticket right away! Here's what to do:
      
      1. Visit our [Contact page](${contactPageLink})
      2. Fill out the form with your details and issue description
      3. Submit and you'll receive a ticket ID for tracking
      
      Alternatively, you can email us at ${emailLink} or call ${phoneLink} and we'll create one for you. What seems to be the issue you're experiencing?"
      
      For Product Questions:
      "Great question! Let me tell you about our water filtration solutions:
      
      ${products.slice(0, 3).map(p => `- **${p.name}** - ${p.shortDescription}`).join('\n')}
      
      You can view all details and pricing on our [Products page](${productsPageLink}). Which one interests you most, or do you have specific requirements I can help with?"
    `;

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

    // Filter history to ensure it starts with a user message (Gemini API requirement)
    // Remove any leading model messages (like the initial greeting)
    let filteredHistory = [...history];
    while (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
      filteredHistory.shift();
    }

    const chat = model.startChat({
      history: filteredHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // Prepend system prompt context for the first message or as a virtual history
    const result = await chat.sendMessage([
      { text: `SYSTEM CONTEXT: ${systemPrompt}` },
      { text: message }
    ]);
    
    const response = await result.response;
    return response.text();
  },
});