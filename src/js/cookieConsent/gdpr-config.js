/* Create config file online at https://playground.cookieconsent.orestbida.com/ */
// Enable dark mode
document.documentElement.classList.add("cc--darkmode");

CookieConsent.run({
  guiOptions: {
    autoShow: false,
    consentModal: {
      layout: "box inline",
      position: "middle center",
      equalWeightButtons: false,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      position: "right",
      equalWeightButtons: false,
      flipButtons: false,
    },
  },
  categories: {
    necessary: {
      readOnly: true,
    },
    analytics: {},
  },
  language: {
    default: "en",
    autoDetect: "document",
    translations: {
      en: {
        consentModal: {
          title: "Cookies on TradeDutyRefund.com",
          description:
            "We use some essential cookies to make this website work. We’d like to set additional cookies to understand how you use TradeDutyRefund.com, remember your settings and improve our services.",
          acceptAllBtn: "Continue and accept",
          acceptNecessaryBtn: "",
          showPreferencesBtn: "Manage preferences",
          footer: "",
        },
        preferencesModal: {
          title: "Consent Preferences Center",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          savePreferencesBtn: "Save preferences",
          closeIconLabel: "Close modal",
          serviceCounterLabel: "Service|Services",
          sections: [
            {
              title: "Cookie Usage",
              description:
                "Cookies are files saved on your phone, tablet or computer when you visit a website. We use cookies to collect and store information about how you use this website, such as the pages you visit.",
            },
            {
              title:
                'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
              description:
                "These essential cookies do things like remember your progress through a form (for example a licence application). They will always be on.",
              linkedCategory: "necessary",
            },
            {
              title: "Analytics Cookies",
              description:
                "We use Google Analytics cookies to measure how you use this website. These cookies collect information about: how you got to these sites, the pages you visit and how long you spend on each page, what you click on while you're visiting these sites.",
              linkedCategory: "analytics",
            },
            {
              title: "More information",
              description:
                'For any query in relation to our policy on cookies and your choices, please <a class="cc__link" href="mailto:contact@tradedutyrefund.com">contact us</a>.',
            },
          ],
        },
      },
      fr: {
        consentModal: {
          title:
            "Ce site utilise des cookies et vous donne le contrôle sur ce que vous souhaitez activer.",
          description:
            "Avant de continuer à naviguer sur notre site, nous devons vous demander votre avis sur l'utilisation des cookies sur notre site ... <br>C'est d'accord pour vous ?",
          acceptAllBtn: "D'accord. Je continue",
          acceptNecessaryBtn: "",
          showPreferencesBtn: "Gérer les préférences",
          footer: "",
        },
        preferencesModal: {
          title: "Préférences de cookies",
          acceptAllBtn: "Accepter tout",
          acceptNecessaryBtn: "Tout rejeter",
          savePreferencesBtn: "Sauver les préférences",
          closeIconLabel: "Fermer",
          serviceCounterLabel: "Services",
          sections: [
            {
              title: "Utilisation de Cookies",
              description:
                "Lorsque vous naviguez sur le site tradedutyrefund.com des cookies sont déposés sur votre appareil. Certains sont indispensables au fonctionnement de notre site, d'autres nécessitent votre consentement.",
            },
            {
              title:
                'Cookies Strictement Nécessaires <span class="pm__badge">Toujours Activé</span>',
              description: "Indispensable au bon fonctionnement de notre site.",
              linkedCategory: "necessary",
            },
            {
              title: "Cookies de mesure d'audience",
              description:
                "Ils permettent d'analyser la fréquentation et la performance de notre site afin d'optimiser son ergonomie, ses contenus et nos services.",
              linkedCategory: "analytics",
            },
            {
              title: "Plus d'informations",
              description:
                "Pour plus d'info <a class='cc__link' href='mailto:contact@tradedutyrefund.com'>contactez-nous</a>.",
            },
          ],
        },
      },
      it: {
        consentModal: {
          title: "Cookies su TradeDutyRefund.com",
          description:
            "Utilizziamo alcuni cookie essenziali per far funzionare questo sito web. Vorremmo impostare cookie aggiuntivi per capire come utilizzi TradeDutyRefund.com, ricordare le tue impostazioni e migliorare i nostri servizi.",
          acceptAllBtn: "Accetta tutto",
          acceptNecessaryBtn: "",
          showPreferencesBtn: "Gestisci preferenze",
          footer: "",
        },
        preferencesModal: {
          title: "Centro preferenze per il consenso",
          acceptAllBtn: "Accetta tutto",
          acceptNecessaryBtn: "Rifiuta tutto",
          savePreferencesBtn: "Salva le preferenze",
          closeIconLabel: "Chiudi la finestra",
          serviceCounterLabel: "Servizi",
          sections: [
            {
              title: "Utilizzo dei Cookie",
              description:
                "I cookie sono file salvati sul tuo telefono, tablet o computer quando visiti un sito web. Utilizziamo i cookie per raccogliere e memorizzare informazioni su come utilizzi questo sito web, come le pagine visitate.",
            },
            {
              title:
                'Cookie Strettamente Necessari <span class="pm__badge">Sempre Attivati</span>',
              description:
                "Questi cookie essenziali fanno cose come ricordare i tuoi progressi attraverso un modulo (ad esempio una domanda di licenza). Saranno sempre attivi.",
              linkedCategory: "necessary",
            },
            {
              title: "Cookie Analitici",
              description:
                "Utilizziamo i cookie di Google Analytics per misurare il modo in cui utilizzi questo sito web. Questi cookie raccolgono informazioni su: come sei arrivato a questi siti, le pagine che visiti e quanto tempo trascorri su ogni pagina, su cosa fai clic mentre visiti questi siti.",
              linkedCategory: "analytics",
            },
            {
              title: "Ulteriori informazioni",
              description:
                'Per qualsiasi domanda in relazione alla nostra politica sui cookie e le vostre scelte, si prega di <a class="cc_link" href="mailto:contact@tradedutyrefund.com">contact us</a>.',
            },
          ],
        },
      },
    },
  },
  disablePageInteraction: true,
});

// setTimeout removed because panel appeared twice
//setTimeout(CookieConsent.show, 3000);
