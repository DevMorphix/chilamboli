/**
 * Grading utility functions
 * Converts judge scores to grades and grade points for leaderboard calculations
 */

export interface GradeInfo {
  grade: string
  gradePoint: number
  normalizedScore: number
}

/**
 * Calculate grade and grade point from total score and max possible score
 * @param totalScore Sum of scores from all judges (e.g., 27.8)
 * @param maxPossibleScore Maximum possible score (e.g., 30 for 3 judges * 10)
 * @returns Grade info with grade, grade point, and normalized score (0-100)
 */
export function calculateGrade(
  totalScore: number,
  maxPossibleScore: number
): GradeInfo {
  // Normalize to 100 scale
  const normalizedScore =
    maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  // Assign grade and grade point based on normalized score (10-point bands: 90, 80, 70, …)
  const gradeThresholds = [
    { min: 90, grade: "A+", gradePoint: 10 },
    { min: 80, grade: "A", gradePoint: 9 },
    { min: 70, grade: "B+", gradePoint: 8 },
    { min: 60, grade: "B", gradePoint: 7 },
    { min: 50, grade: "C+", gradePoint: 6 },
    { min: 40, grade: "C", gradePoint: 5 },
    { min: 30, grade: "D+", gradePoint: 4 },
    { min: 20, grade: "D", gradePoint: 3 },
    { min: 10, grade: "E", gradePoint: 2 },
  ]

  const { grade, gradePoint } =
    gradeThresholds.find((t) => normalizedScore >= t.min) || {
      grade: "F",
      gradePoint: 0,
    }

  return {
    grade,
    gradePoint,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
  }
}
