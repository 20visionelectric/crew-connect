/* 20 Vision Site Safety — reference content.
   Legal references: Ontario OHSA (R.S.O. 1990, c. O.1), O. Reg. 213/91 (Construction Projects),
   O. Reg. 420/21 (Notices and Reports), O. Reg. 297/13 (Awareness Training), Reg. 1101 (First Aid),
   IHSA COR 2020 Audit Tool (v2.0, Oct 2022). Wording is original; check the source text before relying on it. */

/* Ontario elevating work platform rules move from O. Reg. 213/91 s.143–149 to O. Reg. 117/26 on Jan 1, 2027 */
const EWP_DATE='2027-01-01';
const EWP_NEW=new Date().toLocaleDateString('en-CA')>=EWP_DATE;
const refOn=(item,iso)=>{const p=item.split('|');return p[2]&&(iso?new Date(iso).toLocaleDateString('en-CA'):new Date().toLocaleDateString('en-CA'))>=EWP_DATE?p[2]:(p[1]||'')};
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
  ['heights', 'Working at heights (over 3 m, or 1.2 m+ near water, machinery or hazards)', 'Guardrails first; if not possible, travel restraint, then fall arrest with a written rescue plan (s.26, s.26.1(4)).'],
  ['ladder', 'Ladders', 'CSA Z11 Grade 1/1A/1AA, secured, three points of contact (s.80–83).'],
  ['ewp', 'Scissor lift / boom lift', EWP_NEW?'Daily inspection, trained operator, manual kept with the machine (O. Reg. 117/26).':'Daily inspection, trained operator, manual on board (s.144–149).'],
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
      'I am trained on this type of platform and familiar with this make and model.|s.147|O. Reg. 117/26 s.9–11',
      'Operator\'s manual is with the platform.|s.149|O. Reg. 117/26 s.8',
      'Maintenance and inspection tag is attached near the controls.|s.146|O. Reg. 117/26 s.6',
      'Logbook of inspections, repairs and maintenance is up to date.|s.145|O. Reg. 117/26 s.5',
      'Rated load decal visible; load today is within it.|s.148(1)(a)|O. Reg. 117/26 s.7(1)(a)',
      'Guardrails, mid-rails, toe boards and entry gate or chain are in place, and the gate closes.|s.144(7)|O. Reg. 117/26 s.4(7)',
      'Ground and platform controls work, including emergency stop.|Mfr.',
      'Emergency lowering works.|Mfr.',
      'Tilt alarm, descent alarm and horn work.|Mfr.',
      'No hydraulic leaks; hoses and cylinders OK.|Mfr.',
      'Tires, wheels, pothole guards and brakes OK.|Mfr.',
      'Battery charged; charger and cables OK.|Mfr.',
      'Surface is firm and level; overhead hazards and power lines checked.|s.148|O. Reg. 117/26 s.7(1)(c)',
      'Boom lift: harness on and tied off to the anchor point at all times.|s.148(1)(e)|O. Reg. 117/26 s.7(1)(e)'
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
      'Class 00 / 0 gloves: lab-tested within the last 6 months and air-tested before each use.|CSA Z462',
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
    'In a boom lift, tie off to the anchor point.'], ask:['Where is the manual on this machine?'], ref:EWP_NEW?'O. Reg. 117/26':'s.143–149' },
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
    'Tell the JHSC or health and safety rep and the union, if any, and the constructor (GC), right away.',
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
  ['ewp', 'Lift licence: elevating work platform / boom operator', EWP_NEW?60:36],
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
  { n:5, name:'Company Rules', pts:18, docs:['Written company safety rules','Progressive discipline procedure','Rules signed by each worker'], ev:'rules' },
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
  { cat:'Electrical', title:'Lockout done right', do:['Your own lock and tag on every source','Discharge capacitors','Try the start button after locking'], dont:['Share a lock or key','Hang a tag with no lock'], q:'lockout tagout electrical procedure', url:'https://www.youtube.com/watch?v=SZG4n1S7n2k', vt:'Incident Investigation: Failure to Lock Out Injures Sawmill Workers | WorkSafeBC' },
  { cat:'Electrical', title:'Arc flash: what it looks like', do:['Read the label','Wear arc-rated PPE','Stand to the side when operating gear'], dont:['Open energized gear in street clothes','Rack breakers without PPE'], q:'arc flash safety awareness', url:'https://www.youtube.com/watch?v=gv6mQE0Mfsk', vt:'Arc flash survivor interview' },
  { cat:'Access', title:'Ladder setup', do:['1 out for every 4 up','Secure it top and bottom','Three points of contact'], dont:['Stand on the top step','Overreach past your belt buckle'], q:'ladder safety construction', url:'https://www.youtube.com/watch?v=O79dH99XFdk', vt:'IHSA.ca - Ladder Safety' },
  { cat:'Access', title:'Scissor lift daily check', do:['Walk-around before use','Test emergency lowering','Close the gate'], dont:['Climb the rails','Drive on soft or sloped ground'], q:'scissor lift pre-use inspection', url:'https://www.youtube.com/watch?v=aGlPoGqpIGY', vt:'AWPT.org - Scissor-Lift Pre-Start Inspection' },
  { cat:'Access', title:'Harness inspection', do:['Bend the webbing to check for cuts','Check the label and dates','Check the fall indicator'], dont:['Use gear that has arrested a fall','Tie off below your D-ring'], q:'fall protection harness inspection', url:'https://www.youtube.com/watch?v=XvUJ48I6GII', vt:'3M Fall Protection EMEA Protecta Harnesses Pre-use inspection by user Video' },
  { cat:'General', title:'Housekeeping wins', do:['Clean as you go','Coil cords off the floor','Clear exits'], dont:['Leave offcuts in walkways','Block extinguishers'], q:'construction site housekeeping safety', url:'https://www.youtube.com/watch?v=nGHjHLOUKT4', vt:'Planning Your Jobsite for a Safe Working Environment' },
  { cat:'Health', title:'Silica dust control', do:['Wet coring','Vacuum shroud on grinders','Fit-tested respirator'], dont:['Dry sweep','Blow dust with compressed air'], q:'silica dust control construction', url:'https://www.youtube.com/watch?v=R_sC2wX9Uwc', vt:'Silica Exposure | WorkSafeBC' },
  { cat:'Electrical', title:'Look up for power lines', do:['Look up and mark overhead lines before you set ladders, lifts or booms','Keep Ontario\'s minimum distance from lines (O. Reg. 213/91 s.188) and use a signaller for equipment','If equipment touches a line, stay in the cab, keep everyone back, and call 911 and the utility'], dont:['Carry long ladders or conduit near lines','Step off a machine touching a line unless there\'s a fire; then jump clear, feet together, and shuffle away','Assume a line is insulated or dead'], q:'overhead power line safety construction', url:'https://www.youtube.com/watch?v=0tIa564zW74', vt:'A Bright Arc: A Guide to Power Line Safety (Full-length version)' },
  { cat:'General', title:'Confined space entry', do:['Test the air before entry and keep testing while inside','Have a permit, an attendant and a rescue plan before entry','Ventilate the space and isolate its energy'], dont:['Go in after a collapsed worker without rescue gear','Trust your nose for gas','Enter without training and authorization'], q:'confined space entry safety', url:'https://www.youtube.com/watch?v=pjzhDiWFURI', vt:'Confined Spaces Deadly Spaces: Preventing Confined Space Accidents (4 of 4)' },
  { cat:'Health', title:'Beat the heat', do:['Drink water often, before you feel thirsty','Take shade breaks and watch your crew for warning signs','Ease new or returning workers into hot work'], dont:['Push through dizziness, cramps or confusion','Work alone in high heat','Rely on energy drinks'], q:'heat stress awareness workers', url:'https://www.youtube.com/watch?v=seUezvxEjM4', vt:'WSIB Heat Stress Awareness Guide | CSPAAT Guide de sensibilisation au stress de chaleur' }
];

/* ---------- Safety updates (filled weekly by the Research agent; approved before release) ---------- */
const UPDATES = [
  { date:'2026-11-22', title:'COR in Ontario is granted only by IHSA', body:'IHSA is the authority having jurisdiction for COR in Ontario. All external audits now use the COR 2020 audit tool, submitted through AuditSoft. Senior management and one full-time employee must take IHSA\'s prescribed training first.', src:'IHSA', url:'https://www.ihsa.ca/cor-home' },
  { date:'2026-11-22', title:'Incident reporting content is set by O. Reg. 420/21', body:'Critical injuries and deaths: phone the Ministry right away and send a written report within 48 hours. Injuries needing medical attention or keeping a worker from usual work: written notice within 4 days. Some construction incidents with no injury: notice within 2 days.', src:'Ontario.ca', url:'https://www.ontario.ca/page/reporting-workplace-incidents-and-illnesses' },
  { date:'2026-11-22', title:'Elevating work platforms: daily inspection and logbook', body:'Each EWP must be inspected before use every day by a trained worker, and the owner must keep a permanent record of inspections, tests, repairs and maintenance '+(EWP_NEW?'(O. Reg. 117/26 s.4(3), s.5).':'(O. Reg. 213/91 s.144(3), s.145).'), src:EWP_NEW?'O. Reg. 117/26':'O. Reg. 213/91', url:EWP_NEW?'https://www.ontario.ca/laws/regulation/r26117':'https://www.ontario.ca/laws/regulation/910213' },
  { date:'2026-11-22', title:'Fire extinguishers: monthly tag', body:'A competent worker must inspect extinguishers at least once a month and record the date on the attached tag (O. Reg. 213/91 s.55).', src:'O. Reg. 213/91', url:'https://www.ontario.ca/laws/regulation/910213' },
  { date:'2026-04-20', title:'New EWP regulation replaces s.143–149 on Jan 1, 2027', body:'Starting January 1, 2027, the elevating work platform rules move out of O. Reg. 213/91 (s.143–149) into a new standalone regulation, O. Reg. 117/26. Platforms still need a daily pre-use check by a trained worker and an up-to-date signed record of inspections, repairs and maintenance. Mobile EWP operator training will be good for five years, plus familiarization on each make and model you run.', src:'Ontario e-Laws', url:'https://www.ontario.ca/laws/regulation/r26117' },
  { date:'2026-10-22', title:'WSIB average premium drops to $1.18 for 2027', body:'WSIB is cutting its average premium rate to $1.18 per $100 of insurable earnings for 2027, down from $1.23 in 2026. Your own rate depends on your rate class and risk band, so it may not drop by the same amount. Your 2027 rate statement is available now in WSIB online services.', src:'WSIB', url:'https://www.wsib.ca/en/2027premiumrates' },
  { date:'2026-10-21', title:'Contractor and its master electrician fined $122K for selling permits', body:'An Ontario licensed electrical contractor and its owner, who was also its Designated Master Electrician, were fined a combined $122,000 for pulling ESA permits on six homes wired by an unlicensed individual. ESA\'s message: a contractor licence can\'t be rented, lent or used to make unlicensed work look legitimate. The DME is responsible for planning and supervising every job done under the company\'s name.', src:'ESA', url:'https://esasafe.com/newsroom-2026/licensed-electrical-contractor-and-owner-fined-$122,000-in-permits-for-sale-scheme/' }
];

/* ---------- 20 Vision Electric Company Policy (from 20_Vision_Company_Policy.pdf, Jan 2026; text as written by the company) ---------- */
const POLICY_VERSION = '2026-01-03';
const POLICY = [
 { t:'Health and Safety Policy Statement', b:[
  'It is the policy of 20 Vision Electric Inc. to perform work in the safest possible manner consistent with the Occupational Health and Safety Act (OHSA) and applicable Regulations for Construction Projects and Industry Standards. Protection of employees, from injury or occupational illness is a major continuing objective. Management, office staff, supervisors and workers must be dedicated to the continuing objective of reducing the risk of injury. As President of 20 Vision Electric Inc., I give my promise that every reasonable precaution will be taken for the protection of workers.',
  '20 Vision Electric Inc. will strive to eliminate any hazards that may result in damage to property or personal injuries by assigning general and specific responsibilities for workplace health and safety.',
  'Management and Supervisors will be held accountable for the health and safety of workers under their supervision. We will always strive to ensure that safe and healthy work conditions are maintained in all work areas. We further ensure that all workers will receive adequate training in their specific work tasks to protect their health and safety.',
  'As a condition of employment, workers will be expected to protect their health and safety by working in compliance with the OHSA and its applicable regulations, industry standards and the safe work practices and procedures established by 20 Vision Electric Inc. The Company Health and Safety Program will be reviewed with employees upon hiring.',
  'Any subcontractor hired by 20 Vision Electric Inc. to perform work or provide services is responsible for ensuring that all of their workers comply with the Occupational Health and Safety Act, all applicable regulations, any other relevant legislation, and 20 Vision Electric Inc.\'s Health and Safety Policies and Program.',
  'It is the goal of 20 Vision Electric Inc. to eliminate or minimize hazards that may cause accidents and injuries, as well as those which create health hazards. All accidents will be viewed as serious and thoroughly investigated. If necessary, changes will be adopted to minimize the likelihood of a repeat incident and/or accident.',
  'Compliance with this policy will be reviewed regularly at all employee levels. Violations will be recorded. Repeated disregard or willful violations of this policy by any employee or subcontractor, at any level, may be considered cause for disciplinary action in accordance with the 20 Vision Electric Inc. Enforcement Policy and existing laws.',
  '20 Vision Electric Inc. recognizes that working in a safe environment is a right for its employees and further recognizes that the benefit of working in a safe and healthy work environment extends to 20 Vision Electric Inc. employees, their families and friends.' ]},
 { t:'Environmental Policy Statement', b:[
  '20 Vision Electric Inc. is committed to environmental stewardship in all aspects of our business. We accept responsibility and accountability for the environmental impacts of our operations in providing service to our customers.',
  'It is the policy of 20 Vision Electric Inc. to comply with all relevant environmental legislative requirements, responsibilities, and objectives pertaining to all environmental aspects of our business.',
  'Consistent with our goals to provide a safe and healthy working environment for all workers, 20 Vision Electric Inc. promotes the development and application of procedures to minimize the ecological impacts of our operations, as well as supporting environmental sustainability in both the short and long term for our current and future generations.',
  'Whenever possible, 20 Vision Electric Inc. will reduce the consumption of non-renewable resources, minimize waste, and reuse materials, adhering to best practices and specifically minimizing environmental impact.',
  '20 Vision Electric Inc. will provide adequate information, instruction and training to all employees on the Environmental policies and procedures and the General Waste Management Program to ensure that all employees are competent and able to complete tasks and activities safely and without risk or adverse effects to the environment. Environmental concerns and goals will also be discussed during pre-job meetings, site-specific orientation, and hazard assessments.',
  '20 Vision Electric Inc. will seek to use energy-saving materials in all operations, reuse rather than dispose whenever possible and promote recycling and the use of recycled materials where possible. All refused items will be disposed of at transfer stations, and waybills will be kept on record.',
  'Compliance with this policy will be reviewed regularly at all employee levels. Violations will be recorded. Repeated disregard or willful violations of this policy by any employee or subcontractor, at any level, may be considered cause for disciplinary action in accordance with the 20 Vision Electric Inc. Enforcement Policy and existing laws.' ]},
 { t:'Supervisor Responsibilities', b:[[
  'Ensuring workers work in compliance with required protective devices, measures and procedures.',
  'Ensuring workers use or wear any equipment, protective devices or clothing required by the employer.',
  'Advising workers of any potential or actual health or safety danger known by the supervisor.',
  'Providing workers, when required, with written instructions on any measures and procedures to be taken for the workers\' protection.',
  'Taking every precaution reasonable in the circumstances for a worker\'s protection.',
  'Supervising the work on the project at all times, either personally or by having an assistant who is a competent person to do so when the supervisor is unavailable.',
  'Inspecting once a month, all tooling equipment, including fire extinguishing equipment, electrical installation tooling, communications systems, temporary supports and means of access and egress at the project to ensure worker safety.',
  'Report any concerns found or communicated to by the workers regarding all tooling and equipment, including fire extinguishers, electrical installation tooling, communications systems, temporary supports and means of access and egress at the project to the head office and remove hazards if able to. E.g. if a worker finds a faulty tool, remove it from use and arrange with the head office for a replacement.',
  'Where tasks are performed for a scope of work that increases the possibility of a hazard, no matter the magnitude, to the general public, or another trade unfamiliar with electrical installations, the supervisor shall report to the head office immediately of his/her concern, and: cease continuing the task, if already started; assess the possibility of hazards to the general public and devise a method to control the potential hazard (signage to reroute pedestrian traffic, and Hi-Vis traffic cones to identify trip hazards); if minimizing the potential hazard appears unlikely by control methods, review if an alternate shift type is the only option to minimize the volume of pedestrian traffic. Notify the head office if this is required.' ]]},
 { t:'Worker Responsibilities', b:[
  'It is not enough for management to implement safety policies to protect the workers. All 20 Vision Electric Inc. employees must accept their responsibilities in creating a healthy and safe working environment for themselves, their co-workers, and others. 20 Vision Electric Inc. employees will be required to:',
  ['Work in accordance with 20 Vision Electric Inc. Health and Safety Program.',
  'Work in accordance with the Occupational Health and Safety Act and applicable Regulations.',
  'Be accountable for their safety and work in a manner that will not endanger fellow workers.',
  'Help new employees recognize job hazards and encourage following proper procedures.',
  'Advise other trades of a potential hazard, as they may not be familiar with the tasks performed.',
  'Suggest to pedestrian traffic to refrain from approaching during the task and notify the supervisor immediately if ignored by pedestrian traffic.',
  'Use/Operate equipment in a safe manner.',
  'Wear, use and properly maintain Personal Protective Equipment (PPE) required by 20 Vision Electric Inc.',
  'Clean up their work areas as necessary, but at least daily.',
  'Report immediately to the supervisor: any known workplace hazards or OHSA violations; any condition, practice or hazards that may cause injury or health hazard to a worker or damage to equipment; any injury or accident, no matter how minor; and any defective tools and/or equipment should be refrained from use until replacement or repaired equipment is provided.',
  'No matter how small an issue may appear, the key is to remember that it is better to be proactive and not reactive to a potential problem or condition.' ]]},
 { t:'Code of Conduct', b:[
  'Management and workers must work as a team in reaching our goal of creating the safest and healthiest workplace environment. It is for that reason that 20 Vision Electric Inc. has adopted a code of conduct to be followed by all of our employees. All members of the 20 Vision Electric Inc team will:',
  ['Treat others as you would want to be treated (mutual regard and respect).','Distribute and share appropriate information regularly.','Be honest with yourself and with others.','Deliver feedback without being defensive.','Seek first to understand a problem and then work towards solutions.','Have a greater trust and confidence in others, as this will make us more productive and also make the workplace more enjoyable.','Be fair and open-minded while dealing with others.','Deliver on your commitments.','Participate in discussions and decision-making and support the implementations.','Be courteous in your activities with others.','Show up on time and prepared for the task at hand.','Be respectful of your environment, and','Understand that "We are GUESTS on Job Sites."' ]]},
 { t:'Personal Protective Equipment (PPE)', b:[
  'General Personal Protection. For personal protection on the job site, workers shall wear:',
  ['Shirts with minimum 4" sleeves and long sleeve shirts permitted 100% Cotton (No baggy clothing).','Gloves, respirators and specially designed protective clothing shall also be worn under certain hazardous conditions.','Full-length pants must be worn. Shorts are not permitted (No baggy clothing).'],
  'For personal protection on the job, workers shall avoid wearing:',
  ['Greasy or oily clothing, including gloves and boots.','Loose/Baggy, torn or ragged clothing.','Rings, neck chains, dangling earrings and other jewelry that may become entangled with equipment.'],
  'Basic safety equipment required on all 20 Vision Electric Inc. projects by all workers, supervisors, subcontractors, subcontractors employees and visitors include — to be supplied by the worker:',
  ['Steel toe boots CSA Approved (Green Triangle)','Hard Hat CSA Approved Class E (Type I or Type II)','Eye protection CSA Approved Safety Glasses'],
  'To be supplied by 20 Vision Electric Inc.:',
  ['CSA Approved Safety harness and lanyard','CSA Approved face shields, hearing and respiratory protective devices if required for the task','CSA Approved rubber gloves, shields, mats, V-rated tools and arc flash suits if required for the task'],
  'PPE Safe Work Practices:',
  ['When selecting PPE, ensure that it meets the required standards outlined in the 20 Vision Electric Inc. PPE Policy.','PPE should fit the wearer comfortably but must also stay securely in place. When PPE is available in varied sizes or is adjustable, be sure to choose a size/adjustment to ensure proper fit.','Inspect and replace PPE when it is showing signs of wear or when it has been exposed to trauma, i.e. when a hard hat is struck by a falling object.','Work boots must be laced securely to the top eyelet at all times.','Do not use any PPE unless you have been trained in its use and maintenance.'] ]},
 { t:'Head, Foot, Eye, Hearing, Respiratory and Hand Protection', b:[
  'Head Protection: Workers shall wear, at all times on the job site, a CSA-certified or Class E hard hat. They shall not modify the hard hats and shall replace damaged or expired hats.',
  'Foot Protection: Workers shall wear CSA-certified Grade 1 footwear or CSA-certified footwear with heavy-duty toe and sole protection at all times on the job site. Work boots are to be laced to the top, tied and replaced when badly worn or deteriorated. Any worker(s) footwear with the toe exposed can be refused work until proper footwear is used.',
  'Eye Protection: The use of eye protection is required at all times. Protection shall be a minimum of Grade 1 industrial quality glasses with side shields or those that wrap around. Workers shall wear proper welding safety glasses when working with welders.',
  'Hearing Protection: Workers will wear appropriate hearing protection whenever there is a threat of hearing damage due to continuous exposure to excessive noise.',
  'Respiratory Protection: Work areas should be ventilated to reduce hazards from dust, fumes, gases or vapours. Where ventilation is not practical, respirators appropriate to the hazard shall be provided and shall be used by the worker who will be trained to use and maintain the respirators properly. For work generally performed by 20 Vision Electric Inc., workers should only require, at a maximum, filtering half-face pieces or Elastomeric face pieces. Supervisors will train workers to properly use and maintain respirators.',
  'Hand and Skin Protection: Appropriate protection shall be used whenever injury or illness due to the absorption of dangerous substances is possible, when wearing gloves be sure to select gloves appropriate for the hazards presented by the task.',
  ['Cuts and abrasions: Work Gloves','Hot/Cold Objects: Insulated Gloves','Chemical: As specified on SDS','Electrical – Under 300 Volts: Class \'00\' rubber gloves','Electrical – Over 300 Volts: Class \'0\' rubber gloves'],
  'Fall Protection: All employees shall use and be trained in Fall Protection. See Fall Protection Policy.' ]},
 { t:'Designated Substances, Traffic, Fire Retardant Clothing and Live Work', b:[
  'Designated Substance Handling: Asbestos, silica, lead, etc. have particular legislation on minimum requirements that are quite specific. Management will ensure that approved procedures that comply with specific designated substances requirements are in place. Management and/or supervisors will ensure that SDSs are complete and up to date and are located on-site, as required. Supervisors will ensure that workers are trained as per the SDS on the proper procedures when using such products.',
  'Traffic Protection: Reflective fluorescent blazers or international orange vests, with tear-away features, must be worn when required near vehicular traffic and/or mobile machinery.',
  'Fire Retardant Clothing: Fire Retardant clothing must be worn when required as per CSA Z462 Arc Flash Protection Policy.',
  'Live Work: 20 Vision Electric Inc. will not perform any live work. Only testing procedures will be conducted on live equipment. Any worker performing testing must use a full suit for live work including 12.4 cal/cm² coveralls, gloves with leather protective gloves and a face shield with a balaclava.' ]},
 { t:'Workplace Violence and Harassment Prevention', b:[
  '20 Vision Electric Inc. is committed to providing a respectful, supportive, healthy, safe, accessible and inclusive work environment for all employees, who are entitled to work in an environment free from violence, threats of violence, intimidation and other disruptive behaviour.',
  'Examples of Workplace Violence:',
  ['Physical assault: any physical force or threat of physical force to create fear and control another person, such as hitting, blocking, shoving, choking, slapping, threats of violence, and using a weapon or other objects to threaten, hurt or kill.',
   'Sexual harassment: unwanted sexual attention. It can include physical, verbal and non-verbal conduct. Physical conduct includes slapping, pinching, grabbing and related conduct. Verbal harassment includes propositioning or making unwanted comments of sexual nature, such as degrading words, rude jokes, sexual comments, physical contact, sexual demands, unwanted kissing or touching of a sexual nature, and insulting remarks about the person\'s sexual orientation, race, culture, ability, and/or income.',
   'Threat (verbal or written): is communicated intent to inflict physical or other harm on any person or to the property by some unlawful act. A direct threat is a clear and explicit communication distinctly indicating that the potential offender intends to harm, a conditional threat involves a condition, and veiled threats usually involve body language or behaviours that leave little doubt in the mind of the victim that the perpetrator intends to harm.',
   'Verbal/Emotional/Psychological Abuse: this is a pattern of behaviour that makes someone feel worthless, flawed, unloved, or endangered. Like other forms of abuse, it is based on power and control.',
   'Workplace Bullying: repeated and persistent negative acts towards one or more individuals, which involve a perceived power balance and create a hostile work environment.'],
  '20 Vision Electric Inc. is committed to providing a work environment free from harassment and discrimination based on race, creed, colour, national origin, political or religious affiliation, sex, sexual orientation, age, marital status, family and disability. To accomplish this goal 20 Vision Electric Inc. will:',
  ['Ensure that measures and procedures in the violence and harassment prevention program are carried out.','Hold management accountable for responding to and resolving complaints of violence.','Ensure compliance by all who have a relationship with the organization, such as physicians, contractors, volunteers, etc.','Post a copy of this policy in the workplace.','Integrate safe behaviour into day-to-day operations.','Develop a reporting process for incidents of workplace violence and harassment.','Investigate all reports or threats of violence/harassment in a prompt, objective and sensitive way.','Take corrective action.','Provide response measures.','Facilitate medical attention and support for those involved directly or indirectly.','Ensure a report goes to WSIB of all accidents where a worker loses time from work, requires healthcare, earns less than regular pay for regular work, requires modified work at less than regular pay or performs modified work at regular pay for more than seven days.'],
  '20 Vision Electric Inc. expects no less from its employees than to work cooperatively and constructively with co-workers, clients and all personnel its employees may come in contact with while employed by 20 Vision Electric Inc. It is through mutual respect and understanding that we will work together in creating a workplace atmosphere that is free from violence and/or harassment and for the betterment of the project.',
  'Managers/Supervisors\' Responsibilities:',
  ['Enforce policy and procedures and monitor worker compliance.','Identify and alert staff to violent persons and hazardous situations.','Investigate all workplace violence using the organization\'s accident investigation procedure form, and contact the police as required.','Facilitate medical attention for employee(s) as required.','Debrief those involved in the incident either directly or indirectly.','Ensure the workplace violence and harassment prevention program is reviewed at least once a year.'],
  'Employee Rights and Responsibilities:',
  ['Participate in education and training programs so you can respond suitably to any incident of workplace violence or harassment.','Understand and comply with the violence and harassment prevention policies and related procedures.','Report all incidents or injuries of violence/harassment or threats of violence/harassment to your supervisor immediately; complete a Workplace Violence Incident Report.','Contribute to risk assessments.','Seek support when confronted with violence/harassment or threats of violence.','Get medical attention.','At least once a year, participate in a review of the workplace violence prevention program.'],
  'Reporting and Investigation:',
  ['Workers are to report all violence-related incidents or hazards to their manager or supervisor. This report can be made confidentially at the employee\'s request. However, sharing information to ensure the safety of others and prevent reoccurrence may be necessary (e.g. contents of a police report).','The reporting worker may make the report confidentially without leaving a copy in the log, indicating the need for confidentiality to her/his direct manager or supervisor (or in that person\'s absence, to another manager or supervisor).','The manager or supervisor receiving the report investigates it and ensures that measures are taken to safeguard employees and curtail violence or harassment. No report of workplace violence/harassment or risks of violence may be the basis of reprisal against reporting employees.','The employer reports all injuries to MOL and WSIB as required by the Occupational Health and Safety Act and Workplace Safety and Insurance Act.'] ]},
 { t:'Workplace Violence Risk Assessment', b:[
  '20 Vision Electric Inc. shall assess the risk of workplace violence that may arise from the nature of the workplace, the type of work, or the conditions of work. The assessment shall consider circumstances that would be common to similar workplaces, circumstances specific to the workplace and any other prescribed elements.',
  'Education: New employees will receive both general and site-specific orientation to the workplace violence and harassment prevention program. In addition, all employees will receive an annual review of the program\'s general and site-specific components.',
  'Accountability: All workplace parties are accountable for complying with the policy, program, measures and procedures related to workplace violence.',
  'Records: All records of reports and investigations of workplace violence and harassment are kept for five years.',
  'Policy Review: This workplace violence prevention policy will be reviewed annually.' ]},
 { t:'Alcohol and Drug Policy', b:[
  '20 Vision Electric Inc. acknowledges its obligations to take reasonable steps to ensure the health and safety of its workers. The Alcohol and Drug Policy applies to all employees of 20 Vision Electric Inc. and its subcontractors.',
  'Alcohol and drug abuse are not acceptable in the workplace. The following are prohibited:',
  ['Being impaired by alcohol or drugs while at work.','The possession or use of illicit drugs on company premises, at company worksites, or in company vehicles.'],
  'An employee is not to report to work or be at work if he/she is impaired by alcohol or drugs.',
  'Medication:',
  ['An employee who is taking medication (whether or not prescribed by a physician) which may affect or impair judgement, coordination or perception to adversely affect his/her ability to perform work safely and productively must notify his/her supervisor before commencing work.','The supervisor will determine whether the employee will be permitted to work or whether work restrictions will be applied.','An employee who is not capable of competently and safely performing his/her job duties will not be permitted to work and will be required to leave the company premises/job site.','If an employee is considered to be in an unfit condition and is requested to leave company premises, transportation to his/her residence will be arranged by his/her supervisor.'],
  'Assistance:',
  ['Anyone, employee or subcontractor, under the influence of alcohol or drugs that may impair their activities will not be permitted to work and will be encouraged to partake in the company Employee Assistance Program (EAP).','An employee who has a substance abuse problem is encouraged to utilize the service of the company EAP.','20 Vision Electric Inc. will exercise reasonable care and caution to maintain confidentiality relating to an employee\'s participation in a treatment program.','If EAP assistance is refused by the worker, and site safety becomes compromised, then further action may be required.'],
  'Examples of, but not limited to, alcohol and drugs that may impair a worker:',
  ['Alcohol (beer, wine, spirits): impaired judgement, slowed reflexes, impaired motor function, sleepiness or drowsiness.','Cannabis (marijuana, edibles, hashish): distorted sense of time, impaired memory, impaired coordination.','Depressants (sleeping medicines, sedatives): inattention, slowed reflexes, depression, impaired balance, drowsiness.','Hallucinogens (LSD, PCP, mushrooms): inattention, sensory illusions, hallucinations, disorientation, psychosis.','Inhalants (hydrocarbons, solvents, gasoline): intoxication similar to alcohol, dizziness, headache.','Opiates (morphine, codeine, heroin): loss of interest, "nodding", and overdose may be fatal.','Stimulants (cocaine, amphetamines): elevated mood, over-activity, tension/anxiety, rapid heartbeat, constriction of blood vessels.'],
  '(Source: Blume, S.B., Alcohol and Drug Abuse in the Encyclopedia of Occupational Health and Safety 4th edition, International Labour Office, 1998)' ]}
];
const POLICY_AGREE = 'I agree to 20 Vision Electric Inc. company policies and code of conduct. I agree to conduct the task safely with proper PPE. It is my responsibility to make sure I have proper attire and PPE to safely carry out tasks.';
const POLICY_SIGNER = 'Shamar Hamilton, M.E., President, 20 Vision Electric Inc.';
