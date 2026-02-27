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
        port: env.int("SMTP_PORT"),
        secure: env.bool("SMTP_SECURE"),
        auth: {
          user: env("SMTP_USER"),
          pass: env("SMTP_PASS"),
        },
      },
      settings: {
        defaultFrom: env("SMTP_FROM"),
        defaultReplyTo: env("SMTP_REPLY_TO"),
      },
    },
  },
});
