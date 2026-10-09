# The HTML pages in this folder: what each is and where it came from

Written 2026-10-08 by Claude (a Claude Code session in
`~/Documents/Projects/joint-space-der`) at Yeonsu's request, as a hand-off note
for work that continues in this folder. Every statement was checked on that
date unless it says "not verified".

Two machines are involved. **Desktop** is this machine
(`yeonsu-LEGION-T7-34IAS10`), where this folder and the `joint-space-der`
repository live. **Laptop** is `Yeonsus-Laptop` (`ssh laptop` from the
desktop, when its key is loaded), where the rod-packing generator and its data
live.

## The files

| File | Title | Shows | Runs | Built from |
|---|---|---|---|---|
| `index_entangle.html` | Rod Packing Dynamics | rigid rods entangling in a shaken box | 2 | another project, on the laptop |
| `index_whip.html` | Whip Cracking | a 3 m, 40-link whip cracking onto a target | 4 | `joint-space-der` |
| `index_catflip.html` | Two-Link Cat Flip | two links rolling half a turn with no angular momentum | 4 | `joint-space-der` |
| `index_cobra.html` | Cobra Rearing | a 16-link chain rearing under a trained policy | 1 | `joint-space-der` |
| `index_tentacle.html` | Tentacle Gripper | twelve curling filaments lifting a ball | 5 | `joint-space-der` |

All five are **generated files**. Do not edit them by hand: change the
generator and rebuild. Each is one self-contained file except for three.js
r165, which it loads from `cdn.jsdelivr.net`, so a page needs an internet
connection to draw. The landing page that links them (`index.html`), four
more viewer pages, and the posters and tool that go with them were added later
the same day: see "The landing page and what came with it" below.

Checksums (sha256) on 2026-10-08, to tell later whether a file was rebuilt or
changed:

```
2ca51a21484785a3b76811513edeb5c033aa357ef66aa5cff99faa170826232b  index_entangle.html
0892f47a5cb57d00fc231069a84825e1e87469cee6150fa5aff3e4381fad5141  index_whip.html
e6b33506211d870f3721f379f4dcf07af3be018a50f666cc140801b5a0150999  index_catflip.html
2ed09dd566d8b0690cfb8781703dbaa5d86abd8c6fb39910419db66755105ecf  index_cobra.html
1b6a9081e73397ec785b0d7a1463646ee43100ead912d6538fd9b9e3edff5b24  index_tentacle.html
```

## Provenance of `index_entangle.html`

- **Generator** (laptop):
  `~/GitHub/entanglement-optimization-combined/entanglement-optimization/analysis/drawPlots_packingAnimation_web.py`,
  with the page template `viewer/dismech.html` in the same repository.
  It writes `index.html`; this file is that output under another name.
  Usage, from the script: `python analysis/drawPlots_packingAnimation_web.py [--output DIR] [--every N]`.
- **Both files were untracked in git** when I looked (2026-10-08, about 15:40).
  That repository was on `main` at `30ba3b4`, one commit ahead of and 13 behind
  its origin, with three modified pipeline files. Until they are committed, the
  only record of how this page was made is those two working files. Their
  sha256 that day: generator `1b76a97a75486e41…`, template `ed5f34b92e49c4f6…`
  (both last modified 2026-10-08 02:05).
- **Checked:** the page is the template with one `<script>` of data inserted
  before `</head>`, byte for byte. It is identical to
  `~/Downloads/index_entangle.html` on the laptop.
- **Data:** two dismech "allLog" files under the laptop's
  `/Users/yeonsu/Dropbox (Harvard University)/Data/from-cluster/`, as recorded
  inside the page:
  - `EntangledModelo1/20240609-0108_RUN_EntangleModelo1_N0125_AR025/NonIntersectingBox-N0125-AR025-Scale1-mu0.20-visc0.00-amp0.00_allLog_20240609-010903.csv`
    (125 rods, aspect ratio 25)
  - `EntangledModelo1/20240609-0108_RUN_EntangleModelo1_N1500_AR300/NonIntersectingBox-N1500-AR300-Scale1-mu0.20-visc0.00-amp0.00_allLog_20240609-010856.csv`
    (1500 rods, aspect ratio 300)

  Each run is 501 frames over 0 to 5 s, 10 nodes per rod, positions stored to an
  eighth of the rod radius.
- **Reconstructed, not logged: the container.** The generator's own comments
  say the box settings are not in the logs. The box drawn (half-width 0.5,
  floor at z = -1) was chosen to match the logged trajectories, and its
  shaking (0.05 at 10 Hz) was fitted to the lowest rod of the logged runs.
- **Open questions.** The generator lists four runs (two "entangle", two
  "vibration test") but the page holds only the two entangle runs; I do not
  know why (the script skips a run whose log is missing or is an empty Dropbox
  placeholder). Yeonsu points to the cloud session
  `https://claude.ai/code/session_01JFLC7Cqp5mHM4n2PHwPZk6` for this work; a
  local session cannot open that link (HTTP 403), so nothing here is taken
  from it.
- **Not verified by me:** the simulation, the contact and cluster counts, and
  the fit of the box. I only checked how the file was assembled.
- **Added 2026-10-08 22:35 by the session in this folder** (the one that wrote
  "The landing page" below), after reading the laptop. Why the page holds two
  runs: on the laptop the allLog files of both "vibration test" runs
  (`PertrubCalmEEModelo1-Fullset/20240620-1254_…_N0125_AR025_freq100` and
  `…-1302_…_N1500_AR300_freq100`) are 0 bytes, which is how a Dropbox file
  that was never downloaded looks, and the generator skips a log of size 0.
  The generator and template are still untracked, with the checksums given
  above, and that repository is still at `30ba3b4`. The generator's default
  output folder is `…/Data/PrunedData/rod-sim-pnas-revision/visuals`.

## Provenance of the four `joint-space-der` pages

### What they share

- **Repository** (desktop): `~/Documents/Projects/joint-space-der`, remote
  `github.com/yeonsu-jung/joint-space-der` (private), branch `main` at
  `4b06f4f`, pushed to the remote on 2026-10-08.
- **Generator** `scripts/make_replay_viewers.py`; **template**
  `scripts/replay_viewer.html`; packing and kinematics
  `src/chain/viewer_export.py`; tests `tests/test_viewer_export.py`.
- **Each page here is a byte-for-byte copy** of `media/<name>_viewer.html`
  in the repository (`index_whip.html` = `media/whip_viewer.html`, and so on),
  and those are committed.
- **Rebuild:**

  ```
  cd ~/Documents/Projects/joint-space-der
  uv run python scripts/make_replay_viewers.py --portfolio ~/Documents/portfolio
  ```

  That rebuilds all four (about 15 seconds) and copies them here; name one
  page (`whip`, `catflip`, `cobra`, `tentacle`) to rebuild only it. On the
  desktop a rebuild gives the same bytes as before (checked repeatedly).
- **Data: sealed runs.** A sealed run is a directory written by the
  repository's run tooling: `config.yaml`, `metadata.json` (git commit, host,
  package versions), `raw.h5`, and `SHA256SUMS`. They live under
  `joint-space-der/runs/`, which is **not in git** and exists only on the
  desktop as far as I know. Lose that directory and the stored trajectories
  below cannot be rebuilt.
- **How a page holds a run.** It stores the model's kinematic tree and the
  recorded joint coordinates (16 bits per coordinate), and computes the link
  positions in the browser. The plotted numbers and the numbers in the
  captions are computed by the generator from the unrounded data at build
  time; none is typed by hand.

### `index_whip.html`

| Run | Source | Stored or recomputed |
|---|---|---|
| Single crack (optimized) | `runs/20260810/m9a-whip/8389182eb9b7/seed-0` (2026-08-10, repo at `95a6710` plus uncommitted changes) | stored: joint coordinates at every 1 ms step, with the rest state added as frame 0 |
| Periodic orbit, LQR, kicked | orbit `data/whip_periodic.npz` (from `runs/20260927/whip-periodic/f1b285822d76`); gains and kick from `runs/20260927/whip-periodic/4885d208cdbb` (2026-09-27, repo at `58c76b0` plus changes) | **recomputed at build time** on the CPU, 8 periods |
| Periodic orbit, open loop, kicked | same | recomputed, feedback off |
| Periodic orbit, open loop | same | recomputed, no kick |

The three periodic runs are not stored trajectories. The build refuses to
write the page unless each recomputed period misses the target by the amount
the sealed run recorded; on the desktop they agree exactly. Without feedback
this orbit amplifies a rounding difference about 52-fold per period, so the
check is loose for the later periods of the two open-loop runs, and on another
machine those periods may differ from the desktop's.

### `index_catflip.html`

| Run | Source | Stored or recomputed |
|---|---|---|
| Bang-bang gait, planned | `chain.catflip_bangbang` (`arc_gait`, `lift_multi`) | computed at build time: the exact zero-momentum response to the joint path |
| Bang-bang gait, motors at 200°/s and at 800°/s | `chain.catflip_bangbang.run_dynamics` | computed at build time: forward dynamics, motors bounded at 12 N m |
| Smooth gait, optimized | `runs/20260810/m9b-catflip/8de6a628394e/seed-0` (2026-08-10, repo at `ec8ac28` plus changes) | stored: joint coordinates every 5 ms |

### `index_cobra.html`

One run: `runs/20260810/m9c-rl-eval/a1a79a91ae96/seed-0` (2026-08-10, repo at
`3d20e5b` plus changes; rolled in `mjlab` at `9e12896f`). It holds
the joint coordinates after each of 600 policy steps, 30 ms apart; the page
drops the last row, which is the environment's reset, and moves the chain from
the training grid's (3, -3) to the origin. The policy is seed 101, checkpoint
399. The chain's geometry is copied from the task's constants and was checked
equal to mjlab's own model.

**Gap:** no committed script produces this rollout. The page replays what the
archive holds; nobody can regenerate the rollout from code yet.

### `index_tentacle.html`

All five runs are sealed runs under `runs/20261008/tentacle-gripper/`.

| Run on the page | Run it is drawn from | Campaign run it repeats |
|---|---|---|
| Random curl, seed 6, held | `651b28b5f600` | itself |
| Ball on the floor, inward curl, held | `3b7c4052baed` | `46d9229e9baa` |
| Inward curl, held | `308babed14d9` | `48fe924b64e8` |
| Random curl, seed 1, dropped | `28fe223597e7` | `d8e000b9dfa2` |
| Random curl, seed 0, knocked off | `263accfebd4e` | `2536daf4a013` |

The campaign (`scripts/run_tentacle_grasp.py`, summarized in
`data/tentacle_grasp.json`, model `src/chain/tentacle_gripper.py`) ran on
2026-10-08 with the repo at `e4e86d7` plus uncommitted changes. Four of its
runs had been saved without joint coordinates, so they were run once more with
them recorded (same day, repo at `1a72da2` plus changes). The build checks
that each repeat matches its campaign run frame for frame. The page shows 25
frames a second. The tallies in the captions ("12 of 20 draws") come from the
campaign summary.

Two earlier passes of that campaign had the contact solver stopped too early
and gave wrong results. Their 78 run directories were deleted on 2026-10-08;
nothing on the page comes from them.

### Drawn on the pages but not in the simulations

- **Whip:** the grid below the motion (the model has no floor), the trail
  behind the tip, the link colours, and the size of the target (drawn 70 mm in
  radius so it can be seen; the misses are micrometres to millimetres).
- **Cat flip:** the cat (head, ears, legs, paws, tail) and the fins are
  drawings on two plain capsule links. Gravity is zero in the model.
- **Gripper:** the seam and the mark on the ball, added so its rotation shows.
- **Cobra:** only the two shades of green.

## How the rod-packing page differs from the other four

They share the look and the controls: the four were modelled on the
rod-packing page. They differ in three ways.

- **Data.** The rod-packing page stores node positions. The four store joint
  coordinates and compute positions in the browser.
- **Side by side.** On the rod-packing page the clock covers both runs. On the
  four, the left run sets the time span and the right run waits at its ends.
- **Extras on the four only:** a caption per run ("About this run"), the scene
  centred clear of the panels, and keyboard focus left to a focused control.

If the five should behave identically, `viewer/dismech.html` on the laptop
would need the same changes. That has not been done.

## Checking a page

- In the browser console of any of the four: `await viewer.selfTest()` returns
  the largest difference (in metres) between the page's link positions and
  MuJoCo's, and whether the capsules are drawn along the right axis.
- In the repository: `uv run python -m pytest tests/test_viewer_export.py -q`
  (24 tests). They run the page's JavaScript against MuJoCo and recompute every
  plotted quantity from the frames inside the committed pages. One test needs
  `node` 18 or later.

## The landing page and what came with it

Added 2026-10-08 (evening) by Claude (a Claude Code session in this folder) at
Yeonsu's request, to carry out `plan.md`. Every statement in this section was
checked that evening unless it says "not verified".

### `index.html`

Hand-written, not generated: edit it directly. Its seven sections are the
seven items of `plan.md`, in that order. It holds no simulation data. Sections
1 to 4 each have a "stage" whose tabs are the viewer pages of that section,
one `<article class="slide">` per page:

| Section | Slide (`#id`) | Page |
|---|---|---|
| 1 Rods in joint coordinates | `#whip`, `#catflip`, `#cobra` | `index_whip.html`, `index_catflip.html`, `index_cobra.html` |
| 2 Many-body simulations | `#packing`, `#gripper`, `#linking` | `index_entangle.html`, `index_tentacle.html`, `index_entangle_opt.html` |
| 3 Snake lattices | `#lattice` | `index_lattice.html` |
| 4 X-ray reconstruction | `#scan`, `#segment` | `index_xray_stack.html`, `index_xray_segment.html` |

- **How a slide runs.** The page is loaded in an `<iframe>` when its slide
  comes into view, and removed a few seconds after it leaves, so that as a
  rule one viewer runs at a time. A running viewer does not take the mouse
  until it is clicked, so the page scrolls past it; a click outside gives the
  wheel back.
  A slide waits for a click instead of starting by itself on a touch screen,
  when the browser asks for reduced motion or data saving, and, when the site
  is served over http, for a page over 8 MB (only `index_entangle.html`);
  opened from disk, the size does not matter. "Full screen" keeps the tabs,
  so a stage can be presented from. Without JavaScript every slide is shown as
  a picture that links to its page.
- **"Views to try"** under a slide are links into the replay viewers' own URL
  hash (`run`, `run2`, `metric`, `color`, the toggles). Nothing was added to
  the viewers for this, and their files are unchanged (the five checksums
  above still hold). The other four pages keep no state in their URL.
- **Where the words come from.** The captions and numbers of the five replay
  viewers are those viewers' own run notes, read out of the data inside each
  page. Those of the other four pages are those pages' own text. Citations are
  the Crossref records of the DOIs in `plan.md`, plus
  `10.1073/pnas.2417161122`, `10.1073/pnas.2018509118` and
  `10.1371/journal.pone.0204191`; the arXiv number of the PRL manuscript was
  checked at arxiv.org. One-line descriptions of papers paraphrase their
  abstracts. The name, position, education, GitHub link, e-mail address and
  the text of four "Miscellaneous" cards come from the earlier portfolio,
  `~/Documents/job-applications/robotics/portfolio/index.html` (September
  2026); the Google Scholar link is the one on
  `https://yeonsu-jung.github.io`. The tags "PDE-constrained optimization" and
  "differentiable simulation" on the whip and the cat flip are `plan.md`'s
  words.
- **Chosen by me, not by `plan.md`:** which pages stand for items 3 and 4
  (below), every card of "Miscellaneous" (item 6 says only "Suggest ?"), and
  the table at the end of "The thread".

### Four more pages

Byte-for-byte copies, like the five above; do not edit them by hand.

| File | Title | Copy of |
|---|---|---|
| `index_lattice.html` | Two-Level Lattice Viewer | `results/two-level-viewer.html` in `~/Github/shape-morphing-solver` on the Lenovo (`ssh lenovo`) |
| `index_xray_stack.html` | Whole-Stack Rod Viewer | `viewer/whole-stack-viewer.local.html` in `~/GitHub/cylinder-matching` on the laptop |
| `index_xray_segment.html` | Rod Segmentation Viewer | `viewer/rod-segmentation-viewer.local.html` in the same repository |
| `index_entangle_opt.html` | Entangling 15 Rods | the page of `https://claude.ai/artifact/LfqgxXj4bTx6JsFSfZXv7r`, version `1791474643-5387` |

```
904c5a9d94d5f1dedd65ec816391c79690f7bd00155d3b3f62580b10f86f7d57  index_lattice.html
601c6be7ce5e40319ba3a3aeea1b5e964844113197a835f849021c847efa16b4  index_xray_stack.html
f294ecb306ddf9b15d30a38769ee1c312873a6288dfb58939d0557c628d7db0b  index_xray_segment.html
f6cf403fe78577acb26f0c93b1a5ae72afb77473199b6b8f4a88427582f802e1  index_entangle_opt.html
```

- **`index_lattice.html` is a snapshot of work in progress.** Its generator is
  `results/scratch/two_level_viewer.py` with the template
  `results/scratch/two_level_viewer_template.html`; `/results/` is in that
  repository's `.gitignore`, so neither they nor the page are in git. This
  copy is the page written at 19:02, with the repository at `06895b7`
  ("Crossing springs: follow each corner path, restoring four-fold symmetry
  and twist stiffness") plus uncommitted changes. The page was rewritten
  between 18:16 and 19:02 while I worked, so it may have moved on again. To
  take the current one:

  ```
  scp lenovo:Github/shape-morphing-solver/results/two-level-viewer.html ~/Documents/portfolio/index_lattice.html
  ```

  and then do what "When a page is rebuilt" says. The same repository's
  `results/bowl-7x7-oval/viewer.html` ("7×7 Snake Bowl Viewer") is a diagnosis
  of a failed design loop, and I left it out.
- **The two X-ray pages** (laptop; read at 22:30 the same evening, once
  `ssh laptop` answered).
  - **Repository:** `~/GitHub/cylinder-matching`, clean at `2c545e2`
    (2026-10-08 00:30). It has **no git remote**: it exists only on the
    laptop as far as I know.
  - **Generator:** `viewer/build_viewer.py`, which puts exported data into
    `viewer/stack_template.html` (whole stack) and `viewer/template.html`
    (segmentation). For each page it writes `<page>.html`, the body as
    published to claude.ai, and `<page>.local.html`, the same body inside a
    document skeleton. The copies here are the `.local.html` files, built
    2026-10-08 00:30 (checked: skeleton + published body, byte for byte). The
    built pages and their data are in that repository's `.gitignore`.
  - **Rebuild** (from its README; not run by me), then copy the two
    `.local.html` files here under the names above:

    ```
    matlab -batch "addpath('benchmark'); addpath('viewer'); export_viewer_data('center')"
    matlab -batch "addpath('benchmark'); addpath('viewer'); export_stack_data('full')"
    python3 viewer/build_viewer.py
    ```

  - **Data.** Both show one scan:
    `../rod-packing-hysteresis/data/zstack_no_structure_e01.mat`
    (46,193,181 bytes, dated 2025-07-11; "e01 stack of
    rod-packing-hysteresis" in `benchmark/stack_source.m`). The whole-stack
    page is the stack `full` after `postprocess_rods`, exported to
    `viewer/stack_data_full.json` (2026-10-07 00:45). The segmentation page is
    the test volume `center`, a 201³ crop of the same stack, with the four runs
    kept in `results/center/runs/` (`current` and three `legacy_*`), exported
    to `viewer/data.json` (2026-10-07 00:27).
  - **Scan and paper.** The cylinder-matching README says its first commit
    holds "the original `pnas_code` pipeline" and that another crop of this
    stack is "the one used in `PNAS_code.m`". The files of
    `rod-packing-hysteresis` date from July 2025, after the paper (February
    2025). **Not verified:** when the e01 scan was taken, and whether it or
    any figure made from it is in the paper. The landing page cites the
    paper next to these pages for the method, and says nothing about the
    scan.
  - Until 22:30 the two pages here were copies of the artifacts
    `https://claude.ai/artifact/VSZE5EspcADCReYgrcj8vS` (version
    `1791348367-fb94`; the number, read as a Unix time, is 2026-10-07 00:46)
    and `https://claude.ai/artifact/9kRZSKG7enrJapJ3y2bZ4v`
    (`1791347268-df4e`, 2026-10-07 00:27). The segmentation artifact has the
    same body as the laptop's build. The whole-stack artifact is an older
    build: the newer template can hold several scans and words its first line
    differently. The counts in its first line and in its four readouts are
    the same in both.
  - Left out: `viewer/alpha100-series-viewer` (every scan of the 2025-09-09
    Alpha100 series; 39.8 MB with its data inline) and
    `viewer/whole-stack-viewer-alpha100_free`.
- **`index_entangle_opt.html`** was saved through Claude Code's Artifact tool
  (`action: read`, `path: index.html`), which gives the page as published
  (its version number, read as a Unix time, is 2026-10-08 11:50). Its own
  text says it is a fresh run of
  `entanglement_optimization` "with the settings of
  `movie_N15_L2_Rad0.1.mp4`". **Not verified:** its generator. A search for
  its title under `~/Documents`, `~/Downloads` and `~/Github` on the desktop
  and the Lenovo, and under `~/GitHub` and in Spotlight on the laptop, found
  no file. What the laptop does have, committed five minutes later, is its
  sibling `study/entangling_15_long_rods.html` in
  `~/GitHub/entanglement-optimization-combined/entanglement-optimization-cpp`
  (`f52618c`): the same page for rods three times longer, run until the
  solver stops by itself, a complete document with no link to claude.ai. It is
  not on the landing page, because `plan.md` names the other one.
- The two X-ray pages load three.js r128 from `cdnjs.cloudflare.com` and its
  OrbitControls from `cdn.jsdelivr.net`; the rod page loads three.js r128
  only. All four load IBM Plex from Google Fonts, and so does `index.html`.
  `index_lattice.html` draws without three.js.
- Unlike the five, they are documents that scroll, light or dark with the
  system, not full-screen viewers. On the landing page each scrolls inside
  its frame.

### `posters/`, `tools/site.mjs`, `media/`

- `posters/<slide>.webp` (1600 px wide) and `posters/thumbs/<slide>.webp`
  (480 px) are screenshots, **generated** by

  ```
  node tools/site.mjs posters            # all: 80 s here. Or name slides: posters whip lattice
  ```

  For a replay viewer the picture is the state named by its slide's
  `data-shot` in `index.html` (a viewer URL hash: run, time, camera), with the
  panels hidden. For the other four it is the element named in `PAGES` at the
  top of the tool, once light and once dark (`<slide>-dark.webp`).
- `node tools/site.mjs check` (63 s here) opens `index.html` in headless
  Chrome and does three things. It compares each page's size with the
  `data-bytes` on its slide and looks for missing pictures and dead links
  within the page. It runs every slide and every "view to try" (30 in all) and
  asks the viewer inside each frame which run, plot, colouring and switches it
  shows. Then it tries the page's own behaviour by wheel, click and key: a
  viewer in view starts by itself; the wheel over it scrolls the page; after a
  click the wheel goes to the viewer; a click outside gives it back; tabs and
  the arrow keys on them; full screen; the page with scripts off; and, served
  from `http://127.0.0.1`, the 8 MB rule. Last result: all good, nothing on
  the console. It does not look at the pictures.
- The tool needs Node 22 or later and `google-chrome`; nothing is installed.
  Chrome runs headless with software WebGL and still fetches three.js from the
  CDNs.
- Looked at by eye, as screenshots from headless Chrome: 1440 × 900 light and
  dark, 390 × 844 dark. **Not verified:** Firefox, Safari, a real phone, a
  real GPU (everything was drawn by software), and the viewers' own controls
  inside the frames beyond what `check` asks them.
- `media/snake.*` and `media/flagellar.*` are copies of the files of the same
  names in `~/Documents/job-applications/robotics/portfolio/media/`. Where
  those were rendered: not verified.

### When a page is rebuilt

Its size changes, and probably its picture. Update `data-bytes` and the size
label (`<small>`) on its slide in `index.html`, run
`node tools/site.mjs posters <slide>`, then `node tools/site.mjs check`, which
reports a size that no longer matches. If a run was renamed or removed, the
slide's `data-hash`, `data-shot` and "views to try" name it, and `check` says
which view no longer shows the run it asks for. The numbers in the captions of
`index.html` were copied from the pages, so they need the same look.

## Loose ends

1. `index_entangle.html`: generator and template are untracked on the laptop.
2. `joint-space-der`: `runs/` is not in git, so the sealed runs are not on
   the remote.
3. The cobra rollout has no script that reproduces it.
4. The gripper once had a different, scrolling viewer. It was removed from the
   repository in `4b06f4f`, but its published copy still exists at
   `https://claude.ai/artifact/Mu8xRr1bPH94gdrVFgk6FF`. Deleting it needs
   Yeonsu (`/artifacts` in Claude Code, or the artifact's own menu).
5. Old copies on the laptop, in `~/Downloads`: `whip_viewer.html`,
   `catflip_viewer.html` and `cobra_viewer.html` from 2026-10-08 12:26 predate
   several fixes (in that whip page the "Tip to target" plot disagrees with
   its labels), and `tentacle_grasp_viewer.html` is the removed scrolling
   viewer. Use the files in this folder.
6. `plan.md` item 2.2 still names `media/tentacle_grasp_viewer.html`, the
   scrolling viewer of loose end 4, which no longer exists. The landing page
   uses `index_tentacle.html`.
7. `index_entangle_opt.html` links to its thin-rod companion at
   `https://claude.ai/artifact/12ZwGFfcB3PKWmJVxNofPA`, a private artifact:
   the link is dead for anyone but Yeonsu. Fixing it means rebuilding the page
   from its generator, which I did not find.
8. The four added pages do not look or behave like the five replay viewers
   (documents that scroll, other controls, light by default). Making them
   match means rebuilding each from its generator.
9. `index_lattice.html` follows work that was still changing on 2026-10-08
   (see above); `index_entangle_opt.html` has no generator on record here.
10. The site is not published. Since late on 2026-10-08 this folder is a git
    repository, pushed at Yeonsu's request to
    `https://github.com/yeonsu-jung/portfolio`, which I created **private**
    because the questions below are open. GitHub Pages is not turned on, and
    the page has only been opened from disk and from `http://127.0.0.1`.
    Yeonsu's public site, with the paper list, is
    `https://yeonsu-jung.github.io`. Before making the repository public or
    turning Pages on, Yeonsu should decide whether the X-ray scan (the e01
    stack of `rod-packing-hysteresis`, files from July 2025) and the lattice
    work may be shown, whether the e-mail address on the page is the one
    wanted, and whether `README.md` and `plan.md`, which name machines, local
    paths and private artifacts, should go public with the rest.
11. `plan.md` items 3 and 4 name sources I could not use as given. For item
    3, the only pages under `~/Github/shape-morphing-solver/results` on the
    Lenovo are the two named above, both about the inverse-design work of
    2026-10-08; none shows the printed lattices of the paper. Next to that
    repository is `~/Github/shape-morphing-network` (`snakeLatticeController.cpp`,
    `snake_lattice_params.yml`), which has no page; whether it is the paper's
    simulation code is not verified. For item 4 the laptop could not be
    reached until 22:27; what it holds is under "The two X-ray pages" above.
12. `~/GitHub/cylinder-matching` on the laptop has no git remote, and the
    pages built from it are not in git: the laptop holds the only copy of the
    pipeline, and this folder the only other copy of the two pages.
