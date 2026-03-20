"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/landing/ui/Button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Clean up on unmount just in case
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navigationItems = [
    {
      title: "Home",
      hasDropdown: false,
      disabled: false,
      href: "/",
      icon: "/images/landing/home-ic.svg",
      onlyPhone: true,
    },
    // COMMENTED OUT - These pages have been disabled
    // {
    //   title: "WhatsApp Business",
    //   hasDropdown: false,
    //   disabled: false,
    //   href: "/whatsapp",
    //   icon: "/images/landing/whatsapp-ic.svg",
    // },
    // {
    //   title: "AI Call Centre",
    //   hasDropdown: false,
    //   disabled: false,
    //   href: "/call-agents",
    //   icon: "/images/landing/call-ic.svg",
    // },
    // {
    //   title: "AI Patient Engagement",
    //   hasDropdown: false,
    //   disabled: false,
    //   href: "/healthcare",
    //   icon: "/images/landing/ai-patient-engagement.svg",
    // },
  ];


  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="relative w-full border-b bg-[#FBFAF8] z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 container items-center justify-between">
        <div className="h-full flex items-stretch space-x-16">
          <div className="flex items-center">
            <Link href="/" className="text-4xl font-semibold text-black">
              <img src="/zavis-logo.svg" alt="Zavis Logo" className="h-6 md:h-7" />
            </Link>
          </div>

          <nav className="hidden h-full lg:flex items-center space-x-8">
            {navigationItems.filter((item) => !item.onlyPhone).map((item) => (
              <div
                key={item.title}
                className="h-full relative"
              >
                {item.disabled ? (
                  <div className="h-full flex items-center justify-center gap-2 text-gray-400 cursor-not-allowed select-none font-degular">
                    <span>
                      <img src={item.icon} alt={item.title} />
                    </span>
                    {item.title}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`h-full flex items-center justify-center gap-2 transition-colors duration-200 border-b-5 text-xl font-degular ${
                      isActive(item.href)
                        ? "text-[#006828] font-bold border-[#006828]"
                        : "text-gray-600 hover:text-black border-white font-medium"
                    }`}
                  >
                    <span>
                      <img
                        src={item.icon}
                        alt={item.title}
                        className={`
                          h-6 w-6
                          ${
                            isActive(item.href)
                              ? ""
                              : "filter grayscale brightness-0"
                          }`}
                      />
                    </span>
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop Sign up */}
        <div className="hidden lg:flex">
          <Link
            href="/book-a-demo"
            id="navbar-book-demo"
            rel="noopener noreferrer"
          >
            <Button className="text-white bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full font-medium transition-colors duration-200">
              Book A Demo
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-gray-600 hover:text-black"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle navigation menu</span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="lg:hidden absolute w-full left-0 h-[100vh] bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block"
              >
                <div className="border-black border-1 px-4 py-2 flex items-center justify-between cursor-pointer">
                  {item.disabled ? (
                    <div className="text-2xl font-medium text-gray-400 cursor-not-allowed">
                      {item.title}
                    </div>
                  ) : (
                    <div
                      className={`block text-lg font-degular font-medium  ${
                        isActive(item.href)
                          ? "text-black"
                          : "text-primary hover:text-black"
                      }`}
                    >
                      {item.title}
                    </div>
                  )}
                  <div>
                    <ArrowRight className="h-4 w-4 text-black" />
                  </div>
                </div>
              </Link>
            ))}
            {/* Mobile Sign up */}
            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/book-a-demo"
                rel="noopener noreferrer"
                id="navbar-book-demo-mobile"
              >
                <Button className="block w-full text-center bg-black hover:bg-gray-700 text-white py-2 uppercase font-degular text-md font-medium transition">
                  Book A Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
