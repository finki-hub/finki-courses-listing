import { z } from 'zod/v4';

const optionalString = z.string().optional();

export const courseSchema = z.object({
  '2011/2012': optionalString,
  '2012/2013': optionalString,
  '2013/2014': optionalString,
  '2014/2015': optionalString,
  '2015/2016': optionalString,
  '2016/2017': optionalString,
  '2017/2018': optionalString,
  '2018-available': z.string(),
  '2018-channel': optionalString,
  '2018-code': optionalString,
  '2018-credits': optionalString,
  '2018-level': optionalString,
  '2018-name': optionalString,
  '2018-prerequisite': optionalString,
  '2018-semester': optionalString,
  '2018-state-imb': optionalString,
  '2018-state-ke': optionalString,
  '2018-state-ki': optionalString,
  '2018-state-kn': optionalString,
  '2018-state-pit': optionalString,
  '2018-state-seis': optionalString,
  '2018-state-siis': optionalString,
  '2018/2019': optionalString,
  '2019/2020': optionalString,
  '2020/2021': optionalString,
  '2021/2022': optionalString,
  '2022/2023': optionalString,
  '2023-available': z.string(),
  '2023-channel': optionalString,
  '2023-code': optionalString,
  '2023-credits': optionalString,
  '2023-level': optionalString,
  '2023-name': optionalString,
  '2023-prerequisite': optionalString,
  '2023-semester': optionalString,
  '2023-state-ie': optionalString,
  '2023-state-imb': optionalString,
  '2023-state-ki': optionalString,
  '2023-state-kn': optionalString,
  '2023-state-pit': optionalString,
  '2023-state-seis': optionalString,
  '2023-state-siis': optionalString,
  '2023-state-ssp': optionalString,
  '2023/2024': optionalString,
  '2024/2025': optionalString,
  '2025/2026': optionalString,
  assistants: optionalString,
  channel: optionalString,
  name: z.string(),
  professors: z.string(),
  tags: optionalString,
});

export const coursesSchema = z.array(courseSchema);

export type CourseRaw = z.infer<typeof courseSchema>;

export const TAG_TRANSLATIONS: Record<string, string> = {
  ai: 'Вештачка интелигенција',
  devops: 'DevOps',
  filler: 'Филер',
  math: 'Математика',
  networking: 'Мрежи',
  web: 'Веб',
};

export const ALL_TAGS = Object.keys(TAG_TRANSLATIONS);

export const getCourseTags = (course: CourseRaw): string[] =>
  course.tags?.split(',').filter(Boolean) ?? [];

export const ACADEMIC_YEARS = [
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
  '2021/2022',
  '2020/2021',
  '2019/2020',
  '2018/2019',
  '2017/2018',
  '2016/2017',
  '2015/2016',
  '2014/2015',
  '2013/2014',
  '2012/2013',
  '2011/2012',
] as const;

export type AcademicYear = (typeof ACADEMIC_YEARS)[number];

export type AccreditationInfo = {
  channel?: string;
  code?: string;
  level?: string;
  name?: string;
  prerequisite?: string;
  semester?: string;
};

export const getAccreditationInfo = (
  course: CourseRaw,
  accreditation: '2018' | '2023',
): AccreditationInfo | undefined => {
  const available = course[`${accreditation}-available`];
  if (available !== 'TRUE') return undefined;

  return {
    channel: course[`${accreditation}-channel`],
    code: course[`${accreditation}-code`],
    level: course[`${accreditation}-level`],
    name: course[`${accreditation}-name`],
    prerequisite: course[`${accreditation}-prerequisite`],
    semester: course[`${accreditation}-semester`],
  };
};

export const getEnrollmentForYear = (
  course: CourseRaw,
  year: AcademicYear,
): number => {
  const value = course[year];
  return value ? Number.parseInt(value) : 0;
};

export const getLatestEnrollment = (course: CourseRaw): number => {
  for (const year of ACADEMIC_YEARS) {
    const val = getEnrollmentForYear(course, year);
    if (val > 0) return val;
  }
  return 0;
};

const DEFAULT_CREDITS = 6;

export const getCourseCredits = (
  course: CourseRaw,
  accreditation: '2018' | '2023',
): number => {
  const raw = course[`${accreditation}-credits`];
  if (raw) {
    const parsed = Number.parseInt(raw);
    return Number.isNaN(parsed) ? DEFAULT_CREDITS : parsed;
  }
  return DEFAULT_CREDITS;
};

// ---------------------------------------------------------------------------
// Study programs
// ---------------------------------------------------------------------------

export const STUDY_PROGRAMS_2018 = [
  'imb',
  'ke',
  'ki',
  'kn',
  'pit',
  'seis',
  'siis',
] as const;

export const STUDY_PROGRAMS_2023 = [
  'ie',
  'imb',
  'ki',
  'kn',
  'pit',
  'seis',
  'siis',
  'ssp',
] as const;

export type StudyProgram = StudyProgram2018 | StudyProgram2023;
export type StudyProgram2018 = (typeof STUDY_PROGRAMS_2018)[number];
export type StudyProgram2023 = (typeof STUDY_PROGRAMS_2023)[number];

export const STUDY_PROGRAM_LABELS: Record<string, string> = {
  ie: 'ИЕ',
  imb: 'ИМБ',
  ke: 'КЕ',
  ki: 'КИ',
  kn: 'КН',
  pit: 'ПИТ',
  seis: 'СЕИС',
  siis: 'СИИС',
  ssp: 'ССП',
};

export const getCourseStateForProgram = (
  course: CourseRaw,
  accreditation: '2018' | '2023',
  program: string,
): string | undefined =>
  course[`${accreditation}-state-${program}` as keyof CourseRaw];
