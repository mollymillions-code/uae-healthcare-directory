import Image from "next/image";

const WHATSAPP_NUMBER = "971555312595";
const WHATSAPP_MESSAGE = "Hi Zavis, I would like to talk to your team.";

export default function WhatsAppBubble() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Zavis on WhatsApp"
      className="fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.35)] ring-1 ring-white/50 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(37,211,102,0.45)] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 sm:bottom-6 sm:right-6 sm:h-[60px] sm:w-[60px]"
    >
      <Image
        src="/assets/logos/whatsapp.svg"
        alt=""
        width={32}
        height={32}
        aria-hidden="true"
        className="h-8 w-8"
        draggable={false}
      />
    </a>
  );
}
