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
exports.WorkflowEngine = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const EmailService_1 = require("./EmailService");
const TaskService_1 = require("./TaskService");
const WhatsAppService_1 = require("./WhatsAppService");
const NotificationService_1 = require("./NotificationService");
exports.WorkflowEngine = {
    /**
     * Evaluate triggers and execute matching workflows
     */
    evaluate(entityType_1, eventType_1, data_1, organisationId_1) {
        return __awaiter(this, arguments, void 0, function* (entityType, eventType, data, organisationId, depth = 0) {
            try {
                console.log(`[WorkflowEngine] Evaluating ${entityType} ${eventType} for Org ${organisationId}`);
                // Find active workflows for this trigger
                const workflows = yield prisma_1.default.workflow.findMany({
                    where: {
                        organisationId: organisationId,
                        isActive: true,
                        triggerEntity: entityType,
                        triggerEvent: eventType,
                        isDeleted: false
                    }
                });
                console.log(`[WorkflowEngine] Found ${workflows.length} potential workflows`);
                for (const workflow of workflows) {
                    if (this.checkConditions(workflow.conditions, data)) {
                        yield this.executeActions(workflow, data, organisationId, 0, undefined, depth);
                    }
                }
            }
            catch (error) {
                console.error('[WorkflowEngine] Error evaluating workflows:', error);
            }
        });
    },
    /**
     * Check if data matches workflow conditions
     */
    checkConditions(conditions, data) {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0)
            return true;
        for (const condition of conditions) {
            const val = this.getValue(data, condition.field);
            const target = condition.value;
            switch (condition.operator) {
                case 'equals':
                    if (val != target)
                        return false;
                    break;
                case 'not_equals':
                    if (val == target)
                        return false;
                    break;
                case 'contains':
                    if (!String(val).includes(target))
                        return false;
                    break;
                case 'greater_than':
                    if (val <= target)
                        return false;
                    break;
                case 'less_than':
                    if (val >= target)
                        return false;
                    break;
                // Add more operators as needed
            }
        }
        return true;
    },
    /**
     * Get nested value from data
     */
    getValue(data, field) {
        return field.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, data);
    },
    /**
     * Replace placeholders in text with data values
     */
    parseTemplate(text, data) {
        if (!text)
            return '';
        return text.replace(/\{\{(.*?)\}\}/g, (match, field) => {
            const value = this.getValue(data, field.trim());
            return value !== null && value !== undefined ? String(value) : match;
        });
    },
    /**
     * Execute workflow actions
     */
    /**
     * Resume a paused workflow from the queue
     */
    resumeWorkflow(queueId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[WorkflowEngine] Resuming workflow queue item: ${queueId}`);
                const queueItem = yield prisma_1.default.workflowQueue.findUnique({
                    where: { id: queueId },
                    include: { workflow: true }
                });
                if (!queueItem) {
                    console.error(`[WorkflowEngine] Queue item ${queueId} not found`);
                    return;
                }
                // Update status to processing
                yield prisma_1.default.workflowQueue.update({
                    where: { id: queueId },
                    data: { status: 'processing' }
                });
                // Execute remaining actions
                yield this.executeActions(queueItem.workflow, queueItem.data, queueItem.organisationId, queueItem.nextActionIndex, queueItem.entityId, 0 // reset depth for queued items
                );
                // Mark as completed/delete
                yield prisma_1.default.workflowQueue.update({
                    where: { id: queueId },
                    data: { status: 'completed' }
                });
                // Optional: Delete completed items periodically or now
                // await prisma.workflowQueue.delete({ where: { id: queueId } });
            }
            catch (error) {
                console.error(`[WorkflowEngine] Error resuming workflow:`, error);
                yield prisma_1.default.workflowQueue.update({
                    where: { id: queueId },
                    data: { status: 'failed' }
                });
            }
        });
    },
    /**
     * Execute workflow actions
     */
    executeActions(workflow_1, data_1, organisationId_1) {
        return __awaiter(this, arguments, void 0, function* (workflow, data, organisationId, startIndex = 0, entityId, depth = 0) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
            // Recursion Protection
            if (depth > 3) {
                console.warn(`[WorkflowEngine] Max recursion depth reached for workflow ${workflow.name}. Stopping.`);
                return;
            }
            console.log(`[WorkflowEngine] Executing workflow: ${workflow.name} from index ${startIndex}`);
            const actions = workflow.actions;
            if (!actions)
                return;
            // Ensure we have an entityId for updates. If not passed (initial trigger), try to derive it.
            const effectiveEntityId = entityId || data.id;
            for (let i = startIndex; i < actions.length; i++) {
                const action = actions[i];
                try {
                    switch (action.type) {
                        case 'delay': {
                            const delayMinutes = ((_a = action.config) === null || _a === void 0 ? void 0 : _a.minutes) || 0;
                            const delayHours = ((_b = action.config) === null || _b === void 0 ? void 0 : _b.hours) || 0;
                            const delayDays = ((_c = action.config) === null || _c === void 0 ? void 0 : _c.days) || 0;
                            if (delayMinutes === 0 && delayHours === 0 && delayDays === 0)
                                break;
                            const executeAt = new Date();
                            executeAt.setMinutes(executeAt.getMinutes() + delayMinutes);
                            executeAt.setHours(executeAt.getHours() + delayHours);
                            executeAt.setDate(executeAt.getDate() + delayDays);
                            console.log(`[WorkflowEngine] Action: Delaying workflow until ${executeAt.toISOString()}`);
                            if (!effectiveEntityId) {
                                console.error('[WorkflowEngine] Cannot delay workflow without entity ID');
                                break;
                            }
                            // Queue the workflow
                            yield prisma_1.default.workflowQueue.create({
                                data: {
                                    workflowId: workflow.id,
                                    entityId: effectiveEntityId,
                                    organisationId,
                                    nextActionIndex: i + 1,
                                    executeAt,
                                    status: 'pending',
                                    data: data
                                }
                            });
                            // Stop execution of this instance
                            return;
                        }
                        case 'update_field': {
                            const field = (_d = action.config) === null || _d === void 0 ? void 0 : _d.field;
                            const value = (_e = action.config) === null || _e === void 0 ? void 0 : _e.value;
                            if (!field || !effectiveEntityId) {
                                console.warn('[WorkflowEngine] Missing field or entityId for update_field action');
                                break;
                            }
                            // Determine model based on triggerEntity
                            const modelName = workflow.triggerEntity.toLowerCase();
                            // Handle strict types if needed, but Prisma client is dynamic enough for raw queries or we assume model name matches.
                            // However, prisma[modelName] might be tricky with TS.
                            // We'll trust the model mapping. Lead -> lead, Contact -> contact, etc.
                            const delegate = prisma_1.default[modelName];
                            if (delegate) {
                                console.log(`[WorkflowEngine] Action: Updating ${modelName} ${effectiveEntityId} - ${field} = ${value}`);
                                // Parse value if it's a dynamic placeholder
                                const parsedValue = typeof value === 'string' ? this.parseTemplate(value, data) : value;
                                yield delegate.update({
                                    where: { id: effectiveEntityId },
                                    data: { [field]: parsedValue }
                                });
                                // Re-evaluate workflows for the change (triggers recursion depth check)
                                yield this.evaluate(workflow.triggerEntity, 'updated', yield delegate.findUnique({ where: { id: effectiveEntityId } }), organisationId, depth + 1);
                            }
                            else {
                                console.error(`[WorkflowEngine] Model delegate not found for ${modelName}`);
                            }
                            break;
                        }
                        case 'send_email': {
                            const to = ((_f = action.config) === null || _f === void 0 ? void 0 : _f.to) || data.email;
                            const subject = this.parseTemplate(((_g = action.config) === null || _g === void 0 ? void 0 : _g.subject) || 'Notification', data);
                            const body = this.parseTemplate(((_h = action.config) === null || _h === void 0 ? void 0 : _h.body) || 'Hello', data);
                            if (to) {
                                console.log(`[WorkflowEngine] Action: Sending Email to ${to}`);
                                yield EmailService_1.EmailService.sendEmail(to, subject, body, organisationId, workflow.createdById, {
                                    leadId: workflow.triggerEntity === 'Lead' ? effectiveEntityId : undefined,
                                    contactId: workflow.triggerEntity === 'Contact' ? effectiveEntityId : undefined
                                });
                            }
                            break;
                        }
                        case 'send_whatsapp': {
                            const phone = ((_j = action.config) === null || _j === void 0 ? void 0 : _j.phone) || data.phone;
                            if (!phone)
                                break;
                            const waClient = yield WhatsAppService_1.WhatsAppService.getClientForOrg(organisationId);
                            if (!waClient) {
                                console.warn(`[WorkflowEngine] WhatsApp not connected for org ${organisationId}`);
                                break;
                            }
                            if ((_k = action.config) === null || _k === void 0 ? void 0 : _k.templateName) {
                                console.log(`[WorkflowEngine] Action: Sending WhatsApp Template to ${phone}`);
                                yield waClient.sendTemplateMessage(phone, action.config.templateName, action.config.languageCode || 'en_US', action.config.components || []);
                            }
                            else if ((_l = action.config) === null || _l === void 0 ? void 0 : _l.message) {
                                const body = this.parseTemplate(action.config.message, data);
                                console.log(`[WorkflowEngine] Action: Sending WhatsApp Text to ${phone}`);
                                yield waClient.sendTextMessage(phone, body);
                                // Log Interaction
                                yield prisma_1.default.interaction.create({
                                    data: {
                                        organisationId,
                                        type: 'other',
                                        subject: 'WhatsApp Workflow Message',
                                        description: body,
                                        direction: 'outbound',
                                        leadId: workflow.triggerEntity === 'Lead' ? effectiveEntityId : undefined,
                                        contactId: workflow.triggerEntity === 'Contact' ? effectiveEntityId : undefined,
                                        createdById: workflow.createdById,
                                        phoneNumber: phone
                                    }
                                });
                            }
                            break;
                        }
                        case 'create_task': {
                            const subject = this.parseTemplate(((_m = action.config) === null || _m === void 0 ? void 0 : _m.subject) || 'Workflow Task', data);
                            const description = this.parseTemplate(((_o = action.config) === null || _o === void 0 ? void 0 : _o.description) || '', data);
                            console.log(`[WorkflowEngine] Action: Creating Task '${subject}'`);
                            yield TaskService_1.TaskService.createTask({
                                subject,
                                description,
                                status: ((_p = action.config) === null || _p === void 0 ? void 0 : _p.status) || 'pending',
                                priority: ((_q = action.config) === null || _q === void 0 ? void 0 : _q.priority) || 'medium',
                                organisationId,
                                assignedToId: ((_r = action.config) === null || _r === void 0 ? void 0 : _r.assignedToId) || workflow.createdById || data.assignedToId,
                                leadId: workflow.triggerEntity === 'Lead' ? effectiveEntityId : undefined,
                                contactId: workflow.triggerEntity === 'Contact' ? effectiveEntityId : undefined,
                                accountId: workflow.triggerEntity === 'Account' ? effectiveEntityId : undefined,
                                opportunityId: workflow.triggerEntity === 'Opportunity' ? effectiveEntityId : undefined,
                            });
                            break;
                        }
                        case 'notify_user': {
                            const userId = ((_s = action.config) === null || _s === void 0 ? void 0 : _s.userId) || workflow.createdById || data.assignedToId;
                            if (!userId)
                                break;
                            const title = this.parseTemplate(((_t = action.config) === null || _t === void 0 ? void 0 : _t.title) || 'System Notification', data);
                            const message = this.parseTemplate(((_u = action.config) === null || _u === void 0 ? void 0 : _u.message) || 'A workflow has been triggered.', data);
                            console.log(`[WorkflowEngine] Action: Notifying User ${userId}`);
                            yield NotificationService_1.NotificationService.send(userId, title, message, ((_v = action.config) === null || _v === void 0 ? void 0 : _v.notificationType) || 'info');
                            break;
                        }
                        default:
                            console.log(`[WorkflowEngine] Unknown action type: ${action.type}`);
                    }
                }
                catch (err) {
                    console.error(`[WorkflowEngine] Action failed: ${action.type}`, err);
                }
            }
            // Update stats
            yield prisma_1.default.workflow.update({
                where: { id: workflow.id },
                data: {
                    executionCount: { increment: 1 },
                    lastExecutedAt: new Date()
                }
            });
        });
    }
};
