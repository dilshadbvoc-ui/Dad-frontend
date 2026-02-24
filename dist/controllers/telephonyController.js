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
exports.makeOutboundCall = exports.handleStatusWebhook = exports.handleVoiceWebhook = void 0;
const twilio_1 = __importDefault(require("twilio"));
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const telephonyService_1 = require("../services/telephonyService");
const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
// Voice Webhook (Inbound or Outbound Answered)
const handleVoiceWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { orgId, leadId } = req.query; // Added leadId from query
    const { CallSid, From } = req.body; // Removed unused To, Direction
    const twiml = new VoiceResponse();
    try {
        if (!orgId || typeof orgId !== 'string') {
            console.error('Missing orgId in webhook');
            twiml.say('Configuration error.');
            res.type('text/xml').send(twiml.toString());
            return;
        }
        const org = yield prisma_1.default.organisation.findUnique({
            where: { id: orgId },
            include: { callSettings: true }
        });
        if (!org) {
            twiml.say('Organization not found.');
            res.type('text/xml').send(twiml.toString());
            return;
        }
        const integrations = org.integrations;
        const twilioConfig = integrations === null || integrations === void 0 ? void 0 : integrations.twilio;
        // Check recording settings
        const shouldRecord = (_b = (_a = org.callSettings) === null || _a === void 0 ? void 0 : _a.autoRecordInbound) !== null && _b !== void 0 ? _b : true;
        // Prepare Interaction Data
        const interactionData = {
            type: 'call',
            direction: 'inbound', // Default to inbound, but could be outbound if triggered via API 
            subject: `Call with ${From}`,
            phoneNumber: From,
            callStatus: 'initiated',
            description: `Twilio CallSid: ${CallSid}`,
            recordingUrl: null,
            organisation: { connect: { id: orgId } },
        };
        // If leadId is passed (e.g. from Click-to-Call), connect it
        if (leadId && typeof leadId === 'string') {
            interactionData.lead = { connect: { id: leadId } };
            interactionData.direction = 'outbound'; // If we have a leadId, it's likely our initiated outbound call
            interactionData.subject = `Outbound Call to ${From}`;
        }
        // Create Interaction Record
        yield prisma_1.default.interaction.create({
            data: interactionData
        });
        if (shouldRecord) {
            // TwiML to Record
            // If we have a forward number, we Dial it.
            const forwardTo = twilioConfig === null || twilioConfig === void 0 ? void 0 : twilioConfig.forwardTo; // Custom field in integration config
            if (forwardTo) {
                const dial = twiml.dial({
                    record: 'record-from-ringing',
                    action: `/api/telephony/webhook/status?orgId=${orgId}`, // Status callback
                    // method: 'POST'
                });
                dial.number(forwardTo);
            }
            else {
                twiml.say('No forwarding number configured.');
                twiml.record({
                    action: `/api/telephony/webhook/status?orgId=${orgId}`,
                    maxLength: 120
                });
            }
        }
        else {
            const forwardTo = twilioConfig === null || twilioConfig === void 0 ? void 0 : twilioConfig.forwardTo;
            if (forwardTo) {
                twiml.dial(forwardTo);
            }
            else {
                twiml.say('Thank you for calling.');
            }
        }
        res.type('text/xml').send(twiml.toString());
    }
    catch (error) {
        console.error('Twilio Webhook Error:', error);
        twiml.say('An application error occurred.');
        res.type('text/xml').send(twiml.toString());
    }
});
exports.handleVoiceWebhook = handleVoiceWebhook;
const handleStatusWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orgId } = req.query;
    const { CallSid, RecordingUrl, RecordingDuration, CallStatus } = req.body;
    try {
        if (!orgId) {
            return res.status(400).send('No orgId');
        }
        console.log(`Twilio Status: ${CallStatus}, Recording: ${RecordingUrl}`);
        // Find the interaction by CallSid
        // Since we stored CallSid in description safely or subject... 
        // This is fuzzy. Better to have stored it properly. 
        // For now, finding the most recent call with that description substring
        const interaction = yield prisma_1.default.interaction.findFirst({
            where: {
                organisationId: orgId,
                description: { contains: CallSid }
            }
        });
        if (interaction) {
            const data = {
                callStatus: CallStatus
            };
            if (RecordingUrl) {
                data.recordingUrl = RecordingUrl;
            }
            if (RecordingDuration) {
                data.duration = parseInt(RecordingDuration); // seconds
                data.recordingDuration = parseInt(RecordingDuration);
            }
            yield prisma_1.default.interaction.update({
                where: { id: interaction.id },
                data
            });
            // Emit Socket event logic here if needed
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});
exports.handleStatusWebhook = handleStatusWebhook;
const makeOutboundCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { to, leadId } = req.body;
        if (!to)
            return res.status(400).json({ message: 'Phone number required' });
        if (!orgId) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const telephonyService = yield telephonyService_1.TelephonyService.getClientForOrg(orgId);
        if (!telephonyService) {
            return res.status(400).json({ message: 'Telephony not configured' });
        }
        // URL that Twilio will request when the call connects (usually to give instructions or record)
        // For a simple browser-to-phone or click-to-call, this TwiML usually dials the agent first or bridges.
        // For this simple implementation, we'll assume we are triggering a call TO the customer 
        // that plays a message or connects to a verified number.
        // A real "Click-to-Call" often involves dialing the Agent first, then the Customer.
        // For MVP, let's just trigger the API.
        // Pass leadId to webhook so we can link the call
        let callbackUrl = `${process.env.API_URL}/api/telephony/webhook/voice?orgId=${orgId}`;
        if (leadId) {
            callbackUrl += `&leadId=${leadId}`;
        }
        const call = yield telephonyService.makeCall(to, callbackUrl);
        res.json({ message: 'Call initiated', callSid: call.sid });
    }
    catch (error) {
        console.error('Outbound Call Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.makeOutboundCall = makeOutboundCall;
