import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";

/**
 * The app directory shown on the home page — the content that previously
 * lived inline in index.html, now structured so cards render from data and
 * so the Polish edition of the page is a translation of the same directory
 * rather than a second, drifting copy of it.
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

export interface AppDirectory {
  sections: AppSection[];
  experiments: AppEntry[];
}

/**
 * Destinations live here once: both language editions link to the same apps,
 * so a moved URL can never be updated in one language and forgotten in the
 * other.
 */
const links = {
  vajrachedika: "https://vajrachhedika.arybszleger.com/",
  ngondro: "https://donandrutto.github.io/Ngondro/",
  kurukulle: "https://studio--studio-187762806-964b0.us-central1.hosted.app",
  munselDronme: "https://buddhist-text-reader-825982397823.us-west1.run.app/",
  confession:
    "https://studio--confession-companion-whlq9.us-central1.hosted.app",
  bardoOs: "https://bardo-os.arybszleger.com/",
  lamaGongdu: "https://lama-gongdu-cycle-930326859786.us-west1.run.app",
  lamaGongduPurchase: "https://taplink.cc/yeshekhorlo",
  yontenDzo: "https://donandrutto.github.io/Yontendzo/",
  tibetanReading: "https://donandrutto.github.io/TibReading/",
  mandalaExplorer: "https://donandrutto.github.io/Mandala-Explorer/",
  parentheses:
    "https://on-collapse-unified-nested-structure-825982397823.us-west1.run.app/",
} as const;

const en: AppDirectory = {
  sections: [
    {
      label: "Sutra",
      apps: [
        {
          tag: "Sutra",
          title: "Vajrachedikā",
          description:
            "A reading companion for the Vajra Cutter Sutra — a tri-lingual reader with Tibetan, English and Sanskrit. Features adjustable-speed auto-scroll, tilt-to-scroll, light/dark mode, index, and glossary of terms.",
          href: links.vajrachedika,
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
          href: links.ngondro,
        },
        {
          tag: "Sādhana",
          title: "Kurukullé",
          description:
            "Practice text for Kurukullé, magnetising deity of the Lotus family.",
          href: links.kurukulle,
        },
        {
          tag: "Sādhana",
          title: "Münsel Drönme",
          description:
            "Polish-language daily sādhana of Münsel Drönme, the Red Chenrezi practice revealed by the Vidyadhara Pema Lingpa.",
          href: links.munselDronme,
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
          href: links.confession,
        },
        {
          tag: "Prayers and Instructions",
          title: "Bardo OS",
          description:
            "Bardo OS (Bardo Operating System) is a free, offline-ready app of the Bardo Thödrol Chenmo's essential prayers and instructions, for the bedside and for those preparing to die. The tradition promises liberation by hearing alone. It's a growing resource — more texts and translations are on the way. Add it to your home screen, and let these words become familiar before they are needed.",
          href: links.bardoOs,
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
          href: links.lamaGongdu,
          purchaseHref: links.lamaGongduPurchase,
        },
        {
          tag: "Study Aid",
          title: "Yönten Dzö — Sabche Explorer",
          description:
            "An interactive SabChe explorer — a visualization of the structural outline of Jigme Lingpa's Treasury of Precious Qualities, by Patrul Rinpoche.",
          href: links.yontenDzo,
        },
        {
          tag: "Study Aid",
          title: "Reading & Writing Tibetan",
          description: (
            <>
              Learn to read and write Tibetan — an interactive primer based on
              Gen Dawa Tshering&apos;s <em>Manual of Colloquial Tibetan</em>.
            </>
          ),
          href: links.tibetanReading,
        },
      ],
    },
  ],
  experiments: [
    {
      tag: "Experiment",
      title: "Mandala Explorer",
      description: "An interactive mandala explorer.",
      href: links.mandalaExplorer,
    },
    {
      tag: "Experiment",
      title: "Parentheses",
      description: "A Giant Thigle that Embraces All",
      href: links.parentheses,
    },
  ],
};

const pl: AppDirectory = {
  sections: [
    {
      label: "Sutra",
      apps: [
        {
          tag: "Sutra",
          title: "Wadżraczedika",
          description:
            "Aplikacja do lektury Sutry Diament-tnącej — trójjęzyczny tekst w języku tybetańskim, angielskim i sanskrycie. Zawiera automatyczne przewijanie z regulacją prędkości, przewijanie przez przechylanie urządzenia, tryb jasny i ciemny, indeks oraz słownik terminów.",
          href: links.vajrachedika,
        },
      ],
    },
    {
      label: "Sadhana",
      apps: [
        {
          tag: "Sadhana",
          title: "Nyndro",
          description:
            "Praktyki wstępne cyklu Dzogczen Künzang Gongpa Kündü — „Syntezy Całego Umysłu Mądrości Samantabhadry” — odkrytego przez Widjadharę Pema Lingpę. Aplikacja zawiera automatyczne przewijanie z regulacją prędkości, przewijanie przez przechylanie urządzenia oraz tryb jasny i ciemny. Zawiera język polski.",
          href: links.ngondro,
        },
        {
          tag: "Sadhana",
          title: "Kurukullé",
          description:
            "Tekst praktyki Kurukulli, magnetyzującego bóstwa rodziny Lotosu.",
          href: links.kurukulle,
        },
        {
          tag: "Sadhana",
          title: "Münsel Drönme",
          description:
            "Polskojęzyczna codzienna sadhana Münsel Drönme — praktyki Czerwonego Czenrezika odkrytej przez Widjadharę Pema Lingpę.",
          href: links.munselDronme,
        },
      ],
    },
    {
      label: "Modlitwy i instrukcje",
      apps: [
        {
          tag: "Modlitwy",
          title: "Towarzysz Wyznania",
          description:
            "Tybetańskie, angielskie i polskie wersje trzech popularnych tekstów oczyszczenia i wyznania przewinień w tradycji tybetańskiej: Wyznania Upadków Wadżrajany, Wyznania Bodhisattwy oraz Jeshe Kuciok — Ostatecznego Wyznania. Zawiera język polski.",
          href: links.confession,
        },
        {
          tag: "Modlitwy i instrukcje",
          title: "Bardo OS",
          description:
            "Bardo OS (System Operacyjny Bardo) to bezpłatna aplikacja działająca również offline, zawierająca najważniejsze modlitwy i instrukcje z Bardo Thödrol Chenmo — przeznaczone zarówno do odczytywania przy umierającym, jak i dla osób przygotowujących się do własnej śmierci. Zgodnie z tradycją samo ich usłyszenie może prowadzić do wyzwolenia. Zbiór jest stale rozwijany — będą dodawane kolejne teksty i tłumaczenia. Dodaj aplikację do ekranu głównego i oswój się z tymi słowami, zanim nadejdzie chwila, w której będą potrzebne.",
          href: links.bardoOs,
        },
      ],
    },
    {
      label: "Materiały do nauki",
      apps: [
        {
          tag: "Materiały do nauki",
          title: "Lama Gongdu",
          description:
            "Wizualizacja struktury cyklu Lama Gongdu odkrytego przez Sangye Lingpę. Zawiera instrukcje Jogi Snu niedawno przełożone na język angielski.",
          href: links.lamaGongdu,
          purchaseHref: links.lamaGongduPurchase,
        },
        {
          tag: "Materiały do nauki",
          title: "Yönten Dzö — Sabche Explorer",
          description:
            "Interaktywny eksplorator Sabche — wizualizacja strukturalnego konspektu Skarbnicy Drogocennych Właściwości Dzigme Lingpy, opracowanego przez Patrula Rinpocze. Dostępny także w języku polskim.",
          href: links.yontenDzo,
        },
        {
          tag: "Materiały do nauki",
          title: "Czytanie i pisanie po tybetańsku",
          description: (
            <>
              Nauka czytania i pisania po tybetańsku — interaktywny elementarz
              oparty na podręczniku Gen Dawa Tsheringa{" "}
              <em>Manual of Colloquial Tibetan</em>.
            </>
          ),
          href: links.tibetanReading,
        },
      ],
    },
  ],
  experiments: [
    {
      tag: "Eksperyment",
      title: "Mandala Explorer",
      description: "Interaktywny eksplorator mandali Jonten Dzo.",
      href: links.mandalaExplorer,
    },
    {
      tag: "Eksperyment",
      title: "Parentheses",
      description: "Wielka Thigle, która obejmuje wszystko",
      href: links.parentheses,
    },
  ],
};

const directories: Record<Locale, AppDirectory> = { en, pl };

export function getAppDirectory(locale: Locale): AppDirectory {
  return directories[locale];
}
