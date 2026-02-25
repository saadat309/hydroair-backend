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

export interface ProductComponentsTag extends Struct.ComponentSchema {
  collectionName: 'components_product_components_tags';
  info: {
    displayName: 'tag';
    icon: 'priceTag';
  };
  attributes: {
    tag_name: Schema.Attribute.String;
  };
}

export interface ProductsCartItem extends Struct.ComponentSchema {
  collectionName: 'components_products_cart_items';
  info: {
    displayName: 'Cart Item';
    icon: 'shoppingCart';
  };
  attributes: {
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Integer;
    subTotal: Schema.Attribute.BigInteger;
    title: Schema.Attribute.String;
  };
}

export interface ProductsFaq extends Struct.ComponentSchema {
  collectionName: 'components_products_faqs';
  info: {
    displayName: 'Faq';
    icon: 'question';
  };
  attributes: {
    Answer: Schema.Attribute.Text;
    Question: Schema.Attribute.String;
  };
}

export interface ProductsStatusEvent extends Struct.ComponentSchema {
  collectionName: 'components_products_status_events';
  info: {
    displayName: 'Status Event';
    icon: 'cast';
  };
  attributes: {
    message: Schema.Attribute.Text;
    order_status: Schema.Attribute.String;
    timestamp: Schema.Attribute.DateTime;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Professional SEO metadata for ranking and social sharing';
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    canonical_url: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    og_image: Schema.Attribute.Media<'images'>;
    page_description: Schema.Attribute.Text;
    page_title: Schema.Attribute.String;
    robots: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'index, follow'>;
    structured_data: Schema.Attribute.JSON;
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
      'product-components.tag': ProductComponentsTag;
      'products.cart-item': ProductsCartItem;
      'products.faq': ProductsFaq;
      'products.status-event': ProductsStatusEvent;
      'shared.seo': SharedSeo;
      'ticket.reply': TicketReply;
    }
  }
}
