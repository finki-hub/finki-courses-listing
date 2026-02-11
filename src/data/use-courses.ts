import { createResource } from 'solid-js';

import type { CourseRaw } from '@/types/course';

const COURSES_URL = 'https://assets.finki-hub.com/courses.json';

const fetchCourses = async (): Promise<CourseRaw[]> => {
  const response = await fetch(COURSES_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  return response.json() as Promise<CourseRaw[]>;
};

export const useCourses = () => createResource(fetchCourses);
