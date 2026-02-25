import React, { useState } from 'react';
import { Button } from '@strapi/design-system';
import { Search } from '@strapi/icons';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
  useFetchClient,
  useNotification,
  useQueryParams
} from '@strapi/strapi/admin';

const GenerateSeoButton = () => {
  const context = useContentManagerContext();
  const { id, model } = context;
  const [{ query }] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const currentLocale = query?.plugins?.i18n?.locale || query?.locale || 'en';

  // Only show for types that have an SEO component
  const supportedTypes = ['api::product.product', 'api::category.category', 'api::tag.tag'];
  if (!supportedTypes.includes(model)) {
    return null;
  }

  const handleGenerateSeo = async () => {
    if (!id) {
      toggleNotification({
        type: 'warning',
        message: 'Please save the document first',
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestPayload = {
        uid: model,
        documentId: id,
        locale: currentLocale,
      };

      const response = await post('/api/translate/generate-seo', requestPayload);

      if (response.data) {
        toggleNotification({
          type: 'success',
          message: 'SEO generated successfully',
        });
        window.location.reload();
      }
    } catch (error) {
      console.error('SEO Generation error:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to generate SEO content',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      startIcon={<Search />}
      onClick={handleGenerateSeo}
      loading={isLoading}
      fullWidth
      style={{ marginTop: '8px' }}
    >
      AI Generate SEO
    </Button>
  );
};

export default GenerateSeoButton;
