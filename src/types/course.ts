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
  '2018-level': optionalString,
  '2018-name': optionalString,
  '2018-prerequisite': optionalString,
  '2018-semester': optionalString,
  '2018/2019': optionalString,
  '2019/2020': optionalString,
  '2020/2021': optionalString,
  '2021/2022': optionalString,
  '2022/2023': optionalString,
  '2023-available': z.string(),
  '2023-channel': optionalString,
  '2023-code': optionalString,
  '2023-level': optionalString,
  '2023-name': optionalString,
  '2023-prerequisite': optionalString,
  '2023-semester': optionalString,
  '2023/2024': optionalString,
  '2024/2025': optionalString,
  '2025/2026': optionalString,
  assistants: optionalString,
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
