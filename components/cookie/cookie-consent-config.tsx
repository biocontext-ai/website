import { acceptedCategory, acceptedService, type CookieConsentConfig } from "vanilla-cookieconsent"

export const setCookie = (name: string, value: string, days = 1) => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = "; expires=" + date.toUTCString()
  document.cookie = name + "=" + value + expires + "; path=/"
}

const pluginConfig: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom right",
      equalWeightButtons: false,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      position: "left",
      equalWeightButtons: true,
      flipButtons: false,
    },
  },

  autoClearCookies: true,
  manageScriptTags: true,
  hideFromBots: true,
  disablePageInteraction: false,

  onFirstConsent: function () {},

  onConsent: function ({ cookie }) {
    if (acceptedCategory("analytics") && acceptedService("tagmanager", "analytics")) {
      // @ts-expect-error window is not defined on server
      if (window.gtag && window.gtag instanceof Function) {
        // @ts-expect-error window is not defined on server
        window.gtag("consent", "update", {
          ad_personalization: "granted",
          ad_storage: "granted",
          ad_user_data: "granted",
          functionality_storage: "granted",
          personalization_storage: "granted",
          security_storage: "granted",
          analytics_storage: "denied",
        })
      }
    } else {
      // @ts-expect-error window is not defined on server
      if (window.gtag && window.gtag instanceof Function) {
        // @ts-expect-error window is not defined on server
        window.gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          functionality_storage: "denied",
          security_storage: "denied",
          personalization_storage: "denied",
          analytics_storage: "denied",
        })
      }
    }
  },

  onChange: function ({ changedCategories, cookie }) {
    if (changedCategories.includes("analytics")) {
      if (acceptedCategory("analytics") && acceptedService("tagmanager", "analytics")) {
        // @ts-expect-error window is not defined on server
        if (window.gtag && window.gtag instanceof Function) {
          // @ts-expect-error window is not defined on server
          window.gtag("consent", "update", {
            ad_personalization: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            functionality_storage: "granted",
            personalization_storage: "granted",
            security_storage: "granted",
            analytics_storage: "denied",
          })
        }
      } else {
        // @ts-expect-error window is not defined on server
        if (window.gtag && window.gtag instanceof Function) {
          // @ts-expect-error window is not defined on server
          window.gtag("consent", "update", {
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            functionality_storage: "denied",
            security_storage: "denied",
            personalization_storage: "denied",
            analytics_storage: "denied",
          })
        }
      }
    }
  },

  categories: {
    necessary: {
      readOnly: true,
      enabled: false,
    },
    analytics: {
      services: {
        tagmanager: {
          label: "Google Tag Manager & Google Analytics",
          cookies: [
            {
              name: /^_ga_*/,
            },
            {
              name: /^_gid/,
            },
          ],
        },
      },
      autoClear: {
        cookies: [
          {
            name: /^(_ga|_gid)/,
          },
        ],
      },
      enabled: false,
      readOnly: false,
    },
  },

  language: {
    default: "en",

    translations: {
      en: {
        consentModal: {
          title: "Cookies & Similar Technologies 🍪",
          description:
            'We use cookies and similar technologies to optimize our website and outreach efforts. Optional tracking is only activated if you give your express consent. Your consent can be revoked at any time with effect for the future. <a href="#privacy-policy" data-cc="show-preferencesModal" class="cc__link">Manage Preferences</a>',
          acceptAllBtn: "Accept All",
          acceptNecessaryBtn: "Reject All",
          showPreferencesBtn: "Manage Preferences",
          footer: `
            <a href="/legal/privacy">Privacy Policy</a>
            <a href="/legal/notice">Legal Notice</a>
          `,
        },
        preferencesModal: {
          title: "Cookie Preferences",
          acceptAllBtn: "Accept All",
          acceptNecessaryBtn: "Reject All",
          savePreferencesBtn: "Save Preferences",
          closeIconLabel: "Close",
          sections: [
            {
              title: "Cookie Usage",
              description:
                'We use cookies to ensure the basic functions of the website and to enhance your online experience. You can choose to opt in or out for each category at any time. For more details about cookies and other sensitive data, please read the full <a href="/legal/privacy/" class="cc__link">Privacy Policy</a>.',
            },
            {
              title: "Strictly Necessary Cookies",
              description: "Description",
              linkedCategory: "necessary",
              cookieTable: {
                headers: {
                  name: "Name",
                  domain: "Service",
                  description: "Description",
                  expiration: "Expiration",
                },
                body: [
                  {
                    name: "cc_cookie",
                    domain: "BioContextAI",
                    description: "Stores the user&apos;s cookie settings.",
                    expiration: "6 months",
                  },
                  {
                    name: "cf_ob_info, cf_use_ob",
                    domain: "Cloudflare",
                    description: "Information about the status of the website request and Cloudflare Always Online.",
                    expiration: "60 seconds",
                  },
                ],
              },
            },
            {
              title: "Performance and Analytics Cookies",
              linkedCategory: "analytics",
              cookieTable: {
                headers: {
                  name: "Name",
                  domain: "Service",
                  description: "Description",
                  expiration: "Expiration",
                },
                body: [
                  {
                    name: "_ga_*, _gid",
                    domain: "Google Tag Manager & Google Analytics",
                    description:
                      "Web analytics technologies from <a>Google Tag Manager & Google Analytics</a> to collect usage statistics and manage other analytics services.",
                    expiration: "12 days",
                  },
                ],
              },
            },
            {
              title: "More Information",
              description:
                'For any inquiries related to our Cookie Policy and your choices, please contact <a class="cc__link" href="mailto:contact@biocontext.ai">us</a>.',
            },
          ],
        },
      },
    },
  },
}

export default pluginConfig
