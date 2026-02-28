export type CourseInfo = {
  credits: number;
  name: string;
  semester: number;
};

export type CourseStatus = {
  listened: boolean;
  passed: boolean;
};

export type EvalContext = {
  courseInfoMap: Map<string, CourseInfo>;
  courseSemester: number;
  statuses: Record<string, CourseStatus>;
  totalCredits: number;
};

export type PrereqNode =
  | { amount: number; type: 'credits' }
  | { children: PrereqNode[]; type: 'and' }
  | { children: PrereqNode[]; type: 'or' }
  | { name: string; type: 'course' }
  | { text: string; type: 'unknown' }
  | { type: 'none' };

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const splitTopLevel = (text: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;

    if (depth === 0 && text.startsWith(separator, i)) {
      parts.push(current);
      current = '';
      i += separator.length;
    } else {
      current += text[i];
      i++;
    }
  }
  parts.push(current);
  return parts;
};

/**
 * Unified recursive-descent parser that avoids forward references.
 *
 * Grammar: expr   → term (" или " term)*
 *          term   → factor (" и " factor)*
 *          factor → "(" expr ")" | course_token
 */
const parseLevel = (
  text: string,
  courses: string[],
  level: 'expr' | 'factor' | 'term',
): PrereqNode => {
  const trimmed = text.trim();

  if (level === 'expr') {
    const parts = splitTopLevel(trimmed, ' или ');
    if (parts.length <= 1) {
      return parseLevel(parts[0] ?? trimmed, courses, 'term');
    }
    return {
      children: parts.map((p) => parseLevel(p, courses, 'term')),
      type: 'or',
    };
  }

  if (level === 'term') {
    const parts = splitTopLevel(trimmed, ' и ');
    if (parts.length <= 1) {
      return parseLevel(parts[0] ?? trimmed, courses, 'factor');
    }
    return {
      children: parts.map((p) => parseLevel(p, courses, 'factor')),
      type: 'and',
    };
  }

  // factor
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return parseLevel(trimmed.slice(1, -1), courses, 'expr');
  }

  const match = /^%%(?<idx>\d+)%%$/u.exec(trimmed);
  const idxStr = match?.groups?.['idx'];
  if (idxStr !== undefined) {
    const idx = Number.parseInt(idxStr);
    return { name: courses[idx] ?? trimmed, type: 'course' };
  }

  return { text: trimmed, type: 'unknown' };
};

/**
 * Tokenise known course names out of the text (longest-first, case-insensitive),
 * then recursive-descent-parse the remaining connectors / parentheses.
 */
export const parsePrerequisite = (
  text: string | undefined,
  knownCourseNames: string[],
): PrereqNode => {
  if (!text || text.trim() === '') return { type: 'none' };

  const creditMatch = /^(?<amt>\d+)\s*кредити$/u.exec(text.trim());
  const creditAmt = creditMatch?.groups?.['amt'];
  if (creditAmt !== undefined) {
    return { amount: Number.parseInt(creditAmt), type: 'credits' };
  }

  const sorted = [...knownCourseNames].sort((a, b) => b.length - a.length);
  const found: string[] = [];
  let tokenised = text;

  for (const name of sorted) {
    const lowerIdx = tokenised.toLowerCase().indexOf(name.toLowerCase());
    if (lowerIdx !== -1) {
      found.push(name);
      tokenised = `${tokenised.slice(
        0,
        lowerIdx,
      )}%%${String(found.length - 1)}%%${tokenised.slice(
        lowerIdx + name.length,
      )}`;
    }
  }

  if (found.length === 0) return { text, type: 'unknown' };
  return parseLevel(tokenised, found, 'expr');
};

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

const OVERRIDE_CREDITS = 180;

/**
 * Check whether a single course-name prerequisite is met.
 *
 * - If the prerequisite course is exactly 1 semester behind the current course,
 *   having **listened** (enrolled) is enough.
 * - Otherwise the prerequisite course must be **passed**.
 */
const isCoursePrereqMet = (prereqName: string, ctx: EvalContext): boolean => {
  const status = ctx.statuses[prereqName];
  if (!status) return false;

  const prereqInfo = ctx.courseInfoMap.get(prereqName);
  if (!prereqInfo) return status.passed;

  const diff = ctx.courseSemester - prereqInfo.semester;
  return diff === 1 ? status.listened : status.passed;
};

const evaluateNode = (node: PrereqNode, ctx: EvalContext): boolean => {
  switch (node.type) {
    case 'and':
      return node.children.every((c) => evaluateNode(c, ctx));

    case 'course':
      return isCoursePrereqMet(node.name, ctx);

    case 'credits':
      return ctx.totalCredits >= node.amount;

    case 'none':
      return true;

    case 'or':
      return node.children.some((c) => evaluateNode(c, ctx));

    case 'unknown':
      return true;

    default:
      return true;
  }
};

/**
 * Top-level evaluation: returns `true` when the total credits already
 * reach the 180 override, or when the prerequisite tree is satisfied.
 */
export const isPrerequisiteMet = (
  node: PrereqNode,
  ctx: EvalContext,
): boolean => {
  if (ctx.totalCredits >= OVERRIDE_CREDITS) return true;
  return evaluateNode(node, ctx);
};

/**
 * Build a human-readable prerequisite string from a PrereqNode.
 */
export const prereqToString = (node: PrereqNode): string => {
  switch (node.type) {
    case 'and':
      return node.children
        .map((c) => {
          const s = prereqToString(c);
          return c.type === 'or' ? `(${s})` : s;
        })
        .join(' и ');

    case 'course':
      return node.name;

    case 'credits':
      return `${String(node.amount)} кредити`;

    case 'none':
      return '';

    case 'or':
      return node.children.map((c) => prereqToString(c)).join(' или ');

    case 'unknown':
      return node.text;

    default:
      return '';
  }
};
