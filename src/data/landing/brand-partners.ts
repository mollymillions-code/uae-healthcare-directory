import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  TelegramIcon,
  SMSIcon,
  WebChatIcon,
  PractoIcon,
  MeDASIcon,
  UniteIcon,
  HelixIcon,
  TwilioIcon,
  AvayaIcon,
  ThreeCXIcon,
  GoogleAdsIcon,
  MetaAdsIcon,
  OpenAIIcon,
  DialogflowIcon,
  DyteIcon,
  GoogleTranslateIcon,
  StripeIcon,
  TabbyIcon,
  TamaraIcon,
  ZapierIcon,
} from "@/components/landing/BrandIcons";

export const emrPartners = [
  { icon: PractoIcon, name: "Practo", color: "#1A237E" },
  { icon: MeDASIcon, name: "MeDAS", color: "#333333" },
  { icon: UniteIcon, name: "Unite", color: "#1c1c1c" },
  { icon: HelixIcon, name: "Helix", color: "#D32F2F" },
];

export const channelPartners = [
  { icon: WhatsAppIcon, name: "WhatsApp", color: "#25D366" },
  { icon: InstagramIcon, name: "Instagram", color: "#E4405F" },
  { icon: FacebookIcon, name: "Facebook", color: "#1877F2" },
  { icon: TikTokIcon, name: "TikTok", color: "#010101" },
  { icon: TelegramIcon, name: "Telegram", color: "#26A5E4" },
  { icon: SMSIcon, name: "SMS", color: "#006828" },
  { icon: WebChatIcon, name: "Web Chat", color: "#006828" },
];

export const telephonyPartners = [
  { icon: TwilioIcon, name: "Twilio", color: "#F22F46" },
  { icon: AvayaIcon, name: "Avaya", color: "#DA291C" },
  { icon: ThreeCXIcon, name: "3CX", color: "#F8981D" },
];

export const adPlatforms = [
  { icon: GoogleAdsIcon, name: "Google Ads", color: "#4285F4" },
  { icon: MetaAdsIcon, name: "Meta Ads", color: "#0668E1" },
];

export const nativeToolPartners = [
  { icon: OpenAIIcon, name: "OpenAI", color: "#000000" },
  { icon: DialogflowIcon, name: "Dialogflow", color: "#FF9800" },
  { icon: DyteIcon, name: "Dyte", color: "#2160FD" },
  { icon: GoogleTranslateIcon, name: "Google Translate", color: "#4285F4" },
];

export const paymentPartners = [
  { icon: StripeIcon, name: "Stripe", color: "#635BFF" },
  { icon: TabbyIcon, name: "Tabby", color: "#292929" },
  { icon: TamaraIcon, name: "Tamara", color: "#0066FF" },
];

export const automationPartners = [
  { icon: ZapierIcon, name: "Zapier", color: "#FF4F00" },
];

// Combined for integration hub displays
export const allIntegrationPartners = [
  ...channelPartners.slice(0, 3), // WhatsApp, Instagram, Facebook
  ...emrPartners.slice(0, 2), // Practo, MeDAS
  ...telephonyPartners.slice(0, 1), // Twilio
  ...adPlatforms.slice(0, 1), // Google Ads
  ...nativeToolPartners.slice(0, 1), // OpenAI
];
