export type CourseRaw = {
  '2011/2012'?: string;
  '2012/2013'?: string;
  '2013/2014'?: string;

  '2014/2015'?: string;
  '2015/2016'?: string;
  '2016/2017'?: string;
  '2017/2018'?: string;
  '2018-available'?: string;
  '2018-channel'?: string;
  '2018-code'?: string;
  '2018-level'?: string;
  '2018-name'?: string;
  '2018-prerequisite'?: string;
  '2018-semester'?: string;
  '2018/2019'?: string;
  '2019/2020'?: string;
  '2020/2021'?: string;
  '2021/2022'?: string;

  '2022/2023'?: string;
  '2023-available'?: string;

  '2023-channel'?: string;
  '2023-code'?: string;
  '2023-level'?: string;
  '2023-name'?: string;
  '2023-prerequisite'?: string;
  '2023-semester'?: string;

  '2023/2024'?: string;
  '2024/2025'?: string;
  '2025/2026'?: string;
  assistants?: string;
  name: string;
  professors: string;
};

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
