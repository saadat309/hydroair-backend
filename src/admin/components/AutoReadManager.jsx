import { useEffect, useRef } from 'react';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
} from '@strapi/strapi/admin';

const AutoReadManager = () => {
  const context = useContentManagerContext();
  const hasFired = useRef(false);

  const { id, model } = context;
  const form = context?.form;
  
  // Check read status from the form values
  const isRead = form?.values?.read === true;

  useEffect(() => {
    const trackedModels = [
      'api::order.order', 
      'api::support-ticket.support-ticket', 
      'api::subscription-list.subscription-list',
      'api::review.review'
    ];

    // Only fire if we have a valid unread entry and haven't fired yet for this ID
    if (id && trackedModels.includes(model) && !isRead && !hasFired.current) {
      
      const timer = setTimeout(async () => {
        // Double check to prevent race conditions
        if (hasFired.current) return;
        hasFired.current = true;

        try {
          // Use standard fetch to avoid AbortError from Strapi's useFetchClient
          const response = await fetch('/api/translate/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: model, documentId: id })
          });

          if (response.ok) {
            console.log(`[AutoRead] Successfully marked ${id} as read`);
            
            // Update UI toggle locally so user sees the change
            if (form?.onChange) {
              form.onChange({ 
                target: { name: 'read', value: true, type: 'boolean' } 
              });
            }
          }
        } catch (error) {
          console.error('[AutoRead] Error:', error);
          hasFired.current = false; // Allow retry on error
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [id, model, isRead, form]);

  return null;
};

export default AutoReadManager;
