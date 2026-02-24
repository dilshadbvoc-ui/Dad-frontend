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
exports.sendOneOffEmail = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const EmailService_1 = require("../services/EmailService");
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const client_1 = require("../generated/client");
const sendOneOffEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leadId, to, subject, body } = req.body;
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId) {
            return apiResponse_1.ResponseHandler.validationError(res, 'Organisation context required');
        }
        if (!leadId || !to || !subject || !body) {
            return apiResponse_1.ResponseHandler.validationError(res, 'Missing required fields');
        }
        // Verify lead exists and belongs to org
        const lead = yield prisma_1.default.lead.findFirst({
            where: { id: leadId, organisationId: orgId }
        });
        if (!lead) {
            return apiResponse_1.ResponseHandler.notFound(res, 'Lead not found');
        }
        // Send Email
        const sent = yield EmailService_1.EmailService.sendEmail(to, subject, body);
        if (!sent) {
            return apiResponse_1.ResponseHandler.serverError(res, 'Failed to send email');
        }
        // Log Interaction
        const interaction = yield prisma_1.default.interaction.create({
            data: {
                type: client_1.InteractionType.email,
                direction: 'outbound',
                subject: `Email Sent: ${subject}`,
                description: body, // Store body or snippet? Storing full body for now.
                leadId: leadId,
                createdById: user.id,
                organisationId: orgId,
            }
        });
        return apiResponse_1.ResponseHandler.success(res, interaction, 'Email sent successfully');
    }
    catch (error) {
        console.error('sendOneOffEmail Error:', error);
        return apiResponse_1.ResponseHandler.serverError(res, 'Internal server error');
    }
});
exports.sendOneOffEmail = sendOneOffEmail;
