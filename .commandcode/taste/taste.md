# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# opencode
- Use opencode-go as the AI provider (not opencode-zen). Confidence: 0.70

# routing
- Let user configure fallback/chain models manually — do not add automatic fallbacks without asking. Confidence: 0.85

# project-context
- This project is an LMS (Learning Management System) for university students. Confidence: 0.80

# design-philosophy
- For new UI features in the social workspace: design a beautiful, organized interface with original visual treatment — NOT a clone of the reference product (not Instagram, not Google Docs, etc.). The user explicitly wants original design, not a 1:1 copy. Confidence: 0.85

# workflow
- For UI/feature work: plan and create an ASCII wireframe first before implementation. The user prefers visual planning over jumping straight to code. The user will say "/plan" or "plan first" to trigger this. Confidence: 0.90

# social-panel-architecture
- To add a new panel to the KIU social workspace, register it in 5+ places in social-page.js: activeNavPanels() (nav entry), SOCIAL_TOPBAR_SKIPPED_PANELS (if topbar-less), setPanel() allowlist, getSocialPanelConfig() (pills), renderActivePanelMarkup() (renderer call), and handleClick() (action dispatcher). New feature code goes in a separate assets/js/pages/social-*.js module loaded via a module promise with a __kiuSocial*Hooks contract. Confidence: 0.75

# design-tokens
- For new social-route panels: clone the .photo-panel pattern (background: var(--social-fade-surface), border, shadow, backdrop-filter: var(--social-fade-blur)) so panel-alpha + high-transparency toggles affect it. Use existing --social-fade-* and --sn-* tokens; do not introduce new design tokens. Confidence: 0.80

# admin-library
- For the admin-library schema editor: prefer single-click, immediate action over multi-step confirm/cancel flows. The user reported the trash button for removing a schema field as broken when it required a two-step confirm — the user's expectation is that clicking trash removes the field immediately. When a confirm step is needed for destructive actions in this UI, surface the trade-off with the user before adding it. Confidence: 0.85
