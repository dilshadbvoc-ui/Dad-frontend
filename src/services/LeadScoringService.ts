
import prisma from '../config/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
    dangerouslyAllowBrowser: false
});

export class LeadScoringService {

    static async scoreLead(leadId: string) {
        try {
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                include: { interactions: true }
            });

            if (!lead) throw new Error('Lead not found');

            let score = 0;
            const log: string[] = [];

            // 1. Profile Completeness (Rule-based)
            if (lead.email) score += 10;
            if (lead.phone) score += 10;
            if (lead.company) score += 10;
            if (lead.jobTitle) score += 5;
            if (lead.address) score += 5;

            // 2. Engagement (Rule-based)
            if (lead.interactions && lead.interactions.length > 0) {
                // Cap interaction points to 30
                const interactionPoints = Math.min(lead.interactions.length * 5, 30);
                score += interactionPoints;
            }

            // 3. AI Analysis
            if (process.env.OPENAI_API_KEY) {
                try {
                    // In a real scenario, we'd prompt GPT with lead details
                    /*
                    const prompt = `Analyze this lead: ${JSON.stringify(lead)}. Score 0-20 based on intent.`;
                    const completion = await openai.chat.completions.create({...});
                    */
                    // For now, simple keyword boost
                    const title = (lead.jobTitle || '').toLowerCase();
                    if (title.includes('director') || title.includes('vp') || title.includes('head') || title.includes('manager')) {
                        score += 20;
                        log.push('AI: High value job title detected');
                    }
                } catch (err) {
                    console.warn('AI Scoring failed, falling back');
                }
            } else {
                // Mock AI boost for demo
                const title = (lead.jobTitle || '').toLowerCase();
                if (title.includes('vp') || title.includes('director')) {
                    score += 15;
                    log.push('MockAI: VIP title detected');
                }
            }

            // Cap at 100
            score = Math.min(score, 100);

            // Update Lead
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    leadScore: score,
                    lastScoredAt: new Date()
                }
            });

            return { score, log };

        } catch (error) {
            console.error('LeadScoringService Error:', error);
            // Don't throw, just log
        }
    }
}
