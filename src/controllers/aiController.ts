import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/apiResponse';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Lazy initialization of OpenAI to prevent startup errors if key is missing
const getOpenAI = () => {
    if (process.env.OPENAI_API_KEY) {
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return null;
};

export const generateContent = async (req: Request, res: Response) => {
    const { topic, type, tone } = req.body;
    const user = (req as any).user;

    try {
        if (!topic || !type) {
            return ResponseHandler.validationError(res, 'Topic and type are required');
        }

        const openai = getOpenAI();

        // Mock fallback if no API key
        if (!openai) {
            logger.info('OpenAI key missing, returning mock response', 'AI_GENERATION', user?.id);

            const mockResponses: Record<string, string> = {
                email: `Subject: ${topic}\n\nDear Client,\n\nWe are excited to share updates regarding ${topic}. Our team has been working hard to deliver the best results for you.\n\nBest regards,\nThe Team\n\n[MOCK GENERATION - Configure OPENAI_API_KEY for real AI]`,
                social: `🚀 Exciting news about ${topic}! We're exploring new ways to help you succeed. #Growth #Innovation #${topic.split(' ')[0]} \n\n[MOCK GENERATION]`,
                blog: `Title: The Future of ${topic}\n\nIn today's rapidly evolving landscape, understanding ${topic} is more important than ever. Here are three key takeaways to keep in mind...\n\n[MOCK GENERATION]`
            };

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return ResponseHandler.success(res, {
                content: mockResponses[type] || mockResponses['email'],
                isMock: true
            }, 'Content generated successfully (Mock)');
        }

        // Real OpenAI Call
        let systemPrompt = '';
        let userPrompt = '';

        switch (type) {
            case 'email':
                systemPrompt = `You are an expert marketing copywriter. Write a professional email. Tone: ${tone || 'professional'}.`;
                userPrompt = `Write an email about: ${topic}`;
                break;
            case 'social':
                systemPrompt = `You are a social media manager. Write an engaging post with hashtags. Tone: ${tone || 'witty'}.`;
                userPrompt = `Write a social media post about: ${topic}`;
                break;
            case 'blog':
                systemPrompt = `You are a content strategist. Write a blog post outline and intro. Tone: ${tone || 'informative'}.`;
                userPrompt = `Write a blog post about: ${topic}`;
                break;
            default:
                systemPrompt = `You are a helpful assistant.`;
                userPrompt = topic;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 500
        });

        const generatedText = completion.choices[0].message.content;

        logger.info('AI Content generated successfully', 'AI_GENERATION', user?.id, user?.organisationId, { type, topic });

        return ResponseHandler.success(res, {
            content: generatedText,
            isMock: false
        }, 'Content generated successfully');

    } catch (error: any) {
        logger.error('AI Generation Failed', error, 'AI_GENERATION', user?.id);
        return ResponseHandler.serverError(res, 'Failed to generate content');
    }
};
