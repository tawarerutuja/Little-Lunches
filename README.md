# Little Plate · full-app prototype

**Know what to feed your toddler, right now.**
A static, mobile-only, high-fidelity prototype of the whole app. It covers first-time setup, Today, the meal check-in after serving, refusal, Plan, Memory, Learn, Profile, the shared-care carer view, and the edge cases. It is plain HTML, CSS and ES modules, with no framework and no build step.

- Design source: Figma *Little Plate* → page **High-fi v3 · Sunday thali**, sections R1 to R7 and *Mascot: meet Phulka, and money shots*.
- Visual rules: Figma page **Mood board** → *Design System · Parents Planner v1.2 (Option 6: Curry leaf fresh)*. That means Poppins SemiBold titles, Hind body text, rice-white background, curry-leaf green for the one main action, jaggery notes, and tomato only as an accent. The logo is still *Option A6* (Phulka on his plate) with the new colours and a Poppins wordmark.
- Screen size: 402 × 874 (iPhone Pro).

---

## Run it locally

```bash
cd Prototype/app
python3 -m http.server 8000
```

**Windows without Python:** from the `Prototype` folder, run `powershell -ExecutionPolicy Bypass -File serve.ps1`. It opens <http://localhost:8000/>. Press Ctrl+C to stop.

> Opening `index.html` straight from disk (`file://`) does not work, because browsers block ES modules there.

### Two ways in

| Path | What you get |
| --- | --- |
| **Get started** → phone → code **482719** → five setup steps | A brand-new parent. Today, Memory and Plan start empty and fill up as you use them. Plan opens with “Plan your week”. |
| **I already have an account** → phone → code **482719** | A returning parent (Deepali): Aarav, 2 weeks of meal history, a planned week, Aai already joined and Sunita’s invite pending, plus a pattern to check in Memory. All dates follow the real calendar. |

### Prototype panel (desktop, beside the phone)

| Control | What it does |
| --- | --- |
| Sign-in code | Reminds you of **482719** |
| Time: Auto | Tap to make Today act as breakfast, lunch, snack or dinner, whatever the clock says |
| Dark theme | Switches to the derived dark theme |
| Go offline | Shows the *no internet* state (E01). Real offline also works. |
| Refused 3 dinners | Logs three refused dinners so Today shows the E06 notice |
| Restart prototype | Clears everything and starts from the splash |
| **Simulate errors** | Switches that stay on until switched off: *Saving fails* (alert with Try again), *Voice not understood*, *Slow loading* (Phulka and a skeleton screen), *Ideas fail to load* (Try again, or his usual meals) |

On a narrow window the panel folds into a **Prototype** button, so it never covers the phone.

Notifications that would come 20 or 30 minutes later (*How did he eat?* and *Try again*) arrive **after about 8 seconds**, as a lock-screen notification inside the phone.

---

## What’s built, and how it connects

**R1 · First time:** S00 Splash, W01 Welcome, W02 Sign in (+ Google sheet), W03 Enter code, E07 Wrong code, W04 to W08 setup with sheets (W06b, W07b, W08b), then a loading screen, then Today.

**R2 · Today (tab):**
- T01 Today, including:
  - the *Did he eat earlier today?* card, which opens L02;
  - *Tonight · for Monday*: tomorrow’s real prep (soak, chop, grate, set curd), only when there is some;
  - **the T01 decision card** (Figma *v3 · R2 Today*, “Today: deciding dinner”), in curry-leaf colours, for every meal: *Make his dinner from* → two big start cards (*The family’s dinner* in warm jaggery, *What’s at home* in curry leaf) → *Or pick a ready idea*: 3 rows, the first tagged *Best fit* (or *From your plan*) → *None of these? Show other ideas*, then Ask. After a meal is logged, the same card appears for the **next meal** (after dinner, *Tomorrow’s breakfast*), and dishes he already ate that day are left out;
  - *None of these?*, which opens T05 More ideas, then T05s Ask for something specific.
- T07 Family dinner → T08-L Phulka thinking (1.5 s) → T08 his plate.
- T09 What’s at home → T09g Meal and time, T09f Usually at home, V01 Listening → T10 Ideas.
- T10s Ideas for a typed request.
- T02 Recipe, with T04 Missing something?, a one-tap swap, and the backup shown before cooking. *Served it* goes back to Today.
- PL08: when the meal is planned, the same card shows it marked *From your plan*. Swap changes the plan too.

**R3 · After serving:**
- K01 How did he eat?
- K04 Today after the meal: one timeline, the prep, tomorrow’s breakfast, and a toast with Undo.
- K03 notification (*Tell us later*).
- K05 He did not eat (Phulka calm) → K05b with a reason picked → K06 Serve it a different way.
- K07 *Try again* notification.

**R5 · Plan (tab):**
- PL01 first plan (three questions).
- PL02 This week, with a day strip and one-tap swap per meal. PL02b: the swapped row is tinted, with an Undo toast, and the buy count updates.
- PL04 A planned meal sheet, PL11 Next week (*Plan these days*), PL05 Shopping list, PL10 Edit your plan.

**R6 · Memory, Learn, Profile:**
- M01 Memory: a pattern asked as a question, the week grid with outcome shapes, and food groups shown as days.
- M02 A day in Memory, M03 Foods he eats, M04 Change a food (with Undo on remove).
- LN01 Learn and LN02 Article (7 short articles, sources named).
- PR01 Profile. It reuses the setup screens in edit mode, and removing an allergy asks you to check with his doctor first.
- PR02 People who feed him (••• menu, remove with confirm, resend), and PR06 Sign out? Your data stays, so signing back in returns to Today.

**R4 · Shared care:**
- L03 Invite (sheet) → L04 WhatsApp chat on the carer’s phone.
- Tapping the link opens C01 Choose language (Hindi, English; Marathi is “coming soon”), then C02 What to give, then C03 He did not eat, then C04 Saved.
- C04 closes by itself and returns to the parent’s Today, which now shows what Aai added.

**R7 · Edge cases:** E01 No internet, E03 Nothing fits (Phulka searching, two one-tap fixes), E04 Family food has his allergen (type “idli with peanut chutney”), E05 Request had his allergen (type “something with peanut butter”), E06 Refused 3 days, E07 Wrong code.

**Phulka:** the four moods (happy, calm, thinking, searching) and the money-shot motion follow the mascot page. He moves only at peak moments and sits still when *reduce motion* is on.

### Round 4 changes
- **Boy or girl** in setup step 1. All copy switches between he/him and she/her in one place (`pronouns()` in `components.js`). This includes the Hindi carer copy (खाता / खाती).
- **More than one backup food** in setup. The first one picked is suggested first.
- **Earlier today** sits inline on Today, above the decision. It shows what he already ate (by you or a carer), with an optional + for the rest.
- **Today header:** the profile avatar opens Profile directly, with no chevron. *Add another child* lives in Profile.
- **Continue with Google:** shows Google’s “G” and a Google-style account chooser.
- **Plan “How it works”:** a numbered 1 → 2 → 3 stepper instead of card tiles, so nothing looks tappable.
- **Recipe steps:** plain and numbered.
- **Fixes:**
  - The “Checked against his allergies” strip no longer touches the chips in the Ask sheet.
  - The lock-screen notification has centred action buttons and even spacing.
  - *None of these?* is now a full-width button under the ideas.

### Added after testing (not in Figma, needed for a real app)
- **Permission pre-prompts** (DS · States · Permission): “Allow the microphone?” before the first voice input, “Allow reminders?” before the first notification. *Not now* always leaves a working path. Restart the prototype to see them again.
- **Help** screen from Profile: five short answers that expand, and a chat button (coming soon).
- **Micro-interactions:**
  - Phulka’s “saved” hop in the toast when a meal is logged.
  - A light haptic tick on outcome taps and swaps (Android).
  - FAQ answers that expand and collapse.
- **Edge cases:**
  - Typed foods are checked for allergens (“Egg roll” is blocked for an egg allergy).
  - Unsafe dish parts are removed (“mungfali ki sabzi” → no sabzi on his plate).
  - A missing core ingredient (rice in khichdi) offers other ideas instead of “leave it out”.
  - *Nothing fits* only offers fixes that really bring back ideas.
  - Requests respect the time she has.
  - Saves made offline say they will sync.
  - The shopping list skips meals already eaten and shows buy amounts (“Peas 250 g”).

### Round 5 changes
- **Today is one connected dinner card:** the meal, two ways to start (family dinner, what’s at home), an “or pick a ready idea” divider, the best pick with his backup, two more ideas, then *None of these?*. Nothing floats on its own.
- **Earlier today (first section):** nothing added yet → the Figma T01 row “Did he eat earlier today? · Optional · tap to add” with the meal icons; it opens *What did he have?* on the first meal. Once one meal is added, it becomes a list: what he ate (food, how he ate, who added it) and the meals still open, with “2 of 3 added · rest optional”.
- **After *Make something else*:** a “Back to the plan: …” link returned to the planned meal. *(Replaced in round 12 by Swap, and the other options inside the card.)*
- **Edge and error cases:**
  - An allergy added after planning: the planned meal shows “Has milk · swap it” in Plan, an alert on Today, and is skipped in the carer view.
  - Unsafe backups are never suggested.
  - A family dish we don’t know that contains an allergen gets a safe fallback plate.
  - *Nothing fits* with very little at home suggests the one ingredient that unlocks the most of his dishes (“Add moong dal · 4 of his dishes fit with it”). If nothing helps, it says so instead of showing an empty list.
  - *Swap* avoids the same dish on the day before or after.
  - Duplicate checks: shopping items, and invites (different message when that person has already joined).
  - Shopping: a visible *Add* button next to the field (Enter still works). *Share* falls back to copying the list when the phone can’t share.
  - Codes: at most 3 resends. Text fields are capped at 80 characters, and long names wrap.
  - Carer: finger foods say “Give small soft pieces he can pick up himself” instead of “Mash it soft”.
  - Screen readers: a logged meal without a note no longer reads an empty sentence.

### Safety rules in the code (`js/meals.js`)
- Every idea, plan, swap and search is checked against his allergies and the family diet before it is shown.
- Typed family dinners and requests are scanned for allergen words in English, Hindi and Marathi (for example *mungfali*, *dahi*, *sarson*).
- Recipe toddler tips are general feeding guidance. Learn articles say when to call his doctor and name their source.

## Coming soon (never a dead button)

These show a toast or a “coming soon” label:
- recipe videos;
- adding another child;
- Help chat;
- the parent app in Hindi or Marathi (Marathi for carers too);
- Terms and Privacy;
- adding another Google account.

*Share on WhatsApp* for the shopping list uses the phone’s real share sheet. On a desktop it copies the list to the clipboard.

---

## Files

```
index.html  404.html  .nojekyll  favicon.svg  README.md
css/  reset · variables (tokens) · base (frame) · components · screens · animations
js/   icons · phulka · data · store · meals (logic) · components · router · app
      screens (R1) · screens-today (R2, R3, R7) · screens-plan (R5)
      screens-more (R6, R4 invite) · screens-carer (R4 carer view)
assets/photos/        720 px JPGs (hero 1080 px)
assets/photos/thumb/  192 px square crops
```

### Round 15 · Back to the finalised T01 screen
- Today’s decision card is rebuilt to match Figma T01 exactly, in curry-leaf colours. The hero photo card with separate Swap and Ask buttons is gone: the ready-idea rows and *None of these?* (which leads to Ask) already cover them.
- **After logging a meal**, Today shows *Today so far*, tonight’s prep, then the **same T01 card for the next meal**, instead of a single “Next” row.
- **Allergies and house rules:** one title and one lead line, then quiet *Allergies* and *House rules* labels with more space. *Your family’s food* now follows the same pattern.
- **Visual fixes:**
  - The Memory legend is an even 2 × 2 grid.
  - Profile’s Language, Help and Add another child rows use icon tiles like the rows above.
  - Neutral icon tiles are visible on white cards.
  - A single prep task keeps *Done* on the same line.

### Round 14 · Only prep that takes real time
- Tomorrow’s prep card lists only steps that take time the night before: soaking, chopping or cutting, grating, shelling peas, kneading, roasting, cleaning greens, and setting curd.
- Filler steps are removed: “measure the rice”, “keep a banana out”, “check you have an apple or egg”.
- Dishes with no real prep (mashed banana, dal-rice, ragi porridge…) add nothing. If none of tomorrow’s meals need prep, the card doesn’t appear.

### Round 12 · One decision card for every meal
- **Why the old card still showed:** the new card appeared only when the current meal was planned. Plans cover dinner, so at breakfast, lunch or snack time Today fell back to the older “Make his lunch from…” card.
- **Now every meal uses the same card:** photo, meal and *From your plan* or *Best fit*, name, time, **Make this**, **Swap** (one tap, cycles, Undo) and **Ask**.
- **Round 13 correction:** the other ways to decide are back **inside the same card**, not in a sheet. That was the agreed design: one connected card. Below the idea, the card continues: *or start from* (the family’s food, what’s at home), *or pick another idea* (two more), and *None of these?*.
- **Photos:** your original `banana.jpg` shows oats with banana, so it now belongs to *Banana and oats mash*. *Mashed banana* has its own photo.
- **Prep says only tonight’s task**, for example “Set fresh curd.” or “Measure the rice and moong dal into a box.”

### Round 11 · Milk means milk, and we ask about the rest
- A milk allergy no longer silently covers curd, paneer and ghee. When the parent picks **Milk**, setup asks: “Does Ria also react to these? Curd (dahi) · Paneer · Ghee · No, only milk.”
  - The answer is required. The help text says to pick them if unsure and ask the doctor, so “not sure” stays safe.
  - Data saved before this question is treated as “avoid all” until answered.
- Every check follows the answer: ideas, plan, swaps, typed foods (“dahi chawal”), the family plate, prep and the carer view.
  - **Ghee → oil** only when ghee is avoided.
  - Milk itself (milk, kheer, ragi malt, malai, khoa, butter, cheese) is always avoided.
- **Wording:**
  - Alerts say “avoids curd (milk allergy)”.
  - Profile says “Milk only” or “Milk (also curd, ghee)”.
  - The carer note says what to avoid *and* what is fine, in Hindi and English: “Milk allergy: no curd either. Paneer and ghee are fine.”
- From Profile, allowing a milk food again needs a confirm (“Please check with her doctor first”), like removing an allergy.

### Round 10 · Food-safety pass (checked against NHS children’s food-safety guidance)
- **No cook-ahead rice.** Cooked rice left out can grow *Bacillus cereus*. The NHS says to cool rice within 1 hour, refrigerate it, eat it within 24 hours and reheat it only once.
  - Prep steps no longer say “cook extra rice tonight” or “keep dal and rice aside”. They say to set the curd and cook the rice fresh tomorrow.
  - Curd-rice tips say “rice cooked today, never leftover rice”, and every ingredient list says “Rice, cooked today”.
- **Eggs stay in the fridge.** “Keep an egg out of the fridge” is removed. Egg recipes still say to cook the egg fully.
- **Cut vegetables:** prep says “keep covered in the fridge”. The apple is cut fresh, not the night before.
- **Bug fixed, ghee and milk allergy.** Ghee is a milk product, but 8+ recipes using it weren’t marked as milk.
  - For a child with a milk allergy, every recipe now says **oil** in the ingredients, steps and tip, with a note: “Made with oil instead of ghee, because of his milk allergy.”
  - The carer view adds “Milk allergy: no ghee, curd or paneer either” (Hindi and English).
- **Bug fixed, unsafe recipe.** A recipe opened from an old plan or link that is no longer safe now shows an allergy alert, and *Served it* becomes *Pick something else*.
- **Bug fixed, carer house rules.** The carer view always said “No added sugar or spice”. It now shows the rules the parent actually set (salt, sugar or both).
- Choking: upma now says to mash the peas lightly. Other pea dishes already mash them, and balls and strips are sized to hold.

### Round 9 changes
- **Tonight’s head start, for every planned meal.** In the evening, Today shows one small step (5 minutes or less) for each meal planned tomorrow. For example: “Cut the sabzi vegetables, knead the atta and set the curd” for roti-sabzi, or “Shell the peas” for poha.
  - Soaking is marked **Must do**. Only must-dos are tagged in Plan, so the week stays clean.
  - **All done** clears the card, with Undo.
  - It needs a plan for tomorrow. Without one there is nothing to prep, so no card shows.

### Round 8 changes (decisions, and why)
- **Today’s planned meal** is a decision aid, not a lock. Plans meet real life, so the card has:
  - **Make this**
  - **Swap**: one tap, no sheet. It cycles through ideas not shown yet this time (avoiding the days before and after), with Undo in the toast.
  - **Ask**: an AI request for a quick decision.
  - **More ways to decide**: the family’s dinner, or what’s at home. *(Round 13: these options now sit inside the card itself.)*

  The swap changes today’s plan too, so Plan stays in sync.
- **Plan → Change:** *Leave this meal empty* and *Remove from day* did the same job, so there is one option: **Remove dinner from Sunday** (Undo right away; “+ Add …” on the day brings it back).
- **Every recipe has its own photo.** Different dishes no longer share an image. Six new photos match the set: banana and oats mash, moong dal khichdi, paneer and peas khichdi, palak paneer rice, paneer bhurji with rice, and ragi and date porridge. They were generated in Figma (page *Photos · Twist recipes*). Foods that are the same dish as their recipe (poha / poha with peas) still share one.
- **Month picker:** the tick sits on the left edge, so the month label stays centred and the cell doesn’t grow when selected.
- **Prototype panel never covers the phone.** It docks in its own column when the window is wide enough. Otherwise it folds into a **Prototype** button that opens it on request (Esc closes it). This was the main cause of the “messed-up alignment” on smaller windows.
- **Measured alignment check:** every button, chip and tile on every screen and the main sheets was measured for centred, unclipped labels. Only top-aligned cards (by design) were flagged.

### Round 7 changes (decisions, and why)
- **Back to the recipe after “Served it”:** the “How did he eat?” card has a labelled **View recipe** button. When reopened, the recipe’s footer says *Back to Today* instead of serving twice. Why a button: Today is a tab’s home, so a back arrow that appears only sometimes breaks the tab pattern, and a tappable card has no signifier.
- **Logging a specific meal:** tapping a meal’s own row opens *What did he have for dinner?* for that meal only. The general “Did he eat earlier today?” row shows tabs only for meals not added yet. After serving, the same *Earlier today* section shows, and only for meals before the one served.
- **Plan rows:**
  - The meal is a text label (DINNER), not a lone moon icon that looked tappable.
  - Tapping the dish opens its recipe, which is a real screen change. From another day, the recipe’s footer says *Back to the plan*.
  - A labelled **Change** button opens the sheet: 3 other ideas (avoiding the day before and after) and *Remove from day*. The hidden one-tap swap icon is gone.
  - Every day has **+ Add breakfast, lunch or snack** for meals not planned.
  - *Not planned yet* says what *Plan these days* will plan, with a *Change* link.
- **Ask for something specific** understands any ingredient or dish, in English, Hindi and Marathi:
  - It reads local words (palak, anda, dahi, gajar, chawal), exclusions in both word orders (“no rice”, “chawal nahi”), how to cook it (soft, finger food, quick, sweet, no cooking) and the meal.
  - It shows what it understood as tags.
  - When nothing matches all of it, it says so and shows the closest ideas.
  - Allergens are always left out, with an alert.
- **What’s at home:**
  - Search understands local words (palak → Spinach).
  - The note (“teething, no rice”) is read the same way as a request.
  - A **Needs one more thing** section shows dishes missing a single ingredient, each a different ingredient (a common pattern in pantry-recipe apps).
- **New dishes as twists** (from the FigJam interviews: “I usually give variations of food he already likes”, and the Variety tracker note):
  - A twist is a dish he accepts plus one new ingredient, using the same method.
  - It is only suggested when he accepts its base. Lists show his known dishes first and at most one twist, in third place.
  - Tagged **New · adds spinach** and “Like his cheela”.
  - After he eats it, it joins *Foods he eats*, and Memory shows **New this week**. Refused twists drop to the bottom.
- **New recipes with photos:** palak moong cheela, poha with carrot, ragi porridge with apple, curd rice with carrot. The photos were generated in Figma (page *Photos · Twist recipes*) to match the existing ones.
- **Simulate errors** (prototype panel), each a switch that stays on until turned off:
  - **Saving fails:** a red-edged alert toast with *Try again*, and nothing is lost. The carer sees it in her language.
  - **Voice not understood.**
  - **Slow loading:** Phulka with a skeleton screen.
  - **Ideas fail to load:** *Try again* or *Show his usual meals*, which works offline.
- **Copy:** the welcome screen no longer assumes “his” before gender is asked.

The code matches the current refined hi-fi. Styles and functions from earlier rounds (the old Today summary and *decide* card, recipe step tick-off, card-tile “How it works”, unused helpers) were removed in round 6, so every rule in `css/` is used by a screen.

Design values live only in `css/variables.css`. They copy the Figma variables, and add the meal tints (`--meal-*`), outcome colours (`--outcome-*`) and Phulka discs (`--phulka-*`) from the design system.

## Deploy to GitHub Pages

**Without Git (web upload):**
1. On github.com, click **New repository** and name it (for example `little-plate`). Make it **Public**, because Pages is free for public repositories. Then click **Create repository**.
2. On the empty repository page, click **uploading an existing file**.
3. Open the `app` folder on your computer and select **everything inside it**: `assets`, `css`, `js`, `index.html`, `404.html`, `favicon.svg`, `README.md` and `.nojekyll`. Drag them all into the upload box. Folders keep their structure (90 files, under the 100-file limit per upload).
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then **Save**.
6. Wait 1–2 minutes and refresh the Pages settings. The link appears at the top: `https://<user>.github.io/<repo>/`.

**With Git:** make the contents of `app/` the repository root, push to `main`, then follow step 5.

**Updating later:** upload the changed files again (same names replace the old ones). Pages redeploys in about a minute.

All paths are relative, `.nojekyll` is included, and `404.html` is an exact copy of `index.html`. **Copy it again whenever `index.html` changes.** Routes use the hash (`#/plan`), so a refresh or deep link works.

## Assets

All photos come from `Prototype/Assets/Images`, resized for the web. No illustrations were created; Phulka and the logo are drawn in code from the Figma geometry.

| Where | Path | Source |
| --- | --- | --- |
| Welcome hero, lock-screen wallpaper | `assets/photos/hero-thali.jpg` | image 18 |
| Cuisine tiles, Roti-sabzi | `cuisine-*.jpg` | images 19 to 23 |
| Khichdi (veg, moong, paneer and peas) | `khichdi.jpg` | image 1 |
| Curd rice with cucumber | `curd-rice-cucumber.jpg` | image 2 |
| Dal-rice / Soft dal-rice | `dal-rice.jpg` | image 3 |
| Soft dal-rice with bhindi | `khichdi-bhindi.jpg` | image 4 |
| Dal-rice balls he can hold | `khichdi-balls.jpg` | image 5 |
| Palak khichdi / Palak dal-rice / Palak paneer rice | `palak-khichdi.jpg` | image 6 |
| Egg khichdi | `egg-dal-rice.jpg` | image 7 |
| Dal-rice with soft egg | `khichdi-bhurji.jpg` | image 8 |
| Egg bhurji with rice / Soft paneer bhurji with rice | `egg-bhurji-rice.jpg` | image 9 |
| Cheela | `cheela.jpg` | image 10 |
| Poha | `poha.jpg` | image 11 |
| Ragi porridge | `ragi-porridge.jpg` | image 12 |
| Upma | `upma.jpg` | image 13 |
| Idli / Soft idli with dal | `idli.jpg` | image 14 |
| Banana / Banana and oats mash | `banana.jpg` | image 15 |
| Ragi malt / Ragi and date porridge | `ragi-malt.jpg` | image 16 |
| Curd-rice | `curd-rice.jpg` | image 17 |
| iOS touch icon | `apple-touch-icon.png` | **needed** (180 × 180) |

## Known gaps

- Not tested by me in a browser, as you asked. Lighthouse has not been run.
- Hindi carer copy says “देख सकते हैं” (respectful, works for any parent) where Figma says “देख सकती हैं”.
- Names in Devanagari are known only for Aarav, Deepali, Aai, Sunita, Priya and Rahul; other names stay as typed.
- The week grid shows breakfast, lunch and dinner, as in Figma. Snacks show in the day view (M02).
- The dark theme is derived and not yet reviewed in Figma.
