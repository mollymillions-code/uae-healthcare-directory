"use client";
import { useEffect } from "react";

const BASE_URL = "https://crm.zavis.ai";

const ChatwootWidget: React.FC = () => {
  useEffect(() => {
    if (document.getElementById("chatwoot-widget")) return;

    const script = document.createElement("script");
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.id = "chatwoot-widget";
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-expect-error TS2322: 'window.chatwootSDK' is injected by external script, no type defined
      if (window.chatwootSDK) {
        // @ts-expect-error TS2322: 'window.chatwootSDK' is injected by external script, no type defined
        window.chatwootSDK.run({
          websiteToken: "5z1RTZyjKt1BE4PLJSpLEvnH",
          baseUrl: BASE_URL,
        });
      }
    };

    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default ChatwootWidget;
