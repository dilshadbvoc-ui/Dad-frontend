"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
// Lazy initialization of OpenAI to prevent startup errors if key is missing
const getOpenAI = () => {
    if (process.env.OPENAI_API_KEY) {
        return new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return null;
};
const generateContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { topic, type, tone } = req.body;
    const user = req.user;
    try {
        if (!topic || !type) {
            return apiResponse_1.ResponseHandler.validationError(res, 'Topic and type are required');
        }
        const openai = getOpenAI();
        // Mock fallback if no API key
        if (!openai) {
            logger_1.logger.info('OpenAI key missing, returning mock response', 'AI_GENERATION', user === null || user === void 0 ? void 0 : user.id);
            const mockResponses = {
                email: `Subject: ${topic}\n\nDear Client,\n\nWe are excited to share updates regarding ${topic}. Our team has been working hard to deliver the best results for you.\n\nBest regards,\nThe Team\n\n[MOCK GENERATION - Configure OPENAI_API_KEY for real AI]`,
                social: `🚀 Exciting news about ${topic}! We're exploring new ways to help you succeed. #Growth #Innovation #${topic.split(' ')[0]} \n\n[MOCK GENERATION]`,
                blog: `Title: The Future of ${topic}\n\nIn today's rapidly evolving landscape, understanding ${topic} is more important than ever. Here are three key takeaways to keep in mind...\n\n[MOCK GENERATION]`
            };
            // Simulate network delay
            yield new Promise(resolve => setTimeout(resolve, 1000));
            return apiResponse_1.ResponseHandler.success(res, {
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
        const completion = yield openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 500
        });
        const generatedText = completion.choices[0].message.content;
        logger_1.logger.info('AI Content generated successfully', 'AI_GENERATION', user === null || user === void 0 ? void 0 : user.id, user === null || user === void 0 ? void 0 : user.organisationId, { type, topic });
        return apiResponse_1.ResponseHandler.success(res, {
            content: generatedText,
            isMock: false
        }, 'Content generated successfully');
    }
    catch (error) {
        logger_1.logger.error('AI Generation Failed', error, 'AI_GENERATION', user === null || user === void 0 ? void 0 : user.id);
        return apiResponse_1.ResponseHandler.serverError(res, 'Failed to generate content');
    }
});
exports.generateContent = generateContent;
