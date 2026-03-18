# UAE Healthcare Directory — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-18
**Author:** Zavis Product Team
**Status:** Approved — Ready for Design Agent

---

## 1. Executive Summary

The UAE Healthcare Directory is a free, open, comprehensive directory of every licensed healthcare facility, clinic, hospital, pharmacy, and practitioner across all seven emirates. It is the single source of truth for healthcare discovery in the UAE — built for patients first, optimized for both Google and AI search engines (AEO), and designed to replace the fragmented, incomplete, or paywalled alternatives that exist today.

**Product in one sentence:** The UAE Healthcare Directory is a free, exhaustive healthcare search engine for UAE residents that covers every licensed provider across all emirates, optimized to be the definitive source cited by both Google and AI assistants.

---

## 2. Problem Statement

### The Problem

UAE residents — 10M+ people across 7 emirates — have no unified, trustworthy, complete place to find healthcare providers. The information is scattered across government portals with terrible UX (DHA Sheryan, MOHAP, DOH), booking platforms with incomplete coverage (Okadoc, Practo), SEO blogs with stale data (Bayut), and hospital-owned directories that only show their own network.

### Who Has This Problem

- **Expats arriving in the UAE** (85% of population) who don't know the healthcare system, don't know which insurance works where, and can't find providers by area
- **Existing residents** searching for specialists by location, insurance, language, or specific condition
- **Parents** looking for pediatricians, dentists, and family doctors near their home or school
- **Northern Emirates residents** (Sharjah, Ajman, RAK, Fujairah, UAQ) who are essentially invisible to every major healthcare directory

### Current Solutions & What's Broken

| Solution | What's Broken |
|----------|---------------|
| **DHA Sheryan / MOHAP / DOH** | Government UX. Not patient-friendly. No reviews, no discovery, no editorial content. Three separate portals for one country. |
| **Okadoc** (16K doctors) | Booking-first, not discovery-first. Skews toward large hospital groups. No editorial. No AEO. |
| **Practo UAE** (31K doctors) | New to UAE (2025). India-centric UX. No Arabic. Reviews mostly from Indian users. |
| **DoctorUna** | Small database. Dated UI. Limited reviews. |
| **DrFive** (20K doctors) | Dubai-only. Skews toward elective/cosmetic. No other emirates. |
| **MyBayut** | Blog posts, not a directory. No search, no filters, no real-time data. Goes stale. |
| **HealthFinder.ae** | New, unclear depth. Limited brand recognition. |

### Impact of Not Solving

Patients make uninformed healthcare decisions. Expats default to word-of-mouth or whatever Google surfaces first (often SEO-gamed content). Northern Emirates residents have essentially zero digital healthcare discovery. AI assistants (ChatGPT, Perplexity, Claude, Gemini) have no authoritative UAE healthcare source to cite — they hallucinate or give generic answers.

---

## 3. Goals & Success Metrics

### Primary Goal

Become the #1 cited source when any human or AI asks "Where can I find [healthcare provider type] in [UAE location]?"

### Success Metrics

| Metric | Target | Timeframe | Measurement |
|--------|--------|-----------|-------------|
| Indexed pages (Google) | 1,900+ pages indexed | Month 1 | Google Search Console |
| AI citation rate | Cited in 30%+ of UAE healthcare AI queries | Month 6 | Manual sampling across ChatGPT, Perplexity, Gemini |
| Organic traffic | 50K monthly sessions | Month 6 | Google Analytics |
| Facility coverage | 4,000+ MOHAP + 5,000+ DHA facilities | Month 2 | Internal database count |
| Claim requests | 100+ clinics claim/edit their listing | Month 3 | Internal CRM |
| Search accuracy | 90%+ relevant results on first query | Ongoing | User testing + analytics |

### Non-Goals

- We are NOT a booking platform (no appointment scheduling in V1)
- We are NOT a telemedicine provider
- We are NOT a health content/news publisher (that's the Journal, a separate product)
- We do NOT verify individual doctor credentials (we surface licensed facility data)

---

## 4. User Personas

### Primary Persona: Priya (Expat Resident)

**Who She Is**
- 34, Indian expat, marketing manager, lives in Dubai Marina with two kids
- Has Daman insurance through employer
- Technical proficiency: High (uses apps daily)
- Frequency of use: 2-3x/month for family healthcare needs

**Her Goals**
- Find a pediatrician near Dubai Marina who accepts Daman insurance
- Compare clinics by reviews, distance, and specialty
- Know the exact location (Google Maps) and phone number to call directly

**Her Pain Points**
- Googles "pediatrician dubai marina" and gets SEO-gamed blog posts from 2023
- Okadoc shows booking slots but not whether her insurance is accepted
- DHA Sheryan is unusable — she can't filter by area or specialty meaningfully
- She asks ChatGPT and gets a generic list with no contact details

**Quote:** "I just want to search by my area and my insurance and see who's nearby. Why is this so hard in 2026?"

### Secondary Persona: Ahmed (Northern Emirates Resident)

**Who He Is**
- 45, Emirati, government employee, lives in Ras Al Khaimah
- Has Thiqa insurance
- Technical proficiency: Moderate
- Frequency of use: 1-2x/month

**His Goals**
- Find specialist clinics in RAK (limited options, may need to go to Dubai/Abu Dhabi)
- See which facilities accept Thiqa insurance
- Get directions quickly via Google Maps

**His Pain Points**
- No directory covers RAK meaningfully
- Most platforms are English-only or have poor Arabic
- Government MOHAP portal is his only option but it's clunky
- No way to compare facilities across emirates

**Quote:** "Everything is Dubai, Dubai, Dubai. What about us?"

### Tertiary Persona: Dr. Fatima (Clinic Owner)

**Who She Is**
- 50, runs a multi-specialty clinic in Sharjah
- Wants her clinic to appear in online searches
- Concerned about incorrect information online

**Her Goals**
- Ensure her clinic's contact info, specialties, and location are accurate
- Appear in relevant search results when patients search for her specialties
- Correct any wrong information about her facility

**Quote:** "Someone listed the wrong phone number for my clinic. Patients keep calling the wrong place."

---

## 5. Scope

### MVP Scope (V1 — Current Build)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Comprehensive directory** | All MOHAP-licensed facilities (4,000+) across 7 emirates | Core value prop — completeness |
| **Semantic URL structure** | /uae/{city}/{area}/{category}/{listing} | AEO surface area — every permutation is a citable page |
| **Full-text + faceted search** | Search by city, area, category, name, specialty | Core user need — finding providers |
| **Google Maps integration** | Embedded map on every listing page | Wayfinding — "how do I get there?" |
| **Schema.org structured data** | MedicalOrganization, FAQPage, BreadcrumbList on every page | AEO — makes pages machine-readable |
| **Natural language content** | Every listing has a prose paragraph (not just a data table) | AEO — LLMs cite complete sentences |
| **Claim/edit workflow** | Clinics can request to correct their listing | Trust — moves toward source of truth |
| **Google Reviews display** | Show ratings + review count from Google Places | Social proof — helps patients decide |
| **1,900+ static pages** | Pre-rendered city x area x category facet pages | SEO — crawlable, indexable, fast |
| **Freshness signals** | lastVerified date on every listing | AEO — LLMs prefer fresh sources |
| **Sitemap + robots.txt** | Full XML sitemap with all 1,900+ URLs | SEO baseline |
| **directory-skill.md** | Machine-readable skill file for AI agents | AEO — LLM platform discovery |
| **Mobile-responsive** | Works on all devices | 70%+ UAE traffic is mobile |

### V2 Scope (Post-Launch)

| Feature | Description | Dependency |
|---------|-------------|------------|
| **DHA facilities** | Add 5,000+ Dubai Health Authority licensed facilities | DHA Sheryan scraper |
| **DOH facilities** | Add Abu Dhabi Department of Health facilities | DOH portal scraper |
| **Insurance filter** | Filter by Daman, Thiqa, Enaya, AXA, Bupa, etc. | Insurance data sourcing |
| **Arabic language** | Full RTL bilingual support | Translation + RTL CSS |
| **Individual practitioner pages** | Physician schema with specialty, qualifications | Practitioner data sourcing |
| **User reviews** | First-party review system with moderation | Auth + moderation system |
| **Cost transparency** | Consultation fee ranges by specialty | Provider self-reporting |
| **"Near me" geolocation** | Use device GPS to find nearest providers | Geolocation API |
| **Healthcare system guide** | "How UAE healthcare works" — insurance, jurisdictions, emergencies | Content creation |
| **Appointment booking** | Integration with clinic booking systems | Partner integrations |

### Explicitly Out of Scope

| Feature | Rationale |
|---------|-----------|
| Telemedicine/video calls | Different product category entirely |
| Health records / EMR | Regulatory complexity, not our business |
| Pharmacy ordering / e-prescriptions | Regulated, requires licensing |
| Individual doctor ratings/rankings | Liability risk, requires verification process |
| Job board for healthcare professionals | Different audience, different product |

---

## 6. Feature Requirements

### 6.1 Search & Discovery

**Priority:** Must Have
**Complexity:** High

**User Story:**
> As a UAE resident, I want to search for healthcare providers by my location, the type of care I need, and optionally my area, so that I can find the right provider quickly.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Full-text search across facility name, specialty, area, and city | Must |
| FR-1.2 | Filter by city (8 cities: Dubai, Abu Dhabi, Sharjah, Al Ain, Ajman, RAK, Fujairah, UAQ) | Must |
| FR-1.3 | Filter by category (26 medical categories) | Must |
| FR-1.4 | Filter by area within city (e.g., Al Barsha, Marina, Downtown) | Must |
| FR-1.5 | Combined filters (city + category + area simultaneously) | Must |
| FR-1.6 | Search results sorted by relevance (name match > specialty match > area match) | Must |
| FR-1.7 | Search autocomplete with top 5 suggestions | Should |
| FR-1.8 | "Near me" geolocation-based search | Could (V2) |
| FR-1.9 | Filter by insurance provider | Could (V2) |

**Acceptance Criteria:**

```gherkin
Given a user on any page
When they type "dentist marina" in the search bar
Then they see results for dental facilities in Dubai Marina area

Given a user on the Dubai city page
When they select "Cardiology" category and "Downtown" area
Then they see only cardiology providers in Downtown Dubai

Given a user searching "Al Zahra Hospital"
When results load
Then Al Zahra Hospital Dubai appears as the first result
```

**Edge Cases:**

| Scenario | Expected Behavior |
|----------|-------------------|
| No results found | Show "No providers found" with suggestion to broaden search |
| Misspelled query | Show closest matches (fuzzy search) |
| Search from homepage | Redirect to /search?q=... with results |

---

### 6.2 Listing Pages (Individual Provider)

**Priority:** Must Have
**Complexity:** Medium

**User Story:**
> As a patient, I want to see complete information about a healthcare facility including its address, phone, specialties, and location on a map, so I can decide whether to visit.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Display facility name, type, and establishment type (Private/Government) | Must |
| FR-2.2 | Show full address with emirate and area | Must |
| FR-2.3 | Display phone number as clickable tel: link | Must |
| FR-2.4 | Show email address if available | Must |
| FR-2.5 | Embedded Google Maps showing exact location | Must |
| FR-2.6 | List all medical specialties offered | Must |
| FR-2.7 | Natural language paragraph describing the facility (50-100 words) | Must |
| FR-2.8 | Schema.org MedicalOrganization JSON-LD | Must |
| FR-2.9 | Google Reviews rating + count (from Places API) | Should |
| FR-2.10 | "Claim this listing" button | Must |
| FR-2.11 | lastVerified date displayed | Must |
| FR-2.12 | Breadcrumb navigation (Home > City > Area > Category > Listing) | Must |
| FR-2.13 | "Get Directions" link opening Google Maps with destination | Must |
| FR-2.14 | Operating hours if available | Should |
| FR-2.15 | Share button (copy link) | Should |

**Natural Language Content Specification:**

Every listing page MUST include a prose paragraph. This is the AEO differentiator. Format:

> "[Facility Name] is a [facility type] located in [area], [city], UAE. [It is a {establishment_type} facility] specializing in [top 3 specialties]. Patients can reach [Facility Name] at [phone] or visit at [address]. [If rating exists: The facility holds a [X]-star rating on Google Reviews based on [N] patient reviews.] Last verified: [date]."

This paragraph is what LLMs will extract and cite. It must be:
- Factual (no marketing language)
- Self-contained (answerable without reading the rest of the page)
- Include the key entity name, location, and contact in a single sentence

---

### 6.3 Facet Pages (City x Area x Category)

**Priority:** Must Have
**Complexity:** High

**User Story:**
> As a patient searching for "dermatologists in Al Barsha Dubai", I want to land on a dedicated page listing all dermatology providers in that specific area, with a unique title, meta description, and structured data.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Generate a static page for every valid city + category combination | Must |
| FR-3.2 | Generate a static page for every valid city + area + category combination | Must |
| FR-3.3 | Each facet page has unique H1: "[Category] in [Area], [City]" | Must |
| FR-3.4 | Each facet page has unique meta title and description | Must |
| FR-3.5 | Each facet page has FAQPage schema with 3-5 natural questions | Must |
| FR-3.6 | List all matching providers with name, type, area, specialty, rating | Must |
| FR-3.7 | Include a 50-word answer block at top of page | Must |
| FR-3.8 | Pagination for pages with 12+ providers | Must |
| FR-3.9 | Link to sub-areas and related categories | Should |
| FR-3.10 | Show provider count: "Showing X [category] providers in [location]" | Must |

**Answer Block Specification:**

Every facet page starts with a direct answer to the implied query:

> "There are [N] licensed [category] providers in [Area], [City], UAE. [Top provider] and [second provider] are among the highest-rated facilities in the area. All providers listed are licensed by [DHA/DOH/MOHAP] and verified as of [date]."

**FAQ Schema Specification:**

Each facet page includes 3-5 FAQs targeting long-tail queries:

1. "What are the best [category] in [area], [city]?" → Answer listing top 3 by rating
2. "How many [category] are there in [area], [city]?" → Answer with exact count
3. "Which [category] in [area] accept [common insurance]?" → Answer or "Insurance data coming soon"
4. "What are the operating hours of [category] in [area]?" → General answer about typical hours
5. "How do I book an appointment with a [category] in [area]?" → Answer with call/visit guidance

---

### 6.4 City Landing Pages

**Priority:** Must Have
**Complexity:** Medium

**User Story:**
> As a resident of Abu Dhabi, I want to see all healthcare categories available in my city, and browse by area or specialty.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | City landing page at /uae/{city} for each of 8 cities | Must |
| FR-4.2 | Display all 26 medical categories with provider counts per category | Must |
| FR-4.3 | Display all areas within the city with provider counts | Must |
| FR-4.4 | City-level search bar scoped to that city | Must |
| FR-4.5 | Hero section with city name, total provider count, and city description | Must |
| FR-4.6 | Schema.org Place + MedicalOrganization aggregate markup | Must |

---

### 6.5 Claim & Edit Workflow

**Priority:** Must Have
**Complexity:** Medium

**User Story:**
> As a clinic owner, I want to claim my facility's listing and request corrections to ensure our information is accurate.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | "Claim this listing" button on every listing page | Must |
| FR-5.2 | Claim form: business name, claimant name, email, phone, role, message | Must |
| FR-5.3 | Edit request form: select which fields to correct, provide new values | Must |
| FR-5.4 | Claims stored in database with status (pending/approved/rejected) | Must |
| FR-5.5 | Email notification to admin on new claim | Should |
| FR-5.6 | No self-service editing — all changes go through review | Must |

**Acceptance Criteria:**

```gherkin
Given a clinic owner viewing their facility's listing
When they click "Claim this listing"
Then they see a form to submit their contact info and requested changes

Given a submitted claim
When admin reviews and approves
Then the listing is updated with corrected information
```

---

### 6.6 AEO Infrastructure

**Priority:** Must Have
**Complexity:** High

**User Story:**
> As the product, I need to be structured so that AI assistants (ChatGPT, Perplexity, Claude, Gemini) cite my pages when users ask UAE healthcare questions.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | MedicalOrganization schema on every listing page | Must |
| FR-6.2 | FAQPage schema on every facet page | Must |
| FR-6.3 | BreadcrumbList schema on every page | Must |
| FR-6.4 | 50-word self-contained answer block at top of every facet page | Must |
| FR-6.5 | Natural language prose paragraph on every listing page | Must |
| FR-6.6 | `directory-skill.md` at /public/directory-skill.md | Must |
| FR-6.7 | lastVerified date on every listing (freshness signal) | Must |
| FR-6.8 | Semantic HTML (proper h1/h2/h3 hierarchy, article, section, nav) | Must |
| FR-6.9 | Full XML sitemap with all 1,900+ URLs | Must |
| FR-6.10 | Open Graph tags for social sharing | Must |
| FR-6.11 | Canonical URLs on every page | Must |
| FR-6.12 | robots.txt allowing all crawlers | Must |

**Technical Notes:**
- Schema.org markup should use JSON-LD format (not microdata)
- Answer blocks should be the first content element after the H1 (before any filters or lists)
- The `directory-skill.md` follows the emerging LLM-agent discovery pattern — it describes what the directory contains, what queries it can answer, and how to access the data

---

## 7. User Flows

### Flow 1: Search & Find (Primary Journey — 80% of traffic)

**Entry Point:** Google/AI search result, or homepage
**Success State:** User has phone number, address, or maps link for their chosen provider

```
[Google/AI Search] or [Homepage]
         ↓
[Search bar + optional filters]
         ↓
[Search results page OR Facet page]
         ↓
    ┌────┴────────────┐
    ↓                  ↓
[Browse results]    [Click specific listing]
    ↓                  ↓
[Click listing]    [Listing detail page]
    ↓                  ↓
[Listing page]     [Call / Get Directions / Maps]
    ↓
[Call / Get Directions / Maps]
    ↓
[END: Patient contacts provider]
```

**Step-by-Step:**

| Step | Screen | User Action | System Response |
|------|--------|-------------|-----------------|
| 1 | Homepage or Google | Searches "dentist dubai marina" | Lands on /uae/dubai/marina/dental/ |
| 2 | Facet page | Scans answer block + provider list | Shows 12 dental providers in Marina |
| 3 | Facet page | Clicks "Smile Design Dental Clinic" | Navigates to listing detail page |
| 4 | Listing page | Reads description, checks rating | Sees 4.5 stars, reads specialties |
| 5 | Listing page | Clicks phone number | Phone app opens with number |
| 6 | Listing page | Clicks "Get Directions" | Google Maps opens with destination |

### Flow 2: Browse by City (Discovery Journey)

```
[Homepage]
    ↓
[Click city card: "Abu Dhabi"]
    ↓
[City landing: /uae/abu-dhabi/]
    ↓
[Browse categories or areas]
    ↓
    ┌────────┴────────┐
    ↓                  ↓
[Category: Dental] [Area: Corniche]
    ↓                  ↓
[Facet page]        [Area page with all categories]
    ↓                  ↓
[Listing]           [Category within area]
    ↓                  ↓
[Contact]           [Listing → Contact]
```

### Flow 3: Clinic Claims Their Listing

```
[Clinic owner lands on their listing page]
    ↓
[Clicks "Claim this listing"]
    ↓
[Claim form page: /claim/{listingId}]
    ↓
[Fills form: name, email, role, corrections needed]
    ↓
[Submits claim]
    ↓
[Confirmation message: "We'll review within 48 hours"]
    ↓
[Admin reviews claim]
    ↓
    ┌────┴────┐
    ↓          ↓
[Approve]   [Reject]
    ↓          ↓
[Update]    [Email rejection reason]
    ↓
[Listing updated with correct info]
```

### Flow 4: AI Agent Fetches Data

```
[User asks AI: "best cardiology clinic in downtown dubai"]
    ↓
[AI agent discovers directory-skill.md]
    ↓
[AI fetches /uae/dubai/downtown/cardiology/]
    ↓
[AI parses answer block + MedicalOrganization schema]
    ↓
[AI generates response citing UAE Healthcare Directory]
    ↓
[User clicks citation link → lands on facet page]
```

---

## 8. Technical Architecture

### System Overview

```
[Browser / AI Crawler]
         ↓ HTTPS
[Vercel Edge Network (CDN)]
         ↓
[Next.js 14 (App Router)]
         ↓
  ┌──────┴──────┐
  ↓              ↓
[Static Pages]  [API Routes]
(1,900+ SSG)    (/api/search, /api/claims)
  ↓              ↓
[JSON data]    [Neon Postgres]
(mohap.json)   (Drizzle ORM)
                 ↓
          [Google Places API]
          (ratings enrichment)
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | SSG for 1,900+ pages, API routes, React Server Components |
| Styling | Tailwind CSS 3 | Utility-first, fast iteration, responsive |
| Database | Neon Postgres (serverless) | Serverless scale, Vercel-native integration |
| ORM | Drizzle ORM | Type-safe, lightweight, edge-compatible |
| Hosting | Vercel | Auto-deploy from GitHub, edge CDN, serverless functions |
| Search | API route with SQL ILIKE + trigram | Simple, no external search service needed for V1 |
| Maps | Google Maps Embed API | Free tier for embeds, universal UX |
| Reviews | Google Places API | Industry-standard rating source |
| Image Gen | Gemini API (Imagen 3) | AI-generated city and category images |
| Data Pipeline | agent-browser + Node.js scrapers | Headless browser scraping of government portals |
| Analytics | Vercel Analytics + Google Analytics | Traffic, performance, Core Web Vitals |

### Third-Party Integrations

| Service | Purpose | Criticality | Fallback |
|---------|---------|-------------|----------|
| Google Maps Embed API | Location maps on listing pages | High | Static map image |
| Google Places API | Ratings and review counts | Medium | Hide ratings section |
| Gemini API (Imagen 3) | AI-generated imagery | Low | Stock placeholder images |
| MOHAP Portal | Source of 4,000 facility records | Critical | Use cached/stored data |
| DHA Sheryan | Source of Dubai facility records (V2) | High | MOHAP data for Dubai |

---

## 9. Data Model

### Core Entities

```
[Provider]
├── id: text (nanoid, PK)
├── name: text (NOT NULL)
├── slug: text (UNIQUE, NOT NULL)
├── facilityType: text (e.g., "General Hospital", "Specialized Clinic", "Pharmacy")
├── establishmentType: text ("Private" | "Government")
├── city: text (NOT NULL)
├── area: text
├── fullAddress: text
├── phone: text
├── email: text
├── website: text
├── latitude: real
├── longitude: real
├── specialties: text[] (array of specialty strings)
├── categories: text[] (mapped to our 26 categories)
├── googlePlaceId: text
├── googleRating: real
├── googleReviewCount: integer
├── description: text (natural language paragraph)
├── source: text ("mohap" | "dha" | "doh" | "manual")
├── sourceUrl: text (link to government registry entry)
├── lastVerified: timestamp
├── isActive: boolean (default true)
├── createdAt: timestamp
└── updatedAt: timestamp

[Category]
├── id: text (PK)
├── name: text ("Hospitals", "Dental", "Cardiology", etc.)
├── slug: text (UNIQUE)
├── description: text
├── icon: text (icon identifier)
└── sortOrder: integer

[City]
├── id: text (PK)
├── name: text ("Dubai", "Abu Dhabi", etc.)
├── slug: text (UNIQUE)
├── emirate: text
├── description: text
├── latitude: real
├── longitude: real
└── areas: text[] (array of area names)

[Area]
├── id: text (PK)
├── name: text ("Marina", "Al Barsha", "Downtown", etc.)
├── slug: text
├── cityId: text (FK → City)
├── latitude: real
└── longitude: real

[Claim]
├── id: text (PK)
├── providerId: text (FK → Provider)
├── claimantName: text (NOT NULL)
├── claimantEmail: text (NOT NULL)
├── claimantPhone: text
├── claimantRole: text ("Owner" | "Manager" | "Staff" | "Other")
├── message: text
├── requestedChanges: jsonb
├── status: text ("pending" | "approved" | "rejected")
├── adminNotes: text
├── createdAt: timestamp
└── updatedAt: timestamp

[ScrapeLog]
├── id: text (PK)
├── source: text ("mohap" | "dha" | "doh")
├── pagesScraped: integer
├── facilitiesFound: integer
├── errors: integer
├── startedAt: timestamp
└── completedAt: timestamp
```

### Key Relationships

- Provider belongs to City (N:1)
- Provider belongs to Area (N:1)
- Provider has many Categories (N:N via categories array)
- Claim belongs to Provider (N:1)
- Area belongs to City (N:1)

---

## 10. API Requirements

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/search | Search providers with filters | Public |
| POST | /api/claims | Submit a claim/edit request | Public |
| GET | /api/providers/{id} | Get single provider (for dynamic data) | Public |
| GET | /sitemap.xml | Dynamic XML sitemap | Public |
| GET | /robots.txt | Robots directives | Public |

### Search API Detail

```
GET /api/search?q=dentist&city=dubai&area=marina&category=dental&page=1&limit=12

Response:
{
  "providers": [...],
  "total": 47,
  "page": 1,
  "totalPages": 4,
  "filters": {
    "city": "dubai",
    "area": "marina",
    "category": "dental",
    "q": "dentist"
  }
}
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/search | 60 requests | Per minute per IP |
| /api/claims | 5 requests | Per minute per IP |

---

## 11. Screen Specifications

### Screen: Homepage

**Screen ID:** SCR-001
**Purpose:** Entry point — communicate what this is, and get users to search or browse

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header: Logo + Nav + Search]                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Typographic hero statement]                                │
│  "Every licensed healthcare provider in the UAE.             │
│   One search."                                               │
│                                                              │
│  [Search bar — full width, prominent]                        │
│  [City | Category | Area — filter chips below]               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BROWSE BY CITY                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Dubai  │ │Abu Dhabi│ │Sharjah │ │  RAK   │               │
│  │ 1,200  │ │  890    │ │  650   │ │  340   │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Ajman  │ │Fujairah │ │  UAQ   │ │ Al Ain │               │
│  │  280   │ │  120    │ │   90   │ │  430   │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BROWSE BY CATEGORY                                          │
│  Hospitals · Clinics · Dental · Pharmacy · Cardiology ·      │
│  Dermatology · Ophthalmology · Orthopedics · Pediatrics ·    │
│  OB/GYN · Mental Health · Physiotherapy · ENT · Radiology ·  │
│  ... (26 categories as text links, not cards)                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NUMBERS                                                     │
│  4,000+ providers · 8 cities · 26 categories ·               │
│  7 emirates · Updated daily                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Design Direction:**
- Editorial newspaper aesthetic — NOT a SaaS landing page
- Near-monochrome with one warm accent
- Typography is the design element (large, bold, confident)
- No hero gradient. No card shadows. No generic illustrations.
- Horizontal rules as visual separators
- Data (numbers, counts) displayed prominently
- The search bar is the centerpiece

---

### Screen: City Landing Page (/uae/{city})

**Screen ID:** SCR-002
**Purpose:** Show all healthcare options in a specific city

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header + Breadcrumb: Home > Dubai]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DUBAI                                                       │
│  1,247 licensed healthcare providers                         │
│                                                              │
│  [Search bar scoped to this city]                            │
│                                                              │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                   │
│  CATEGORIES              │  AREAS                            │
│  ─────────────           │  ─────                            │
│  Hospitals (42)          │  Downtown (89)                    │
│  Clinics (380)           │  Marina (67)                      │
│  Dental (156)            │  Al Barsha (54)                   │
│  Pharmacy (290)          │  Jumeirah (48)                    │
│  Cardiology (34)         │  Deira (92)                       │
│  Dermatology (28)        │  Bur Dubai (78)                   │
│  ...                     │  Business Bay (41)                │
│                          │  JLT (35)                         │
│                          │  ...                              │
│                          │                                   │
├──────────────────────────┴──────────────────────────────────┤
│                                                              │
│  FEATURED PROVIDERS                                          │
│  ─────────────────────────────────────────────               │
│  Mediclinic City Hospital · 4.3★ · Downtown · Multi-specialty│
│  American Hospital Dubai · 4.1★ · Oud Metha · General       │
│  Saudi German Hospital · 4.0★ · Al Barsha · General         │
│  ...                                                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen: Facet Page (/uae/{city}/{area}/{category})

**Screen ID:** SCR-003
**Purpose:** Show all providers matching a specific city + area + category combination

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header + Breadcrumb: Home > Dubai > Marina > Dental]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DENTAL CLINICS IN DUBAI MARINA                              │
│                                                              │
│  [Answer block: "There are 12 licensed dental clinics in     │
│   Dubai Marina, UAE. Smile Design Dental and Marina Dental   │
│   Clinic are among the highest-rated..."]                    │
│                                                              │
│  Showing 12 providers                                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Smile Design Dental Clinic ──────────────────────────┐  │
│  │  Specialized Dental Clinic · Private                   │  │
│  │  Dubai Marina, Dubai · ★ 4.6 (234 reviews)           │  │
│  │  Specialties: General Dentistry, Orthodontics, Cosmetic│  │
│  │  +971-4-XXX-XXXX · Get Directions                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Marina Dental Clinic ────────────────────────────────┐  │
│  │  General Dental Clinic · Private                       │  │
│  │  Dubai Marina, Dubai · ★ 4.3 (156 reviews)           │  │
│  │  Specialties: General Dentistry, Pediatric Dental      │  │
│  │  +971-4-XXX-XXXX · Get Directions                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ... (more listings)                                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FREQUENTLY ASKED QUESTIONS                                  │
│  ─────────────────────────                                   │
│  Q: What are the best dental clinics in Dubai Marina?        │
│  A: The highest-rated dental clinics in Dubai Marina...      │
│                                                              │
│  Q: How many dental clinics are in Dubai Marina?             │
│  A: There are 12 licensed dental clinics in Dubai Marina...  │
│                                                              │
│  Q: Which dental clinics in Marina accept Daman insurance?   │
│  A: Insurance acceptance data is being verified...           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RELATED                                                     │
│  Dental in Downtown Dubai · Dental in Al Barsha ·            │
│  Orthodontics in Dubai · Hospitals in Marina                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen: Listing Detail Page (/uae/{city}/{area}/{category}/{listing})

**Screen ID:** SCR-004
**Purpose:** Show everything about a single healthcare facility

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header + Breadcrumb]                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SMILE DESIGN DENTAL CLINIC                                  │
│  Specialized Dental Clinic · Private · ★ 4.6 (234 reviews) │
│  Last verified: March 2026                                   │
│                                                              │
│  ─────────────────────────────────────────────────           │
│                                                              │
│  [Natural language paragraph]                                │
│  Smile Design Dental Clinic is a specialized dental          │
│  facility located in Dubai Marina, Dubai, UAE. It is a       │
│  private establishment offering services in general          │
│  dentistry, orthodontics, and cosmetic dentistry. Patients   │
│  can reach the clinic at +971-4-XXX-XXXX or visit at        │
│  Marina Walk, Tower A, Floor 2, Dubai Marina.                │
│                                                              │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                   │
│  CONTACT                 │  [Google Maps Embed]              │
│  ───────                 │  ┌─────────────────────────┐     │
│  Phone: +971-4-XXX-XXXX │  │                         │     │
│  Email: info@smile.ae    │  │    [Interactive Map]    │     │
│  Web: smiledesign.ae     │  │                         │     │
│                          │  │                         │     │
│  ADDRESS                 │  └─────────────────────────┘     │
│  ───────                 │  [Get Directions →]               │
│  Marina Walk, Tower A    │                                   │
│  Floor 2, Dubai Marina   │                                   │
│  Dubai, UAE              │                                   │
│                          │                                   │
├──────────────────────────┴──────────────────────────────────┤
│                                                              │
│  SPECIALTIES                                                 │
│  ──────────                                                  │
│  General Dentistry · Orthodontics · Cosmetic Dentistry ·     │
│  Dental Implants · Teeth Whitening · Pediatric Dentistry     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GOOGLE REVIEWS                                              │
│  ──────────────                                              │
│  ★ 4.6 out of 5 · Based on 234 reviews                     │
│  [Link: "View all reviews on Google Maps"]                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Claim this listing — Is this your facility?]               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MORE DENTAL IN DUBAI MARINA                                 │
│  Marina Dental Clinic · Bright Smile · Pearl Dental ·        │
│  (links to related listings)                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen: Search Results (/search)

**Screen ID:** SCR-005
**Purpose:** Show results for a free-text search query

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header]                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Search bar with current query pre-filled]                  │
│                                                              │
│  [Filter chips: City ▼ | Category ▼ | Area ▼]              │
│                                                              │
│  47 results for "dentist marina"                             │
│                                                              │
│  ─────────────────────────────────────────────────           │
│                                                              │
│  Smile Design Dental Clinic                                  │
│  Specialized Dental · Dubai Marina, Dubai · ★ 4.6          │
│                                                              │
│  ─────────────────────────────────────────────────           │
│                                                              │
│  Marina Dental Clinic                                        │
│  General Dental · Dubai Marina, Dubai · ★ 4.3              │
│                                                              │
│  ... (list continues, 12 per page)                           │
│                                                              │
│  [Pagination: ← Prev | 1 | 2 | 3 | 4 | Next →]            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen: Claim Form (/claim/{listingId})

**Screen ID:** SCR-006
**Purpose:** Allow facility owners to claim and request edits to their listing

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Header]                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLAIM THIS LISTING                                          │
│  [Facility name displayed]                                   │
│                                                              │
│  ─────────────────────────────────────────────────           │
│                                                              │
│  Your name *          [                              ]       │
│  Email *              [                              ]       │
│  Phone                [                              ]       │
│  Your role *          [Owner ▼]                              │
│                                                              │
│  What needs correcting?                                      │
│  [                                                    ]      │
│  [                                                    ]      │
│  [                                                    ]      │
│                                                              │
│  [ Submit claim ]                                            │
│                                                              │
│  We review all claims within 48 hours.                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Largest Contentful Paint | < 1.5s | Vercel Speed Insights, P75 |
| First Input Delay | < 100ms | Core Web Vitals |
| Cumulative Layout Shift | < 0.1 | Core Web Vitals |
| Time to First Byte | < 200ms | SSG pages served from CDN |
| API response (search) | < 300ms | P95 |
| Total page weight | < 200KB | Without map embed |

### Security

- [x] HTTPS everywhere (Vercel default)
- [x] Input validation on all API routes
- [x] SQL injection prevention (Drizzle ORM parameterized queries)
- [x] XSS prevention (React default escaping)
- [x] Rate limiting on API routes
- [ ] CSRF protection on claim form (V2)
- [ ] Admin authentication for claim review (V2)

### Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader support (semantic HTML, aria-labels)
- [ ] Color contrast minimum 4.5:1 for all text
- [ ] Touch targets minimum 44x44px on mobile
- [ ] RTL support for Arabic (V2)

### SEO Technical

| Requirement | Status |
|-------------|--------|
| XML sitemap with all URLs | Done |
| robots.txt | Done |
| Canonical URLs | Done |
| Meta title + description per page | Done |
| Open Graph tags | Done |
| JSON-LD structured data per page | Done |
| Static generation (SSG) | Done |
| Mobile-first responsive | Done |
| Core Web Vitals passing | Target |

---

## 13. Design Direction (For Design Agent)

### Aesthetic: Editorial Swiss Newspaper

**NOT THIS:** Generic SaaS landing page with hero gradient, card grid with rounded corners and shadows, teal/blue color scheme, stock photos, "Trusted by thousands" badges.

**THIS:** The Financial Times meets Swiss International Typographic Style. Near-monochrome. Typography as the primary design element. Horizontal rules. Data displayed prominently. One warm accent color. Information hierarchy through weight and size, not decoration.

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Warm white | #fafaf7 |
| Primary text | Near-black | #1a1a1a |
| Secondary text | Warm gray | #6b6b60 |
| Accent | Warm amber/terracotta | Single bold color — designer's choice |
| Dividers | Light warm gray | #e5e5df |
| Hover/Active | Accent at 10% opacity | — |

### Typography

| Role | Spec |
|------|------|
| Display / H1 | Bold serif or distinctive grotesque. NOT Playfair, NOT Inter, NOT Space Grotesk. Something with character — Bricolage Grotesque, Fraunces, Newsreader, or similar. |
| Body | Clean sans-serif. Source Sans 3, DM Sans, or similar. High readability. |
| Data / Numbers | Tabular figures. Mono or semi-mono for counts and stats. |
| Scale contrast | Extreme — H1 at 48-72px, body at 16-18px, labels at 12-13px |

### Layout Principles

1. **No card shadows** — Use borders and dividers instead
2. **No gradients** — Flat, confident surfaces
3. **Horizontal rules** as primary visual separator
4. **Asymmetric layouts** — Not everything needs to be in a grid
5. **Dense data display** — This is a directory, not a marketing page
6. **Generous whitespace** in hero areas, tight spacing in data areas
7. **Typography hierarchy** does the heavy lifting — not icons, colors, or decoration
8. **Numbers are prominent** — Provider counts, ratings, review counts are visual anchors
9. **No decorative illustrations** — If images exist, they're city photography or maps
10. **Mobile: single column, large touch targets, collapsible sections**

### What Makes This Unforgettable

The one thing someone remembers: **"It looks like a newspaper, not a website."** The authority comes from the typography, the data density, and the editorial voice — not from marketing polish. It feels like a reference document you'd trust, like looking up something in The Economist or the FT.

---

## 14. 26 Medical Categories

| # | Category | Slug | Example Facility Types |
|---|----------|------|----------------------|
| 1 | Hospitals | hospitals | General Hospital, Specialized Hospital, Day Surgery Center |
| 2 | Clinics | clinics | General Medicine Clinic, Multi-Specialty Clinic |
| 3 | Dental | dental | General Dental Clinic, Specialized Dental Clinic |
| 4 | Pharmacy | pharmacy | Pharmacy, Drug Store |
| 5 | Cardiology | cardiology | Cardiology centers, heart clinics |
| 6 | Dermatology | dermatology | Skin clinics, aesthetic centers |
| 7 | Ophthalmology | ophthalmology | Eye clinics, laser vision centers |
| 8 | Orthopedics | orthopedics | Bone and joint clinics |
| 9 | Pediatrics | pediatrics | Children's clinics and hospitals |
| 10 | OB/GYN & Maternity | obstetrics-gynecology | Maternity hospitals, women's health clinics |
| 11 | ENT | ent | Ear, nose, throat clinics |
| 12 | Mental Health | mental-health | Psychiatry, psychology, counseling centers |
| 13 | Physiotherapy | physiotherapy | Rehabilitation centers, sports medicine |
| 14 | Radiology & Imaging | radiology | Diagnostic imaging, MRI, CT scan centers |
| 15 | Laboratory | laboratory | Diagnostic labs, pathology labs |
| 16 | Fertility & IVF | fertility | IVF clinics, reproductive medicine |
| 17 | Oncology | oncology | Cancer treatment centers |
| 18 | Neurology | neurology | Brain and nerve specialist clinics |
| 19 | Urology | urology | Urological clinics |
| 20 | Gastroenterology | gastroenterology | Digestive health clinics |
| 21 | Pulmonology | pulmonology | Respiratory clinics |
| 22 | Endocrinology | endocrinology | Diabetes and hormone clinics |
| 23 | Nephrology | nephrology | Kidney clinics, dialysis centers |
| 24 | Home Healthcare | home-healthcare | Home nursing, home medical services |
| 25 | Alternative Medicine | alternative-medicine | Ayurveda, homeopathy, TCM, chiropractic |
| 26 | Medical Equipment | medical-equipment | Medical device suppliers, equipment trading |

---

## 15. Cities & Areas

### Cities

| City | Slug | Regulator | Est. Providers |
|------|------|-----------|---------------|
| Dubai | dubai | DHA | ~1,200 |
| Abu Dhabi | abu-dhabi | DOH | ~900 |
| Sharjah | sharjah | MOHAP | ~650 |
| Al Ain | al-ain | DOH | ~400 |
| Ajman | ajman | MOHAP | ~280 |
| Ras Al Khaimah | ras-al-khaimah | MOHAP | ~340 |
| Fujairah | fujairah | MOHAP | ~120 |
| Umm Al Quwain | umm-al-quwain | MOHAP | ~90 |

### Areas (Top areas per city — not exhaustive)

**Dubai:** Downtown, Marina, Al Barsha, Jumeirah, Deira, Bur Dubai, Business Bay, JLT, JBR, DIFC, Healthcare City, Silicon Oasis, Motor City, Sports City, International City, Discovery Gardens, Al Quoz, Al Nahda, Karama

**Abu Dhabi:** Corniche, Al Reem Island, Al Khalidiyah, Tourist Club Area, Musaffah, Mussafah, Al Raha, Yas Island, Saadiyat, Khalifa City, Mohamed Bin Zayed City, Al Shamkha

**Sharjah:** Al Nahda, Al Majaz, Al Khan, Al Taawun, Al Qasimia, Muwaileh, Industrial Area, University City

**Al Ain:** Central District, Al Jimi, Al Muwaiji, Al Hili, Al Ain Oasis

**Ajman:** Al Nuaimia, Al Rashidiya, Al Jurf, Ajman Industrial

**RAK:** Al Nakheel, Al Dhait, Khuzam, Al Hamra

**Fujairah:** Fujairah City Center, Al Faseel

**UAQ:** UAQ City Center, Old Town

---

## 16. Competitive Analysis

| Competitor | Coverage | AEO | Insurance | Editorial | Our Edge |
|------------|----------|-----|-----------|-----------|----------|
| **Okadoc** | Dubai + AD (16K docs) | None | Partial | None | All-emirates, AEO-first, editorial |
| **Practo UAE** | All (31K docs, new) | None | Coming | None | Established data, AEO, local trust |
| **DoctorUna** | MENA (small UAE) | None | Yes | None | UAE depth, AEO, completeness |
| **DrFive** | Dubai only (20K docs) | None | No | Partial | All-emirates coverage |
| **MyBayut** | All (blog) | None | No | Strong | Real directory, not blog posts |
| **HealthFinder.ae** | All (new) | None | Yes | Some | Data authority, AEO, scale |
| **Govt portals** | By jurisdiction | None | No | None | Patient UX, unified, discoverable |

**Our unique position:** Only directory that is (1) government-sourced data, (2) AEO-optimized, (3) all-emirates, (4) free and open, (5) editorial + directory combined.

---

## 17. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Government portals block scraping | High | Medium | Cache aggressively, explore FOIA/open data requests, diversify sources |
| Google Places API costs at scale | Medium | High | Cache ratings, batch requests, use free tier wisely |
| Data staleness | High | Medium | Automated re-scrape weekly, lastVerified signals, user reports |
| Competitor copies AEO approach | Medium | Low | First-mover advantage, data depth moat |
| Incorrect facility data causes harm | High | Low | Clear disclaimers, claim system, lastVerified dates |
| Low organic traffic initially | Medium | Medium | Journal cross-promotion, social media, healthcare community outreach |

---

## 18. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **V1 Launch** (current) | Done | 1,900+ static pages, MOHAP data, search, claim workflow |
| **Data expansion** | Week 1-2 | Full MOHAP scrape (4,000), begin DHA scraping |
| **Design overhaul** | Week 2-3 | Editorial newspaper aesthetic applied |
| **DHA + Google Places** | Week 3-4 | Dubai facilities added, ratings enriched |
| **Insurance data** | Month 2 | Basic insurance acceptance data |
| **Arabic/RTL** | Month 2-3 | Full bilingual support |
| **DOH Abu Dhabi** | Month 2 | Abu Dhabi-specific facilities |
| **Practitioner pages** | Month 3 | Individual doctor profiles |

---

## 19. Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Can we get MOHAP data via official open data API instead of scraping? | Engineering | Investigating |
| What is the legal status of scraping government directories? | Legal | TBD |
| Should we show cost/price data? (liability concerns) | Product | Deferred to V2 |
| How do we verify claim requests? (phone verification? email domain?) | Product | TBD |
| Do we need DHA/DOH/MOHAP partnership for official endorsement? | Business | Exploring |

---

## Appendix A: URL Structure Reference

```
/                                          → Homepage
/uae/                                      → UAE landing (all cities)
/uae/dubai/                                → City landing
/uae/dubai/hospitals/                      → City + Category
/uae/dubai/marina/                         → City + Area
/uae/dubai/marina/dental/                  → City + Area + Category (FACET PAGE)
/uae/dubai/marina/dental/smile-design/     → Individual listing
/search?q=dentist+marina                   → Search results
/claim/{id}                                → Claim form
/about                                     → About page
```

## Appendix B: Schema.org Markup Reference

### Listing Page

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "Smile Design Dental Clinic",
  "url": "https://uae-healthcare-directory.vercel.app/uae/dubai/marina/dental/smile-design",
  "telephone": "+971-4-XXX-XXXX",
  "email": "info@smiledesign.ae",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Marina Walk, Tower A, Floor 2",
    "addressLocality": "Dubai Marina",
    "addressRegion": "Dubai",
    "addressCountry": "AE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 25.0800,
    "longitude": 55.1400
  },
  "medicalSpecialty": [
    "General Dentistry",
    "Orthodontics",
    "Cosmetic Dentistry"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "234"
  },
  "isAcceptingNewPatients": true
}
```

### Facet Page

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best dental clinics in Dubai Marina?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The highest-rated dental clinics in Dubai Marina include Smile Design Dental Clinic (4.6 stars), Marina Dental Clinic (4.3 stars), and Bright Smile Dental (4.1 stars). All are licensed by DHA."
      }
    }
  ]
}
```

---

**END OF PRD**

*This document is the single source of truth for the UAE Healthcare Directory product. Feed to design agent for aesthetic implementation.*
