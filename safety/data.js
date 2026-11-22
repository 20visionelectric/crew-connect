/* 20 Vision Site Safety — reference content.
   Legal references: Ontario OHSA (R.S.O. 1990, c. O.1), O. Reg. 213/91 (Construction Projects),
   O. Reg. 420/21 (Notices and Reports), O. Reg. 297/13 (Awareness Training), Reg. 1101 (First Aid),
   IHSA COR 2020 Audit Tool (v2.0, Oct 2022). Wording is original; check the source text before relying on it. */

const TICKER = [
  'Always remember to wear your PPE.',
  'Safety starts with YOU!',
  'Test before you touch. Always verify it is dead with a proven tester.',
  'Your lock, your tag, your life: lock out every source before you work.',
  'Report every near miss. Today\'s close call is tomorrow\'s injury.',
  'Everyone has the right to refuse unsafe work.',
  'See something? Say something.',
  'Tired, rushed or distracted? Speak up.'
];

/* ---------- Daily Field Level Hazard Assessment (COR element 2, 3, 6, 9, 11) ---------- */
const DAILY = [
  { sec: 'Arrival and emergency info', items: [
    ['orient', 'I have done the site orientation for this project (general contractor and 20 Vision).', 'COR 8.1'],
    ['emerg', 'I know the emergency procedures, muster point, first aider and nearest hospital for this site.', 'O. Reg. 213/91 s.17'],
    ['phone', 'I have a phone or two-way radio I can use in an emergency.', 'O. Reg. 213/91 s.18'],
    ['posted', 'The OHSA poster, constructor notice and emergency procedures are posted on site.', 'OHSA s.25(2)(i); O. Reg. 213/91 s.13, s.17(3)']
  ]},
  { sec: 'Fit for work', items: [
    ['fit', 'I am fit for work today: not impaired, overtired or unwell.', 'COR 2'],
    ['trained', 'I am trained and competent for every task I will do today.', 'OHSA s.25(2)(a)']
  ]},
  { sec: 'PPE', items: [
    ['hat', 'Hard hat worn and in good condition.', 's.22'],
    ['boots', 'Grade 1 safety boots (green triangle, Omega shock-resistant mark) worn.', 's.23'],
    ['eyes', 'Safety glasses worn (face shield where needed).', 's.24'],
    ['vis', 'High-visibility vest or clothing worn.', 'Site rule'],
    ['gloves', 'Right gloves for the task (cut-resistant, rubber insulating or leather).', 's.25'],
    ['hear', 'Hearing protection available where noise is high.', 'COR 6']
  ]},
  { sec: 'Site conditions', items: [
    ['house', 'Work area and access routes are clear and not slippery.', 's.35, s.72'],
    ['openings', 'Floor openings are covered or guarded; open edges protected.', 's.26.3'],
    ['light', 'Lighting is good enough to work safely.', 'COR 9'],
    ['ext', 'A fire extinguisher is nearby, marked and tagged this month.', 's.52, s.55'],
    ['fak', 'A first aid kit is on site and I know where it is.', 'Reg. 1101'],
    ['wash', 'Washroom facilities are available and serviced.', 's.29']
  ]},
  { sec: 'Electrical work', items: [
    ['iso', 'Every source for today\'s work is identified, isolated, locked and tagged.', 's.190(4), (6)'],
    ['ttt', 'I will prove my tester on a known live source and test before I touch (live-dead-live).', 's.190(7)'],
    ['gfci', 'Cords and tools used outdoors or in wet areas are on a Class A GFCI.', 's.195.2'],
    ['ohl', 'I have checked for overhead power lines and kept the required distance.', 's.188']
  ]}
];

const HAZARDS = [
  ['energized', 'Energized equipment / live work', 'Only if de-energizing is not reasonably possible: written procedure, certified electrician, rated PPE, CPR-trained rescuer watching at 300 V or more (s.191).'],
  ['loto', 'Lockout and tagging', 'Lock and tag each source, discharge stored energy, verify dead (s.190).'],
  ['heights', 'Working at heights (over 3 m)', 'Guardrails first; if not possible, travel restraint, then fall arrest with a written rescue plan (s.26, s.26.1(4)).'],
  ['ladder', 'Ladders', 'CSA Z11 Grade 1/1A/1AA, secured, three points of contact (s.80–83).'],
  ['ewp', 'Scissor lift / boom lift', 'Daily inspection, trained operator, manual on board (s.144–149).'],
  ['ohl', 'Overhead power lines', 'Keep the minimum distance (3 m up to 150 kV); signaller if equipment could encroach (s.188).'],
  ['hot', 'Hot work / soldering / cutting', 'Extinguisher on hand, combustibles cleared, fire watch.'],
  ['confined', 'Confined space', 'STOP. Do not enter without a confined space program and entry permit.'],
  ['silica', 'Silica / concrete dust (coring, chasing)', 'Wet method or vacuum shroud; respirator as required.'],
  ['asbestos', 'Possible asbestos', 'STOP. Do not disturb. Tell the supervisor (O. Reg. 278/05).'],
  ['noise', 'High noise', 'Hearing protection.'],
  ['lifting', 'Heavy lifting / awkward work', 'Use carts, team lift, plan the path.'],
  ['trades', 'Other trades working nearby / overhead', 'Coordinate with the GC; barricade your area.'],
  ['weather', 'Heat, cold or weather', 'Water, breaks, warm-up area; watch for heat stress.'],
  ['traffic', 'Traffic, equipment or the public', 'Barricades, signs, spotter.'],
  ['alone', 'Working alone', 'Check-in schedule with the office.'],
  ['excav', 'Digging / excavation', 'Get locates before you dig (Ontario One Call); trench rules over 1.2 m.']
];

/* ---------- Equipment pre-use inspections (COR element 7, 9) ---------- */
const INSP = {
  ewp: { name: 'Scissor lift / boom lift (EWP)', photos: ['Whole machine', 'Serial / data plate', 'Maintenance and inspection tag'],
    fields: [['serial','Serial number','text'],['unit','Unit / rental number','text'],['annual','Last annual inspection date','date'],['tag','Date on inspection tag','date']],
    items: [
      'I am trained on this class of platform (oral, written and hands-on).|s.147',
      'Operator\'s manual is on the platform.|s.149',
      'Maintenance and inspection tag is attached near the controls.|s.146',
      'Logbook of inspections, repairs and maintenance is up to date.|s.145',
      'Rated load decal visible; load today is within it.|s.148(1)(a)',
      'Guardrails, mid-rails, toe boards and entry gate or chain are in place, and the gate closes.|s.144(7)',
      'Ground and platform controls work, including emergency stop.|Mfr.',
      'Emergency lowering works.|Mfr.',
      'Tilt alarm, descent alarm and horn work.|Mfr.',
      'No hydraulic leaks; hoses and cylinders OK.|Mfr.',
      'Tires, wheels, pothole guards and brakes OK.|Mfr.',
      'Battery charged; charger and cables OK.|Mfr.',
      'Surface is firm and level; overhead hazards and power lines checked.|s.148',
      'Boom lift: harness on and tied off to the anchor point at all times.|s.148(1)(e)'
    ]},
  ladder: { name: 'Ladder (step / extension)', photos: ['Whole ladder', 'CSA grade / duty label'],
    fields: [['serial','Ladder ID or serial','text'],['grade','CSA grade (1, 1A or 1AA)','text']],
    items: [
      'Label shows CSA Z11 Grade 1, 1A or 1AA.|s.80(1)',
      'Non-conductive (fibreglass) for electrical work.|Site rule',
      'Rails not cracked, bent or burned.|s.81(1)',
      'Rungs / steps tight and not damaged.|s.81(1)',
      'Ladder feet and slip-resistant pads OK.|s.81(1)',
      'Step ladder spreaders lock fully.|s.83(1)',
      'Extension ladder locks, rope and pulley OK.|Mfr.',
      'Will be set on firm, level footing and secured top and bottom (extension ladder: 900 mm past the landing).|s.82',
      'Labels and warnings readable.|Mfr.'
    ]},
  harness: { name: 'Harness, lanyard and SRL', photos: ['Full harness', 'Harness label (serial and manufacture date)', 'Lanyard / SRL label'],
    fields: [['serial','Harness serial','text'],['mfg','Harness manufacture date','date'],['expiry','Service-life / expiry date (from manufacturer)','date'],['lserial','Lanyard / SRL serial','text'],['annual','Last competent-person inspection','date']],
    items: [
      'CSA Z259 label is present and readable.|s.26.6',
      'Webbing: no cuts, burns, fraying, chemical damage or hardening.|s.26.6(6)',
      'Stitching intact; no pulled or broken threads.|s.26.6(6)',
      'D-rings, buckles and adjusters: no cracks, rust or bending.|s.26.6(6)',
      'Fall indicator not deployed; harness has never arrested a fall.|s.26.6(8)',
      'Shock-absorbing lanyard pack intact.|s.26.6(1)',
      'Snap hooks / carabiners self-close and lock.|s.26.9',
      'SRL pulls out smoothly, locks and retracts.|Mfr.',
      'Anchor point is adequate (8 kN or engineered).|s.26.7',
      'Written rescue plan for this site is in place.|s.26.1(4)',
      'I have Working at Heights training (within the last 3 years).|O. Reg. 297/13'
    ]},
  cord: { name: 'Extension cord / GFCI / temporary power', photos: ['Cord or GFCI', 'Rating / approval label'],
    fields: [['serial','Cord or panel ID','text']],
    items: [
      'Ground pin present; three or more conductors.|s.195',
      'Jacket intact; no splices, tape repairs or exposed wire.|s.195.3',
      'CSA-approved and rated for the load.|s.195',
      'Class A GFCI tested with the test button.|s.195.2',
      'Temporary power switch is in a lockable enclosure and not locked ON.|s.194(5)',
      'Cords kept out of water and traffic, or protected.|s.195.3'
    ]},
  tools: { name: 'Power tools', photos: ['Tool', 'Serial / rating plate'],
    fields: [['serial','Tool serial','text'],['toolname','Tool (e.g. hammer drill)','text']],
    items: [
      'Guards in place and working.|Mfr.',
      'Grounded or double-insulated; cord and plug OK.|s.195.1',
      'Switch and trigger lock work.|Mfr.',
      'Bits, blades and discs right for the job and in good shape.|Mfr.',
      'Battery and charger not damaged.|Mfr.'
    ]},
  gloves: { name: 'Rubber insulating gloves and arc-rated PPE', photos: ['Gloves with protectors', 'Class / test date stamp'],
    fields: [['serial','Glove ID','text'],['class','Glove class (00, 0, 1, 2…)','text'],['test','Last dielectric test date','date']],
    items: [
      'Air-tested and inspected by me before use today.|s.193(1)',
      'Leather protectors worn over them.|s.193(3)',
      'Test date within 3 months in service / 6 months in storage (gloves rated over 5,000 V).|s.193(2)',
      'Arc-rated clothing and face shield match the arc flash label.|CSA Z462',
      'I am trained in their use.|s.193(6)'
    ]},
  tester: { name: 'Voltage tester / multimeter', photos: ['Tester', 'CAT rating label'],
    fields: [['serial','Serial number','text'],['cal','Calibration due date','date']],
    items: [
      'CAT rating suits the work (CAT III/IV).|CSA Z462',
      'Leads and probes not cracked; probe guards OK.|Mfr.',
      'Battery good.|Mfr.',
      'Proven on a known live source before and after testing.|s.190(7), CSA Z462'
    ]},
  loto: { name: 'Lockout kit', photos: ['Locks, tags and devices'],
    fields: [['serial','Kit ID','text']],
    items: [
      'Personal locks are keyed differently, one key each.|COR 3',
      'Tags are non-conductive and show the reason, my name, my employer and the date.|s.190(6)',
      'Breaker lockouts and hasps fit the panels on this job.|s.190(4)'
    ]},
  scaffold: { name: 'Rolling scaffold / Baker scaffold', photos: ['Whole scaffold', 'Manufacturer / rating label'],
    fields: [['serial','Scaffold ID','text']],
    items: [
      'Frames, braces and pins complete and undamaged.|s.126–136',
      'Platform secured and fully planked.|s.126–136',
      'Guardrails on all open sides where required.|s.26.3',
      'Casters locked when in use.|s.129',
      'Set on a firm, level surface.|s.126–136',
      'Erected under the supervision of a competent worker.|s.131'
    ]},
  extinguisher: { name: 'Fire extinguisher (monthly)', photos: ['Extinguisher', 'Inspection tag'],
    fields: [['serial','Serial / location','text'],['tag','Last date on tag','date']],
    items: [
      'Rating is at least 4A40BC.|s.53(2)',
      'Gauge in green; pin and seal in place.|s.55',
      'No damage, corrosion or blocked nozzle.|s.55',
      'Readily accessible and location marked.|s.52(1)',
      'Monthly inspection date written on the tag.|s.55'
    ]},
  firstaid: { name: 'First aid kit', photos: ['Open kit', 'Inspection card'],
    fields: [['serial','Kit location','text'],['card','Last date on inspection card','date']],
    items: [
      'Kit is stocked for the number of workers on site.|Reg. 1101',
      'Inspection card signed at least every 3 months.|Reg. 1101',
      'First aid poster (Form 82) is posted.|Reg. 1101',
      'Names of trained first aiders are posted.|Reg. 1101'
    ]},
  vehicle: { name: 'Company vehicle', photos: ['Vehicle', 'Licence plate / VIN'],
    fields: [['serial','Plate or VIN','text'],['odo','Odometer','text']],
    items: [
      'Lights, signals and horn work.|COR 7',
      'Tires and brakes OK.|COR 7',
      'Load secured; ladders strapped.|COR 7',
      'Fire extinguisher and first aid kit in vehicle.|COR 11'
    ]}
};

/* ---------- Toolbox talks (COR element 8.2) ---------- */
const TALKS = [
  { id:'t1', title:'Lockout and tagging', cat:'Electrical', points:[
    'Identify every energy source: breakers, disconnects, backfeeds, UPS, generators and solar.',
    'Turn off, lock, tag. Your own lock, your own key. Tags show the reason, your name, employer and the date.',
    'Discharge stored energy (capacitors, VFDs) before work.',
    'Verify dead with a proven tester. Only remove your own lock.'], ask:['Where could a backfeed come from on this job?'], ref:'O. Reg. 213/91 s.190' },
  { id:'t2', title:'Test before you touch', cat:'Electrical', points:[
    'Treat every conductor as live until you have tested it.',
    'Live-dead-live: prove the tester on a known source, test, then prove it again.',
    'Test phase to phase and phase to ground.',
    'Use a CAT III/IV tester with good leads.'], ask:['When was your tester last checked?'], ref:'s.190(7), CSA Z462' },
  { id:'t3', title:'Arc flash awareness', cat:'Electrical', points:[
    'Arc flash can burn at a distance; you do not have to touch anything.',
    'Read the arc flash label before opening gear.',
    'Wear the arc-rated PPE the label calls for.',
    'Energized work needs a written procedure and approval first.'], ask:['Which panels here have arc flash labels?'], ref:'s.191, CSA Z462' },
  { id:'t4', title:'Cords, GFCIs and temporary power', cat:'Electrical', points:[
    'Use three-wire cords with the ground pin. No splices or tape repairs.',
    'Outdoors and in wet areas: Class A GFCI every time.',
    'If a GFCI trips, find out why before resetting.',
    'Tag and remove damaged cords right away.'], ask:['Who checks cords on this site?'], ref:'s.195–195.3' },
  { id:'t5', title:'Overhead power lines', cat:'Electrical', points:[
    'Look up before you raise a ladder, lift or material.',
    'Keep the minimum distance for the line voltage.',
    'Use a signaller when equipment could get close.',
    'If contact happens, stay in the machine and keep others back. If fire forces you out, jump clear with feet together and shuffle away.'], ask:['Are there lines near our lift path?'], ref:'s.188' },
  { id:'t6', title:'Ladder safety', cat:'Access', points:[
    'Grade 1, 1A or 1AA only, and fibreglass for electrical work.',
    'Set at 1 out for every 4 up; secure top and bottom; extend 900 mm past the landing.',
    'Never stand on the top step, top cap or pail shelf.',
    'Three points of contact; carry tools on a belt or hoist them.'], ask:['Is a ladder the right tool, or should we use a lift?'], ref:'s.80–84' },
  { id:'t7', title:'Scissor lifts and boom lifts', cat:'Access', points:[
    'Inspect it every day before use and record it.',
    'Only trained operators; know the emergency lowering.',
    'Keep the gate closed; never climb the guardrails.',
    'In a boom lift, tie off to the anchor point.'], ask:['Where is the manual on this machine?'], ref:'s.143–149' },
  { id:'t8', title:'Fall protection and rescue', cat:'Access', points:[
    'Over 3 m (or less near hazards): guardrails first, then travel restraint, then fall arrest.',
    'Inspect your harness and lanyard before each use.',
    'A written rescue plan must exist before anyone uses fall arrest.',
    'Suspension trauma starts in minutes; rescue fast.'], ask:['What is our rescue plan here?'], ref:'s.26–26.9' },
  { id:'t9', title:'Housekeeping', cat:'General', points:[
    'Clean up as you go; remove waste at least daily.',
    'Keep walkways, stairs and exits clear.',
    'Keep material 1.8 m back from open edges.',
    'Coil cords and store offcuts.'], ask:['What is our biggest trip hazard today?'], ref:'s.35, s.40, s.72' },
  { id:'t10', title:'PPE: the last line of defence', cat:'General', points:[
    'Hard hat, boots and eye protection at all times on site.',
    'Pick gloves for the task: cut, leather or rubber insulating.',
    'Check PPE before each use; replace damaged gear.',
    'PPE only works if it fits and you wear it.'], ask:['Is any of your PPE due for replacement?'], ref:'s.21–25' },
  { id:'t11', title:'WHMIS and products on site', cat:'Health', points:[
    'Read the label and SDS before using a product.',
    'Know where the SDS binder or app is.',
    'Use the PPE the SDS calls for.',
    'Store and dispose of products properly.'], ask:['Which products are we using this week?'], ref:'WHMIS' },
  { id:'t12', title:'Silica dust from coring and chasing', cat:'Health', points:[
    'Concrete and block dust contains silica that damages lungs.',
    'Use water or a vacuum shroud on the tool.',
    'Wear the right respirator and be fit-tested.',
    'Never dry-sweep or blow dust with air.'], ask:['How will we control dust on today\'s cores?'], ref:'COR 2' },
  { id:'t13', title:'Asbestos: stop if you suspect it', cat:'Health', points:[
    'Older buildings may have asbestos in pipe wrap, tiles, plaster or panels.',
    'If you suspect it, stop and do not disturb it.',
    'Tell your supervisor; ask for the owner\'s asbestos survey.',
    'Only trained workers with the right controls may work with it.'], ask:['Has the owner given us an asbestos survey?'], ref:'O. Reg. 278/05' },
  { id:'t14', title:'Heat and cold stress', cat:'Health', points:[
    'Drink water often; take breaks in shade or a warm area.',
    'Know the signs: headache, dizziness, confusion, shivering, numbness.',
    'Buddy system in extreme weather.',
    'Report symptoms right away.'], ask:['Where is the cool or warm area on this site?'], ref:'COR 2' },
  { id:'t15', title:'Fire extinguishers', cat:'Emergency', points:[
    'Know where the nearest extinguisher is.',
    'PASS: Pull, Aim, Squeeze, Sweep.',
    'Check the tag monthly; report used or empty units.',
    'Only fight small fires with a clear way out.'], ask:['Where is the closest extinguisher to our work?'], ref:'s.52–55' },
  { id:'t16', title:'Emergencies and first aid', cat:'Emergency', points:[
    'Know the muster point, the first aider and the nearest hospital.',
    'Report every injury, even small ones, the same day.',
    'Critical injury: call 911, protect the scene, call the office.',
    'Do not move anything at a critical injury scene except to save a life.'], ask:['Who is our first aider today?'], ref:'OHSA s.51, Reg. 1101' },
  { id:'t17', title:'Your rights: know, take part, refuse', cat:'General', points:[
    'You have the right to know about hazards.',
    'You have the right to take part in health and safety decisions.',
    'You have the right to refuse unsafe work.',
    'No reprisal for raising a safety concern.'], ask:['How do you report a hazard here?'], ref:'OHSA s.43, s.50' },
  { id:'t18', title:'Working alone', cat:'General', points:[
    'Tell the office where you are and when you will check in.',
    'No energized work alone.',
    'Carry a charged phone.',
    'If you miss a check-in, the office calls you, then the site.'], ask:['Who will be working alone this week?'], ref:'COR 2' },
  { id:'t19', title:'Hand and power tools', cat:'General', points:[
    'Inspect before use; tag out damaged tools.',
    'Keep guards on; use the right tool for the job.',
    'Unplug the tool or remove the battery before changing bits or blades.',
    'Use insulated tools near live parts.'], ask:['Any tools that need repair?'], ref:'s.192, s.195.1' },
  { id:'t20', title:'Digging and locates', cat:'General', points:[
    'Never dig without locates (Ontario One Call).',
    'Hand-dig near marked lines.',
    'Trenches over 1.2 m deep need wall support, and the Ministry must be told before work starts.',
    'Keep spoil 1 m back from the edge.'], ask:['Do we have valid locates?'], ref:'s.7, s.222–242' }
];

/* ---------- Incident types and OHSA reporting (COR element 10) ---------- */
const INC_TYPES = [
  ['near', 'Near miss (no injury)'],
  ['hazard', 'Hazard / unsafe condition'],
  ['firstaid', 'First aid only'],
  ['medical', 'Medical aid (doctor, clinic, hospital)'],
  ['lost', 'Lost time / can\'t do usual work'],
  ['critical', 'Critical injury or fatality'],
  ['property', 'Property / equipment damage'],
  ['shock', 'Electrical shock or arc flash'],
  ['enviro', 'Spill / environmental']
];
const REPORTING = {
  critical: [
    'Call 911 and give first aid. Do not disturb the scene except to save life, relieve suffering or prevent unnecessary damage (OHSA s.51(2)).',
    'Phone the Ministry right away: Health and Safety Contact Centre 1-877-202-0008 (24/7) (OHSA s.51(1)).',
    'Tell the JHSC or health and safety rep and the union, if any, right away.',
    'Written report to the Ministry, JHSC/rep and union within 48 hours (OHSA s.51(1); content set by O. Reg. 420/21).',
    'WSIB Form 7 within 3 business days (WSIB: 1-800-387-0750).'
  ],
  medical: [
    'Written notice to the JHSC or health and safety rep (and union, if any) within 4 days (OHSA s.52(1)).',
    'WSIB Form 7 within 3 business days of learning of it.',
    'Record it in the first aid record book.'
  ],
  lost: [
    'Written notice to the JHSC or health and safety rep (and union, if any) within 4 days (OHSA s.52(1)).',
    'WSIB Form 7 within 3 business days.',
    'Offer modified / early return-to-work duties.'
  ],
  firstaid: [
    'Record the injury and first aid given in the first aid record (Reg. 1101).',
    'If it later needs a doctor or time off, it becomes WSIB reportable (Form 7 within 3 business days).'
  ],
  shock: [
    'Every electrical shock needs medical assessment, even if the worker feels fine.',
    'Treat as medical aid: notice within 4 days (s.52) and WSIB Form 7 within 3 business days.',
    'Lock out and preserve the equipment for investigation.'
  ],
  property: [
    'On a construction project, some dangerous occurrences need written notice from the constructor (tell the GC right away) within 2 days even with no injury (OHSA s.53; O. Reg. 420/21 lists them).',
    'Photograph and tag out damaged equipment.'
  ],
  near: ['Investigate and record a corrective action. Share it at the next toolbox talk (COR 10).'],
  hazard: ['Report it, then fix or barricade it now and assign a corrective action (OHSA s.28(1)(d)).'],
  enviro: ['Contain the spill; call the Spills Action Centre 1-800-268-6060 if it could harm the environment.']
};

/* ---------- Training (COR element 8.1) ---------- */
const COURSES = [
  ['wah', 'Working at Heights (CPO-approved)', 36],
  ['awareness', 'Worker Health and Safety Awareness', 0],
  ['supaware', 'Supervisor Health and Safety Awareness', 0],
  ['whmis', 'WHMIS', 12],
  ['ewp', 'Lift licence: elevating work platform / boom operator', 36],
  ['firstaid', 'First aid / CPR / AED', 36],
  ['arcflash', 'Arc flash / CSA Z462 electrical safety', 36],
  ['loto', 'Lockout and tagging', 36],
  ['ext', 'Fire extinguisher use', 12],
  ['confined', 'Confined space awareness', 36],
  ['jhsc', 'JHSC / H&S representative', 0],
  ['orient', '20 Vision company orientation', 0],
  ['cor', 'IHSA COR internal auditor training', 0],
  ['licence', '309A / 442A licence (Certificate of Qualification)', 36],
  ['wsib', 'WSIB document (claim, clearance or return-to-work)', 0],
  ['other', 'Other certificate or document', 0]
];

/* ---------- COR 2020 elements and program documents ---------- */
const COR = [
  { n:1, name:'H&S Policy and Document Control', pts:37, docs:['Signed and dated H&S policy (reviewed every year)','Policy posted on sites and in the office','Document and record control procedure','Document / revision log'], ev:'policy' },
  { n:2, name:'Hazard Assessment, Analysis and Control', pts:52, docs:['Hazard assessment policy and procedure','Formal (company-wide) hazard assessment with risk ratings','Critical task list','Annual review of hazard assessments'], ev:'flha' },
  { n:3, name:'Controls', pts:39, docs:['Hierarchy of controls procedure','Safe work practices / procedures (lockout, energized work, heights)','Written lockout and energized work procedures (s.190(2), s.191(4))'], ev:'controls' },
  { n:4, name:'Procurement and Contractor Management', pts:26, docs:['Contractor / supplier selection procedure with H&S criteria','Subcontractor evaluation form','Supplier list'], ev:'none' },
  { n:5, name:'Company Rules', pts:18, docs:['Written company safety rules','Progressive discipline procedure','Rules signed by each worker'], ev:'none' },
  { n:6, name:'Personal Protective Equipment', pts:32, docs:['PPE requirements by task','PPE fit, care and use guidelines','PPE issue records'], ev:'ppe' },
  { n:7, name:'Preventative Maintenance', pts:29, docs:['Inventory of all tools, equipment and vehicles','Maintenance schedule per manufacturer','Out-of-service / tag-out procedure'], ev:'equip' },
  { n:8, name:'Training and Communication', pts:66, docs:['Training needs analysis and competency matrix','Orientation program (before work starts)','Annual company-wide H&S meeting with senior management','Toolbox talk schedule'], ev:'training' },
  { n:9, name:'Workplace Inspections', pts:37, docs:['Inspection procedure: what, how often, who','Workplace inspection forms','Pre-use inspection forms'], ev:'insp' },
  { n:10, name:'Investigations and Reporting', pts:39, docs:['Incident reporting and investigation procedure','Investigator training records','Corrective action follow-up process'], ev:'inc' },
  { n:11, name:'Emergency Preparedness', pts:55, docs:['Emergency response plan per site','Drill records (with corrective actions)','Certified first aider list','Annual review of the plan'], ev:'emerg' },
  { n:12, name:'Statistics and Records', pts:25, docs:['Annual H&S statistics summary (leading and lagging)','Trend analysis shared with workers'], ev:'stats' },
  { n:13, name:'Legislation and Other Requirements', pts:23, docs:['Legislation register (OHSA, O. Reg. 213/91, 420/21, 297/13, Reg. 1101…)','OHSA and regulations available on each site','Compliance evaluation records'], ev:'legis' },
  { n:14, name:'Management Review and Management of Change', pts:76, docs:['Annual management review minutes','Measurable H&S objectives and action plan','Management of change procedure and log'], ev:'none' }
];

/* ---------- Safety Socials (curated by the Socials agent; approved by the Approver agent) ---------- */
const SOCIALS = [
  { cat:'Electrical', title:'Test before you touch', do:['Prove your tester on a known live source','Test every conductor, phase to phase and to ground','Prove the tester again after'], dont:['Trust the panel schedule','Assume a breaker is the only source'], q:'live dead live test electrician' },
  { cat:'Electrical', title:'Lockout done right', do:['Your own lock and tag on every source','Discharge capacitors','Try the start button after locking'], dont:['Share a lock or key','Hang a tag with no lock'], q:'lockout tagout electrical procedure' },
  { cat:'Electrical', title:'Arc flash: what it looks like', do:['Read the label','Wear arc-rated PPE','Stand to the side when operating gear'], dont:['Open energized gear in street clothes','Rack breakers without PPE'], q:'arc flash safety awareness' },
  { cat:'Access', title:'Ladder setup', do:['1 out for every 4 up','Secure it top and bottom','Three points of contact'], dont:['Stand on the top step','Overreach past your belt buckle'], q:'ladder safety construction' },
  { cat:'Access', title:'Scissor lift daily check', do:['Walk-around before use','Test emergency lowering','Close the gate'], dont:['Climb the rails','Drive on soft or sloped ground'], q:'scissor lift pre-use inspection' },
  { cat:'Access', title:'Harness inspection', do:['Bend the webbing to check for cuts','Check the label and dates','Check the fall indicator'], dont:['Use gear that has arrested a fall','Tie off below your D-ring'], q:'fall protection harness inspection' },
  { cat:'General', title:'Housekeeping wins', do:['Clean as you go','Coil cords off the floor','Clear exits'], dont:['Leave offcuts in walkways','Block extinguishers'], q:'construction site housekeeping safety' },
  { cat:'Health', title:'Silica dust control', do:['Wet coring','Vacuum shroud on grinders','Fit-tested respirator'], dont:['Dry sweep','Blow dust with compressed air'], q:'silica dust control construction' }
];

/* ---------- Safety updates (filled weekly by the Research agent; approved before release) ---------- */
const UPDATES = [
  { date:'2026-11-22', title:'COR in Ontario is granted only by IHSA', body:'IHSA is the authority having jurisdiction for COR in Ontario. All external audits now use the COR 2020 audit tool, submitted through AuditSoft. Senior management and one full-time employee must take IHSA\'s prescribed training first.', src:'IHSA', url:'https://www.ihsa.ca/cor-home' },
  { date:'2026-11-22', title:'Incident reporting content is set by O. Reg. 420/21', body:'Critical injuries and deaths: phone the Ministry right away and send a written report within 48 hours. Injuries needing medical attention or keeping a worker from usual work: written notice within 4 days. Some construction incidents with no injury: notice within 2 days.', src:'Ontario.ca', url:'https://www.ontario.ca/page/reporting-workplace-incidents-and-illnesses' },
  { date:'2026-11-22', title:'Elevating work platforms: daily inspection and logbook', body:'Each EWP must be inspected before use every day by a trained worker, and the owner must keep a permanent record of inspections, tests, repairs and maintenance (O. Reg. 213/91 s.144(3), s.145).', src:'O. Reg. 213/91', url:'https://www.ontario.ca/laws/regulation/910213' },
  { date:'2026-11-22', title:'Fire extinguishers: monthly tag', body:'A competent worker must inspect extinguishers at least once a month and record the date on the attached tag (O. Reg. 213/91 s.55).', src:'O. Reg. 213/91', url:'https://www.ontario.ca/laws/regulation/910213' }
];
