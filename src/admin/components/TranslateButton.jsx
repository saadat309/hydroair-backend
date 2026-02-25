import React, { useState } from 'react';
import { Button } from '@strapi/design-system';
import { Earth } from '@strapi/icons';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
  useFetchClient,
  useNotification,
  useQueryParams // Add this to get locale from URL
} from '@strapi/strapi/admin';

const TranslateButton = () => {
  const context = useContentManagerContext();
  const { id, model, contentType } = context;
  const [{ query }] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  // In Strapi 5, locale is nested in plugins[i18n][locale]
  const currentLocale = query?.plugins?.i18n?.locale || query?.locale || 'en';

  // Supported types for sync/translate/seo
  const supportedTypes = ['api::product.product', 'api::category.category', 'api::tag.tag'];

  // Only show if not English and is a supported type
  if ((currentLocale === 'en' && !window.location.search.includes('force_translate=true')) || !supportedTypes.includes(model)) {
    return null;
  }

  const handleTranslate = async () => {
    if (!id) {
      toggleNotification({
        type: 'warning',
        message: 'Please save the document first',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Ensure we have the values from context
      const requestPayload = {
        uid: model, // UID (e.g. api::product.product)
        documentId: id, // The documentId in Strapi 5
        targetLocale: currentLocale, // The locale we want to translate TO
        sourceLocale: 'en'
      };

      console.log('Sending translation request with payload:', requestPayload);

      const response = await post('/api/translate/manual-translate', requestPayload);

      if (response.data) {
        toggleNotification({
          type: 'success',
          message: 'Content translated successfully',
        });
        window.location.reload();
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      let errorMessage = 'Unknown error';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage = error.response.status;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toggleNotification({
        type: 'danger',
        message: `Failed to translate content (${errorMessage})`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      startIcon={<Earth />}
      onClick={handleTranslate}
      loading={isLoading}
      fullWidth
      style={{ marginTop: '8px' }}
    >
      AI Translate Content
    </Button>
  );
};

export default TranslateButton;
