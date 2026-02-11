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
exports.TelephonyService = void 0;
const twilio_1 = require("twilio");
const prisma_1 = __importDefault(require("../config/prisma"));
class TelephonyService {
    constructor(config) {
        this.client = null;
        this.config = null;
        if (config) {
            this.config = config;
            this.client = new twilio_1.Twilio(config.accountSid, config.authToken);
        }
    }
    static getClientForOrg(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            const org = yield prisma_1.default.organisation.findUnique({
                where: { id: orgId },
                select: { integrations: true }
            });
            if (!org || !org.integrations)
                return null;
            const integrations = org.integrations;
            const twilioConfig = integrations.twilio;
            if (!twilioConfig || !twilioConfig.accountSid || !twilioConfig.authToken)
                return null;
            return new TelephonyService(twilioConfig);
        });
    }
    makeCall(to, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client || !this.config)
                throw new Error('Twilio client not initialized');
            return this.client.calls.create({
                to,
                from: this.config.phoneNumber,
                url
            });
        });
    }
    sendSms(to, body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client || !this.config)
                throw new Error('Twilio client not initialized');
            return this.client.messages.create({
                to,
                from: this.config.phoneNumber,
                body
            });
        });
    }
}
exports.TelephonyService = TelephonyService;
