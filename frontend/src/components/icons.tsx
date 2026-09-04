import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconAcademy = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2 9l10-5 10 5-10 5L2 9z" fill="currentColor" stroke="none" />
    <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" fill="currentColor" stroke="none" opacity=".8" />
    <path d="M22 9v6" />
  </svg>
);

export const IconCards = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="6" width="10" height="14" rx="2" transform="rotate(-8 8 13)" fill="currentColor" stroke="none" opacity=".55" />
    <rect x="9" y="4" width="11" height="15" rx="2" transform="rotate(8 14.5 11.5)" fill="currentColor" stroke="none" />
    <path d="M14 9l1.2 2.2L17.5 12l-2.3.8L14 15l-1.2-2.2L10.5 12l2.3-.8L14 9z" fill="#111317" stroke="none" />
  </svg>
);

export const IconSwords = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="M4 4l11 11" />
    <path d="M20 4L9 15" />
    <path d="M14 15l2 2M10 15l-2 2" />
    <path d="M17 17l3 3M7 17l-3 3" />
    <path d="M4 4h4v4M20 4h-4v4" />
  </svg>
);

export const IconStore = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 10l1.2-5h13.6L20 10" fill="currentColor" stroke="none" opacity=".9" />
    <path d="M3 10h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0v-2z" fill="currentColor" stroke="none" />
    <path d="M5 13v7h14v-7" fill="currentColor" stroke="none" opacity=".7" />
    <rect x="10" y="15" width="4" height="5" fill="#111317" stroke="none" />
  </svg>
);

export const IconTrophy = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" fill="currentColor" stroke="none" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    <path d="M10 14h4v3h-4zM8 20h8" fill="currentColor" stroke="none" />
    <path d="M12 6l.9 1.8 2 .3-1.5 1.4.4 2L12 10.6 10.2 11.5l.4-2-1.5-1.4 2-.3L12 6z" fill="#111317" stroke="none" />
  </svg>
);

export const IconBell = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const IconGear = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IconSkull = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2a8 8 0 0 0-8 8c0 2.6 1.2 4.6 3 6v3h10v-3c1.8-1.4 3-3.4 3-6a8 8 0 0 0-8-8z" fill="currentColor" stroke="none" />
    <circle cx="9" cy="11" r="2" fill="#0a0b0d" stroke="none" />
    <circle cx="15" cy="11" r="2" fill="#0a0b0d" stroke="none" />
    <path d="M11 15l1-1.5 1 1.5" stroke="#0a0b0d" strokeWidth="1.5" />
    <path d="M9 19v3M12 19v3M15 19v3" />
  </svg>
);

export const IconTarget = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);

export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
    <path d="M12 7v5l3 2" stroke="#111317" />
  </svg>
);

export const IconCandles = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 3v3M7 17v4M17 4v2M17 15v5" />
    <rect x="4.5" y="6" width="5" height="11" rx="1" fill="currentColor" stroke="none" />
    <rect x="14.5" y="6" width="5" height="9" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconNews = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8h5v5H7zM14 8h3M14 11h3M7 16h10" />
  </svg>
);

export const IconChecklist = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
  </svg>
);

export const IconWhale = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12c2-4 6-6 10-6 4 0 7 2 8 5-1 3-4 5-8 5-2 0-3.5-.5-5-1.5L4 17l1-4.5L3 12z" fill="currentColor" stroke="none" />
    <path d="M20 8c1-2 2-3 3-3-.5 2-1 3-2.5 4" fill="currentColor" stroke="none" />
    <circle cx="8" cy="11" r="1" fill="#111317" stroke="none" />
  </svg>
);

export const IconCalendar = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2" />
  </svg>
);

export const IconChat = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 5h16v11H9l-5 4V5z" />
  </svg>
);

export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrend = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={3}>
    <path d="M3 17l5-6 4 4 8-9" />
    <path d="M14 6h6v6" />
  </svg>
);

export const IconTrendDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={3}>
    <path d="M3 7l5 6 4-4 8 9" />
    <path d="M14 18h6v-6" />
  </svg>
);

export const IconVolume = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="12" width="4" height="9" fill="currentColor" stroke="none" />
    <rect x="9" y="6" width="4" height="15" fill="currentColor" stroke="none" />
    <rect x="15" y="9" width="4" height="12" fill="currentColor" stroke="none" />
    <rect x="21" y="14" width="1" height="7" fill="currentColor" stroke="none" opacity=".4" />
  </svg>
);

export const IconShield = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" fill="currentColor" stroke="none" />
    <path d="M9 12l2 2 4-4" stroke="#111317" strokeWidth="2.4" />
  </svg>
);

export const IconTimerLock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="13" r="7" />
    <path d="M11 9v4l2.5 1.5M8 3h6M11 3v3" />
    <rect x="15" y="15" width="7" height="6" rx="1" fill="currentColor" stroke="none" />
    <path d="M16.5 15v-1.5a2 2 0 0 1 4 0V15" />
  </svg>
);

export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconWarning = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v4M12 17.5v.5" />
  </svg>
);

export const IconHourglass = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 3h12M6 21h12M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9" />
  </svg>
);

export const IconGhost = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 21V11a7 7 0 0 1 14 0v10l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2L5 21z" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="11" r="1.4" fill="#111317" stroke="none" />
    <circle cx="14.5" cy="11" r="1.4" fill="#111317" stroke="none" />
  </svg>
);

export const IconPause = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <rect x="8" y="7" width="3" height="10" rx="1" fill="#111317" stroke="none" />
    <rect x="13" y="7" width="3" height="10" rx="1" fill="#111317" stroke="none" />
  </svg>
);

export const IconCrown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={3}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const IconChevron = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconBack = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const IconCoin = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="5.5" stroke="#111317" strokeWidth="1.5" fill="none" />
    <path d="M12 8.5v7M10 10.2h3a1.3 1.3 0 0 1 0 2.6h-2a1.3 1.3 0 0 0 0 2.6h3" stroke="#111317" strokeWidth="1.4" />
  </svg>
);

export const IconTicket = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" fill="currentColor" stroke="none" />
    <path d="M9 7v10" stroke="#111317" strokeDasharray="2 2" />
  </svg>
);

export const IconFire = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 0 2 1 3 2 3 0-4 2-7 5-9 0 4 4 6 4 12 0 4-3 8-7 8z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBook = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z" />
    <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z" />
  </svg>
);

export const IconStar = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8L12 2z" fill="currentColor" stroke="none" />
  </svg>
);
