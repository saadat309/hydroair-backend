import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Textarea, 
  Typography, 
  Divider
} from '@strapi/design-system';
import { Magic } from '@strapi/icons';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
  useFetchClient,
  useNotification,
  useQueryParams
} from '@strapi/strapi/admin';

const AiContentGenerator = () => {
  const { id, model } = useContentManagerContext();
  const [{ query }] = useQueryParams();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const currentLocale = query?.plugins?.i18n?.locale || query?.locale || 'en';

  // Supported types for AI writing
  const supportedTypes = ['api::product.product', 'api::category.category', 'api::tag.tag'];
  
  if (!supportedTypes.includes(model) || currentLocale !== 'en') {
    return null;
  }

  const handleGenerate = async () => {
    if (!id) {
      toggleNotification({
        type: 'warning',
        message: 'Please save the draft first to use AI generation',
      });
      return;
    }

    if (!input.trim()) {
      toggleNotification({
        type: 'warning',
        message: 'Please provide a short intro or requirement',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await post('/api/translate/generate-ai-content', {
        uid: model,
        documentId: id,
        userInput: input,
        locale: currentLocale
      });

      if (response.data) {
        toggleNotification({
          type: 'success',
          message: 'AI Content Generated Successfully',
        });
        setInput('');
        window.location.reload();
      }
    } catch (error) {
      console.error('AI Writer error:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to generate content',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const typeLabel = model.split('.').pop();

  return (
    <Box paddingTop={4}>
      <Divider />
      <Box paddingTop={4}>
        <Typography variant="sigma" textColor="neutral600">
          AI Content Writer
        </Typography>
        <Box paddingTop={2}>
          <Textarea
            placeholder={`Explain what this ${typeLabel} is about...`}
            label={`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Intro / Requirement`}
            name="ai-input"
            onChange={(e) => setInput(e.target.value)}
            value={input}
            rows={8}
          />
        </Box>
        <Box paddingTop={2}>
          <Button
            variant="secondary"
            startIcon={<Magic />}
            fullWidth
            onClick={handleGenerate}
            loading={isLoading}
          >
            Generate Content
          </Button>
        </Box>
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="neutral500">
            {model === 'api::product.product' 
              ? 'Fills Name, Description, Features (3), and FAQs (3).'
              : 'Fills Name and Short Description.'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AiContentGenerator;
