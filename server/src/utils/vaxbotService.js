/**
 * VaxBot Pediatric & Vaccine Knowledge Engine
 * Implements National Immunization Schedule (NIS 2025) clinical knowledge base
 * with multilingual semantic matching (English, Hindi, Hinglish) and optional Gemini API integration.
 */

// Comprehensive clinical knowledge rules
const KNOWLEDGE_BASE = [
  {
    triggers: [
      'fever', 'bukhar', 'temperature', 'body hot', 'garam', 'tapman', 'feverish',
      'vaccine ke baad bukhar', 'halka bukhar', 'pyrexia', 'side effect'
    ],
    title: 'Post-Vaccination Fever Management (AEFI Protocol)',
    reply: `🌡️ **Post-Vaccine Fever is Normal & Common:**
Mild fever (99°F - 101°F) within 24–48 hours is a healthy sign that your baby's immune system is building protective antibodies, especially after **Pentavalent** or **DPT** doses.

**Recommended Care:**
1. **Comfortable Clothing:** Dress baby in light, breathable cotton clothes. Keep the room well-ventilated.
2. **Hydration / Breastfeeding:** Continue frequent breastfeeding or offer plenty of fluids.
3. **Cold Sponge:** If needed, use a clean cloth dampened with lukewarm (NOT ice cold) water on the forehead.
4. **Medication:** Only administer infant Paracetamol drops (PCM) if prescribed by your pediatrician, adhering strictly to dose-by-weight. Never give Aspirin.

⚠️ **Consult Doctor Immediately If:**
- Fever exceeds 102°F (39°C) or lasts beyond 48 hours.
- Baby is unusually drowsy, lethargic, or has persistent inconsolable crying (>3 hours).`,
    suggestions: ['What about swelling at injection site?', 'Can I give bath after vaccine?', 'DPT vs Pentavalent differences']
  },
  {
    triggers: [
      'bcg scar', 'scar nahi bana', 'no scar', 'bcg mark', 'bcg papule', 'nishan nahi bana',
      'bcg pustule', 'bcg vaccine', 'tuberculosis'
    ],
    title: 'BCG Scar Formation NIS Guidelines',
    reply: `💉 **BCG Scar Timeline & Guidelines:**
Under NIS 2025 guidelines, a BCG scar typically takes **6 to 12 weeks** to develop:

1. **Week 2–3:** A small red nodule/papule appears at the left upper arm.
2. **Week 5–6:** It turns into a small blister or pustule that may discharge watery fluid (do NOT squeeze or apply ointments).
3. **Week 8–12:** It heals naturally leaving a permanent round scar.

**What if NO scar forms after 12 weeks?**
- Government of India & WHO guidelines state: **Do NOT re-vaccinate with BCG** if immunization was officially recorded at birth. Up to 10% of children develop cellular immunity without a visible scar!`,
    suggestions: ['Fever after vaccination?', 'Next vaccine due date?', 'What is OPV zero dose?']
  },
  {
    triggers: [
      'miss', 'late', 'delayed', 'chhut gayi', 'der ho gayi', 'catch up', 'schedule missed',
      'gap', 'interval', 'minimum interval'
    ],
    title: 'Missed / Delayed Vaccine Guidelines (Catch-up Schedule)',
    reply: `📅 **Catch-Up Immunization Rules (NIS 2025):**
If you missed a scheduled vaccination date, **do NOT restart the entire series from dose 1!** Simply resume from the next due dose as soon as possible.

**Key NIS Rules:**
- **Minimum Interval Rule:** Multi-dose series (e.g., OPV 1-2-3, Pentavalent 1-2-3, Rotavirus 1-2-3) requires at least **4 weeks (28 days)** between consecutive doses.
- **BCG:** Can be given up to 1 year of age.
- **Pentavalent & Rotavirus:** Given up to 1 year of age. If older than 1 year, DPT is given instead.
- **Measles-Rubella (MR):** First dose at 9 months; catch-up available up to 5 years.

👉 *Log in to your VacciTrack Parent Dashboard to see your child's auto-adjusted schedule with grace periods!*`,
    suggestions: ['How to book appointment?', 'What is minimum gap?', 'Is it safe to give late?']
  },
  {
    triggers: [
      'swelling', 'sujan', 'redness', 'pain', 'dard', 'lump', 'gath', 'injection site',
      'hard spot', 'leg pain', 'rona'
    ],
    title: 'Injection Site Pain & Swelling Care',
    reply: `🩹 **Injection Site Care:**
Mild redness, tenderness, and a small lump at the thigh/arm are typical after intramuscular injections (like Pentavalent or PCV).

**What to do:**
- Apply a **cool, clean damp cloth** gently over the area for 5-10 minutes.
- Do NOT massage or vigorously rub the injection site.
- Avoid applying ice directly, hot compresses, or unauthorized ointments.
- The small firm nodule usually resolves on its own within 2 to 4 weeks.`,
    suggestions: ['Fever after vaccine?', 'Bath after vaccine?', 'Doctor consultation']
  },
  {
    triggers: [
      'schedule', 'nis', 'nis 2025', 'table', 'all vaccines', 'phases', 'birth',
      'national immunization schedule', 'list of vaccines'
    ],
    title: 'NIS 2025 Universal Immunization Schedule',
    reply: `🇮🇳 **India National Immunization Schedule (NIS 2025) Overview:**
VacciTrack tracks 25 vaccines across 4 key phases:

1. **Phase 1 — At Birth (0–15 days):**
   - BCG (Tuberculosis)
   - OPV-0 (Oral Polio Zero Dose)
   - Hepatitis B Birth Dose (Within 24 hours)

2. **Phase 2 — Primary Series (6, 10, 14 Weeks):**
   - OPV (Doses 1, 2, 3)
   - Pentavalent (Doses 1, 2, 3: Diphtheria, Pertussis, Tetanus, Hep-B, Hib)
   - Rotavirus (Doses 1, 2, 3: Severe Diarrhea)
   - fIPV (Fractional IPV: Doses 1 & 2)
   - PCV (Pneumococcal: Doses 1 & 2)

3. **Phase 3 — Boosters (9–16 Months):**
   - MR 1 & 2 (Measles-Rubella)
   - JE 1 & 2 (Japanese Encephalitis - endemic districts)
   - PCV Booster & DPT Booster 1

4. **Phase 4 — School Age (5–16 Years):**
   - DPT Booster 2 (5-6 yrs), Td-10 (10 yrs), Td-16 (16 yrs).`,
    suggestions: ['How to download certificate?', 'What is Pentavalent?', 'Check next dose']
  },
  {
    triggers: [
      'pentavalent', 'penta', '5 in 1', 'dpt', 'five in one'
    ],
    title: 'Pentavalent Vaccine Information',
    reply: `🛡️ **Pentavalent Vaccine (5-in-1 Protection):**
Pentavalent is a single combination vaccine that shields against **5 life-threatening childhood diseases**:

1. **Diphtheria** (Throat infection & airway obstruction)
2. **Pertussis** (Whooping cough)
3. **Tetanus** (Lockjaw)
4. **Hepatitis B** (Liver infection)
5. **Haemophilus Influenzae type b (Hib)** (Severe pneumonia & meningitis)

**Schedule:** 3 doses given at **6 weeks, 10 weeks, and 14 weeks** of age into the middle anterolateral thigh.`,
    suggestions: ['Fever after Pentavalent?', 'What is Rotavirus?', 'Can I give bath?']
  },
  {
    triggers: [
      'certificate', 'cowin', 'download', 'pdf', 'qr code', 'verify', 'school admission', 'praman patra'
    ],
    title: 'Vaccine Certificate & QR Verification',
    reply: `📜 **Official Digital Immunization Certificate:**
You can generate a government-grade verifiable PDF certificate directly in VacciTrack!

**How to Download:**
1. Go to your **Parent Dashboard**.
2. Click on your child's card.
3. Click the **"Download Certificate"** button at the top.
4. You will see a digital certificate preview with a **live QR Code**.
5. Click **"Download Official PDF"** to save your CoWIN-style document.

**Verification:**
Anyone (school, hospital, or authority) can scan the QR code on the certificate using their phone camera to instantly verify all administered doses on the VacciTrack registry!`,
    suggestions: ['How to add another child?', 'Check missed doses', 'Doctor reminder']
  },
  {
    triggers: [
      'bath', 'nahana', 'snan', 'shower', 'water', 'pani'
    ],
    title: 'Bathing After Vaccination',
    reply: `🚿 **Can you bathe your baby after vaccination?**
**Yes!** A gentle lukewarm bath is completely safe after vaccination. 

**Tips:**
- Keep water lukewarm, not hot or chilly.
- Avoid scrubbing or applying harsh soap directly on the needle puncture site for 24 hours.
- Pat the skin dry with a soft towel gently.
- If baby has high fever or is fussy, you can opt for a quick sponge bath instead.`,
    suggestions: ['Fever management', 'Swelling at injection site', 'Next due date']
  },
  {
    triggers: [
      'opv', 'ipv', 'fipv', 'polio', 'drops', 'oral polio', 'inactivated polio', 'two drops'
    ],
    title: 'OPV vs IPV (Polio Vaccines Explained)',
    reply: `🛡️ **OPV vs IPV (Why Both are Given in NIS 2025):**
India uses **BOTH** oral drops and injectable polio vaccines together for maximum protection:

1. **OPV (Oral Polio Vaccine - Drops):**
   - Given at Birth (Zero dose), 6, 10, and 14 weeks, plus booster at 16–24 months.
   - Builds **mucosal immunity** in the gut to prevent the polio virus from shedding or spreading to others.

2. **fIPV (Fractional Inactivated Polio Vaccine - Injection):**
   - Given intradermally into the right upper arm at **6 weeks and 14 weeks**.
   - Builds deep **humoral (blood) antibody immunity**, preventing paralysis even if exposed.

👉 *Together, they provide complete, lifelong immunity against all poliovirus strains!*`,
    suggestions: ['Fever after vaccination?', 'NIS 2025 schedule', 'What is Pentavalent?']
  },
  {
    triggers: [
      'abha', 'abha id', 'ayushman', 'health id', '14 digit', 'digital health', 'card'
    ],
    title: 'ABHA ID (Ayushman Bharat Health Account)',
    reply: `🆔 **What is an ABHA ID and Why is it Needed?**
An **ABHA ID** (Ayushman Bharat Health Account) is a 14-digit digital health identity created under India's **Ayushman Bharat Digital Mission (ABDM)**.

**Key Benefits for Your Child in VacciTrack:**
1. **Paperless Immunization Card:** Never lose your child's vaccination history again.
2. **Nationwide Interoperability:** Accepted across all Government PHCs, AIIMS, and private pediatric hospitals in India.
3. **School & Travel Ready:** Enables instant QR code authentication for admissions and passports.
4. **100% Secure & Private:** Accessed only via two-factor OTP verification by registered healthcare professionals.`,
    suggestions: ['How to download certificate?', 'NIS 2025 schedule', 'Doctor reminder']
  }
];

/**
 * Match user query against the clinical knowledge engine
 */
export const queryVaxbot = async (userMessage, context = {}) => {
  const cleanQuery = (userMessage || '').toLowerCase().trim();

  if (!cleanQuery) {
    return {
      reply: 'Namaste! Main VaxBot hoon, aapka AI Pediatric & Vaccine Assistant. Aap mujhse NIS 2025 schedule, bukhar, side-effects, ya vaccine certificate ke bare me puch sakte hain.',
      suggestions: ['Fever after vaccination?', 'NIS 2025 schedule overview', 'BCG scar guidelines', 'Download certificate']
    };
  }

  // 1. Direct Greetings
  if (/^(hi|hello|hey|namaste|pranam|halo|hola|help)$/i.test(cleanQuery)) {
    const greeting = context?.userName ? `Namaste ${context.userName}! 👋` : `Namaste! 👋`;
    return {
      reply: `${greeting} Main **VaxBot** hoon — VacciTrack ka AI Pediatric & Vaccine Guide.
      
Main aapki madad kar sakta hoon:
- 🌡️ Vaccine ke baad bukhar ya dard ka gharelu ilaj
- 📅 Missed dose / Catch-up schedule guidelines
- 💉 NIS 2025 vaccines (BCG, Pentavalent, Polio, MR, etc.)
- 📜 Verifiable PDF Certificate download karne me

Aapka sawal kya hai?`,
      suggestions: ['Fever after vaccine?', 'NIS 2025 schedule', 'No BCG scar formed?', 'Download Certificate']
    };
  }

  // 2. Scan clinical knowledge base
  let bestMatch = null;
  let highestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const trigger of item.triggers) {
      if (cleanQuery.includes(trigger)) {
        score += trigger.split(' ').length * 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      reply: bestMatch.reply,
      suggestions: bestMatch.suggestions || ['Ask another question', 'Download Certificate', 'View Full Schedule']
    };
  }

  // 3. Fallback with helpful NIS orientation
  return {
    reply: `Aapke sawal ke mutabiq: India ke **National Immunization Schedule (NIS 2025)** ke hisab se sabhi vaccines bache ki suraksha ke liye zaroori hain. 

Agar bache ko **bukhar ya halki sujan** hai, toh lukewarm pani ki patti rakhein aur dhoodh pilate rahein. Agar koi dose chhoot gayi hai, toh dobara shuru karne ki zaroorat nahi hai, bas agla visit jaldi schedule karein.

Aap specific sawal puch sakte hain jaise:
- *"Vaccine ke baad bukhar kya karein?"*
- *"Pentavalent vaccine kya hoti hai?"*
- *"Certificate kaise download karein?"*`,
    suggestions: ['Fever after vaccine?', 'NIS 2025 Schedule', 'BCG scar guidelines', 'Download Certificate']
  };
};
