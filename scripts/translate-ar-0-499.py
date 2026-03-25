#!/usr/bin/env python3.13
"""Translate description + reviewSummary for providers 0-499 to Arabic using Gemini."""

import json
import os
import sys
import time
import re
from google import genai
from google.genai import types

DATA_PATH = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/src/lib/providers-scraped.json"
OUT_PATH  = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/scripts/arabic-chunks/ar-0-499.json"

GEMINI_API_KEY = "AIzaSyBkfeEE230U3GblCRjR54cqQgXPu8nVY6s"
MODEL = "gemini-2.0-flash"

BATCH_SIZE = 10   # providers per API call
START = 0
END   = 500       # exclusive

SYSTEM_PROMPT = """You are a professional Arabic medical translator for a UAE healthcare directory.

RULES:
1. Keep facility/clinic/hospital names in English (e.g. "Aster Hospital", "Mediclinic", "800 Pharma Pharmacy LLC")
2. Keep area and city names in English (e.g. "Dubai Marina", "Al Karama", "Deira", "Abu Dhabi", "Al Barsha")
3. Keep regulator abbreviations as-is: DHA, DOH, MOHAP
4. Keep numbers, ratings, phone numbers, star ratings as-is (e.g. "4.5 stars", "104 reviews")
5. Keep street names and building names in English
6. Translate surrounding Arabic text naturally and fluently — NOT word-for-word
7. Arabic should read naturally to a native Gulf Arabic speaker (Modern Standard Arabic)
8. Do NOT add extra commentary or explanation

You will receive a JSON array of providers. Each has an "index" (integer), "description" (string), and "reviewSummary" (array of strings).

Respond ONLY with a valid JSON array where each element has:
- "index": same integer as input
- "descriptionAr": Arabic translation of description
- "reviewSummaryAr": array of Arabic translations of each reviewSummary item

CRITICAL: Return ONLY raw JSON — no markdown, no code fences, no explanation. Start your response with [ and end with ]"""

def make_user_prompt(batch):
    items = []
    for p in batch:
        items.append({
            "index": p["index"],
            "description": p["description"],
            "reviewSummary": p["reviewSummary"]
        })
    return json.dumps(items, ensure_ascii=False)

def parse_response(text):
    """Extract JSON array from model response."""
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()
    # Find the JSON array
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)

def main():
    client = genai.Client(api_key=GEMINI_API_KEY)

    print(f"Loading providers from {DATA_PATH}...")
    with open(DATA_PATH, encoding="utf-8") as f:
        all_providers = json.load(f)

    providers_slice = all_providers[START:END]
    print(f"Processing {len(providers_slice)} providers (indices {START}–{END-1})")

    # Load existing output if resuming
    if os.path.exists(OUT_PATH):
        with open(OUT_PATH, encoding="utf-8") as f:
            results = json.load(f)
        print(f"Resuming — {len(results)} already translated")
    else:
        results = {}

    # Build batches of items not yet translated
    batches = []
    batch = []
    for i, p in enumerate(providers_slice):
        global_idx = START + i
        if str(global_idx) in results:
            continue  # already done
        item = {
            "index": global_idx,
            "description": p.get("description", ""),
            "reviewSummary": p.get("reviewSummary", [])
        }
        batch.append(item)
        if len(batch) == BATCH_SIZE:
            batches.append(batch)
            batch = []
    if batch:
        batches.append(batch)

    print(f"Batches to process: {len(batches)}")

    for batch_num, batch in enumerate(batches):
        indices = [p["index"] for p in batch]
        print(f"Batch {batch_num+1}/{len(batches)} — indices {indices[0]}–{indices[-1]} ... ", end="", flush=True)

        user_msg = make_user_prompt(batch)
        full_prompt = SYSTEM_PROMPT + "\n\n" + user_msg

        for attempt in range(4):
            try:
                response = client.models.generate_content(
                    model=MODEL,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=8192,
                        temperature=0.2,
                    )
                )
                raw = response.text
                parsed = parse_response(raw)

                # Store results
                for item in parsed:
                    idx = str(item["index"])
                    results[idx] = {
                        "descriptionAr": item.get("descriptionAr", ""),
                        "reviewSummaryAr": item.get("reviewSummaryAr", [])
                    }

                print(f"OK ({len(parsed)} translated)")
                break

            except (json.JSONDecodeError, KeyError, ValueError) as e:
                print(f"\n  Parse error attempt {attempt+1}: {e}")
                if attempt == 3:
                    print(f"  FAILED batch {batch_num+1}, storing placeholders")
                    for p in batch:
                        if str(p["index"]) not in results:
                            results[str(p["index"])] = {
                                "descriptionAr": "[TRANSLATION_FAILED]",
                                "reviewSummaryAr": []
                            }
                else:
                    time.sleep(2 ** attempt)

            except Exception as e:
                err_str = str(e)
                if "quota" in err_str.lower() or "rate" in err_str.lower() or "429" in err_str:
                    wait = 30 * (attempt + 1)
                    print(f"\n  Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                elif attempt == 3:
                    print(f"\n  API error (giving up): {e}")
                    for p in batch:
                        if str(p["index"]) not in results:
                            results[str(p["index"])] = {
                                "descriptionAr": "[TRANSLATION_FAILED]",
                                "reviewSummaryAr": []
                            }
                    break
                else:
                    print(f"\n  API error attempt {attempt+1}: {e}")
                    time.sleep(5 * (attempt + 1))

        # Save checkpoint after every batch
        with open(OUT_PATH, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        # Small delay between batches
        if batch_num < len(batches) - 1:
            time.sleep(0.3)

    print(f"\nDone. Total in output: {len(results)}/{END-START}")
    print(f"Output saved to: {OUT_PATH}")

    # Verify coverage
    missing = [i for i in range(START, END) if str(i) not in results]
    failed = [k for k, v in results.items() if v.get("descriptionAr") == "[TRANSLATION_FAILED]"]
    if missing:
        print(f"WARNING: {len(missing)} providers missing from output: {missing[:20]}{'...' if len(missing)>20 else ''}")
    elif failed:
        print(f"WARNING: {len(failed)} providers marked TRANSLATION_FAILED")
    else:
        print("Coverage: 100% — all 500 providers translated.")

if __name__ == "__main__":
    main()
