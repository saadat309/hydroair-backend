import React, { useState } from 'react';
import { Button } from '@strapi/design-system';
import { Play } from '@strapi/icons';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
  useFetchClient,
  useNotification,
  useQueryParams
} from '@strapi/strapi/admin';

const SyncButton = () => {
  const context = useContentManagerContext();
  const { id, model } = context;
  const [{ query }] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const currentLocale = query?.plugins?.i18n?.locale || query?.locale || 'en';

  // Supported types for sync/translate/seo
  const supportedTypes = ['api::product.product', 'api::category.category', 'api::tag.tag'];

  // Only show if not English and is a supported type
  if (currentLocale === 'en' || !supportedTypes.includes(model)) {
    return null;
  }

  const handleSync = async () => {
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
        targetLocale: currentLocale,
        sourceLocale: 'en'
      };

      const response = await post('/api/translate/sync-from-source', requestPayload);

      if (response.data) {
        toggleNotification({
          type: 'success',
          message: 'Data and relations synced successfully',
        });
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to sync content from English',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      startIcon={<Play />}
      onClick={handleSync}
      loading={isLoading}
      fullWidth
      style={{ marginTop: '8px' }}
    >
      Sync Base Data
    </Button>
  );
};

export default SyncButton;
