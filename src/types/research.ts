export interface Report {
  id: string;
  title: string;
  description: string;
  summary: string[];
  thumbnail: string;
  category: string;
  publishedAt: string;
  readTime: string;
  isTopReport?: boolean;
  isLatest?: boolean;
  pdfFile?: string; // Legacy: path to PDF file
  reportHtml?: string; // New: interactive HTML report content
  reportUrl?: string; // New: external URL if hosted elsewhere
  status?: 'draft' | 'review' | 'published' | 'archived';
  detailedContent?: {
    mainHeading: string;
    mainContent: string;
    keyPoints: string[];
    industryInsights: string;
    ctaHeading: string;
    ctaDescription: string;
  };
  // Extended fields for internal report page
  content?: {
    sections: ReportSection[];
    features?: string[];
    disclaimer?: string;
  };
}

export interface ReportSection {
  heading: string;
  subheading?: string;
  content: string | string[];
  type?: 'text' | 'list' | 'highlight';
}

export interface ReportData {
  reports: Report[];
  topReports: Report[];
  latestReports: Report[];
}
