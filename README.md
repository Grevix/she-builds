# SHE BUILDS — Open Innovation Program

> An open-innovation editorial web experience combining luxury editorial typography, interactive butterfly mask reveal mechanics, retro Windows 95/98 desktop interfaces, and responsive cross-platform architectures.

---

## ✦ Overview

**SHE BUILDS** is a three-month open innovation initiative designed for girls to transform ideas into tangible, production-grade projects. The digital platform is crafted as a horizontal editorial canvas with precision motion design, retro-futuristic HUD guides, and responsive viewport management.

---

## ✦ Key Pages & Experiences

- **`index.html` (Home)**: Signature interactive mask reveal showcasing the dual cream/orange butterfly over editorial headline typography with custom organic liquid glass brush interactions.
- **`program.html` (Program)**: Editorial serif presentation integrated with draggable retro Windows 95/98 windows, pixel-art iconography, and an interactive 3-month curriculum roadmap.
- **`in-the-making.html` (In the Making)**: High-impact Under Construction experience in hot magenta (`#E1035D`), featuring an editorial headline, vector construction cone with sparkle accents, and an active diagonal-striped progress animation.
- **`about.html` (About GREVIX)**: Hot-pink editorial canvas featuring a technical HUD targeting frame with an anchored 60fps GPU-composited sideways flying ASCII butterfly and leadership overview.

---

## ✦ Cross-Platform & Device Optimization

- **Mandatory Mobile Landscape Orientation**: When viewed on mobile devices (iOS / Android) or compact tablets in portrait mode, a minimalist modal automatically instructs visitors to rotate their device into landscape orientation to experience the full widescreen layout.
- **Touch-Optimized**: Custom desktop cursors are gracefully suppressed on touch displays (`@media (pointer: coarse)`), enabling fluid native gesture navigation.
- **Safe-Area Inset Handling**: Full support for iPhone Dynamic Island, camera cutouts, and Android edge-to-edge displays via `env(safe-area-inset-*)`.
- **Vercel & Linux Ready**: Strict case-sensitive asset paths and clean URL routing via `vercel.json`.

---

## ✦ Project Structure

```
she-builds/
├── index.html                 # Home / Hero butterfly mask reveal
├── program.html               # Program roadmap & Retro Windows desktop
├── in-the-making.html         # Under construction / In the making
├── about.html                 # About GREVIX & ASCII butterfly
├── terms.html                 # Terms & Conditions legal documentation
│
├── style.css                  # Home page styles & animations
├── program.css                # Program page styles & retro desktop UI
├── in-the-making.css          # In the Making page styles & text animation
├── about.css                  # About page & HUD styles
├── terms.css                  # Terms & Conditions editorial stylesheet
├── rotate-prompt.css          # Mandatory mobile rotation overlay styles
│
├── home.js                    # Home motion orchestration
├── program.js                 # Program window dragging & timeline
├── in-the-making.js           # Progress bar animation engine
├── about.js                   # ASCII butterfly flight choreography
├── butterfly-liquid.js        # Liquid-glass butterfly interaction
├── rotate-prompt.js           # Orientation detection & event handler
├── dev-server.js              # Local development static server (node dev-server.js)
│
├── fonts/                     # Self-hosted typography (Bodoni Moda, etc.)
├── cursors/                   # Custom Rimuru Tempest cursor set
├── lib/                       # GSAP Core 3.12.5 library
│
├── vercel.json                # Vercel deployment configuration
├── package.json               # Project manifest
└── README.md                  # Documentation
```

---

## ✦ Local Development & Deployment

### Run locally
```bash
node server.js
# Access at http://localhost:8080
```

### Deploy to Vercel
Push to the repository and import into Vercel, or run:
```bash
vercel
```

---

## ✦ Credits

Initiated by **GREVIX** — A student-led open-source collective.
- **Aaryan Rawat** — Founder
- **Apoorv Negi** — Co-Founder
