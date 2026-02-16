import TranslateButton from './components/TranslateButton.jsx';
import AuthLogo from './extensions/logo.svg';
import MenuLogo from './extensions/logo.svg';
import favicon from './extensions/favicon.png';

export default {
  config: {
    auth: {
      logo: AuthLogo,
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
        'Auth.form.welcome.title': 'Welcome to HydroAir',
        'Auth.form.welcome.subtitle': 'Log in to your HydroAir account',
        'HomePage.header.title': 'Welcome to HydroAir Technologies',
        'HomePage.header.subtitle': 'Efficiently manage your air and water filtration systems.',
      },
      ru: {
        'app.components.LeftMenu.navbrand.title': 'HydroAir Technologies',
        'app.components.LeftMenu.navbrand.workplace': 'HydroAir Панель',
        'Auth.form.welcome.title': 'Добро пожаловать в HydroAir',
        'Auth.form.welcome.subtitle': 'Войдите в свою учетную запись HydroAir',
        'HomePage.header.title': 'Добро пожаловать в HydroAir Technologies',
        'HomePage.header.subtitle': 'Эффективно управляйте вашими системами фильтрации воздуха и воды.',
      },
      uz: {
        'app.components.LeftMenu.navbrand.title': 'HydroAir Technologies',
        'app.components.LeftMenu.navbrand.workplace': 'HydroAir Dashboard',
        'Auth.form.welcome.title': 'HydroAir-ga xush kelibsiz',
        'Auth.form.welcome.subtitle': 'HydroAir hisobingizga kiring',
        'HomePage.header.title': 'HydroAir Technologies-ga xush kelibsiz',
        'HomePage.header.subtitle': 'Havo va suv filtrlash tizimlarini samarali boshqaring.',
      },
    },
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

    console.log('Admin app bootstrap - Registering TranslateButton');
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'translate-button',
      Component: TranslateButton,
    });
  },
};
