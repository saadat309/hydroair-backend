module.exports = ({ env }) => ({
  i18n: true,
  cloud: {
    enabled: false,
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST"),
        port: env.int("SMTP_PORT",),
        secure: env.bool("SMTP_SECURE",),
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
