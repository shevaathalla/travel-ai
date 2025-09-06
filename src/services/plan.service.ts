import { PrismaClient } from '@prisma/client';
import { ChooseOptionInput } from '../schemas/plan.schema';
import { PlanOption } from '../utils/ai';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface PlanSummary {
  id: string;
  days: number;
  budget: number;
  feeling: string;
  originCity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDetail extends PlanSummary {
  optionsJson: PlanOption[];
  chosenOption: PlanOption | null;
}

export const planService = {
  async getUserPlans(userId: string): Promise<PlanSummary[]> {
    logger.info('Getting user plans:', { userId });

    const plans = await prisma.plan.findMany({
      where: { userId },
      select: {
        id: true,
        days: true,
        budget: true,
        feeling: true,
        originCity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans;
  },

  async getPlanDetail(planId: string, userId: string): Promise<PlanDetail> {
    logger.info('Getting plan detail:', { planId, userId });

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    const optionsJson = (plan.optionsJson as unknown) as PlanOption[];
    const chosenOption = (plan.chosenOption as unknown) as PlanOption | null;

    return {
      id: plan.id,
      days: plan.days,
      budget: plan.budget,
      feeling: plan.feeling,
      originCity: plan.originCity,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      optionsJson,
      chosenOption,
    };
  },

  async chooseOption(planId: string, userId: string, input: ChooseOptionInput): Promise<PlanOption> {
    logger.info('Choosing plan option:', { planId, userId, optionId: input.optionId });

    // Get the plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.status === 'chosen') {
      throw new Error('Plan option has already been chosen');
    }

    // Find the chosen option
    const options = (plan.optionsJson as unknown) as PlanOption[];
    const chosenOption = options.find((option) => option.id === input.optionId);

    if (!chosenOption) {
      throw new Error('Invalid option ID');
    }

    // Update the plan
    await prisma.plan.update({
      where: { id: planId },
      data: {
        chosenOption: (chosenOption as unknown) as any,
        status: 'chosen',
      },
    });

    logger.info('Plan option chosen successfully:', { planId, optionId: input.optionId });
    return chosenOption;
  },

  async deletePlan(planId: string, userId: string): Promise<void> {
    logger.info('Deleting plan:', { planId, userId });

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    await prisma.plan.delete({
      where: { id: planId },
    });

    logger.info('Plan deleted successfully:', { planId });
  },
};
