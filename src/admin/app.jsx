import TranslateButton from './components/TranslateButton.jsx';
import GenerateSeoButton from './components/GenerateSeoButton.jsx';
import SyncButton from './components/SyncButton.jsx';
import AiProductGenerator from './components/AiProductGenerator.jsx';
import PrintReceiptButton from './components/PrintReceiptButton.jsx';
import AutoReadManager from './components/AutoReadManager.jsx';
import DashboardWidget from './components/DashboardWidget.jsx';
import AuthLogo from './extensions/logo.svg';
import MenuLogo from './extensions/logo.svg';
import favicon from './extensions/favicon.png';

export default {
  config: {
    auth: {
      logo: AuthLogo,
      sessions: {
        maxRefreshTokenLifespan: 2592000,
        maxSessionLifespan: 2592000,
      },
    },
    head: {
      favicon: favicon,
      title: 'HydroAir Technologies',
    },
    menu: {
      logo: MenuLogo,
    },
    locales: ['ru', 'uz'],
    translations: {
      en: {
        'app.components.LeftMenu.navbrand.title': 'HydroAir Technologies',
        'app.components.LeftMenu.navbrand.workplace': 'HydroAir Dashboard',
        'activity-overview.title': 'Activity Overview',
      },
    },
  },

  register(app) {
    if (app.widgets) {
      app.widgets.register({
        name: 'activity-overview',
        icon: () => (
          <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        ),
        title: {
          id: 'activity-overview.title',
          defaultMessage: 'Activity Overview',
        },
        component: async () => DashboardWidget,
        id: 'activity-overview-widget',
      });
    }
  },

  bootstrap(app) {
    // Manually set favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = favicon;
    document.head.appendChild(link);

    // Keep document title consistent
    const updateTitle = () => {
      if (document.title.includes(' | Strapi')) {
        document.title = document.title.replace(' | Strapi', ' | HydroAir Technologies');
      } else if (document.title === 'Strapi Admin') {
        document.title = 'HydroAir Technologies';
      }
    };

    updateTitle();
    const observer = new MutationObserver(updateTitle);
    observer.observe(document.querySelector('title'), {
      childList: true,
      characterData: true,
      subtree: true,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'sync-button',
      Component: SyncButton,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'translate-button',
      Component: TranslateButton,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'generate-seo-button',
      Component: GenerateSeoButton,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'ai-product-generator',
      Component: AiProductGenerator,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'print-receipt-button',
      Component: PrintReceiptButton,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'auto-read-manager',
      Component: AutoReadManager,
    });
  },
};
