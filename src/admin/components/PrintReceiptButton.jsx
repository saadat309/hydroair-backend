import React from 'react';
import { Button } from '@strapi/design-system';
import { 
  unstable_useContentManagerContext as useContentManagerContext,
} from '@strapi/strapi/admin';

// Simple Printer icon fallback
const PrinterIcon = () => (
  <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 14H6V22H18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PrintReceiptButton = () => {
  const context = useContentManagerContext();
  
  // Debug log to see exactly what context contains in the console
  console.log('PrintReceiptButton Context Debug:', context);

  // In Strapi 5, model name might be singular/plural or prefixed. 
  const model = context?.model || context?.slug || '';
  const isOrder = model.includes('order');

  if (!isOrder) {
    return null;
  }

  const handlePrint = () => {
    // Merge initial values (fields) with context data (system fields like createdAt)
    const baseData = context?.form?.initialValues || context?.data || {};
    const systemData = context?.data || {};
    const data = { ...systemData, ...baseData };
    
    console.log('PrintReceiptButton Final Data:', data);

    if (!data || (!data.order_id && !data.id)) {
      alert("Order data not available. Please ensure the order is saved.");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    
    const itemsHtml = data.cartItems?.map(item => {
      // Use item.title (filled by cart logic) or nested product name
      const name = item.title || item.product?.name || 'Product';
      const price = item.subTotal || 0;
      
      return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
            ${name} x ${item.quantity || 1}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${data.currency || 'USD'} ${price.toLocaleString()}
          </td>
        </tr>
      `;
    }).join('') || '<tr><td>No items</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.order_id}</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 13px; line-height: 1.4; }
          .receipt { width: 100%; max-width: 380px; margin: auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { width: 50px; height: 50px; margin-bottom: 8px; }
          .brand { font-size: 18px; font-weight: bold; color: #000; display: block; }
          .meta { font-size: 11px; color: #666; margin-top: 2px; }
          .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
          .section-title { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #888; margin-bottom: 8px; display: block; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
          .total { margin-top: 15px; border-top: 2px solid #000; padding-top: 8px; font-weight: bold; font-size: 16px; text-align: right; }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { padding: 0; }
            .receipt { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <img src="/favicon.png" class="logo" alt="Logo" onerror="this.style.display='none'" />
            <span class="brand">HydroAir Technologies</span>
            <div class="meta">Pure Air. Pure Water.</div>
          </div>

          <div class="divider"></div>

          <span class="section-title">Order Info</span>
          <div class="info-grid">
            <div>
              <strong>Order ID:</strong><br/>
              ${data.order_id || 'N/A'}
            </div>
            <div style="text-align: right;">
              <strong>Date:</strong><br/>
              ${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
          </div>

          <span class="section-title">Customer</span>
          <div style="margin-bottom: 15px;">
            <strong>${data.first_name || ''} ${data.last_name || ''}</strong><br/>
            ${data.email ? `Email: ${data.email}<br/>` : ''}
            ${data.phone ? `Phone: ${data.phone}<br/>` : ''}
            ${data.address || ''}<br/>
            ${data.city || ''}${data.postal_code ? `, ${data.postal_code}` : ''}<br/>
            ${data.country || ''}
          </div>

          <div class="divider"></div>

          <span class="section-title">Items</span>
          <table>
            ${itemsHtml}
          </table>

          <div class="total">
            TOTAL: ${data.currency || 'USD'} ${data.total_price?.toLocaleString() || '0'}
          </div>

          <div class="divider"></div>
          <div style="text-align: center; font-size: 10px; color: #999; margin-top: 20px;">
            Thank you for choosing HydroAir!<br/>
            hydroairtechnologies.com
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Button
      variant="secondary"
      startIcon={<PrinterIcon />}
      fullWidth
      onClick={handlePrint}
      style={{ marginTop: '8px' }}
    >
      Print Receipt
    </Button>
  );
};

export default PrintReceiptButton;
