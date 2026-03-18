/**
 * Generate editorial creative assets for the UAE Healthcare Directory
 * using Google Gemini image generation (Nano Banana Pro 2)
 *
 * VANGUARD aesthetic: deep forest green (#143625), antique gold (#B69A52),
 * warm canvas (#F6F5F2). Comforting, editorial, fine-art photography feel.
 */

import * as fs from "fs";
import * as path from "path";

const API_KEY = "AIzaSyBlb-6SaGxmdcf1AhOc5tImzVTsDqd0ptY";
const MODEL = "gemini-2.0-flash-preview-image-generation";
const OUTPUT_DIR = path.resolve("public/images");

const STYLE = `Fine art editorial photography. Muted desaturated palette: warm ivory, deep forest green, antique gold tones. Soft diffused natural lighting with slight film grain texture. Elegant, calming, comforting. No text, no logos, no watermarks, no recognizable faces. Abstract and suggestive rather than literal. Magazine editorial quality.`;

interface Asset {
  name: string;
  filename: string;
  subfolder?: string;
  prompt: string;
}

const assets: Asset[] = [
  // === HERO ===
  {
    name: "hero-bg",
    filename: "hero-bg.png",
    prompt: `Abstract atmospheric photograph of light filtering through translucent architectural glass in a modern healthcare atrium. Warm golden light creating soft patterns on white marble. Deep green shadow tones. Minimal and serene. ${STYLE}`,
  },

  // === MISSING CITIES ===
  {
    name: "sharjah",
    filename: "sharjah.png",
    subfolder: "cities",
    prompt: `Aerial view of Sharjah UAE — the Al Noor mosque and Khalid Lagoon at golden hour. Warm ivory sky, deep teal water. Elegant minarets silhouetted. Dreamy editorial quality. ${STYLE}`,
  },
  {
    name: "ajman",
    filename: "ajman.png",
    subfolder: "cities",
    prompt: `Serene coastal scene of Ajman UAE — calm turquoise waters, pristine white sand beach, distant low-rise buildings. Golden hour, peaceful atmosphere. ${STYLE}`,
  },
  {
    name: "ras-al-khaimah",
    filename: "ras-al-khaimah.png",
    subfolder: "cities",
    prompt: `The Hajar mountains near Ras Al Khaimah UAE — dramatic ochre and green mountain ridges at sunrise. Desert meets mountain. Atmospheric haze. Majestic. ${STYLE}`,
  },
  {
    name: "fujairah",
    filename: "fujairah.png",
    subfolder: "cities",
    prompt: `Fujairah coastline UAE — rugged mountains meeting the Indian Ocean. Rocky coast, deep blue water, warm light on ancient stone. Wild natural beauty. ${STYLE}`,
  },
  {
    name: "umm-al-quwain",
    filename: "umm-al-quwain.png",
    subfolder: "cities",
    prompt: `Mangrove lagoon at Umm Al Quwain UAE — still waters reflecting a pastel sky. Mangrove trees in deep green. Quietude and natural beauty. ${STYLE}`,
  },

  // === MISSING CATEGORIES ===
  {
    name: "clinics",
    filename: "clinics.png",
    subfolder: "categories",
    prompt: `Minimalist close-up of a stethoscope resting on warm linen surface. Soft focus, golden light from window. Clean and reassuring. ${STYLE}`,
  },
  {
    name: "dermatology",
    filename: "dermatology.png",
    subfolder: "categories",
    prompt: `Abstract macro of a single drop of golden serum on frosted glass. Light refracting through it creating warm patterns. Luxurious skincare essence. ${STYLE}`,
  },
  {
    name: "pediatrics",
    filename: "pediatrics.png",
    subfolder: "categories",
    prompt: `Small wooden toy stethoscope on soft knitted fabric in cream and sage green. Warm gentle nurturing atmosphere. Soft focus background. ${STYLE}`,
  },
  {
    name: "orthopedics",
    filename: "orthopedics.png",
    subfolder: "categories",
    prompt: `Abstract anatomical illustration of a human spine rendered in gold ink on deep green paper. Medical illustration style, elegant and scientific. ${STYLE}`,
  },
  {
    name: "mental-health",
    filename: "mental-health.png",
    subfolder: "categories",
    prompt: `Peaceful zen garden — smooth river stones in raked sand pattern, one green leaf resting on stone. Calm meditative therapeutic. ${STYLE}`,
  },
  {
    name: "physiotherapy",
    filename: "physiotherapy.png",
    subfolder: "categories",
    prompt: `Warm wooden massage tools arranged on linen cloth with eucalyptus sprigs. Therapeutic and soothing. Spa warmth. ${STYLE}`,
  },
  {
    name: "obstetrics-gynecology",
    filename: "obstetrics-gynecology.png",
    subfolder: "categories",
    prompt: `Single white peony flower in full bloom on ivory fabric. Soft ethereal light. Feminine, nurturing, life-giving symbolism. ${STYLE}`,
  },
  {
    name: "ent",
    filename: "ent.png",
    subfolder: "categories",
    prompt: `Abstract sound waves visualized as golden concentric circles on deep green background. Elegant scientific minimal. ${STYLE}`,
  },
  {
    name: "radiology",
    filename: "radiology.png",
    subfolder: "categories",
    prompt: `X-ray lightbox glowing with soft blue-white light in a dark room. One medical film silhouetted. Clinical but beautiful. ${STYLE}`,
  },
  {
    name: "laboratory",
    filename: "laboratory.png",
    subfolder: "categories",
    prompt: `Glass laboratory flasks and beakers with amber and emerald liquids lit by soft window light. Scientific elegance still life. ${STYLE}`,
  },
  {
    name: "fertility",
    filename: "fertility.png",
    subfolder: "categories",
    prompt: `Single sprouting seedling emerging from dark soil lit by warm golden light from above. New life hope growth. ${STYLE}`,
  },
  {
    name: "oncology",
    filename: "oncology.png",
    subfolder: "categories",
    prompt: `Abstract microscopy image of cells in warm amber and deep green tones. Scientific beauty. Life at the cellular level. ${STYLE}`,
  },
  {
    name: "neurology",
    filename: "neurology.png",
    subfolder: "categories",
    prompt: `Abstract neural network pattern rendered in gold filaments on dark green background. Synapses firing with warm light. Scientific art. ${STYLE}`,
  },
  {
    name: "gastroenterology",
    filename: "gastroenterology.png",
    subfolder: "categories",
    prompt: `Still life of healing herbs and chamomile tea in ceramic bowl on natural linen. Warm tones, comforting, wellness. ${STYLE}`,
  },
  {
    name: "urology",
    filename: "urology.png",
    subfolder: "categories",
    prompt: `Clear water droplets on smooth stone surface. Clean pure clinical elegance. Muted warm tones. ${STYLE}`,
  },
  {
    name: "pulmonology",
    filename: "pulmonology.png",
    subfolder: "categories",
    prompt: `Macro photograph of delicate leaf skeleton showing intricate branching vein patterns resembling lung bronchial tree. Nature as anatomy. ${STYLE}`,
  },
  {
    name: "endocrinology",
    filename: "endocrinology.png",
    subfolder: "categories",
    prompt: `Abstract molecular structure as golden geometric shapes floating in soft green space. Hormones and balance. Scientific elegance. ${STYLE}`,
  },
  {
    name: "nephrology",
    filename: "nephrology.png",
    subfolder: "categories",
    prompt: `Smooth river pebbles arranged in kidney-bean shape on wet sand. Natural organic form. Water droplets catching golden light. ${STYLE}`,
  },
  {
    name: "home-healthcare",
    filename: "home-healthcare.png",
    subfolder: "categories",
    prompt: `Comfortable armchair by window with sheer curtains, small side table with tea cup and reading glasses. Home comfort warmth. ${STYLE}`,
  },
  {
    name: "alternative-medicine",
    filename: "alternative-medicine.png",
    subfolder: "categories",
    prompt: `Dried herbs and flowers arranged on handmade paper — lavender turmeric root ginger green leaves. Traditional healing. Warm earthy. ${STYLE}`,
  },
  {
    name: "medical-equipment",
    filename: "medical-equipment.png",
    subfolder: "categories",
    prompt: `Precision medical instruments — surgical steel tools arranged symmetrically on dark green velvet surface. Industrial beauty. ${STYLE}`,
  },
];

async function generateImage(asset: Asset): Promise<boolean> {
  const dir = asset.subfolder ? path.join(OUTPUT_DIR, asset.subfolder) : OUTPUT_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, asset.filename);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭  ${asset.name} (exists)`);
    return true;
  }

  console.log(`  🎨 Generating: ${asset.name}`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: asset.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ❌ API error (${response.status}): ${err.slice(0, 200)}`);
      return false;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(outPath, buffer);
        console.log(`  ✅ ${asset.name} (${(buffer.length / 1024).toFixed(1)}KB)`);
        return true;
      }
    }

    console.error(`  ❌ No image in response for ${asset.name}`);
    return false;
  } catch (err) {
    console.error(`  ❌ Error: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  console.log(`\n🎨 VANGUARD Asset Generation — UAE Healthcare Directory`);
  console.log(`  Model: ${MODEL}`);
  console.log(`  Aesthetic: Deep green + antique gold + warm canvas`);
  console.log(`  Total: ${assets.length} assets\n`);

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    const ok = await generateImage(asset);
    if (ok) success++;
    else failed++;

    // Rate limit
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`\n✅ Done: ${success} generated, ${failed} failed\n`);
}

main().catch(console.error);
