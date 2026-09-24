export interface DocSection {
  heading: string;
  body: string[]; // paragraphs
  bullets?: string[];
  callout?: { type: "info" | "warning" | "success"; text: string };
}

export interface DocArticle {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  sections: DocSection[];
  related?: string[]; // slugs
}

export const DOC_CATEGORIES = ["WhatsApp Integration"] as const;

export const WHATSAPP_DOCS: DocArticle[] = [
  {
    slug: "whatsapp-integration-overview",
    category: "WhatsApp Integration",
    title: "WhatsApp Integration: Overview",
    summary: "What's available, how the pieces fit together, and where to start.",
    readTime: "3 min read",
    sections: [
      {
        heading: "What you can do",
        body: [
          "PypeCRM's WhatsApp integration lets your organisation connect one or more WhatsApp Business numbers, run outbound campaigns from any of them, automatically reply to inbound messages, and route conversations to the right agent — all without leaving the CRM.",
        ],
        bullets: [
          "Connect multiple WhatsApp numbers to a single organisation, each independently.",
          "Assign each number to a specific agent or a round-robin group of agents.",
          "Send bulk campaigns from any connected number, with delivery tracking.",
          "Auto-reply to keywords with a single message (Automations).",
          "Build multi-step visual conversations with buttons, menus, and agent handoff (Flows).",
          "Link a campaign to a specific Flow so replies to that campaign follow their own dedicated conversation.",
        ],
      },
      {
        heading: "How the pieces relate",
        body: [
          "These five areas are independent but composable — you don't need all of them to use one.",
        ],
        bullets: [
          "WhatsApp Accounts (Settings → WhatsApp Accounts): the numbers themselves, and who's assigned to each.",
          "Campaigns (Marketing → WhatsApp): one-off or scheduled bulk sends to a recipient list.",
          "Automations (Marketing → WhatsApp → Automations): simple keyword-in, reply-out, with optional escalation to an agent.",
          "Flows (Marketing → WhatsApp → Flows): a visual builder for multi-step conversations — buttons, menus, branching, and agent handoff.",
        ],
      },
      {
        heading: "Recommended order for first-time setup",
        body: [],
        bullets: [
          "1. Connect a number — see \"Connecting Your Meta / WhatsApp Business Account\".",
          "2. Assign an agent to that number — see \"Managing Multiple Numbers & Assignment Rules\".",
          "3. Send a test campaign, or build a simple keyword Automation — see the relevant guide below.",
          "4. Once comfortable, move to Flows for anything that needs more than one message exchange.",
        ],
      },
    ],
    related: ["connect-meta-whatsapp", "whatsapp-numbers-assignment", "whatsapp-campaigns"],
  },
  {
    slug: "connect-meta-whatsapp",
    category: "WhatsApp Integration",
    title: "Connecting Your Meta / WhatsApp Business Account",
    summary: "Step-by-step setup for an official WhatsApp Business number, and how to fix the most common activation errors.",
    readTime: "6 min read",
    sections: [
      {
        heading: "Before you start",
        body: [
          "You'll need admin access to a Facebook Business Manager account, and a phone number that isn't already active on the regular WhatsApp consumer app (WhatsApp Business API numbers can't be shared with the personal app).",
        ],
        bullets: [
          "A Facebook Business Manager account you can log into.",
          "A WhatsApp Business Account (WABA) — created automatically the first time you connect if you don't already have one.",
          "A phone number that can receive an SMS or voice call for verification.",
        ],
      },
      {
        heading: "Step 1: Start the connection",
        body: [
          "Go to Settings → WhatsApp Accounts (or Settings → Integrations) and click Connect via Meta.",
          "You'll be redirected to Facebook to log in and grant PypeCRM permission to manage messaging for your business. This is the same \"Embedded Signup\" flow Meta uses across WhatsApp Business tools — nothing PypeCRM-specific.",
        ],
      },
      {
        heading: "Step 2: Automatic discovery",
        body: [
          "After you approve access, PypeCRM automatically discovers every phone number across every WhatsApp Business Account your login can see, and connects all of them in one step. You never need to manually enter a Phone Number ID, WABA ID, or access token for a Meta-connected number — that's handled entirely by the OAuth flow.",
        ],
        callout: {
          type: "info",
          text: "To connect an additional number later (a second Business Manager, or a different WABA), click Connect via Meta again — existing numbers are never overwritten.",
        },
      },
      {
        heading: "Step 3: Complete number registration (required)",
        body: [
          "Connecting the number in PypeCRM only links your account — Meta still requires the number itself to be registered/verified before it can send messages. This is a one-time step in Meta Business Suite, separate from PypeCRM.",
        ],
        bullets: [
          "Go to Meta Business Suite → WhatsApp Manager → your account → Phone Numbers.",
          "Find the number and complete any pending \"Finish registration\" or verification step (usually a 2-step-verification PIN).",
          "Confirm a valid payment method is on file under Business Settings → Billing. Without one, Meta blocks the business from initiating conversations — customer-initiated replies still work, but nothing you send first will go through.",
        ],
      },
      {
        heading: "Troubleshooting: \"(#133010) Account not registered\"",
        body: [
          "This error means Meta is refusing to send on this number's behalf. In practice it almost always traces back to one of the Step 3 items above, most commonly the missing payment method. Check WhatsApp Manager's alerts banner first — it will say explicitly if billing is the blocker.",
        ],
        callout: {
          type: "warning",
          text: "Customer-initiated conversations are on the free tier and unaffected by billing. If you want to confirm the connection works before setting up billing, have someone message the number first and check that an Automation or Flow replies — that doesn't require a payment method.",
        },
      },
      {
        heading: "Disconnecting a number",
        body: [
          "Use the Disconnect action next to the number (Settings → WhatsApp Accounts, or Integrations). This properly unsubscribes the number from PypeCRM's webhook on Meta's side — not just clearing the local connection — and deactivates any assignment rules, Automations, or Flows tied to that number.",
        ],
      },
    ],
    related: ["whatsapp-integration-overview", "connect-other-providers", "whatsapp-numbers-assignment"],
  },
  {
    slug: "connect-other-providers",
    category: "WhatsApp Integration",
    title: "Connecting via Other Providers (Gallabox, Wati, DoubleTick, Wabis, Happilee, HAL API)",
    summary: "Manual credential setup for providers that don't support Meta's OAuth connect flow.",
    readTime: "3 min read",
    sections: [
      {
        heading: "When to use this instead of Connect via Meta",
        body: [
          "If your team already uses a WhatsApp Business Solution Provider (BSP) like Gallabox or Wati for a number, connect it here with its credentials rather than through Meta directly. These providers sit between PypeCRM and Meta's API and issue their own API keys.",
        ],
      },
      {
        heading: "Steps",
        body: [],
        bullets: [
          "Go to Settings → WhatsApp Accounts and click Add Account.",
          "Choose the provider from the dropdown.",
          "Enter the phone number, the Phone Number ID / Channel ID, and the access token/API key from that provider's dashboard.",
          "Save. The number now behaves identically to a Meta-connected one for Campaigns, Automations, and Flows.",
        ],
      },
      {
        heading: "Where to find these values",
        body: [
          "Each provider exposes its API credentials differently — check that provider's own developer/API settings page. PypeCRM doesn't validate the values at save time, so a typo in the token will surface as a send failure the first time a message goes out; double-check by sending a test campaign to your own number after connecting.",
        ],
      },
    ],
    related: ["connect-meta-whatsapp", "whatsapp-numbers-assignment"],
  },
  {
    slug: "whatsapp-numbers-assignment",
    category: "WhatsApp Integration",
    title: "Managing Multiple Numbers & Assignment Rules",
    summary: "Connect several numbers, see them all in one place, and decide who owns each one.",
    readTime: "4 min read",
    sections: [
      {
        heading: "The Accounts page",
        body: [
          "Settings → WhatsApp Accounts lists every connected number regardless of how it was connected (Meta or manual), with live stats: messages sent, delivery rate, and how many campaigns have used it.",
        ],
      },
      {
        heading: "Assigning an agent",
        body: [
          "Click Routing next to a number to open its assignment rule.",
        ],
        bullets: [
          "Specific User — every conversation on this number is owned by one person.",
          "Round Robin — conversations are handed off in rotation across a chosen group of agents.",
        ],
        callout: {
          type: "info",
          text: "A number with no assignment rule shows as \"Unassigned\" in the integration report. Automations and Flows configured to hand off to an agent will silently skip that step if there's no rule to resolve an agent from.",
        },
      },
      {
        heading: "The Integration Report",
        body: [
          "The stat tiles at the top of the Accounts page (Total Numbers, Messages, Delivery Rate, Campaigns) roll up across every connected number, giving you a single view of WhatsApp activity across the whole organisation.",
        ],
      },
    ],
    related: ["connect-meta-whatsapp", "whatsapp-automations", "whatsapp-flow-builder"],
  },
  {
    slug: "whatsapp-campaigns",
    category: "WhatsApp Integration",
    title: "Creating WhatsApp Campaigns",
    summary: "Send a bulk message from any connected number, and optionally route replies into a dedicated Flow.",
    readTime: "4 min read",
    sections: [
      {
        heading: "Creating a campaign",
        body: [
          "Go to Marketing → WhatsApp and click New Campaign. Give it a name, write the message (placeholders like {{1}} are supported for per-recipient personalization), and optionally set a Test Number to preview it before sending to the full list.",
        ],
      },
      {
        heading: "Running several campaigns on one number",
        body: [
          "Multiple campaigns can share the same connected number — each is its own independent send job with its own message and recipient list, so there's no conflict between them. A number can have Campaign A running a promotional blast and Campaign B running a re-engagement sequence at the same time.",
        ],
      },
      {
        heading: "Routing replies with the Reply Flow field",
        body: [
          "By default, a reply to any campaign just lands in the shared WhatsApp Inbox for an agent to handle manually. If you want replies to a specific campaign to trigger their own automated conversation — regardless of what the person types — set the Reply Flow field when creating the campaign to one of your built Flows.",
          "This takes priority over keyword-based Automations and Flows: PypeCRM checks whether the most recent outbound message to that person was part of a campaign with a Reply Flow set, and if so, starts that Flow first.",
        ],
        callout: {
          type: "success",
          text: "This is what makes \"each campaign gets its own custom conversation\" possible on a single number — see \"WhatsApp Flow Builder\" for how to build the Flow itself first.",
        },
      },
    ],
    related: ["whatsapp-flow-builder", "whatsapp-numbers-assignment"],
  },
  {
    slug: "whatsapp-automations",
    category: "WhatsApp Integration",
    title: "Keyword Automations",
    summary: "The fastest way to auto-reply to a specific word or phrase, with an optional handoff to a human agent.",
    readTime: "3 min read",
    sections: [
      {
        heading: "What Automations are for",
        body: [
          "Automations handle the simplest case well: \"if someone's message contains this word, send this reply.\" For anything that needs more than one back-and-forth exchange, use Flows instead — Automations don't track conversation state.",
        ],
      },
      {
        heading: "Creating one",
        body: [],
        bullets: [
          "Go to Marketing → WhatsApp → Automations and click New Automation.",
          "Pick a specific number, or leave it as All Numbers to apply everywhere.",
          "Choose a trigger: any incoming message, or one that contains specific keyword(s) (comma-separated — matches if the message contains any of them).",
          "Write the reply message.",
          "Optionally enable Escalate to Assigned Agent to hand the conversation to that number's assigned agent right after the reply goes out.",
        ],
      },
      {
        heading: "Compliance note",
        body: [
          "WhatsApp requires automated replies to serve a concrete business task — pricing, support, booking, and similar — rather than open-ended conversation. Keep the reply message scoped to answering the matched keyword, not simulating a free-form chat.",
        ],
      },
    ],
    related: ["whatsapp-flow-builder", "whatsapp-numbers-assignment"],
  },
  {
    slug: "whatsapp-flow-builder",
    category: "WhatsApp Integration",
    title: "WhatsApp Flow Builder",
    summary: "Build multi-step conversations visually — buttons, menus, branching, and agent handoff.",
    readTime: "7 min read",
    sections: [
      {
        heading: "When to use a Flow instead of an Automation",
        body: [
          "Use a Flow whenever the conversation needs more than one exchange: a welcome message followed by a menu, collecting an answer before deciding what to say next, or handing off to an agent only after gathering some context first.",
        ],
      },
      {
        heading: "Building a Flow",
        body: [
          "Go to Marketing → WhatsApp → Flows, click New Flow, name it, and you'll land on the canvas.",
        ],
        bullets: [
          "Message — sends plain text, then automatically continues to the next connected node.",
          "Quick Reply Buttons — up to 3 tappable options; each button gets its own connection point at the bottom of the node.",
          "List Menu — for more than 3 options, shown as a scrollable list on WhatsApp.",
          "Media — sends an image, video, document, or audio file.",
          "Collect Answer — waits for a free-text reply and stores it as a named variable for later steps.",
          "Condition — branches the conversation based on a previously collected variable.",
          "Delay — a pause before continuing (currently synchronous; doesn't hold the conversation open across minutes/hours yet).",
          "Hand Off to Agent — notifies the number's assigned agent and ends the automated portion.",
          "End — closes the conversation session.",
        ],
      },
      {
        heading: "Connecting nodes and branching",
        body: [
          "Drag from a node's connection point to the node that should come next. For Buttons and List nodes, each individual option has its own connection point — that's how you build different paths for different replies without any separate \"if/else\" configuration.",
        ],
      },
      {
        heading: "Trigger and scope",
        body: [
          "A Flow is either keyword-triggered (starts when an incoming message contains one of its keywords) or an any-message catch-all, and can be scoped to one connected number or all of them. A Flow can also be started by linking it to a Campaign's Reply Flow field instead of relying on a keyword — see \"Creating WhatsApp Campaigns\".",
        ],
      },
      {
        heading: "Testing before going live",
        body: [
          "Save the Flow, then click Test and enter a phone number — this fires the Flow's opening message immediately so you can walk through the whole conversation on a real WhatsApp app before flipping it Active for real customers.",
        ],
        callout: {
          type: "warning",
          text: "Testing sends a business-initiated message, which requires a valid payment method on the connected Meta account (see \"Connecting Your Meta / WhatsApp Business Account\" → Troubleshooting). If Test doesn't seem to deliver anything, that's the first thing to check.",
        },
      },
      {
        heading: "Where the conversation shows up",
        body: [
          "Every message a Flow sends is logged the same way an agent's message would be, so the full exchange — bot and human parts together — is visible in WhatsApp Inbox once an agent needs to step in.",
        ],
      },
    ],
    related: ["whatsapp-campaigns", "whatsapp-automations", "whatsapp-numbers-assignment"],
  },
];

export function getDocBySlug(slug: string): DocArticle | undefined {
  return WHATSAPP_DOCS.find((d) => d.slug === slug);
}
