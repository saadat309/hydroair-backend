module.exports = ({ env }) => ({
  i18n: true,
  cloud: {
    enabled: false,
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp.gmail.com"),
        port: env.int("SMTP_PORT", 465),
        secure: env.bool("SMTP_SECURE", true),
        auth: {
          user: env("GMAIL_USER"),
          pass: env("GMAIL_PASS"),
        },
      },
      settings: {
        defaultFrom: env("EMAIL_FROM"),
        defaultReplyTo: env("EMAIL_REPLY_TO"),
      },
    },
  },
});
