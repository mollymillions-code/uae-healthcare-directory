import { Navbar } from "@/components/landing/layout/Navbar";
import { Footer } from "@/components/landing/layout/Footer";
import LenisProvider from "@/components/landing/layout/LenisProvider";
import WhatsAppBubble from "@/components/widgets/WhatsAppBubble";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-theme min-h-screen flex flex-col">
      <Navbar />
      <LenisProvider>
        {children}
      </LenisProvider>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
