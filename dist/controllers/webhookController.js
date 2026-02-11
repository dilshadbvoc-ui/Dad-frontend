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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebhook = exports.updateWebhook = exports.createWebhook = exports.getWebhooks = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../utils/logger");
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getWebhooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        if (!orgId)
            return res.status(400).json({ message: 'Organisation required' });
        const webhooks = yield prisma_1.prisma.webhook.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(webhooks);
    }
    catch (error) {
        logger_1.logger.error('getWebhooks Error', error, 'WebhookController');
        res.status(500).json({ message: 'Failed to fetch webhooks' });
    }
});
exports.getWebhooks = getWebhooks;
const createWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        if (!orgId)
            return res.status(400).json({ message: 'Organisation required' });
        const { url, events, secret, isActive } = req.body;
        if (!url || !events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ message: 'URL and at least one event are required' });
        }
        const webhook = yield prisma_1.prisma.webhook.create({
            data: {
                name: new URL(url).hostname,
                url,
                events,
                secret,
                isActive: isActive !== null && isActive !== void 0 ? isActive : true,
                organisationId: orgId,
                createdById: req.user.id
            }
        });
        logger_1.logger.info(`Webhook created: ${webhook.id}`, 'WebhookController', req.user.id, orgId);
        res.status(201).json(webhook);
    }
    catch (error) {
        logger_1.logger.error('createWebhook Error', error, 'WebhookController');
        res.status(500).json({ message: 'Failed to create webhook' });
    }
});
exports.createWebhook = createWebhook;
const updateWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        const webhook = yield prisma_1.prisma.webhook.findUnique({ where: { id } });
        if (!webhook || webhook.organisationId !== orgId || webhook.isDeleted) {
            return res.status(404).json({ message: 'Webhook not found' });
        }
        const updated = yield prisma_1.prisma.webhook.update({
            where: { id },
            data: req.body
        });
        logger_1.logger.info(`Webhook updated: ${id}`, 'WebhookController', req.user.id, orgId);
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('updateWebhook Error', error, 'WebhookController');
        res.status(500).json({ message: 'Failed to update webhook' });
    }
});
exports.updateWebhook = updateWebhook;
const deleteWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        const webhook = yield prisma_1.prisma.webhook.findUnique({ where: { id } });
        if (!webhook || webhook.organisationId !== orgId) {
            return res.status(404).json({ message: 'Webhook not found' });
        }
        yield prisma_1.prisma.webhook.update({
            where: { id },
            data: { isDeleted: true, isActive: false }
        });
        logger_1.logger.info(`Webhook deleted: ${id}`, 'WebhookController', req.user.id, orgId);
        res.json({ message: 'Webhook deleted' });
    }
    catch (error) {
        logger_1.logger.error('deleteWebhook Error', error, 'WebhookController');
        res.status(500).json({ message: 'Failed to delete webhook' });
    }
});
exports.deleteWebhook = deleteWebhook;
