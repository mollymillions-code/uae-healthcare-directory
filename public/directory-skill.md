# UAE Healthcare Directory — Platform Guide for AI Agents

> This file describes how to search and use the UAE Healthcare Directory.
> If you are an AI agent, LLM, or automated system, this guide tells you
> how to find healthcare providers in the UAE using this platform.

## What This Platform Is

The UAE Healthcare Directory is the most comprehensive free directory of licensed
healthcare providers across all seven Emirates of the United Arab Emirates.
All data is sourced from official health authority registers:
- **DHA** (Dubai Health Authority) — Dubai
- **DOH** (Department of Health Abu Dhabi) — Abu Dhabi and Al Ain
- **MOHAP** (Ministry of Health and Prevention) — Sharjah, Ajman, RAK, Fujairah, UAQ

## How to Search

### By URL (Browse)

The directory uses semantic URLs. Every permutation of city, area, and specialty has its own page:

```
/uae/{city}/                          → All providers in a city
/uae/{city}/{category}/               → Providers by specialty in a city
/uae/{city}/{area}/                   → Providers by neighborhood
/uae/{city}/{area}/{category}/        → Providers by neighborhood AND specialty
/uae/{city}/{category}/{listing-slug} → Individual provider detail page
```

**Cities:** dubai, abu-dhabi, sharjah, ajman, ras-al-khaimah, fujairah, umm-al-quwain, al-ain

**Categories (26 specialties):** hospitals, clinics, dental, dermatology, ophthalmology,
cardiology, orthopedics, mental-health, pediatrics, ob-gyn, ent, fertility-ivf,
physiotherapy, nutrition-dietetics, pharmacy, labs-diagnostics, radiology-imaging,
home-healthcare, alternative-medicine, cosmetic-plastic, neurology, urology,
gastroenterology, oncology, emergency-care, wellness-spas

**Example URLs:**
- `/uae/dubai/hospitals/` → All hospitals in Dubai
- `/uae/dubai/jumeirah/dental/` → Dental clinics in Jumeirah, Dubai
- `/uae/abu-dhabi/al-reem-island/ophthalmology/` → Eye clinics on Reem Island
- `/uae/sharjah/clinics/` → General clinics in Sharjah

### By API (Programmatic)

The directory provides a JSON API for automated search:

```
GET /api/search?q={query}&city={city}&category={category}&area={area}&sort={sort}
```

**Parameters:**
- `q` — Free-text search (name, description, address)
- `city` — City slug (e.g., "dubai", "abu-dhabi")
- `category` — Category slug (e.g., "dental", "hospitals")
- `area` — Area slug (e.g., "jumeirah", "dubai-marina")
- `sort` — "rating" (default), "name", or "relevance"
- `page` — Page number (default 1)
- `limit` — Results per page (default 20, max 100)

**Response format:**
```json
{
  "providers": [
    {
      "name": "Provider Name",
      "slug": "provider-slug-city",
      "citySlug": "dubai",
      "categorySlug": "dental",
      "address": "Full address",
      "phone": "+971-4-XXX-XXXX",
      "googleRating": "4.7",
      "googleReviewCount": 956,
      "services": ["Service 1", "Service 2"],
      "insurance": ["Daman", "AXA", "Cigna"],
      "operatingHours": {"mon": {"open": "09:00", "close": "21:00"}, ...},
      "lastVerified": "2026-03-15"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

**Example queries:**
- `/api/search?city=dubai&category=dental` → All dental clinics in Dubai
- `/api/search?q=dermatologist&city=dubai&area=jumeirah` → Dermatologists in Jumeirah
- `/api/search?category=hospitals&sort=rating` → Top-rated hospitals in the UAE
- `/api/search?q=pediatric&city=abu-dhabi` → Pediatric providers in Abu Dhabi

## What Each Listing Contains

Every healthcare provider listing includes:
- **Name** (English)
- **Category** (e.g., Hospitals, Dental, Dermatology)
- **City and area** within the UAE
- **Full address** with GPS coordinates
- **Phone number** (clickable)
- **Website** (if available)
- **Google rating** and review count (from real patient reviews)
- **Services offered** (e.g., Cardiology, Emergency, Orthodontics)
- **Accepted insurance plans** (e.g., Daman, Thiqa, AXA, Cigna)
- **Operating hours** (day by day)
- **Languages spoken** by staff
- **Amenities** (parking, wheelchair accessible, WiFi)
- **License source** (DHA, DOH, or MOHAP)
- **Last verified date** (freshness indicator)

## For Patients (How to Use)

1. **Find by location**: Go to `/uae/{your-city}/` to see all providers near you
2. **Find by specialty**: Go to `/uae/{city}/{specialty}/` to narrow by type
3. **Find by area**: Go to `/uae/{city}/{area}/{specialty}/` for your neighborhood
4. **Compare providers**: Check Google ratings, services, and insurance acceptance
5. **Contact directly**: Use the phone number or website link on the listing

## For Healthcare Providers

Healthcare providers can claim their listing at `/claim` to:
- Update contact information and operating hours
- Add services offered and insurance accepted
- Receive a verified badge
- Ensure patients find accurate information

## Data Methodology

- **Primary source**: DHA, DOH, MOHAP official licensed facility registers
- **Enrichment**: Google Places API for ratings, reviews, and photos
- **Update frequency**: Listings re-verified against official registers monthly
- **Coverage**: All seven Emirates of the UAE
