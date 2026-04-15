export type TaskCategory =
  | "Safety"
  | "Maintenance"
  | "Bridge Watchkeeping & Navigation"
  | "Ship Operations"
  | "Mooring & Anchoring"
  | "Operational Management";

export interface TaskStep {
  step: number | string;
  title: string;
  description: string;
  imagePlaceholder?: string;
}

export interface TRBTask {
  id: string;
  code: string;
  title: string;
  category: TaskCategory;
  description: string;
  guidance: string;
  steps: TaskStep[];
}

export const categoryColors: Record<TaskCategory, string> = {
  Safety: "hsl(0, 72%, 51%)",
  Maintenance: "hsl(32, 95%, 44%)",
  "Bridge Watchkeeping & Navigation": "hsl(199, 89%, 42%)",
  "Ship Operations": "hsl(142, 70%, 38%)",
  "Mooring & Anchoring": "hsl(271, 65%, 50%)",
  "Operational Management": "hsl(47, 95%, 40%)",
};

export const categoryBgColors: Record<TaskCategory, string> = {
  Safety: "bg-red-50 text-red-700 border-red-200",
  Maintenance: "bg-orange-50 text-orange-700 border-orange-200",
  "Bridge Watchkeeping & Navigation": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Ship Operations": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Mooring & Anchoring": "bg-purple-50 text-purple-700 border-purple-200",
  "Operational Management": "bg-yellow-50 text-yellow-700 border-yellow-200",
};

export const categories: TaskCategory[] = [
  "Safety",
  "Maintenance",
  "Bridge Watchkeeping & Navigation",
  "Ship Operations",
  "Mooring & Anchoring",
  "Operational Management",
];

export const trbTasks: TRBTask[] = [
  // ── 5.1 SAFETY ──────────────────────────────────────────────
  {
    id: "a11",
    code: "A11",
    title: "Take personal emergency action on board a vessel",
    category: "Safety",
    description: "Tasks covering A11 and A12 jointly. 'Making progress' satisfies A11; 'Satisfactory' satisfies A12.",
    guidance: "Start early – these are priority tasks that should be signed within your first 2–3 weeks on board. Attend every drill and volunteer for different emergency team roles each time. Keep a pocket notebook to jot down equipment locations during your safety tour. Ask the Chief Officer or Safety Officer to walk you through fixed fire-fighting systems – don't just read the manual. When practising BA (breathing apparatus), focus on communication and search patterns, not just wearing the gear. Record drill dates in your TRB immediately – don't leave it to memory. The MCA examiner will check these tasks are fully completed and may ask you to describe specific drills in detail.",
    steps: [
      { step: 1, title: "Raise the alarm in different scenarios", description: "Demonstrate knowledge of how to raise the alarm in a range of different scenarios representing emergencies discovered in various locations on board and describe the appropriate initial action to take." },
      { step: 2, title: "Communicate with emergency personnel", description: "Demonstrate an ability to communicate information clearly with both shipboard and shoreside emergency personnel." },
      { step: 3, title: "Respond to alarm situations", description: "Demonstrate an ability to respond to all alarm status situations and report to the designated area wearing appropriate safety equipment." },
      { step: 4, title: "First aid response", description: "Demonstrate an ability to act as first responder and describe how to apply first aid to casualties in a range of different injury scenarios on board." },
      { step: 5, title: "Operate fire-fighting and emergency systems", description: "Demonstrate knowledge of how to: operate the fixed fire fighting system for accommodation, engine room, pumproom/cargo spaces as applicable; operate automatic and manual fire flaps, fire doors, watertight doors, ventilation and air conditioning systems; operate emergency shut off valves, pump stops, main engine stops; start the main and emergency fire pumps and emergency generator." },
      { step: 6, title: "Accommodation fire drill", description: "Demonstrate an ability to undertake the role of any emergency team member in an accommodation fire drill." },
      { step: 7, title: "Open deck oil/gas fire drill", description: "Demonstrate an ability to undertake the role of any emergency team member in an open deck oil/gas fire drill." },
      { step: 8, title: "Machinery space fire drill", description: "Demonstrate an ability to undertake the role of any emergency team member in a machinery space fire drill." },
      { step: 9, title: "Low visibility search and rescue drill", description: "Demonstrate an ability to undertake the role of any emergency team member in a low visibility accommodation search and rescue drill." },
      { step: 10, title: "BA search drill in poor visibility", description: "Demonstrate an ability to undertake the role of any emergency team member wearing BA in a poor visibility accommodation or machinery space casualty search drill." },
      { step: 11, title: "Enclosed space rescue drill", description: "Demonstrate an ability to undertake the role of any emergency team member in an enclosed space casualty rescue drill." },
    ],
  },
  {
    id: "a12",
    code: "A12",
    title: "Respond to emergencies on board a vessel",
    category: "Safety",
    description: "Covered jointly with A11 – the 'Satisfactory' sign-off for the tasks above satisfies A12.",
    guidance: "A12 is assessed through the same 11 tasks as A11. The key difference is that 'Satisfactory' means you can perform the task independently, not just under instruction. To reach this level, actively debrief after every drill: what went well, what could be improved? Study the ship's Emergency Procedures Manual and SMS – the examiner may ask you to explain procedures you haven't drilled. Practise communicating with shore authorities (Coastguard, Port Control) during exercises. Know your SOPEP and SMPEP plans. The more varied your drill experience (different ships, different scenarios), the better prepared you'll be.",
    steps: [
      { step: 1, title: "Shared tasks with A11", description: "A12 is assessed through the same 11 tasks as A11 above. The 'Making progress' column satisfies A11, while the 'Satisfactory' column satisfies A12. You must demonstrate competence at both levels." },
    ],
  },
  {
    id: "a15",
    code: "A15",
    title: "Take control of survival craft and rescue boats",
    category: "Safety",
    description: "Demonstrate competence in taking charge of survival craft and rescue boat operations.",
    guidance: "These tasks can partly be covered during your PSC&RB (Proficiency in Survival Craft & Rescue Boats) short course if opportunities don't arise at sea. However, try to get as much practical experience on board as possible – it's far more valuable than shore-based training alone. Volunteer for rescue boat crew duties. During abandon ship drills, ask to take charge of preparing the liferaft rather than just standing at your muster station. Know the location and operation of every EPIRB and SART on board. Practise explaining pyrotechnic procedures aloud – the examiner will expect you to describe the correct sequence confidently.",
    steps: [
      { step: 1, title: "Effective team member with safety awareness", description: "Demonstrate an ability to perform effectively as a team member displaying awareness for the safety of self and others at all times." },
      { step: 2, title: "Clear communication during operations", description: "Demonstrate an ability to communicate clearly with the bridge, other shipboard locations, team members, and others providing external assistance." },
      { step: 3, title: "Take charge of survival craft operations", description: "Demonstrate an ability to: take charge of the preparation of survival craft and rescue boats for launching; give appropriate orders for the preparation and launching of survival craft and rescue boats; take charge of launching survival craft and rescue boats; take charge of and handle survival craft and rescue boats after launching; instruct team members and passengers in abandonment and survival procedures." },
      { step: 4, title: "Operate pyrotechnics and emergency equipment", description: "Demonstrate an ability to: locate and explain the correct procedure for operating pyrotechnics and line throwing apparatus; locate and explain the correct procedure for operating emergency radio equipment, EPIRB and SART." },
      { step: 5, title: "Man overboard drill participation", description: "Demonstrate an ability to undertake the role of any team member in a man overboard drill." },
    ],
  },

  // ── 5.2 MAINTENANCE ─────────────────────────────────────────
  {
    id: "a21",
    code: "A21",
    title: "Maintain steelwork and deck equipment on board a vessel",
    category: "Maintenance",
    description: "Carry out routine and non-routine inspection and maintenance of deck equipment, steelwork, and fittings.",
    guidance: "Maintenance tasks are where you'll spend much of your first sea phase. Approach them enthusiastically – they teach you how the ship works. Always complete a risk assessment before starting any job and use the permit-to-work system when required. Learn the ship's Planned Maintenance System (PMS) and record every job accurately. For ropework (tasks 4a–4k), practise splicing and knots in your free time – speed comes with repetition. When painting, understand why surface preparation matters more than the topcoat. Take photos of your work for your workbook. The Bosun is your best teacher for practical seamanship – shadow them whenever possible.",
    steps: [
      { step: 1, title: "Safety awareness during maintenance", description: "Display awareness for the safety of self and others at all times during work activities." },
      { step: 2, title: "Compliance with maintenance procedures", description: "Demonstrate knowledge of and compliance with maintenance procedures: the ship's SMS as it relates to work activities; the ship's planned maintenance system; risk assessment plans and how to carry out assessments; the ship's permit to work system; special precautions for work in hazardous areas." },
      { step: 3, title: "Safe working practices", description: "Demonstrate knowledge of and compliance with safe working practices: work planning; entry into enclosed spaces; work aloft and outboard; preparation of work area; selection of correct tools, materials and equipment; selection and use of PPE; manual lifting and carrying; use of power operated tools; use of lifting gear; safe stowage on completion and disposal of waste." },
      { step: "4a", title: "Survival craft, davits, and launching equipment", description: "Undertake routine or non-routine inspection and maintenance of survival craft and equipment, davits, and launching equipment and machinery." },
      { step: "4b", title: "Other lifesaving appliances", description: "Undertake routine or non-routine inspection and maintenance of other lifesaving appliances and equipment." },
      { step: "4c", title: "Fire-fighting appliances", description: "Undertake routine or non-routine inspection and maintenance of firefighting appliances and equipment." },
      { step: "4d", title: "Windlass, winches, roller leads", description: "Undertake routine or non-routine inspection and maintenance of windlass, winches, roller leads, and similar equipment." },
      { step: "4e", title: "Watertight/weathertight closures", description: "Undertake routine or non-routine inspection and maintenance of vents, watertight doors, weathertight doors, hatches, tank lids, escape hatches, and similar." },
      { step: "4f", title: "Gangways, pilot ladders, access equipment", description: "Undertake routine or non-routine inspection and maintenance of gangways, pilot ladders, and other access equipment." },
      { step: "4g", title: "Mooring ropes, wires, anchoring equipment", description: "Undertake routine or non-routine inspection and maintenance of mooring ropes and wires, and anchoring equipment and machinery." },
      { step: "4h", title: "Lifting and rigging gear", description: "Undertake routine or non-routine inspection and maintenance of lifting, running gear, and rigging, both fixed and portable." },
      { step: "4i", title: "Cargo and operations gear", description: "Undertake routine or non-routine inspection and maintenance of cargo and operations gear, and similar." },
      { step: "4j", title: "Paintwork (internal and external)", description: "Undertake routine or non-routine inspection and maintenance of paintwork both internal and external." },
      { step: "4k", title: "Steelwork preparation and protective coatings", description: "Undertake preparation of steelwork and the application of protective coatings." },
    ],
  },

  // ── 5.3 BRIDGE WATCHKEEPING & NAVIGATION ────────────────────
  {
    id: "b01",
    code: "B01",
    title: "Contribute to maintaining a navigational watch",
    category: "Bridge Watchkeeping & Navigation",
    description: "Supporting the Officer of the Watch – carrying out tasks under instruction.",
    guidance: "B01 is your introduction to bridge watchkeeping. You'll be 'supporting' the OOW, meaning you work under direct instruction. Focus on developing good habits from day one: always maintain a proper lookout (Rule 5 COLREGS), report everything you see or hear, and never leave the bridge without permission. For steering (Task 5), you need at least 10 hours excluding instruction time – log every session in the Steering Record Table. Practise steady-course steering in varying conditions (following sea, crosswind). Learn the standard helm orders from the Helmsman's Code and respond correctly every time. The OOW will assess your reliability – show initiative but always check before acting.",
    steps: [
      { step: 1, title: "Relieve and hand over the watch", description: "Relieve and handover the watch in accordance with laid down practices and procedures." },
      { step: 2, title: "Clear communication on the bridge", description: "Demonstrate an ability to communicate clearly including: with other bridge personnel; other shipboard locations; reporting problems arising with watchkeeping operations." },
      { step: 3, title: "Assist the OOW in watch activities", description: "Assist the OOW in watch activities including: making weather observations; monitoring crew movements about the ship; monitoring alarms and indicators; safety and security checks." },
      { step: 4, title: "Keep a lookout", description: "Keep a lookout both at sea and at anchor including: reporting sights, sounds and weather changes which may affect the vessel; identifying, reporting, and giving relative bearings, of sounds, lights and other objects." },
      { step: 5, title: "Steer the ship (minimum 10 hours)", description: "Steer the ship for at least 10 hours, excluding periods of instruction, recording details in the Steering Record Table including: keeping a steady course by gyro compass, magnetic compass and visual reference point; repeating helm orders and notifying the OOW when completed; executing helm orders correctly showing full understanding of the compass and rudder indicators; countering the effect of wind, sea state and ship's speed; steering under the direction of Master/Pilot in congested or restricted areas; changing mode of steering when instructed." },
    ],
  },
  {
    id: "b02",
    code: "B02",
    title: "Maintain a navigational watch",
    category: "Bridge Watchkeeping & Navigation",
    description: "Understudying the Officer of the Watch – carrying out tasks under supervision.",
    guidance: "B02 is a significant step up from B01 – you're now 'understudying' the OOW, meaning you should be able to perform tasks with minimal guidance. This is your largest task set (19 tasks with sub-tasks). Plan your progress carefully across both sea phases. For position fixing (Task 7), practise all methods: visual bearings, celestial (sun, stars, planets), radar, and GPS. Don't rely solely on GPS – the examiner will test your ability with traditional methods. For COLREGS (Task 15), use the Section 2.5 table to track your progress through every rule. For passage planning (Task 17), ask the OOW to involve you in planning the next voyage. Keep your Workbook up to date with calculations, plots, and observations – it's assessed alongside the TRB.",
    steps: [
      { step: 1, title: "Watch handover", description: "Relieve and handover the watch in accordance with laid down practices and procedures." },
      { step: 2, title: "Clear communication", description: "Demonstrate an ability to communicate clearly with other bridge personnel, other shipboard locations, and external locations." },
      { step: 3, title: "Task management and prioritisation", description: "Demonstrate an ability to manage and prioritise tasks and complete within watch time constraints." },
      { step: 4, title: "Bridge Procedures and Standing Orders", description: "Understand and implement Bridge Procedures Guides, Standing Orders and Night Orders." },
      { step: 5, title: "Navigational publications and corrections", description: "Demonstrate knowledge of the range and general use of navigational publications, and methods of correction and updating, including: assisting in the correction of navigational warnings, temporary and preliminary notices, radio signals, light lists and sailing directions; correction of Admiralty or other charts and electronic charts; selection of charts and publications for the voyage; checking in a new chart outfit." },
      { step: 6, title: "Bridge equipment checks", description: "Demonstrate an ability to: complete pre-departure and pre-arrival bridge equipment checks to company procedures; regularly check all bridge equipment and set for optimum performance." },
      { step: "7a", title: "Position fixing – visual bearings", description: "Fix the vessel's position by visual bearings only." },
      { step: "7b", title: "Position fixing – celestial navigation", description: "Fix the vessel's position by calculation and reduction tables using the sun, the stars and planets." },
      { step: "7c", title: "Position fixing – radar and parallel indexing", description: "Fix the vessel's position by radar and monitor track by parallel indexing techniques." },
      { step: "7d", title: "Position fixing – satellite/electronic systems", description: "Fix the vessel's position by satellite and other electronic navigation systems and equipment." },
      { step: "7e", title: "Buoys, lights, marks and chart information", description: "Understand and recognise buoys, lights, marks and chart information." },
      { step: "7f", title: "Courses, distances and ETAs", description: "Evaluate courses and distances and ETAs." },
      { step: "8a", title: "Compass errors – transits", description: "Compare compasses and check errors by transits." },
      { step: "8b", title: "Compass errors – sun amplitudes/azimuths", description: "Compare compasses and check errors by amplitudes and azimuths of the sun." },
      { step: "8c", title: "Compass errors – celestial azimuths", description: "Compare compasses and check errors by azimuths of moon, planets and stars." },
      { step: 9, title: "Vessel manoeuvring characteristics", description: "Demonstrate an understanding of the vessel's manoeuvring characteristics to enable proper and effective action to be taken." },
      { step: 10, title: "Steering mode changes and speed controls", description: "Demonstrate an ability to: change the steering mode from manual to automatic and vice versa; adjust speed controls as directed." },
      { step: 11, title: "Emergency steering gear drill", description: "Participate and fully understand the procedure in an emergency steering gear drill." },
      { step: 12, title: "Man overboard drill", description: "Participate and fully understand the procedure in a man overboard drill." },
      { step: 13, title: "Lights, shapes, signals and International Code", description: "Demonstrate an ability to: display lights, shapes and manoeuvring signals in accordance with local regulations and International Regulations for the Prevention of Collisions at Sea, 1972, as amended; use the International Code of Signals." },
      { step: 14, title: "GMDSS and radiocommunications", description: "Demonstrate an understanding of the procedures and operation of GMDSS and other radiocommunication systems equipment, including identifying the Search and Rescue Region (SRR) and the GMDSS Sea Area for the current voyage." },
      { step: 15, title: "COLREGS (tracked in Section 2.5)", description: "Understand the International Regulations for the Prevention of Collisions at Sea, 1972, as amended. Use the table in Section 2.5 for progress towards completion." },
      { step: "16a", title: "Lookout and hazard identification", description: "During watchkeeping on passage: maintain an efficient lookout at all times, promptly identify possible hazards to the vessel, report and take agreed action as appropriate." },
      { step: "16b", title: "Traffic monitoring", description: "Monitor traffic movements and anticipate developing close quarters situations." },
      { step: "16c", title: "COLREGS compliance on passage", description: "Comply at all times with the International Regulations for the Prevention of Collisions at Sea, 1972, as amended." },
      { step: "16d", title: "Weather changes and response", description: "Recognise changes in the weather, receive and interpret information correctly, and take agreed action as appropriate." },
      { step: "16e", title: "Heavy weather response", description: "Respond appropriately to: the sudden onset of pounding; the sudden onset of progressive rolling with a following sea/swell; any other situation arising that affects the movement, steering, and handling of the vessel." },
      { step: "16f", title: "Monitor deck work and environment", description: "Monitor deck work, crew movements, the vessel and the environment." },
      { step: "17a", title: "Passage plan – position plotting", description: "Implement a passage plan including: plotting the vessel's position accurately at appropriate intervals." },
      { step: "17b", title: "Passage plan – position verification", description: "Verifying primary position fixing at regular and frequent intervals by all appropriate means." },
      { step: "17c", title: "Passage plan – equipment limitations", description: "Effectively using and understanding the limitations of navigational equipment." },
      { step: "17d", title: "Passage plan – integrated navigation systems", description: "Programming and monitoring integrated navigation and bridge systems." },
      { step: 18, title: "Anchor watch", description: "Demonstrate an ability to keep an anchor watch." },
      { step: 19, title: "Navigational logbooks and records", description: "Demonstrate an ability to maintain navigational logbooks and other records required of movements and activities relating to safe navigation of the ship." },
    ],
  },
  {
    id: "b11",
    code: "B11",
    title: "Initiate the response to navigation emergencies",
    category: "Bridge Watchkeeping & Navigation",
    description: "Understudying the OOW – respond to navigational emergencies under supervision.",
    guidance: "These tasks test your ability to react correctly under pressure. Study the ship's emergency procedures manual thoroughly – know what to do before you need to do it. For Task 1, learn to recognise equipment trends (e.g. gyro drift, GPS signal degradation) before they become alarms. For Task 2, create a personal 'immediate actions' checklist for each emergency type – the examiner will expect you to list actions in the correct order. Practise the Master-calling procedure from night orders. For distress signals (Task 3), know all 16 methods listed in COLREG Annex IV. Participate in every emergency drill offered and volunteer for the bridge team role.",
    steps: [
      { step: 1, title: "Monitor bridge equipment and systems", description: "Demonstrate an ability to monitor all bridge equipment and systems, recognise and react to trends before alarm status." },
      { step: "2a", title: "Gyro/steering/power failure response", description: "Demonstrate understanding of OOW actions in response to: gyro failure; steering failure; power failure." },
      { step: "2b", title: "Man overboard response", description: "Demonstrate understanding of OOW actions in response to: man overboard." },
      { step: "2c", title: "Oil/cargo spill response", description: "Demonstrate understanding of OOW actions in response to: oil or other cargo spill on deck; oil or other cargo spill or discharge into the sea." },
      { step: "2d", title: "Grounding response", description: "Demonstrate understanding of OOW actions in response to: grounding." },
      { step: "2e", title: "Collision response", description: "Demonstrate understanding of OOW actions in response to: collision." },
      { step: 3, title: "Methods of indicating distress", description: "Demonstrate understanding and recognition of all methods of indicating distress at sea." },
      { step: 4, title: "Response to distress from other vessels", description: "Demonstrate understanding of OOW actions in response to: distress call or signal from another vessel in the vicinity of own ship; distress call or signal from another vessel in a distant position from own ship." },
      { step: 5, title: "Use of IAMSAR procedures", description: "Demonstrate understanding of search and rescue coordination procedures using the IAMSAR manual." },
    ],
  },

  // ── 5.4 SHIP OPERATIONS ─────────────────────────────────────
  {
    id: "b13",
    code: "B13",
    title: "Contribute to vessel operations",
    category: "Ship Operations",
    description: "Supporting the OOW – carrying out ship operations tasks under instruction. Tasks 7 and 8 depend on ship type.",
    guidance: "B13 covers a wide range of operational tasks. Tasks 1–5 are straightforward and should be completed early. For cargo tasks (6–7), your experience will depend on your ship type – document what type of ship you completed each task on. If you're on a container ship, you won't get tanker experience and vice versa – that's fine, but complete what you can. For bunkering (Task 5), understand the SOPEP procedures and pollution prevention measures. Always take soundings carefully and double-check readings. The note at the bottom of the TRB says you may only complete one of B13.7 (cargo) or B13.8 (specialist operations), but complete both if opportunities arise.",
    steps: [
      { step: 1, title: "Watch handover (cargo/port operations)", description: "Relieve and handover the watch in accordance with laid down practices and procedures." },
      { step: 2, title: "Receiving and stowing stores", description: "Assist in receiving, checking and stowing ship's stores." },
      { step: 3, title: "Soundings and ullages", description: "Take soundings/ullages of bilges and tanks." },
      { step: 4, title: "Taking on fresh water", description: "Assist in taking on fresh water." },
      { step: 5, title: "Bunkering operations", description: "Assist in bunkering operations." },
      { step: "6a", title: "Prepare systems and conduct checks", description: "On any ship type: assist in preparing systems for operations, conduct performance checks and report irregularities." },
      { step: "6b", title: "Operate equipment safely", description: "Operate equipment safely and in accordance with manufacturers' instructions." },
      { step: "6c", title: "Shut down and secure systems", description: "Shut down systems on completion of operations, stow and secure equipment." },
      { step: "7a", title: "Safe cargo working practices", description: "On any ship type carrying cargo: comply with the principles and safe working practices for the proper loading, stowage, carriage and discharge of the vessel's cargoes." },
      { step: "7b", title: "Safe working environment during cargo ops", description: "Maintain a safe working environment throughout the period of operations." },
      { step: "7c", title: "Prepare compartments for loading", description: "Assist in preparation of compartments and equipment for loading the designated cargoes." },
      { step: "7d", title: "Monitor cargo handling equipment", description: "Monitor the cargo handling equipment during use, and report abnormal variations." },
      { step: "7e", title: "Cargo measurement and monitoring", description: "Operate cargo measurement equipment, take temperatures and other readings as appropriate to monitor and rate the efficiency of operations, and report abnormal variations." },
      { step: "8a", title: "Specialist operations – safe practices", description: "On specialist vessel types: comply with the principles and safe working practices for the operations." },
      { step: "8b", title: "Specialist operations – safe environment", description: "Maintain a safe working environment throughout the period of operations." },
      { step: "8c", title: "Specialist operations – prepare systems", description: "Assist in preparation of compartments and equipment for the operations." },
      { step: "8d", title: "Specialist operations – monitor equipment", description: "Monitor the equipment during use, and report abnormal variations." },
      { step: "8e", title: "Specialist operations – measurements", description: "Operate measurement equipment and take readings as appropriate to monitor and rate the efficiency of operations, and report abnormal variations." },
    ],
  },
  {
    id: "a01",
    code: "A01",
    title: "Contribute to the stability and watertight integrity of a vessel",
    category: "Ship Operations",
    description: "Understudying the Deck Officer – stability and watertight integrity tasks under supervision.",
    guidance: "Stability is a critical topic that the MCA examiner will probe in depth. Don't just get the TRB signed – genuinely understand the concepts. Ask the Chief Officer to explain the stability calculations for your current loading condition. Study the ship's stability booklet and understand the KG, GM, and GZ curves. For Task 1, physically walk around and check every watertight door and hatch – know what each closing mechanism looks like. For Task 3, use the loading computer and understand how tank levels affect trim and stress. Draw diagrams in your workbook showing waterplane area, metacentre, and righting levers. The examiner may ask you to calculate GM or explain free surface effect from first principles.",
    steps: [
      { step: 1, title: "Watertight arrangements and drills", description: "Demonstrate an understanding of the weather and watertight arrangements on the vessel, conduct drills and complete logs as appropriate." },
      { step: 2, title: "Senior officer's operations plan", description: "Demonstrate an understanding of the senior officer's operations plan for the round voyage including ballast passage where appropriate." },
      { step: 3, title: "Trim, stress and stability calculations", description: "Show a working knowledge of how the senior officer determines the trim, stress and stability of the vessel for various stages of the operation and voyage, including calculations and equipment generated data." },
      { step: 4, title: "Stability plans and safety monitoring", description: "Demonstrate an understanding of the vessel's stability plans and information and an ability to monitor operations and maintain the vessel within the safety margin of the plan." },
    ],
  },
  {
    id: "b14",
    code: "B14",
    title: "Monitor and control vessel operations",
    category: "Ship Operations",
    description: "Understudying the OOW – monitoring and controlling vessel operations under supervision. Tasks 3 and 4 depend on ship type.",
    guidance: "B14 is the supervisory-level counterpart to B13 – you're now expected to lead operations, not just assist. For cargo tasks (3a–3j), focus on understanding the cargo plan and being able to explain decisions. Why this stow plan? Why these ballast arrangements? The examiner will ask. For Task 2, practise briefing your watch team clearly and concisely. For draft and trim confirmation (Task 3i), be able to read all six draft marks and calculate mean drafts. Like B13, you may only complete one of B14.3 (cargo) or B14.4 (specialist operations), but try both if possible. Keep detailed records – the examiner will check your logbook entries match your TRB claims.",
    steps: [
      { step: 1, title: "Watch handover (operations)", description: "Relieve and handover the watch in accordance with laid down practices and procedures." },
      { step: 2, title: "Team communication and briefing", description: "Demonstrate ability to: communicate effectively with team members and across departments; brief all members of the watch and clarify their tasks; verify continuous readiness for emergencies; ensure a safe working environment throughout operations." },
      { step: "3a", title: "Ship/shore and ship-to-ship communication", description: "On any ship type carrying cargo: maintain effective ship/shore and ship-to-ship communication as appropriate, and confirm emergency procedures." },
      { step: "3b", title: "Team compliance with safe cargo practices", description: "Ensure team compliance with the principles and safe working practices for the proper loading, stowage, carriage and discharge of the vessel's cargoes." },
      { step: "3c", title: "Lead system preparation and checks", description: "Lead the team in preparing systems for operations, conduct performance checks, and report irregularities." },
      { step: "3d", title: "Supervise and monitor cargo operations", description: "Supervise and monitor operations in accordance with the plan to avoid damage to the ship and cargo, and maintain vessel within agreed trim, list and longitudinal stress criteria at all times." },
      { step: "3e", title: "Identify irregularities and defects", description: "Identify irregularities, defects and damage to ship and cargo, take appropriate initial action and report as necessary in accordance with legislative and company requirements." },
      { step: "3f", title: "Loading, stowage, separation and securing", description: "Follow the plan to ensure proper loading, stowage, separation and securing of cargo." },
      { step: "3g", title: "Discharge and delivery of cargo", description: "Follow the plan to ensure proper discharge and delivery of cargo." },
      { step: "3h", title: "Shut down and secure for sea", description: "Lead the team in shutting down equipment on completion of operations and securing the vessel for sea." },
      { step: "3i", title: "Draft and trim confirmation", description: "Confirm the draft and trim of the vessel on completion of operations." },
      { step: "3j", title: "Records and documentation", description: "Maintain records of operations to legislative and operational requirements." },
      { step: "4a", title: "Specialist ops – communications", description: "On specialist vessel types: maintain effective ship-to-ship, ship/installation, and ship/shore communication as appropriate, and confirm emergency procedures." },
      { step: "4b", title: "Specialist ops – team compliance", description: "Ensure team compliance with the principles and safe working practices for the operations." },
      { step: "4c", title: "Specialist ops – system preparation", description: "Lead the team in preparing systems for operations, conduct performance checks, and report irregularities." },
      { step: "4d", title: "Specialist ops – supervise and monitor", description: "Supervise and monitor operations in accordance with the plan to avoid damage to the ship, and maintain vessel within agreed trim, list and stress criteria at all times." },
      { step: "4e", title: "Specialist ops – identify defects", description: "Identify irregularities, defects and damage to ship and operations equipment, take appropriate initial action and report as necessary." },
      { step: "4f", title: "Specialist ops – shut down equipment", description: "Lead the team in shutting down equipment on completion of operations." },
      { step: "4g", title: "Specialist ops – draft and trim", description: "Confirm the draft and trim of the vessel on completion of operations." },
      { step: "4h", title: "Specialist ops – maintain records", description: "Maintain records of operations to legislative and operational requirements." },
    ],
  },

  // ── 5.5 MOORING & ANCHORING ─────────────────────────────────
  {
    id: "b21",
    code: "B21",
    title: "Contribute to vessel mooring, anchoring and securing operations",
    category: "Mooring & Anchoring",
    description: "Supporting the Deck Officer – mooring and anchoring tasks under instruction.",
    guidance: "Mooring operations are one of the most dangerous activities on board – snap-back zones from parting lines cause fatalities every year. Always know where the danger zones are and never stand in the bight of a rope. Wear correct PPE (hard hat, safety boots, gloves, high-vis). For Task 3, practise heaving lines until you can throw accurately every time. Learn the difference between head lines, breast lines, springs, and stern lines. For anchoring (Task 4), understand cable markings and how to communicate cable direction and tension to the bridge. For port watch (Task 7), know your responsibilities under ISPS Code security levels. Keep your gangway watch log neat – it may be inspected by Port State Control.",
    steps: [
      { step: 1, title: "Effective mooring team member", description: "Perform effectively as a member of a mooring or anchoring team member showing awareness for the safety of self and others at all times." },
      { step: 2, title: "Port watch handover (alongside and at anchor)", description: "Relieve and handover a deck watch in port, both alongside and at anchor, in accordance with laid down practices and procedures." },
      { step: 3, title: "Line handling operations", description: "Demonstrate ability to: single up and let go lines; run mooring lines and make fast; secure and let go tugs; use heaving lines and stopper off mooring lines; stow mooring lines and secure for sea; operate winches and capstans." },
      { step: 4, title: "Anchoring operations", description: "Demonstrate ability to: prepare for letting go an anchor; let go an anchor; weigh an anchor; secure anchors for sea; recognise anchor chain markings; operate the anchor windlass." },
      { step: 5, title: "Rig gangways, pilot ladders and hoists", description: "Demonstrate an ability to rig and stow gangways and accommodation ladders, pilot ladders and hoists." },
      { step: 6, title: "Secure vessel for sea", description: "Demonstrate an ability to secure the vessel for sea in accordance with instructions received." },
      { step: 7, title: "Port watch duties", description: "Demonstrate ability to keep a deck watch in port, both alongside and at anchor, including: maintaining safe access to the vessel; guiding and informing port officials and authorised visitors; preventing unauthorised access; making regular rounds; reporting irregularities to the OOW." },
    ],
  },
  {
    id: "b22",
    code: "B22",
    title: "Control vessel mooring, anchoring and securing operations",
    category: "Mooring & Anchoring",
    description: "Understudying the Deck Officer – directing mooring and anchoring operations under supervision.",
    guidance: "B22 is the supervisory counterpart to B21 – you're now directing operations rather than just participating. For Task 1, practise clear VHF communication with the bridge using standard terminology ('one head line ashore', 'all fast forward'). For Task 2, always conduct a toolbox talk before mooring operations. For Task 4, learn to assess the mooring plan considering berth layout, wind, current, and tug availability. For Task 8 (port watch in charge), you must demonstrate competence in all aspects including monitoring moorings for tidal changes, ISPS compliance, draft readings, and maintaining the port log. This task set is typically completed during your second sea phase.",
    steps: [
      { step: 1, title: "Communication and safe working", description: "Demonstrate ability to: communicate effectively with the bridge, mooring team, tugs, mooring boats, port workers, and deck watch; ensure safe working practices in all operations; ensure work areas are secured on completion." },
      { step: 2, title: "Risk assessments", description: "Demonstrate an understanding of the risk assessments for the work areas." },
      { step: 3, title: "Port watch handover (in charge)", description: "Relieve and handover a deck watch in port, both alongside and at anchor, in accordance with laid down practices and procedures." },
      { step: 4, title: "Take charge of mooring/unmooring", description: "Demonstrate an ability to take charge of mooring and unmooring operations." },
      { step: 5, title: "Take charge of anchoring operations", description: "Demonstrate an ability to take charge of anchoring operations." },
      { step: 6, title: "Take charge of access equipment", description: "Demonstrate an ability to take charge of rigging and stowing gangways and accommodation ladders, pilot ladders and hoists." },
      { step: 7, title: "Take charge of securing for sea", description: "Demonstrate ability to take charge of securing the vessel for sea, including: undertaking security and stowaway checks prior to departure; checking the security of equipment and stores on sailing in preparation for heavy weather." },
      { step: 8, title: "Take charge of port watch", description: "Demonstrate ability to take charge of a deck watch in port, both alongside and at anchor, including: monitoring and adjusting moorings; monitoring and adjusting means of access; making rounds of the vessel; ensuring compliance with the ship's security plan; controlling access to the vessel; reading draft and freeboard as required; keeping the port log and other records." },
    ],
  },

  // ── 5.6 OPERATIONAL MANAGEMENT ──────────────────────────────
  {
    id: "a31",
    code: "A31",
    title: "Maintain personal health, safety and environmental standards",
    category: "Operational Management",
    description: "Maintain high standards of personal health, safety, and environmental protection on board.",
    guidance: "A31, A32, and A34 are grouped together with shared tasks. These are ongoing competencies assessed throughout your sea service, not discrete tasks to complete in one go. Demonstrate consistent behaviour: always wear correct PPE, follow rest hour requirements (STCW/MLC), report hazards, and participate in environmental management (waste segregation, MARPOL compliance). The examiner will look for evidence of sustained good practice over time, not just a one-off demonstration. Keep a personal safety journal noting near-misses you've witnessed or reported.",
    steps: [
      { step: 1, title: "Personal safety, health, and environmental awareness", description: "Follow all safety procedures and risk assessments. Use correct PPE for every task. Report near-misses and unsafe conditions. Maintain personal health and hygiene standards. Follow MARPOL and environmental regulations for waste disposal and pollution prevention." },
    ],
  },
  {
    id: "a32",
    code: "A32",
    title: "Maintain safe, legal and effective working practices on board a vessel",
    category: "Operational Management",
    description: "Ensure all working practices comply with safety regulations, company procedures, and international conventions.",
    guidance: "Understand your rights and obligations under the Maritime Labour Convention (MLC) – particularly hours of work and rest. Know the ship's permit-to-work system and when it must be used (hot work, enclosed space entry, working at height, electrical isolation). Conduct and document toolbox talks before starting any job. Understand risk assessment methodology: identify hazards, assess likelihood and severity, implement controls. The examiner will ask about real situations – be prepared to describe actual risk assessments you've participated in, not textbook examples.",
    steps: [
      { step: 2, title: "Safe and legal working practices", description: "Understand and apply MLC requirements for hours of work and rest. Follow permit-to-work systems. Conduct risk assessments and toolbox talks before starting work. Know your rights and responsibilities under maritime law." },
    ],
  },
  {
    id: "a34",
    code: "A34",
    title: "Create, maintain and enhance productive working relationships",
    category: "Operational Management",
    description: "Build and maintain effective working relationships with all members of the ship's company.",
    guidance: "Effective communication across multicultural crews is essential in modern shipping. Show respect for different cultures and working styles. Participate constructively in safety meetings and handover discussions. Understand the ship's organisational structure – who reports to whom, and through what channels. Support your colleagues and maintain a positive attitude even during demanding periods. The examiner may ask how you dealt with a difficult interpersonal situation on board – have a genuine example ready that shows maturity and professionalism.",
    steps: [
      { step: 3, title: "Effective working relationships", description: "Communicate effectively with multicultural crews. Participate constructively in team activities and meetings. Understand the ship's organisational structure and reporting lines. Support colleagues and contribute to a positive working environment." },
    ],
  },
];
