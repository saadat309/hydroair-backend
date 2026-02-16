import type { Schema, Struct } from '@strapi/strapi';

export interface ChatbotFaq extends Struct.ComponentSchema {
  collectionName: 'components_chatbot_faqs';
  info: {
    description: 'Frequently Asked Questions for Chatbot';
    displayName: 'FAQ';
  };
  attributes: {
    answer: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    question: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface ChatbotSitePage extends Struct.ComponentSchema {
  collectionName: 'components_chatbot_site_pages';
  info: {
    description: 'Page descriptions for Chatbot navigation';
    displayName: 'Site Page';
  };
  attributes: {
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    path: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductComponentsFeatures extends Struct.ComponentSchema {
  collectionName: 'components_product_components_features';
  info: {
    displayName: 'Features';
    icon: 'attachment';
  };
  attributes: {
    Feature: Schema.Attribute.String;
  };
}

export interface SharedOpenGraph extends Struct.ComponentSchema {
  collectionName: 'components_shared_open_graphs';
  info: {
    displayName: 'openGraph';
    icon: 'project-diagram';
  };
  attributes: {
    ogDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    ogType: Schema.Attribute.String;
    ogUrl: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
        minLength: 50;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaRobots: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaViewport: Schema.Attribute.String;
    openGraph: Schema.Attribute.Component<'shared.open-graph', false>;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface TicketReply extends Struct.ComponentSchema {
  collectionName: 'components_ticket_replies';
  info: {
    description: 'Ticket reply';
    displayName: 'Reply';
    icon: 'message';
  };
  attributes: {
    author: Schema.Attribute.Enumeration<['admin', 'user']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'admin'>;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'chatbot.faq': ChatbotFaq;
      'chatbot.site-page': ChatbotSitePage;
      'product-components.features': ProductComponentsFeatures;
      'shared.open-graph': SharedOpenGraph;
      'shared.seo': SharedSeo;
      'ticket.reply': TicketReply;
    }
  }
}
