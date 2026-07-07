import { promises as fs } from 'fs';
import path from 'path';

export interface PersonalInfo {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  intro: string;
  objective: string;
  quote: string;
  motto: string;
  profilePhoto: string;
  logoText: string;
  resumePdf?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  status: string;
  description: string;
}

export interface Experience {
  id: string;
  title: string;
  organization: string;
  duration: string;
  responsibilities: string[];
}

export interface Activity {
  id: string;
  title: string;
  description: string;
}

export interface Blog {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  publishDate: string;
  readTime: string;
  urls?: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  urls?: string[];
  description?: string;
  category: 'moot' | 'court' | 'college' | 'event' | 'other';
  uploadDate: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
  urls?: string[];
  description?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
}

export interface Milestone {
  id: string;
  year: string;
  title: string;
}

export interface SupremeCourtSection {
  tourTitle: string;
  tourText: string;
  opportunityTitle: string;
  opportunityText: string;
  horizonsTitle: string;
  horizonsText: string;
}

export interface SkillsGroup {
  cs: string[];
  law: string[];
  pro: string[];
}

export interface SectionLayoutSettings {
  textPosition?: 'left' | 'center' | 'right';
  layoutSide?: 'left' | 'right';
}

export interface LayoutSettings {
  home?: SectionLayoutSettings;
  about?: SectionLayoutSettings;
  journey?: SectionLayoutSettings;
  skills?: SectionLayoutSettings;
  supremecourt?: SectionLayoutSettings;
  research?: SectionLayoutSettings;
  certificates?: SectionLayoutSettings;
  contact?: SectionLayoutSettings;
}

export interface DatabaseSchema {
  personal: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  activities: Activity[];
  achievements: string[];
  blogs: Blog[];
  gallery: GalleryItem[];
  certificates: Certificate[];
  messages: ContactMessage[];
  seo: SeoSettings;
  milestones?: Milestone[];
  supremeCourt?: SupremeCourtSection;
  skillsGroup?: SkillsGroup;
  sectionOrder?: string[];
  layoutSettings?: LayoutSettings;
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export async function getDb(): Promise<DatabaseSchema> {
  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading local JSON database, returning fallback empty database:', error);
    // In case db.json doesn't exist yet, we could return a skeleton structure
    return {
      personal: {
        name: 'Nency Soni',
        title: 'Aspiring Company Secretary & Law Student',
        location: '',
        email: '',
        phone: '',
        linkedin: '',
        intro: '',
        objective: '',
        quote: '',
        motto: '',
        profilePhoto: '',
        logoText: 'Nency Soni'
      },
      education: [],
      experience: [],
      skills: [],
      languages: [],
      activities: [],
      achievements: [],
      blogs: [],
      gallery: [],
      certificates: [],
      messages: [],
      seo: {
        title: 'Nency Soni Portfolio',
        description: '',
        keywords: ''
      },
      sectionOrder: ['home', 'about', 'journey', 'skills', 'supremecourt', 'gallery', 'research', 'certificates', 'contact'],
      layoutSettings: {
        home: { textPosition: 'center' },
        about: { textPosition: 'left', layoutSide: 'left' },
        journey: { textPosition: 'left', layoutSide: 'left' },
        skills: { textPosition: 'center' },
        supremecourt: { textPosition: 'left' },
        research: { textPosition: 'left', layoutSide: 'left' },
        certificates: { textPosition: 'center' },
        contact: { textPosition: 'center' }
      }
    };
  }
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  const dirPath = path.dirname(DB_PATH);
  // Ensure data folder exists
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}
