import { type FC, type ReactNode } from "react";
import {
  SiGoogleads,
  SiMeta,
  SiOpenai,
  SiDialogflow,
  SiStripe,
  SiZapier,
  SiGoogletranslate,
} from "react-icons/si";

// ─── Shared wrapper for react-icons inside a colored circle ─────

function BrandCircle({
  children,
  bg,
  className = "w-6 h-6",
}: {
  children: ReactNode;
  bg: string;
  className?: string;
}) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full overflow-hidden shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

// ─── Messaging & Social Channels (official SVGs from Figma) ─────

export const WhatsAppIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/whatsapp.svg" alt="WhatsApp" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const InstagramIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/instagram.svg" alt="Instagram" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const FacebookIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/facebook.svg" alt="Facebook" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const LinkedInIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/linkedin.svg" alt="LinkedIn" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const SnapchatIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/snapchat.svg" alt="Snapchat" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const TikTokIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/tiktok.svg" alt="TikTok" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const TelegramIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/telegram.svg" alt="Telegram" className={`${className} rounded-full`} draggable={false} loading="lazy" />
);

export const SMSIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="12" fill="#006828" />
    <path
      d="M6 8h12a1 1 0 011 1v6a1 1 0 01-1 1H9l-3 3V9a1 1 0 011-1z"
      fill="#fff"
    />
    <circle cx="9" cy="12" r="0.75" fill="#006828" />
    <circle cx="12" cy="12" r="0.75" fill="#006828" />
    <circle cx="15" cy="12" r="0.75" fill="#006828" />
  </svg>
);

export const WebChatIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="12" fill="#006828" />
    <circle cx="12" cy="11" r="5" stroke="#fff" strokeWidth="1.2" fill="none" />
    <path d="M7.5 11h9M12 6v10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M14 15l1.5 3L18 16.5" fill="#fff" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
  </svg>
);

// ─── EMR / Healthcare Partners ──────────────────────────────────

export const PractoIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/emr-logos/Practo Logo.webp" alt="Practo EMR" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

export const MeDASIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/emr-logos/Medas Logo.webp" alt="Medas EMR" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

export const UniteIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/emr-logos/unite-logo 1.webp" alt="Unite EMR" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

export const HelixIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/emr-logos/Helix EMR Logo.svg" alt="Helix EMR" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

// ─── Telephony Partners (react-icons Simple Icons) ──────────────

export const TwilioIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/twilio-logo.svg" alt="Twilio" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

export const AvayaIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/avaya-logo.svg" alt="Avaya" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

export const ThreeCXIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/3cx Logo.webp" alt="3CX" className={className} style={{ objectFit: "contain" }} draggable={false} loading="lazy" />
);

// ─── Ad Platforms (react-icons Simple Icons) ────────────────────

export const GoogleAdsIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#4285F4" className={className}>
    <SiGoogleads className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

export const MetaAdsIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#0081FB" className={className}>
    <SiMeta className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

// ─── AI & Native Tool Partners (react-icons Simple Icons) ───────

export const OpenAIIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#000000" className={className}>
    <SiOpenai className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

export const DialogflowIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#FF9800" className={className}>
    <SiDialogflow className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

export const DyteIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="12" fill="#2160FD" />
    <path d="M8 8l4 4-4 4M12 8l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GoogleTranslateIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#4285F4" className={className}>
    <SiGoogletranslate className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

// ─── Payment & Automation (react-icons Simple Icons) ────────────

export const StripeIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#635BFF" className={className}>
    <SiStripe className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

export const ZapierIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <BrandCircle bg="#FF4A00" className={className}>
    <SiZapier className="w-[50%] h-[50%] text-white" />
  </BrandCircle>
);

// ─── BNPL Payment Partners (SVG wordmarks) ─────────────────────

export const TabbyIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/tabby.svg" alt="Tabby" className={className} draggable={false} loading="lazy" />
);

export const TamaraIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <img src="/assets/logos/tamara.svg" alt="Tamara" className={className} draggable={false} loading="lazy" />
);

// ─── Status & Action Icons ──────────────────────────────────────

export const DoubleTickIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M2 13l4 4L14 9" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 13l4 4L20 9" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BookingConfirmIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="#006828" strokeWidth="1.5" />
    <path d="M3 9h18" stroke="#006828" strokeWidth="1.5" />
    <path d="M8 2v4M16 2v4" stroke="#006828" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 14l2 2 4-4" stroke="#006828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ProgressThreadIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="5" r="2.5" fill="#006828" />
    <circle cx="12" cy="12" r="2.5" fill="#006828" />
    <circle cx="12" cy="19" r="2.5" fill="#006828" />
    <path d="M12 7.5v2M12 14.5v2" stroke="#006828" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
  </svg>
);
