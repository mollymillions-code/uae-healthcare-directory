"use server";

import { type QuizAnswers, type PlanRecommendation, recommendPlans } from "@/lib/insurance";

export async function getRecommendedPlans(answers: QuizAnswers): Promise<PlanRecommendation[]> {
  return recommendPlans(answers);
}
