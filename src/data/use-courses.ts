import { createResource } from 'solid-js';

import { type CourseRaw, coursesSchema } from '@/types/course';

const COURSES_URL = 'https://assets.finki-hub.com/courses.json';

const fetchCourses = async (): Promise<CourseRaw[]> => {
  const response = await fetch(COURSES_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  const data: unknown = await response.json();
  return coursesSchema.parse(data);
};

export const useCourses = () => createResource(fetchCourses);
