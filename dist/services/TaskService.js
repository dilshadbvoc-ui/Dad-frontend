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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class TaskService {
    static createTask(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { organisationId, createdById, assignedToId, leadId, contactId, accountId, opportunityId } = data, rest = __rest(data, ["organisationId", "createdById", "assignedToId", "leadId", "contactId", "accountId", "opportunityId"]);
            const createData = Object.assign(Object.assign({}, rest), { organisation: { connect: { id: organisationId } } });
            if (createdById)
                createData.createdBy = { connect: { id: createdById } };
            if (assignedToId)
                createData.assignedTo = { connect: { id: assignedToId } };
            if (leadId)
                createData.lead = { connect: { id: leadId } };
            if (contactId)
                createData.contact = { connect: { id: contactId } };
            if (accountId)
                createData.account = { connect: { id: accountId } };
            if (opportunityId)
                createData.opportunity = { connect: { id: opportunityId } };
            return yield prisma_1.default.task.create({
                data: createData
            });
        });
    }
}
exports.TaskService = TaskService;
