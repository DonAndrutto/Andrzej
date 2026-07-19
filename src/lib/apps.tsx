import type { ReactNode } from "react";

/**
 * The app directory shown on the home page — the content that previously
 * lived inline in index.html, now structured so cards render from data.
 */
export interface AppEntry {
  tag: string;
  title: string;
  description: ReactNode;
  href: string;
  /** Optional secondary action (e.g. purchase link) → renders a static card. */
  purchaseHref?: string;
}

export interface AppSection {
  label: string;
  apps: AppEntry[];
}

export const appSections: AppSection[] = [
  {
    label: "Sutra",
    apps: [
      {
        tag: "Sutra",
        title: "Vajrachedikā",
        description:
          "A reading companion for the Vajra Cutter Sutra — a tri-lingual reader with Tibetan, English and Sanskrit. Features adjustable-speed auto-scroll, tilt-to-scroll, light/dark mode, index, and glossary of terms.",
        href: "https://vajrachhedika.arybszleger.com/",
      },
    ],
  },
  {
    label: "Sādhana",
    apps: [
      {
        tag: "Ngöndro",
        title: "KGK Ngondro",
        description:
          "Preliminary practice for the Kunzang Gongpa Kundu Dzogchen Cycle (Synthesis of the Entire Wisdom Mind of Samantabhadra) revealed by the Vidyadhara Pema Lingpa. Features adjustable-speed auto-scroll, tilt-to-scroll, light/dark mode.",
        href: "https://donandrutto.github.io/Ngondro/",
      },
      {
        tag: "Sādhana",
        title: "Kurukullé",
        description:
          "Practice text for Kurukullé, magnetising deity of the Lotus family.",
        href: "https://studio--studio-187762806-964b0.us-central1.hosted.app",
      },
      {
        tag: "Sādhana",
        title: "Münsel Drönme",
        description:
          "Polish-language daily sādhana of Münsel Drönme, the Red Chenrezi practice revealed by the Vidyadhara Pema Lingpa.",
        href: "https://buddhist-text-reader-825982397823.us-west1.run.app/",
      },
    ],
  },
  {
    label: "Prayers and Instructions",
    apps: [
      {
        tag: "Prayers",
        title: "Confession Companion",
        description:
          "Tibetan, English and Polish renderings of three popular confession texts within the Tibetan tradition: the Vajrayāna Downfall Confession, the Bodhisattva's Confession, and Yeshe Kuchok — the Ultimate Confession.",
        href: "https://studio--confession-companion-whlq9.us-central1.hosted.app",
      },
      {
        tag: "Prayers and Instructions",
        title: "Bardo OS",
        description:
          "Bardo OS (Bardo Operating System) is a free, offline-ready app of the Bardo Thödrol Chenmo's essential prayers and instructions, for the bedside and for those preparing to die. The tradition promises liberation by hearing alone. It's a growing resource — more texts and translations are on the way. Add it to your home screen, and let these words become familiar before they are needed.",
        href: "https://bardo-os.arybszleger.com/",
      },
    ],
  },
  {
    label: "Study Aid",
    apps: [
      {
        tag: "Study Aid",
        title: "Lama Gongdu",
        description:
          "A visualization of the structure of the Lama Gongdu cycle revealed by Sangye Lingpa. Contains Dream Yoga instructions recently rendered into English.",
        href: "https://lama-gongdu-cycle-930326859786.us-west1.run.app",
        purchaseHref: "https://taplink.cc/yeshekhorlo",
      },
      {
        tag: "Study Aid",
        title: "Yönten Dzö — Sabche Explorer",
        description:
          "An interactive SabChe explorer — a visualization of the structural outline of Jigme Lingpa's Treasury of Precious Qualities, by Patrul Rinpoche.",
        href: "https://donandrutto.github.io/Yontendzo/",
      },
      {
        tag: "Study Aid",
        title: "Reading & Writing Tibetan",
        description: (
          <>
            Learn to read and write Tibetan — an interactive primer based on Gen
            Dawa Tshering&apos;s <em>Manual of Colloquial Tibetan</em>.
          </>
        ),
        href: "https://donandrutto.github.io/TibReading/",
      },
    ],
  },
];

export const experiments: AppEntry[] = [
  {
    tag: "Experiment",
    title: "Mandala Explorer",
    description: "An interactive mandala explorer.",
    href: "https://donandrutto.github.io/Mandala-Explorer/",
  },
  {
    tag: "Experiment",
    title: "Parentheses",
    description: "A Giant Thigle that Embraces All",
    href: "https://on-collapse-unified-nested-structure-825982397823.us-west1.run.app/",
  },
];
