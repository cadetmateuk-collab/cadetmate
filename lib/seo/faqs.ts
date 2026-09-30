/** Shared FAQ copy for landing page UI + FAQPage schema. */
export const LANDING_FAQS = [
  {
    question: 'Is CadetMate for UK deck cadets and MCA training?',
    answer:
      'Yes. CadetMate is built for UK merchant navy deck cadets working toward Officer of the Watch (OOW). Content covers college modules, sea phases, Training Record Book (TRB) tasks, COLREGS revision, STCW topics, and MCA oral exam preparation.',
  },
  {
    question: 'What maritime topics does CadetMate cover?',
    answer:
      'CadetMate supports navigation and chartwork, COLREGS (rules of the road), seamanship, cargo and stability, meteorology, signals, sea survival, TRB evidence, and MCA oral practice — organised around the real UK cadetship journey from college to qualification.',
  },
  {
    question: 'Is CadetMate free to start?',
    answer:
      'Yes. Create a free account for community access, daily quizzes, limited flashcards, progress tracking, and free maritime articles. Premium unlocks the full module library and oral question banks. Flashcard packs are sold separately in the store.',
  },
  {
    question: 'Does CadetMate help with MCA oral exams?',
    answer:
      'Premium includes mock oral practice and a large practice question bank designed for deck cadet oral prep. Free accounts can still use free guides, community discussions, and limited revision tools while building toward orals.',
  },
  {
    question: 'Who creates the training content?',
    answer:
      'CadetMate is developed for cadets by mariners and educators familiar with the UK deck pathway. Free articles and platform tools are written to match how cadets actually study at college, at sea, and ashore — not generic exam dumps.',
  },
  {
    question: 'How much time do I need each week?',
    answer:
      'CadetMate is built for short sessions between lectures and watches. Many cadets use daily quizzes and flashcards in 10–20 minutes. Premium modules can be studied at your own pace — there is no live timetable you must attend.',
  },
  {
    question: 'Is CadetMate an official MCA or college qualification?',
    answer:
      'No. CadetMate is a study companion, not an MCA-endorsed college or awarding body. It will not replace approved training, sea service, or oral exams. Use it to organise revision and practise alongside your cadetship.',
  },
  {
    question: 'What does Premium cost, and can I get a refund?',
    answer:
      'The current Premium price is shown on the pricing page. You can start free with no credit card. Refunds and cancellation for paid plans are explained in the Refund Policy. Flashcard packs are sold separately.',
  },
] as const;

/** Extra questions shown on /faq (landing already covers the set above). */
export const FAQ_PAGE_EXTRA = [
  {
    question: 'Do I need a credit card to start?',
    answer:
      'No. The free plan does not require a card. You only enter payment details if you upgrade to Premium or buy a store pack.',
  },
  {
    question: 'Can I use CadetMate at sea with limited internet?',
    answer:
      'The web app needs a connection for most features. A companion mobile app is designed for cadets who need study tools with offline-friendly workflows. Sign in with the same CadetMate account.',
  },
  {
    question: 'Are flashcards included with Premium?',
    answer:
      'No. Flashcard packs are à-la-carte. Free packs can be claimed in the store; paid packs are purchased individually. Premium is for modules, orals, and TRB tools.',
  },
  {
    question: 'How do I cancel Premium?',
    answer:
      'Open Profile → Billing and use the Stripe billing portal, or email support. Cancellation stops the next renewal; access continues until the period you already paid for unless a refund is agreed.',
  },
  {
    question: 'Who is CadetMate for if I am only aspiring to a cadetship?',
    answer:
      'Aspiring deck cadets can use free guides, community preview, and a free account to learn how UK cadetships, TRB, and orals work before joining a programme.',
  },
] as const;

export const ALL_PUBLIC_FAQS = [...LANDING_FAQS, ...FAQ_PAGE_EXTRA];
