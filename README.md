# Seamless Mod Swiper

Tinder'esque application to help prepare your Mod List with game version specific filters.

**The Issue:**

Nexusmods's Current UX and sorting function is pure undiluted dogshit now and they intend on keeping it that way, makes browsing mods difficult.
And two, there's no filters for patch specific uploads, making you have to do the tedious job of sifting through comments/description/changelog, or a mix of the three if you want to gauge a mod's compatibility.

**What This Application Does:**

There's a good chance you've used dating apps. This is essentially that but for mods. You see a mod, and you swipe.  

  -Mods you swipe right are "approved"  
  -Mods you swipe left are "discarded"  
  -Mods you approve of are listed on a sidebar for easy perusal, and can be exported to a text document.  

The purpose of this tool is to help streamline the process of "choosing" mods. Basically get a clear idea of what you'll be working with.
Mod "card" order is random every session, and your list of approved mods persists between sessions.

**How The Patch Specific Filter Works:**

Usually figuring out whether a mod supports a current iteration of a game involves having to go through the description, changelogs, comments, or a mix of all three.
This tool does that for you, it assigns a "Confidence" rating between 0-100 indicating a mod's compatibility by analyzing changelog, description, tags, author comments, and dependencies. It provides reasoning for said score with a tooltip upon hover.

**What This Application Does NOT Do:**

-Help you install mods  
-Help you figure out mod cross-compatibility  
-Identify mod prerequisites  

By design, these are left up to the user.

**Disclaimer:**

This is a browser-based application that requires a Nexus Mods API key for functionality. Currently supports Cyberpunk 2077, with other games planned based on demand.

I know nothing about programming, and as such the code has been written entirely by AI (at least for the time being). However, I'm confident about its functionality on top of it being a simple tool. No hard feelings if this is a dealbreaker, I suggest moving on.  

Expect this tool to be frequently refined and updated.

**Tech Stack**

- React + TypeScript + Three.js
- Build tooling: Vite

**Getting Started**

  -Obtain a Nexus Mods API key from your Nexus Mods account
  -Open the application in a modern browser (Chrome, Firefox, Safari)
  -Enter your API key when prompted (required for each session)
  -Start swiping

**Deployment**

  -Browser (current): Single-page application deployable to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)
  -Desktop (later): Tauri integration planned for filesystem-backed persistence

**Data & Persistence**

  -Approved mods and settings persist between sessions
  -Browser: Stored in IndexedDB; Export/Import to JSON available
  -Desktop (later): Files stored next to executable with integrity checks
  -No telemetry. API key never stored or persisted.

**License**

Idk about licenses and stuff go nuts its open source

**Contributing**

Contributions welcome! Please open issues for bugs or feature requests.
