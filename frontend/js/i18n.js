/* ═══════════════════════════════════════
   INTERNATIONALISATION — HumanitAID
   Lightweight FR / EN / ES switcher.
   - Dictionary lives here (static, no external API).
   - Preference stored in localStorage ("humanitaid-lang").
   - Detect: stored → navigator.language → 'fr'.
   - Applies to:
       · <html lang>, document.title
       · [data-i18n]            → textContent/innerHTML
       · [data-i18n-placeholder]→ input placeholder
       · [data-i18n-aria]       → aria-label
       · [data-i18n-title]      → title attribute
   - Dispatches a `ha:langchange` CustomEvent so the other
     JS modules can re-render their dynamic French/English/
     Spanish strings.
   ═══════════════════════════════════════ */

const I18N = {
  STORAGE_KEY: 'humanitaid-lang',
  supported: ['fr', 'en', 'es'],

  dict: {
    fr: {
      'meta.title': 'HumanitAID — Aide humanitaire en RDC | Solidarité et dignité',

      'skip.link': 'Aller au contenu principal',

      'ticker.1': 'Crise humanitaire active dans l\'Est de la RDC — soutien aux déplacés à Goma et Butembo',
      'ticker.2': 'Enfants en zones de conflit — chaque don soutient la protection et l\'éducation',
      'ticker.3': 'Veuves et femmes survivantes — accompagnement psychosocial à Beni, Minembwe et Uvira',
      'ticker.4': 'Victimes de violences — réhabilitation et accompagnement psychosocial',
      'ticker.5': 'Personnes handicapées en zones de guerre — appui à l\'accessibilité et aux soins',
      'ticker.6': '« Tant que tu as les moyens d\'aider, tu as le devoir de le faire » — Rejoignez les donateurs aujourd\'hui',
      'ticker.7': '« La générosité n\'a pas de frontières — l\'humanité non plus » — Faites un don maintenant',
      'ticker.aria': 'Alertes humanitaires',

      'nav.label': 'Navigation principale',
      'nav.home': 'Accueil',
      'nav.collectes': 'Collectes',
      'nav.apropos': 'À propos',
      'nav.rapports': 'Rapports',
      'nav.commentAider': 'Comment aider',
      'nav.partenaires': 'Partenaires',
      'nav.contact': 'Contact',
      'nav.causesAll': 'Voir toutes les causes',
      'menu.app': 'Application',
      'nav.causes': 'Causes',
      'nav.stories': 'Histoires',
      'nav.temoignages': 'Témoignages',
      'nav.actualites': 'Actualités',
      'nav.donner': 'Faire un don',

      'pwa.install.title': 'Installer HumanitAID',
      'pwa.install.text': "Ajoutez l'app à votre écran d'accueil pour un accès rapide, même avec une connexion limitée.",
      'pwa.install.btn': 'Installer',
      'pwa.install.dismiss': 'Plus tard',

      'menu.label': 'Menu',
      'menu.close': 'Fermer le menu',
      'menu.title': 'Menu mobile',
      'menu.nav': 'Navigation',
      'menu.appearance': 'Apparence',

      'lang.label': 'Langue',
      'lang.aria': 'Changer de langue',

      'theme.label': 'Changer le thème',
      'theme.light': 'Mode clair',
      'theme.dark': 'Mode sombre',
      'theme.system': 'Mode système',
      'theme.lightTitle': 'Clair',
      'theme.darkTitle': 'Sombre',
      'theme.systemTitle': 'Système',

      'hero.diaporama': 'Diaporama',
      'hero.dot': 'Diapositive {n}',
      'hero.btn1': 'Faire un don maintenant',
      'hero.btn2': 'Découvrir les causes',

      'stat.raised': 'Total collecté',
      'stat.donors': 'Donateurs à travers le monde',
      'stat.aria': 'Chiffres clés',

      'apropos.label': 'Notre mission',
      'apropos.title': 'Une réponse humanitaire pour l\'<em>Est de la RDC</em>',
      'apropos.p1': 'HumanitAID est une organisation humanitaire centrée sur les personnes touchées par les conflits et les crises dans l\'Est de la République démocratique du Congo, principalement dans les provinces du Nord-Kivu, du Sud-Kivu et de l\'Ituri.',
      'apropos.p2': 'Déplacés de guerre, enfants orphelins, veuves et femmes survivantes, victimes de violences, personnes handicapées : nous collectons des fonds et soutenons des programmes qui leur apportent protection, soins, éducation et dignité.',
      'apropos.p3': 'Vos dons financent directement les programmes ; nos frais de fonctionnement sont couverts séparément par des donateurs institutionnels.',
      'apropos.cta': 'Soutenir HumanitAID',
      'apropos.why1.title': 'Transparence',
      'apropos.why1.desc': 'Rapports d\'utilisation publiés et envoyés aux donateurs.',
      'apropos.why2.title': 'Impact direct',
      'apropos.why2.desc': 'Les fonds soutiennent des programmes sur le terrain, au plus près des bénéficiaires.',
      'apropos.why3.title': 'Dignité',
      'apropos.why3.desc': 'Chaque personne soutenue est accompagnée avec respect et dignité.',

      'collectes.label': 'État des collectes',
      'collectes.title': 'Votre argent à l\'<em>œuvre</em>',
      'collectes.sub': 'Le détail de chaque collecte est publié, montant par montant.',
      'collectes.goal': 'Objectif',
      'collectes.daysLeft': 'jours restants',

      'causes.label': 'Nos bénéficiaires',
      'causes.title': 'Cinq causes, <em>une mission</em>',
      'causes.sub': 'Chaque cause concentre des besoins concrets et des solutions concrètes. Survolez pour en savoir plus.',
      'causes.priority': 'Priorité {n}',
      'causes.link': 'Aider maintenant',
      'causes.donors': '{n} donateurs',

      'stories.label': 'Histoires du terrain',
      'stories.title': 'Ce que nos équipes <em>voient</em>',
      'stories.sub': 'Récits et reportages depuis les zones de conflit. Chaque image raconte une histoire.',
      'carousel.prev': 'Précédent',
      'carousel.next': 'Suivant',
      'carousel.dot': 'Diapositive {n}',

      'publications.label': 'Publications',
      'publications.title': 'Rapports & <em>Analyses</em>',
      'publications.sub': 'Documents de référence pour comprendre et agir.',
      'pub.download': 'Télécharger : {title}',

      'temoignages.label': 'Voix du terrain',
      'temoignages.title': 'Ils se <em>relèvent</em>.<br>Ils témoignent.',
      'temoignages.sub': 'Derrière chaque témoignage, une vie qui se reconstruit.',
      'tcat.beneficiary': 'Bénéficiaire',
      'tcat.volunteer': 'Bénévole',
      'tcat.donor': 'Donateur',
      'tcat.partner': 'Partenaire',
      'tcat.field-worker': 'Acteur de terrain',
      'tcat.default': 'Témoignage',
      'citations.aria': 'Citations inspirantes',
      'cit.dot': 'Citation {n}',
      'cit.c1.text': '« Injustice anywhere is a threat to justice everywhere. »',
      'cit.c1.author': '— Martin Luther King Jr.',
      'cit.c2.text': '« Si vous ne pouvez pas nourrir cent personnes, nourrissez-en une seule. »',
      'cit.c2.author': '— Mère Teresa',
      'cit.c3.text': '« La vie d\'un seul homme vaut autant que celle de toute l\'humanité. »',
      'cit.c3.author': '— Albert Einstein',
      'cit.c4.text': '« Un enfant, un enseignant, un livre, un stylo peuvent changer le monde. »',
      'cit.c4.author': '— Malala Yousafzai',

      'donner.label': 'Agir maintenant',
      'donner.title': 'Votre don change<br>une <em>vie réelle</em>',
      'donner.sub': 'Les fonds collectés financent directement les programmes sur le terrain. Les frais de fonctionnement sont couverts séparément.',

      'don.feature.secure.title': 'Paiement sécurisé',
      'don.feature.secure.desc': 'Chiffrement SSL 256 bits. Vos données bancaires ne sont jamais stockées sur nos serveurs.',
      'don.feature.report.title': 'Rapport d\'utilisation',
      'don.feature.report.desc': 'Un rapport d\'utilisation est envoyé à chaque donateur, avec le détail de l\'utilisation des fonds.',
      'don.feature.receipt.title': 'Certificat de don',
      'don.feature.receipt.desc': 'Certificat de don fourni sur demande par notre équipe. Les conditions de déduction dépendent de votre pays de résidence.',
      'don.feature.recurring.title': 'Don récurrent possible',
      'don.feature.recurring.desc': 'Soutien mensuel pour une action continue. Arrêt possible à tout moment.',

      'form.title': 'Faire un don sécurisé',
      'form.aria': 'Formulaire de don',
      'form.step.amount': '1. Choisissez votre montant',
      'form.step.cause': '2. Choisissez la cause bénéficiaire',
      'form.step.payment': '3. Mode de paiement',
      'form.custom.label': 'Montant personnalisé',
      'form.custom.placeholder': 'Ou entrez un montant personnalisé (ex: 1000)',
      'form.cause.label': 'Cause bénéficiaire',
      'form.cause.placeholder': '— Sélectionner une cause ou toutes les causes —',
      'causeopt.deplaces': 'Déplacés & réfugiés de guerre',
      'causeopt.orphelins': 'Enfants orphelins en zones de conflit',
      'causeopt.veuves': 'Veuves & femmes survivantes de violences',
      'causeopt.victimes': 'Victimes de violences armées',
      'causeopt.handicapes': 'Personnes handicapées en zones de guerre',
      'causeopt.all': 'Toutes les causes',

      'pay.carte': 'Carte',
      'pay.mobile': 'Mobile Money',
      'pay.virement': 'Virement',

      'card.name.label': 'Nom sur la carte',
      'card.name.placeholder': 'Nom sur la carte',
      'card.email.label': 'Email pour le reçu',
      'card.email.placeholder': 'Email pour le reçu fiscal',
      'card.hint': 'Paiement sécurisé : vous serez redirigé vers la page Stripe pour saisir les coordonnées de votre carte.',

      'providers.mpesa': 'M-Pesa',
      'providers.airtel': 'Airtel Money',
      'providers.orange': 'Orange Money',
      'providers.wave': 'Wave',

      'mobile.phone.label': 'Numéro de téléphone',
      'mobile.phone.placeholder': 'Numéro de téléphone Mobile Money (+243...)',
      'mobile.name.label': 'Nom du titulaire',
      'mobile.name.placeholder': 'Nom complet du titulaire',
      'mobile.email.label': 'Email de confirmation',
      'mobile.email.placeholder': 'Email pour la confirmation',

      'wire.coord': 'Coordonnées bancaires',
      'wire.beneficiary': 'Bénéficiaire',
      'wire.iban': 'IBAN',
      'wire.bic': 'BIC/SWIFT',
      'wire.bank': 'Banque',
      'wire.ref': 'Référence',
      'wire.name.label': 'Votre nom',
      'wire.name.placeholder': 'Votre nom (pour confirmation de réception)',
      'wire.email.label': 'Email pour le reçu',
      'wire.email.placeholder': 'Email pour le reçu',

      'form.ssl': 'Connexion sécurisée SSL 256 bits — Données chiffrées et protégées',
      'form.submit': 'Confirmer mon don — $',
      'form.processing': 'Traitement...',
      'form.submitShort': 'Confirmer le don',

      'don.err.amount': 'Veuillez choisir ou saisir un montant valide.',
      'don.err.email': 'Veuillez saisir votre email pour recevoir le reçu.',
      'don.err.network': 'Le paiement n\'a pas pu être initié. Vérifiez votre connexion et réessayez.',
      'don.err.submit': 'Une erreur est survenue lors de l\'envoi du don. Veuillez réessayer.',
      'don.paidReceived': 'Paiement reçu',
      'don.transmitted': 'Votre paiement a bien été transmis.',
      'don.ref': 'Référence : {ref}',
      'don.confirmSuffix': ' — En attente de confirmation du paiement.',
      'don.definitiveSuffix': ' — La confirmation définitive de votre don sera enregistrée après vérification du paiement.',
      'don.cancelled.title': 'Paiement annulé',
      'don.cancelled.msg': 'Paiement annulé. Vous pouvez réessayer ou choisir un autre mode de paiement.',
      'don.cancelled.notSaved': 'Don non enregistré',
      'don.anonymous': 'Anonyme',

      'modal.title': 'Merci pour votre don',
      'modal.text': 'Votre contribution financera directement les programmes en République Démocratique du Congo.',
      'modal.close': 'Fermer',
      'modal.x': 'Fermer',

      'actualites.label': 'Terrain & Rapports',
      'actualites.title': 'L\'actualité de la <em>crise</em>',
      'actualites.sub': 'Rester informé pour mieux agir. Nos équipes reportent depuis le terrain chaque semaine.',

      'partenaires.label': 'Nos partenaires',
      'partenaires.title': 'Ensemble pour <em>l\'humanitaire</em>',
      'partenaires.sub': 'Des organisations du monde entier nous font confiance.',

      'faq.label': 'Questions fréquentes',
      'faq.title': 'Vous avez des <em>questions</em> ?',
      'faq.sub': 'Tout ce que vous devez savoir sur HumanitAID et vos dons.',
      'faq.q1': 'Où va mon don exactement ?',
      'faq.a1': 'Votre don finance directement les programmes au bénéfice des populations en RDC. Nos frais de fonctionnement sont couverts séparément par des donateurs institutionnels. Vous recevez un rapport détaillé sur l\'utilisation des fonds.',
      'faq.q2': 'Comment puis-je obtenir mon reçu fiscal ?',
      'faq.a2': 'Après votre don, notre équipe peut vous adresser un certificat de don sur demande (contact : support@humanit-aid.org). Les conditions de déduction fiscale dépendent du pays de résidence ; renseignez-vous auprès de votre administration fiscale.',
      'faq.q3': 'Puis-je faire un don récurrent ?',
      'faq.a3': 'Oui ! Vous pouvez choisir de devenir partenaire mensuel lors de votre don. Le prélèvement est automatique et vous pouvez l\'annuler à tout moment en nous contactant à support@humanit-aid.org.',
      'faq.q4': 'Comment HumanitAID garantit-elle la transparence ?',
      'faq.a4': 'Chaque don reçu est suivi de bout en bout. Nous publions des rapports réguliers sur l\'utilisation des fonds et partageons des informations détaillées avec les donateurs. Les documents sont disponibles sur demande.',
      'faq.q5': 'Dans quelles régions intervenez-vous ?',
      'faq.a5': 'Nous intervenons principalement dans les provinces du Nord-Kivu, Sud-Kivu et Ituri, les zones les plus touchées par les conflits armés. Nos équipes opèrent également dans les camps de déplacés à Goma, Butembo, Beni, Uvira et Minembwe.',

      'cta.aria': 'Appel à l\'action',
      'cta.title': 'Rejoignez la mobilisation.<br>Votre don <em style="color:var(--or);font-style:normal;">soutient</em> la reconstruction.',
      'cta.sub': 'Trop de familles attendent encore une aide humanitaire. Chaque don, quel que soit son montant, finance directement les programmes.',
      'cta.btn1': 'Faire un don',
      'cta.btn2': 'Voir les collectes',

      'footer.desc': 'HumanitAID collecte des fonds pour les victimes des conflits armés à l\'Est de la République Démocratique du Congo. L\'utilisation des fonds est publiée dans des rapports réguliers.',
      'footer.col1.title': 'Nos causes',
      'footer.col1.l1': 'Déplacés de guerre',
      'footer.col1.l2': 'Enfants orphelins',
      'footer.col1.l3': 'Veuves & femmes',
      'footer.col1.l4': 'Victimes de violence',
      'footer.col1.l5': 'Personnes handicapées',
      'footer.col2.title': 'Organisation',
      'footer.col2.l1': 'À propos de nous',
      'footer.col2.l2': 'Notre équipe terrain',
      'footer.col2.l3': 'Rapports annuels',
      'footer.col2.l4': 'Partenaires',
      'footer.col2.l5': 'Devenir bénévole',
      'footer.col2.l6': 'Presse & Médias',
      'footer.col3.title': 'Contact',
      'footer.col3.l1': 'Whatsapp / Signal',
      'footer.col3.l2': 'Goma, Nord-Kivu — RDC',
      'footer.col3.l3': 'Bruxelles — Europe',
      'footer.rights': 'HumanitAID Foundation · Tous droits réservés',
      'footer.b1': 'Politique de confidentialité',
      'footer.b2': 'Conditions d\'utilisation',
      'footer.b3': 'Rapport financier 2024',
    },

    en: {
      'meta.title': 'HumanitAID — Humanitarian aid in the DRC | Solidarity and dignity',

      'skip.link': 'Skip to main content',

      'ticker.1': 'Ongoing humanitarian crisis in the eastern DRC — support for the displaced in Goma and Butembo',
      'ticker.2': 'Children in conflict zones — every gift supports protection and education',
      'ticker.3': 'Widows and women survivors — psychosocial support in Beni, Minembwe and Uvira',
      'ticker.4': 'Victims of violence — rehabilitation and psychosocial support',
      'ticker.5': 'People with disabilities in war zones — access and care support',
      'ticker.6': '« As long as you can help, you have a duty to do so » — Join our donors today',
      'ticker.7': '« Generosity knows no borders — neither does humanity » — Donate now',
      'ticker.aria': 'Humanitarian alerts',

      'nav.label': 'Main navigation',
      'nav.home': 'Home',
      'nav.collectes': 'Campaigns',
      'nav.apropos': 'About',
      'nav.rapports': 'Reports',
      'nav.commentAider': 'How to help',
      'nav.partenaires': 'Partners',
      'nav.contact': 'Contact',
      'nav.causesAll': 'See all causes',
      'menu.app': 'App',
      'nav.causes': 'Causes',
      'nav.stories': 'Stories',
      'nav.temoignages': 'Testimonials',
      'nav.actualites': 'News',
      'nav.donner': 'Donate',

      'pwa.install.title': 'Install HumanitAID',
      'pwa.install.text': 'Add the app to your home screen for quick access, even on a limited connection.',
      'pwa.install.btn': 'Install',
      'pwa.install.dismiss': 'Later',

      'menu.label': 'Menu',
      'menu.close': 'Close menu',
      'menu.title': 'Mobile menu',
      'menu.nav': 'Navigation',
      'menu.appearance': 'Appearance',

      'lang.label': 'Language',
      'lang.aria': 'Change language',

      'theme.label': 'Change theme',
      'theme.light': 'Light mode',
      'theme.dark': 'Dark mode',
      'theme.system': 'System mode',
      'theme.lightTitle': 'Light',
      'theme.darkTitle': 'Dark',
      'theme.systemTitle': 'System',

      'hero.diaporama': 'Slideshow',
      'hero.dot': 'Slide {n}',
      'hero.btn1': 'Donate now',
      'hero.btn2': 'Discover the causes',

      'stat.raised': 'Total raised',
      'stat.donors': 'Donors worldwide',
      'stat.aria': 'Key figures',

      'apropos.label': 'Our mission',
      'apropos.title': 'A humanitarian response for the <em>Eastern DRC</em>',
      'apropos.p1': 'HumanitAID is a humanitarian organization focused on people affected by conflicts and crises in the eastern Democratic Republic of the Congo, mainly in the provinces of North Kivu, South Kivu and Ituri.',
      'apropos.p2': 'War-displaced people, orphaned children, widows and women survivors, victims of violence, people with disabilities: we raise funds and support programmes that bring them protection, care, education and dignity.',
      'apropos.p3': 'Your donations directly fund the programmes; our operating costs are covered separately by institutional donors.',
      'apropos.cta': 'Support HumanitAID',
      'apropos.why1.title': 'Transparency',
      'apropos.why1.desc': 'Usage reports published and sent to donors.',
      'apropos.why2.title': 'Direct impact',
      'apropos.why2.desc': 'Funds support field programmes, close to the beneficiaries.',
      'apropos.why3.title': 'Dignity',
      'apropos.why3.desc': 'Every person supported is accompanied with respect and dignity.',

      'collectes.label': 'Campaign status',
      'collectes.title': 'Your money at <em>work</em>',
      'collectes.sub': 'Every campaign is published in detail, amount by amount.',
      'collectes.goal': 'Goal',
      'collectes.daysLeft': 'days left',

      'causes.label': 'Our beneficiaries',
      'causes.title': 'Five causes, <em>one mission</em>',
      'causes.sub': 'Each cause focuses real needs and concrete solutions. Hover to learn more.',
      'causes.priority': 'Priority {n}',
      'causes.link': 'Help now',
      'causes.donors': '{n} donors',

      'stories.label': 'Field stories',
      'stories.title': 'What our teams <em>see</em>',
      'stories.sub': 'Stories and reports from conflict zones. Every image tells a story.',
      'carousel.prev': 'Previous',
      'carousel.next': 'Next',
      'carousel.dot': 'Slide {n}',

      'publications.label': 'Publications',
      'publications.title': 'Reports & <em>Analysis</em>',
      'publications.sub': 'Reference documents to understand and act.',
      'pub.download': 'Download: {title}',

      'temoignages.label': 'Voices from the field',
      'temoignages.title': 'They <em>rise again.</em><br>They testify.',
      'temoignages.sub': 'Behind every testimony, a life being rebuilt.',
      'tcat.beneficiary': 'Beneficiary',
      'tcat.volunteer': 'Volunteer',
      'tcat.donor': 'Donor',
      'tcat.partner': 'Partner',
      'tcat.field-worker': 'Field worker',
      'tcat.default': 'Testimonial',
      'citations.aria': 'Inspiring quotes',
      'cit.dot': 'Quote {n}',
      'cit.c1.text': '« Injustice anywhere is a threat to justice everywhere. »',
      'cit.c1.author': '— Martin Luther King Jr.',
      'cit.c2.text': '« If you can\'t feed a hundred people, feed just one. »',
      'cit.c2.author': '— Mother Teresa',
      'cit.c3.text': '« The life of a single man is worth as much as that of all humanity. »',
      'cit.c3.author': '— Albert Einstein',
      'cit.c4.text': '« One child, one teacher, one book, one pen can change the world. »',
      'cit.c4.author': '— Malala Yousafzai',

      'donner.label': 'Act now',
      'donner.title': 'Your donation changes<br>a <em>real life</em>',
      'donner.sub': 'Funds raised directly finance field programs. Operating costs are covered separately.',

      'don.feature.secure.title': 'Secure payment',
      'don.feature.secure.desc': '256-bit SSL encryption. Your banking data is never stored on our servers.',
      'don.feature.report.title': 'Usage report',
      'don.feature.report.desc': 'A usage report is sent to every donor with details on how funds are used.',
      'don.feature.receipt.title': 'Donation certificate',
      'don.feature.receipt.desc': 'Donation certificate available on request from our team. Deduction rules depend on your country of residence.',
      'don.feature.recurring.title': 'Recurring donations available',
      'don.feature.recurring.desc': 'Monthly support for long-term action. Cancel anytime.',

      'form.title': 'Make a secure donation',
      'form.aria': 'Donation form',
      'form.step.amount': '1. Choose your amount',
      'form.step.cause': '2. Choose the beneficiary cause',
      'form.step.payment': '3. Payment method',
      'form.custom.label': 'Custom amount',
      'form.custom.placeholder': 'Or enter a custom amount (e.g. 1000)',
      'form.cause.label': 'Beneficiary cause',
      'form.cause.placeholder': '— Select a cause or all causes —',
      'causeopt.deplaces': 'Displaced people & war refugees',
      'causeopt.orphelins': 'Orphaned children in conflict zones',
      'causeopt.veuves': 'Widows & women survivors of violence',
      'causeopt.victimes': 'Victims of armed violence',
      'causeopt.handicapes': 'People with disabilities in war zones',
      'causeopt.all': 'All causes',

      'pay.carte': 'Card',
      'pay.mobile': 'Mobile Money',
      'pay.virement': 'Bank transfer',

      'card.name.label': 'Name on card',
      'card.name.placeholder': 'Name on card',
      'card.email.label': 'Email for the receipt',
      'card.email.placeholder': 'Email for the tax receipt',
      'card.hint': 'Secure payment: you will be redirected to Stripe to enter your card details.',

      'providers.mpesa': 'M-Pesa',
      'providers.airtel': 'Airtel Money',
      'providers.orange': 'Orange Money',
      'providers.wave': 'Wave',

      'mobile.phone.label': 'Phone number',
      'mobile.phone.placeholder': 'Mobile Money phone number (+243...)',
      'mobile.name.label': 'Account holder name',
      'mobile.name.placeholder': 'Full account holder name',
      'mobile.email.label': 'Confirmation email',
      'mobile.email.placeholder': 'Email for confirmation',

      'wire.coord': 'Bank details',
      'wire.beneficiary': 'Beneficiary',
      'wire.iban': 'IBAN',
      'wire.bic': 'BIC/SWIFT',
      'wire.bank': 'Bank',
      'wire.ref': 'Reference',
      'wire.name.label': 'Your name',
      'wire.name.placeholder': 'Your name (for receipt confirmation)',
      'wire.email.label': 'Email for the receipt',
      'wire.email.placeholder': 'Email for the receipt',

      'form.ssl': 'Secure SSL 256-bit connection — Data encrypted and protected',
      'form.submit': 'Confirm my donation — $',
      'form.processing': 'Processing...',
      'form.submitShort': 'Confirm donation',

      'don.err.amount': 'Please choose or enter a valid amount.',
      'don.err.email': 'Please enter your email to receive the receipt.',
      'don.err.network': 'The payment could not be initiated. Check your connection and try again.',
      'don.err.submit': 'An error occurred while submitting your donation. Please try again.',
      'don.paidReceived': 'Payment received',
      'don.transmitted': 'Your payment has been transmitted.',
      'don.ref': 'Reference: {ref}',
      'don.confirmSuffix': ' — Awaiting payment confirmation.',
      'don.definitiveSuffix': ' — Final confirmation of your donation will be recorded after payment verification.',
      'don.cancelled.title': 'Payment cancelled',
      'don.cancelled.msg': 'Payment cancelled. You can try again or choose another payment method.',
      'don.cancelled.notSaved': 'Donation not recorded',
      'don.anonymous': 'Anonymous',

      'modal.title': 'Thank you for your donation',
      'modal.text': 'Your contribution will directly fund programs in the Democratic Republic of the Congo.',
      'modal.close': 'Close',
      'modal.x': 'Close',

      'actualites.label': 'Field & Reports',
      'actualites.title': 'News from the <em>crisis</em>',
      'actualites.sub': 'Stay informed to act effectively. Our teams report from the field every week.',

      'partenaires.label': 'Our partners',
      'partenaires.title': 'Together for <em>humanitarian</em> work',
      'partenaires.sub': 'Organizations from around the world trust us.',

      'faq.label': 'Frequently asked questions',
      'faq.title': 'Have any <em>questions</em>?',
      'faq.sub': 'Everything you need to know about HumanitAID and your donations.',
      'faq.q1': 'Where exactly does my donation go?',
      'faq.a1': 'Your donation directly funds programmes for the people in the DRC. Our operating costs are covered separately by institutional donors. You receive a detailed report on how your funds are used.',
      'faq.q2': 'How can I get my tax receipt?',
      'faq.a2': 'After your gift, our team can send you a donation certificate on request (contact: support@humanit-aid.org). Deduction rules depend on your country of residence; please check with your tax authority.',
      'faq.q3': 'Can I make a recurring donation?',
      'faq.a3': 'Yes! You can choose to become a monthly partner when donating. The payment is automatic and you can cancel at any time by writing to support@humanit-aid.org.',
      'faq.q4': 'How does HumanitAID guarantee transparency?',
      'faq.a4': 'Every donation received is tracked end to end. We publish regular reports on how funds are used and share detailed information with donors. Documents are available on request.',
      'faq.q5': 'In which regions do you operate?',
      'faq.a5': 'We mainly operate in the provinces of North Kivu, South Kivu and Ituri, the areas hardest hit by armed conflict. Our teams also work in the displacement camps of Goma, Butembo, Beni, Uvira and Minembwe.',

      'cta.aria': 'Call to action',
      'cta.title': 'Join the movement.<br>Your gift <em style="color:var(--or);font-style:normal;">fuels</em> recovery.',
      'cta.sub': 'Too many families are still waiting for humanitarian aid. Every gift, whatever the amount, directly funds the programmes.',
      'cta.btn1': 'Donate',
      'cta.btn2': 'See the campaigns',

      'footer.desc': 'HumanitAID raises funds for the victims of armed conflict in the eastern Democratic Republic of the Congo. The use of funds is published in regular reports.',
      'footer.col1.title': 'Our causes',
      'footer.col1.l1': 'War displaced',
      'footer.col1.l2': 'Orphaned children',
      'footer.col1.l3': 'Widows & women',
      'footer.col1.l4': 'Victims of violence',
      'footer.col1.l5': 'People with disabilities',
      'footer.col2.title': 'Organization',
      'footer.col2.l1': 'About us',
      'footer.col2.l2': 'Our field team',
      'footer.col2.l3': 'Annual reports',
      'footer.col2.l4': 'Partners',
      'footer.col2.l5': 'Become a volunteer',
      'footer.col2.l6': 'Press & Media',
      'footer.col3.title': 'Contact',
      'footer.col3.l1': 'Whatsapp / Signal',
      'footer.col3.l2': 'Goma, North Kivu — DRC',
      'footer.col3.l3': 'Brussels — Europe',
      'footer.rights': 'HumanitAID Foundation · All rights reserved',
      'footer.b1': 'Privacy policy',
      'footer.b2': 'Terms of use',
      'footer.b3': 'Financial report 2024',
    },

    es: {
      'meta.title': 'HumanitAID — Ayuda humanitaria en la RDC | Solidaridad y dignidad',

      'skip.link': 'Ir al contenido principal',

      'ticker.1': 'Crisis humanitaria activa en el este de la RDC — apoyo a los desplazados en Goma y Butembo',
      'ticker.2': 'Niños en zonas de conflicto — cada donación apoya la protección y la educación',
      'ticker.3': 'Viudas y mujeres supervivientes — acompañamiento psicosocial en Beni, Minembwe y Uvira',
      'ticker.4': 'Víctimas de violencias — rehabilitación y acompañamiento psicosocial',
      'ticker.5': 'Personas con discapacidad en zonas de guerra — apoyo a la accesibilidad y los cuidados',
      'ticker.6': '« Mientras puedas ayudar, tienes el deber de hacerlo » — Únete hoy a los donantes',
      'ticker.7': '« La generosidad no tiene fronteras — tampoco la humanidad » — Dona ahora',
      'ticker.aria': 'Alertas humanitarias',

      'nav.label': 'Navegación principal',
      'nav.home': 'Inicio',
      'nav.collectes': 'Campañas',
      'nav.apropos': 'Nosotros',
      'nav.rapports': 'Informes',
      'nav.commentAider': 'Cómo ayudar',
      'nav.partenaires': 'Socios',
      'nav.contact': 'Contacto',
      'nav.causesAll': 'Ver todas las causas',
      'menu.app': 'Aplicación',
      'nav.causes': 'Causas',
      'nav.stories': 'Historias',
      'nav.temoignages': 'Testimonios',
      'nav.actualites': 'Noticias',
      'nav.donner': 'Donar',

      'pwa.install.title': 'Instalar HumanitAID',
      'pwa.install.text': 'Añade la app a tu pantalla de inicio para un acceso rápido, incluso con conexión limitada.',
      'pwa.install.btn': 'Instalar',
      'pwa.install.dismiss': 'Más tarde',

      'menu.label': 'Menú',
      'menu.close': 'Cerrar menú',
      'menu.title': 'Menú móvil',
      'menu.nav': 'Navegación',
      'menu.appearance': 'Apariencia',

      'lang.label': 'Idioma',
      'lang.aria': 'Cambiar idioma',

      'theme.label': 'Cambiar tema',
      'theme.light': 'Modo claro',
      'theme.dark': 'Modo oscuro',
      'theme.system': 'Modo sistema',
      'theme.lightTitle': 'Claro',
      'theme.darkTitle': 'Oscuro',
      'theme.systemTitle': 'Sistema',

      'hero.diaporama': 'Presentación',
      'hero.dot': 'Diapositiva {n}',
      'hero.btn1': 'Dona ahora',
      'hero.btn2': 'Descubre las causas',

      'stat.raised': 'Total recaudado',
      'stat.donors': 'Donantes en todo el mundo',
      'stat.aria': 'Cifras clave',

      'apropos.label': 'Nuestra misión',
      'apropos.title': 'Una respuesta humanitaria para el <em>este de la RDC</em>',
      'apropos.p1': 'HumanitAID es una organización humanitaria centrada en las personas afectadas por conflictos y crisis en el este de la República Democrática del Congo, principalmente en las provincias de Kivu del Norte, Kivu del Sur e Ituri.',
      'apropos.p2': 'Desplazados de guerra, niños huérfanos, viudas y mujeres supervivientes, víctimas de violencias, personas con discapacidad: recaudamos fondos y apoyamos programas que les aportan protección, cuidados, educación y dignidad.',
      'apropos.p3': 'Tus donaciones financian directamente los programas; nuestros costes operativos se cubren por separado con donantes institucionales.',
      'apropos.cta': 'Apoyar a HumanitAID',
      'apropos.why1.title': 'Transparencia',
      'apropos.why1.desc': 'Informes de uso publicados y enviados a los donantes.',
      'apropos.why2.title': 'Impacto directo',
      'apropos.why2.desc': 'Los fondos apoyan programas sobre el terreno, junto a los beneficiarios.',
      'apropos.why3.title': 'Dignidad',
      'apropos.why3.desc': 'Cada persona apoyada es acompañada con respeto y dignidad.',

      'collectes.label': 'Estado de las campañas',
      'collectes.title': 'Tu dinero en <em>obras</em>',
      'collectes.sub': 'El detalle de cada campaña se publica, importe por importe.',
      'collectes.goal': 'Objetivo',
      'collectes.daysLeft': 'días restantes',

      'causes.label': 'Nuestros beneficiarios',
      'causes.title': 'Cinco causas, <em>una misión</em>',
      'causes.sub': 'Cada causa concentra necesidades concretas y soluciones concretas. Pasa el cursor para saber más.',
      'causes.priority': 'Prioridad {n}',
      'causes.link': 'Ayudar ahora',
      'causes.donors': '{n} donantes',

      'stories.label': 'Historias del terreno',
      'stories.title': 'Lo que nuestros equipos <em>ven</em>',
      'stories.sub': 'Relatos y reportajes desde las zonas de conflicto. Cada imagen cuenta una historia.',
      'carousel.prev': 'Anterior',
      'carousel.next': 'Siguiente',
      'carousel.dot': 'Diapositiva {n}',

      'publications.label': 'Publicaciones',
      'publications.title': 'Informes y <em>análisis</em>',
      'publications.sub': 'Documentos de referencia para comprender y actuar.',
      'pub.download': 'Descargar: {title}',

      'temoignages.label': 'Voces del terreno',
      'temoignages.title': 'Ellos <em>renacen.</em><br>Dan testimonio.',
      'temoignages.sub': 'Detrás de cada testimonio, una vida que se reconstruye.',
      'tcat.beneficiary': 'Beneficiario',
      'tcat.volunteer': 'Voluntario',
      'tcat.donor': 'Donante',
      'tcat.partner': 'Socio',
      'tcat.field-worker': 'Trabajador de terreno',
      'tcat.default': 'Testimonio',
      'citations.aria': 'Citas inspiradoras',
      'cit.dot': 'Cita {n}',
      'cit.c1.text': '« Injustice anywhere is a threat to justice everywhere. »',
      'cit.c1.author': '— Martin Luther King Jr.',
      'cit.c2.text': '« Si no puedes alimentar a cien personas, alimenta a una sola. »',
      'cit.c2.author': '— Madre Teresa',
      'cit.c3.text': '« La vida de un solo hombre vale tanto como la de toda la humanidad. »',
      'cit.c3.author': '— Albert Einstein',
      'cit.c4.text': '« Un niño, un maestro, un libro y un lápiz pueden cambiar el mundo. »',
      'cit.c4.author': '— Malala Yousafzai',

      'donner.label': 'Actúa ahora',
      'donner.title': 'Tu donación cambia<br>una <em>vida real</em>',
      'donner.sub': 'Los fondos recaudados financian directamente los programas sobre el terreno. Los costes operativos se cubren por separado.',

      'don.feature.secure.title': 'Pago seguro',
      'don.feature.secure.desc': 'Cifrado SSL de 256 bits. Tus datos bancarios nunca se almacenan en nuestros servidores.',
      'don.feature.report.title': 'Informe de uso',
      'don.feature.report.desc': 'Cada donante recibe un informe de uso con el detalle del uso de los fondos.',
      'don.feature.receipt.title': 'Certificado de donación',
      'don.feature.receipt.desc': 'Certificado de donación disponible a petición de nuestro equipo. Las condiciones de deducción dependen de tu país de residencia.',
      'don.feature.recurring.title': 'Donación recurrente posible',
      'don.feature.recurring.desc': 'Apoyo mensual para una acción continua. Cancelable en cualquier momento.',

      'form.title': 'Haz una donación segura',
      'form.aria': 'Formulario de donación',
      'form.step.amount': '1. Elige el importe',
      'form.step.cause': '2. Elige la causa beneficiaria',
      'form.step.payment': '3. Método de pago',
      'form.custom.label': 'Importe personalizado',
      'form.custom.placeholder': 'O introduce un importe personalizado (ej: 1000)',
      'form.cause.label': 'Causa beneficiaria',
      'form.cause.placeholder': '— Selecciona una causa o todas las causas —',
      'causeopt.deplaces': 'Desplazados y refugiados de guerra',
      'causeopt.orphelins': 'Niños huérfanos en zonas de conflicto',
      'causeopt.veuves': 'Viudas y mujeres supervivientes de violencia',
      'causeopt.victimes': 'Víctimas de la violencia armada',
      'causeopt.handicapes': 'Personas con discapacidad en zonas de guerra',
      'causeopt.all': 'Todas las causas',

      'pay.carte': 'Tarjeta',
      'pay.mobile': 'Mobile Money',
      'pay.virement': 'Transferencia',

      'card.name.label': 'Nombre en la tarjeta',
      'card.name.placeholder': 'Nombre en la tarjeta',
      'card.email.label': 'Correo para el recibo',
      'card.email.placeholder': 'Correo para el recibo fiscal',
      'card.hint': 'Pago seguro: serás redirigido a Stripe para introducir los datos de tu tarjeta.',

      'providers.mpesa': 'M-Pesa',
      'providers.airtel': 'Airtel Money',
      'providers.orange': 'Orange Money',
      'providers.wave': 'Wave',

      'mobile.phone.label': 'Número de teléfono',
      'mobile.phone.placeholder': 'Número de teléfono Mobile Money (+243...)',
      'mobile.name.label': 'Nombre del titular',
      'mobile.name.placeholder': 'Nombre completo del titular',
      'mobile.email.label': 'Correo de confirmación',
      'mobile.email.placeholder': 'Correo para la confirmación',

      'wire.coord': 'Datos bancarios',
      'wire.beneficiary': 'Beneficiario',
      'wire.iban': 'IBAN',
      'wire.bic': 'BIC/SWIFT',
      'wire.bank': 'Banco',
      'wire.ref': 'Referencia',
      'wire.name.label': 'Tu nombre',
      'wire.name.placeholder': 'Tu nombre (para confirmar la recepción)',
      'wire.email.label': 'Correo para el recibo',
      'wire.email.placeholder': 'Correo para el recibo',

      'form.ssl': 'Conexión segura SSL de 256 bits — Datos cifrados y protegidos',
      'form.submit': 'Confirmar mi donación — $',
      'form.processing': 'Procesando...',
      'form.submitShort': 'Confirmar donación',

      'don.err.amount': 'Por favor, elige o introduce un importe válido.',
      'don.err.email': 'Por favor, introduce tu correo para recibir el recibo.',
      'don.err.network': 'No se pudo iniciar el pago. Comprueba tu conexión e inténtalo de nuevo.',
      'don.err.submit': 'Ocurrió un error al enviar tu donación. Inténtalo de nuevo.',
      'don.paidReceived': 'Pago recibido',
      'don.transmitted': 'Tu pago se ha transmitido correctamente.',
      'don.ref': 'Referencia: {ref}',
      'don.confirmSuffix': ' — En espera de confirmación del pago.',
      'don.definitiveSuffix': ' — La confirmación definitiva de tu donación se registrará tras la verificación del pago.',
      'don.cancelled.title': 'Pago cancelado',
      'don.cancelled.msg': 'Pago cancelado. Puedes reintentarlo o elegir otro método de pago.',
      'don.cancelled.notSaved': 'Donación no registrada',
      'don.anonymous': 'Anónimo',

      'modal.title': 'Gracias por tu donación',
      'modal.text': 'Tu contribución financiará directamente los programas en la República Democrática del Congo.',
      'modal.close': 'Cerrar',
      'modal.x': 'Cerrar',

      'actualites.label': 'Terreno e informes',
      'actualites.title': 'La actualidad de la <em>crisis</em>',
      'actualites.sub': 'Mantente informado para actuar mejor. Nuestros equipos informan desde el terreno cada semana.',

      'partenaires.label': 'Nuestros socios',
      'partenaires.title': 'Juntos por la <em>ayuda humanitaria</em>',
      'partenaires.sub': 'Organizaciones de todo el mundo confían en nosotros.',

      'faq.label': 'Preguntas frecuentes',
      'faq.title': '¿Tienes <em>preguntas</em>?',
      'faq.sub': 'Todo lo que necesitas saber sobre HumanitAID y tus donaciones.',
      'faq.q1': '¿Adónde va exactamente mi donación?',
      'faq.a1': 'Tu donación financia directamente los programas en beneficio de las poblaciones en la RDC. Nuestros costes operativos se cubren por separado con donantes institucionales. Recibes un informe detallado sobre el uso de los fondos.',
      'faq.q2': '¿Cómo puedo obtener mi recibo fiscal?',
      'faq.a2': 'Tras tu donativo, nuestro equipo puede enviarte un certificado de donación a petición (contacto: support@humanit-aid.org). Las condiciones de deducción fiscal dependen de tu país de residencia; infórmate en tu administración tributaria.',
      'faq.q3': '¿Puedo hacer una donación recurrente?',
      'faq.a3': '¡Sí! Puedes convertirte en socio mensual al donar. El cobro es automático y puedes cancelarlo en cualquier momento escribiendo a support@humanit-aid.org.',
      'faq.q4': '¿Cómo garantiza HumanitAID la transparencia?',
      'faq.a4': 'Cada donación recibida se rastrea de principio a fin. Publicamos informes regulares sobre el uso de los fondos y compartimos información detallada con los donantes. Los documentos están disponibles a petición.',
      'faq.q5': '¿En qué regiones intervenís?',
      'faq.a5': 'Intervenimos principalmente en las provincias de Kivu del Norte, Kivu del Sur e Ituri, las zonas más afectadas por los conflictos armados. Nuestros equipos también operan en los campamentos de desplazados de Goma, Butembo, Beni, Uvira y Minembwe.',

      'cta.aria': 'Llamada a la acción',
      'cta.title': 'Únete a la movilización.<br>Tu donación <em style="color:var(--or);font-style:normal;">sostiene</em> la reconstrucción.',
      'cta.sub': 'Demasiadas familias siguen esperando ayuda humanitaria. Cada donación, sea cual sea su importe, financia directamente los programas.',
      'cta.btn1': 'Donar',
      'cta.btn2': 'Ver las campañas',

      'footer.desc': 'HumanitAID recauda fondos para las víctimas de los conflictos armados en el este de la República Democrática del Congo. El uso de los fondos se publica en informes regulares.',
      'footer.col1.title': 'Nuestras causas',
      'footer.col1.l1': 'Desplazados de guerra',
      'footer.col1.l2': 'Niños huérfanos',
      'footer.col1.l3': 'Viudas y mujeres',
      'footer.col1.l4': 'Víctimas de la violencia',
      'footer.col1.l5': 'Personas con discapacidad',
      'footer.col2.title': 'Organización',
      'footer.col2.l1': 'Sobre nosotros',
      'footer.col2.l2': 'Nuestro equipo de terreno',
      'footer.col2.l3': 'Informes anuales',
      'footer.col2.l4': 'Socios',
      'footer.col2.l5': 'Hazte voluntario',
      'footer.col2.l6': 'Prensa y medios',
      'footer.col3.title': 'Contacto',
      'footer.col3.l1': 'Whatsapp / Signal',
      'footer.col3.l2': 'Goma, Kivu Norte — RDC',
      'footer.col3.l3': 'Bruselas — Europa',
      'footer.rights': 'HumanitAID Foundation · Todos los derechos reservados',
      'footer.b1': 'Política de privacidad',
      'footer.b2': 'Términos de uso',
      'footer.b3': 'Informe financiero 2024',
    },
  },

  get lang() {
    return this._lang || this.detect();
  },

  set lang(value) {
    this._lang = this.supported.includes(value) ? value : 'fr';
  },

  detect() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && this.supported.includes(stored)) return stored;
    const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return this.supported.includes(nav) ? nav : 'fr';
  },

  t(key, vars) {
    const table = this.dict[this.lang] || this.dict.fr;
    let s = (table[key] !== undefined) ? table[key] : (this.dict.fr[key] !== undefined ? this.dict.fr[key] : key);
    if (vars) {
      for (const k in vars) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return s;
  },

  setLang(lang, { persist = true } = {}) {
    if (!this.supported.includes(lang)) return;
    this._lang = lang;
    if (persist) localStorage.setItem(this.STORAGE_KEY, lang);
    this.apply();
  },

  apply() {
    document.documentElement.setAttribute('lang', this.lang);

    const title = this.t('meta.title');
    if (document.title && title !== 'meta.title') document.title = title;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (val !== key) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', this.t(el.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', this.t(el.dataset.i18nTitle));
    });

    const switcher = document.getElementById('lang-switcher');
    if (switcher) switcher.value = this.lang;
    const mobileSwitcher = document.getElementById('lang-switcher-mobile');
    if (mobileSwitcher) mobileSwitcher.value = this.lang;

    document.dispatchEvent(new CustomEvent('ha:langchange', { detail: { lang: this.lang } }));
  },

  init() {
    this._lang = this.detect();
    this.apply();
  },
};

function bindLangSwitcher() {
  document.querySelectorAll('.lang-switcher').forEach((switcher) => {
    switcher.addEventListener('change', () => {
      if (switcher.value) I18N.setLang(switcher.value);
    });
  });
}

I18N.init();
bindLangSwitcher();