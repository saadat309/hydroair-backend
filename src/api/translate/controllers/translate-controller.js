"use strict";

module.exports = {
  // Shared helper to check if a document exists in a specific locale
  async getValidRelationId(targetUid, docId, targetLoc) {
    if (!docId) return null;

    const contentType = strapi.contentType(targetUid);
    const isLocalized = contentType.pluginOptions?.i18n?.localized === true;

    if (!isLocalized) return docId;

    try {
      const exists = await strapi.documents(targetUid).findOne({
        documentId: docId,
        locale: targetLoc,
        status: "draft",
      });
      return exists ? docId : null;
    } catch (e) {
      return null;
    }
  },

  async translate(ctx) {
    const {
      uid,
      documentId,
      targetLocale,
      sourceLocale = "en",
    } = ctx.request.body;

    if (!uid || !documentId || !targetLocale) {
      return ctx.badRequest("Missing required parameters");
    }

    try {
      strapi.log.info(
        `[Translate] AI Translating ${uid} (docId: ${documentId}) to ${targetLocale}`,
      );

      const sourceEntry = await strapi.documents(uid).findFirst({
        filters: {
          documentId: { $eq: documentId },
          locale: { $eq: sourceLocale },
        },
        populate: "*",
      });

      if (!sourceEntry)
        return ctx.notFound(
          `Source document not found for locale ${sourceLocale}`,
        );

      const fieldsToTranslate = {};

      if (uid === "api::product.product") {
        fieldsToTranslate.name = sourceEntry.name;
        fieldsToTranslate.description = sourceEntry.description;
        fieldsToTranslate.shortDescription = sourceEntry.shortDescription;
        fieldsToTranslate.addFeatures = sourceEntry.addFeatures;
        fieldsToTranslate.FAQs = sourceEntry.FAQs;
      } else if (uid === "api::category.category" || uid === "api::tag.tag") {
        fieldsToTranslate.name = sourceEntry.name;
        fieldsToTranslate.short_description = sourceEntry.short_description;
      } else {
        ["name", "title", "description", "content"].forEach((f) => {
          if (sourceEntry[f]) fieldsToTranslate[f] = sourceEntry[f];
        });
      }

      const translateService = strapi.service("api::translate.gemini");
      const translatedData = await translateService.translateObject(
        fieldsToTranslate,
        targetLocale,
      );

      // Helper to remove IDs from nested objects
      const removeIds = (obj) => {
        if (Array.isArray(obj)) return obj.map(removeIds);
        if (obj && typeof obj === "object") {
          const { id, ...rest } = obj;
          const newObj = {};
          for (const key in rest) {
            newObj[key] = removeIds(rest[key]);
          }
          return newObj;
        }
        return obj;
      };

      const result = await strapi.documents(uid).update({
        documentId,
        locale: targetLocale,
        data: removeIds(translatedData),
        status: "draft",
      });

      return { data: result };
    } catch (error) {
      strapi.log.error("Translation error:", error);
      return ctx.internalServerError(`Failed to translate: ${error.message}`);
    }
  },

  async sync(ctx) {
    const {
      uid,
      documentId,
      targetLocale,
      sourceLocale = "en",
    } = ctx.request.body;

    if (!uid || !documentId || !targetLocale) {
      return ctx.badRequest("Missing required parameters");
    }

    try {
      strapi.log.info(
        `[Sync] Updating common fields for ${uid} (docId: ${documentId}) from ${sourceLocale}`,
      );

      const sourceEntry = await strapi.documents(uid).findFirst({
        filters: {
          documentId: { $eq: documentId },
          locale: { $eq: sourceLocale },
        },
        populate: "*",
      });

      if (!sourceEntry) return ctx.notFound(`Source document not found`);

      const syncedFields = {};

      if (uid === "api::product.product") {
        // ONLY sync non-translatable/common fields to avoid overwriting existing translations
        [
          "slug",
          "SKU",
          "price",
          "old_price",
          "inStock",
          "international_currency",
        ].forEach((f) => {
          if (sourceEntry[f] !== undefined) syncedFields[f] = sourceEntry[f];
        });

        // Sync Media (Global)
        if (sourceEntry.images)
          syncedFields.images = sourceEntry.images.map((img) => img.id);

        // Sync Relations (Global) with locale validation
        if (sourceEntry.category) {
          syncedFields.category = await this.getValidRelationId(
            "api::category.category",
            sourceEntry.category.documentId,
            targetLocale,
          );
        }

        if (sourceEntry.tags) {
          const validTags = await Promise.all(
            sourceEntry.tags.map((t) =>
              this.getValidRelationId(
                "api::tag.tag",
                t.documentId,
                targetLocale,
              ),
            ),
          );
          syncedFields.tags = validTags.filter(Boolean);
        }

        if (sourceEntry.related_products) {
          const validRelated = await Promise.all(
            sourceEntry.related_products.map((p) =>
              this.getValidRelationId(
                "api::product.product",
                p.documentId,
                targetLocale,
              ),
            ),
          );
          syncedFields.related_products = validRelated.filter(Boolean);
        }

        if (sourceEntry.reviews)
          syncedFields.reviews = sourceEntry.reviews.map((r) => r.documentId);
      } else if (uid === "api::category.category" || uid === "api::tag.tag") {
        // Sync slug to remain same across locales
        if (sourceEntry.slug) syncedFields.slug = sourceEntry.slug;
      }

      const result = await strapi.documents(uid).update({
        documentId,
        locale: targetLocale,
        data: syncedFields,
        status: "draft",
      });

      return { data: result };
    } catch (error) {
      strapi.log.error("Sync error:", error);
      return ctx.internalServerError(
        `Failed to sync content: ${error.message}`,
      );
    }
  },

  async generateSeo(ctx) {
    const { uid, documentId, locale } = ctx.request.body;

    if (!uid || !documentId || !locale) {
      return ctx.badRequest("Missing required parameters");
    }

    try {
      strapi.log.info(
        `[SEO] Generating SEO for ${uid} (docId: ${documentId}) in ${locale}`,
      );

      const entry = await strapi.documents(uid).findOne({
        documentId,
        locale,
        populate: "*",
      });

      if (!entry) {
        return ctx.notFound("Entry not found");
      }

      const translateService = strapi.service("api::translate.gemini");
      const frontendUrl =
        process.env.FRONTEND_URL || "https://hydroairtechnologies.com";

      // Helper to extract plain text from blocks
      const blocksToText = (blocks) => {
        if (!Array.isArray(blocks)) return "";
        return blocks
          .map((block) =>
            block.children
              ?.map((child) => child.text)
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean)
          .join("\n");
      };

      const description =
        (entry.short_description && typeof entry.short_description === "string"
          ? entry.short_description
          : "") ||
        (entry.shortDescription && typeof entry.shortDescription === "string"
          ? entry.shortDescription
          : "") ||
        blocksToText(
          entry.description || entry.content || entry.shortDescription,
        );
      const name = entry.name || entry.title;

      const prompt = `As a Senior SEO Specialist, generate high-ranking metadata for this entry.
      Name: ${name}
      Description: ${description}
      Locale: ${locale}

      GUARDRAILS:
      1. page_title: Must be 50-60 characters. Use structure: "[Name] - [Category/Benefit] | HydroAir".
      2. page_description: Compelling, 140-160 characters. End with a call to action.
      3. NO EMOJIS, NO special symbols (like ★, █, »), NO ALL CAPS.
      4. Keywords: Exactly 7 highly relevant keywords in ${locale}, comma-separated.
      5. ALL content must be in ${locale}.

      Return ONLY a raw JSON object with keys: "page_title", "page_description", "keywords". No markdown, no notes.`;

      const aiResponse = await translateService.generateWithPrompt(prompt);
      let seoData = {};

      if (aiResponse) {
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            seoData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          strapi.log.error("Failed to parse AI SEO response:", aiResponse);
        }
      }

      // Determine path prefix based on UID
      let canonicalUrl = null;
      if (entry.slug) {
        const localePrefix = `/${locale}`;
        if (uid === "api::product.product") {
          canonicalUrl = `${frontendUrl}${localePrefix}/products/${entry.slug}`;
        } else if (uid.includes("category")) {
          // Matches your pattern: /locale/products?category=slug
          canonicalUrl = `${frontendUrl}${localePrefix}/products?category=${entry.slug}`;
        } else if (uid.includes("tag")) {
          // Matches your pattern: /locale/products?tag=slug
          canonicalUrl = `${frontendUrl}${localePrefix}/products?tag=${entry.slug}`;
        }
      }

      // Pick first image for OG Image
      let ogImageId = null;
      if (entry.images && entry.images.length > 0) {
        ogImageId = entry.images[0].id;
      } else if (entry.image) {
        ogImageId = entry.image.id;
      }

      const result = await strapi.documents(uid).update({
        documentId,
        locale,
        data: {
          seo: {
            ...seoData,
            canonical_url: canonicalUrl,
            og_image: ogImageId,
            robots: "index, follow",
          },
        },
        status: "draft",
      });

      strapi.log.info(`[SEO] Successfully generated SEO for ${documentId}`);
      return { data: result };
    } catch (error) {
      strapi.log.error("SEO generation error:", error);
      return ctx.internalServerError(
        `Failed to generate SEO: ${error.message}`,
      );
    }
  },

  async generateAiContent(ctx) {
    const { uid, documentId, userInput, locale } = ctx.request.body;

    if (!documentId || !userInput || !uid) {
      return ctx.badRequest("Missing required parameters");
    }

    try {
      strapi.log.info(
        `[AI Writer] Generating content for ${uid} (docId: ${documentId})`,
      );

      const currentEntry = await strapi.documents(uid).findOne({
        documentId,
        locale,
      });

      let prompt = "";
      if (uid === "api::product.product") {
        prompt = `You are a professional product copywriter for "HydroAir Technologies".
        
        USER INPUT/INTRO: "${userInput}"
        
        TASK: Generate a full product entry in English.
        
        REQUIRED JSON STRUCTURE:
        {
          "name": "Professional product name",
          "shortDescription": "A 2-sentence catchy summary for product cards",
          "description_text": "A detailed 3-paragraph professional marketing description",
          "features": ["Feature 1", "Feature 2", "Feature 3"],
          "faqs": [
            {"q": "Question 1?", "a": "Answer 1"},
            {"q": "Question 2?", "a": "Answer 2"},
            {"q": "Question 3?", "a": "Answer 3"}
          ]
        }

        STRICT RULES:
        1. "features" array: Must contain EXACTLY 3 strings.
        2. Each feature string: Must be 5 words or fewer (MAX 5 WORDS).
        3. "faqs" array: Must contain EXACTLY 3 items.
        4. Tone: Technical and professional.
        5. Return ONLY the raw JSON object.`;
      } else {
        const typeLabel = uid.includes("category") ? "Category" : "Tag";
        prompt = `You are a professional copywriter for "HydroAir Technologies".
        
        USER INPUT: "${userInput}"
        
        TASK: Generate a professional Name and Short Description for this ${typeLabel}.
        
        REQUIRED JSON STRUCTURE:
        {
          "name": "Catchy and clear ${typeLabel} name",
          "short_description": "A professional 2-sentence summary describing what's in this ${typeLabel}."
        }

        RULES:
        1. Tone: Professional and informative.
        2. Return ONLY the raw JSON.`;
      }

      const translateService = strapi.service("api::translate.gemini");
      const aiResponse = await translateService.generateWithPrompt(prompt);

      if (!aiResponse) throw new Error("AI failed to respond");

      let data = {};
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);

      const updateData = {};

      if (uid === "api::product.product") {
        // Helper to format text into Strapi 5 Blocks
        const textToBlocks = (text) => {
          return text
            .split("\n")
            .filter(Boolean)
            .map((para) => ({
              type: "paragraph",
              children: [{ type: "text", text: para }],
            }));
        };

        updateData.shortDescription = data.shortDescription;
        updateData.description = textToBlocks(data.description_text);
        updateData.addFeatures = data.features?.map((f) => ({ Feature: f }));
        updateData.FAQs = data.faqs?.map((item) => ({
          Question: item.q,
          Answer: item.a,
        }));
      } else {
        updateData.short_description = data.short_description;
      }

      // Only fill name if it's empty or looks like a placeholder
      if (
        !currentEntry.name ||
        currentEntry.name.includes("(en)") ||
        currentEntry.name.length < 3
      ) {
        updateData.name = data.name;
      }

      const result = await strapi.documents(uid).update({
        documentId,
        locale,
        data: updateData,
        status: "draft",
      });

      return { data: result };
    } catch (error) {
      strapi.log.error("AI Writer error:", error);
      return ctx.internalServerError(
        `Failed to generate content: ${error.message}`,
      );
    }
  },

  async getUnreadCounts(ctx) {
    try {
      const [orders, tickets, subscriptions, reviews] = await Promise.all([
        strapi.documents("api::order.order").count({ filters: { read: false } }),
        strapi.documents("api::support-ticket.support-ticket").count({ filters: { read: false } }),
        strapi.documents("api::subscription-list.subscription-list").count({ filters: { read: false } }),
        strapi.documents("api::review.review").count({ filters: { read: false } }),
      ]);

      return {
        data: {
          orders,
          tickets,
          subscriptions,
          reviews
        }
      };
    } catch (error) {
      strapi.log.error("Unread counts error:", error);
      return ctx.internalServerError("Failed to fetch unread counts");
    }
  },

  async markAsRead(ctx) {
    const { uid, documentId } = ctx.request.body;

    if (!uid || !documentId) {
      return ctx.badRequest('Missing parameters');
    }

    try {
      const contentType = strapi.contentType(uid);
      const hasDraftAndPublish = contentType.options?.draftAndPublish === true;

      // Single atomic update
      // In Strapi 5, updating with status: 'published' handles everything
      await strapi.documents(uid).update({
        documentId,
        data: { read: true },
        status: hasDraftAndPublish ? 'published' : undefined
      });
      
      return { ok: true };
    } catch (error) {
      strapi.log.error(`[Read Status] Failed to mark ${uid} as read:`, error);
      return ctx.internalServerError('Failed to update read status');
    }
  }
};
