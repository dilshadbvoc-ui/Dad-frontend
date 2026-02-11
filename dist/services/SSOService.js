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
exports.setupPassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_saml_1 = require("passport-saml");
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("../generated/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const setupPassport = () => {
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield prisma_1.default.user.findUnique({ where: { id } });
            done(null, user);
        }
        catch (err) {
            done(err, null);
        }
    }));
    const strategy = new passport_saml_1.MultiSamlStrategy({
        passReqToCallback: true,
        getSamlOptions: (req, done) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { orgId } = req.params;
                if (!orgId)
                    return done(new Error('Organization ID missing for SSO'));
                const org = yield prisma_1.default.organisation.findUnique({
                    where: { id: orgId }
                });
                if (!org || !org.ssoConfig) {
                    return done(new Error('SSO not configured for this organization'));
                }
                const ssoConfig = org.ssoConfig;
                return done(null, {
                    path: `/api/auth/sso/callback/${orgId}`,
                    entryPoint: ssoConfig.entryPoint,
                    issuer: ssoConfig.issuer || 'mern-crm',
                    cert: ssoConfig.cert,
                    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
                });
            }
            catch (err) {
                done(err);
            }
        })
    }, // Cast options to any
    (req, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        // User finding/creation logic
        try {
            // Profile usually has nameID (email) or attributes
            const email = profile.nameID || profile.email;
            if (!email)
                return done(new Error('No email found in SAML response'));
            const { orgId } = req.params;
            // 1. Find User
            let user = yield prisma_1.default.user.findFirst({
                where: {
                    email: { equals: email, mode: 'insensitive' },
                    organisationId: orgId
                }
            });
            // 2. JIT Provisioning
            if (!user) {
                // Create basic user
                const firstName = profile.firstName || profile.givenName || email.split('@')[0];
                const lastName = profile.lastName || profile.sn || '-';
                // Generate random password
                const randomPass = Math.random().toString(36).slice(-8);
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(randomPass, salt);
                // Get Org for defaults
                const org = yield prisma_1.default.organisation.findUnique({ where: { id: orgId } });
                if (!org)
                    return done(new Error('Org not found'));
                user = yield prisma_1.default.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        password: hashedPassword,
                        role: client_1.UserRole.sales_rep, // Default role
                        organisationId: orgId,
                        userId: `${org.name.slice(0, 3).toUpperCase()}_${Date.now()}`,
                        isActive: true
                    }
                });
            }
            return done(null, user);
        }
        catch (err) {
            console.error('SAML Verify Error:', err);
            return done(err);
        }
    }));
    passport_1.default.use('saml', strategy);
};
exports.setupPassport = setupPassport;
