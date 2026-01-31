import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';
import { ResponseHandler } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Enhanced Global Search Controller
 * Provides unified search across all CRM entities
 */

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'account' | 'opportunity' | 'task';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  value?: number;
  assignedTo?: string;
  createdAt: Date;
  url: string;
}

// GET /api/search/global
export const globalSearch = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.id;
  const organisationId = getOrgId(user);
  const query = req.query.q as string;
  const limit = Math.min(50, Number(req.query.limit) || 20);

  try {
    logger.apiRequest('GET', '/api/search/global', userId, organisationId || undefined, { query, limit });

    if (!organisationId) {
      return ResponseHandler.forbidden(res, 'User not associated with an organisation');
    }

    if (!query || query.trim().length < 2) {
      return ResponseHandler.validationError(res, 'Search query must be at least 2 characters');
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Search Leads
    const leads = await prisma.lead.findMany({
      where: {
        organisationId,
        isDeleted: false,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } }
      },
      take: Math.ceil(limit * 0.4) // 40% of results for leads
    });

    leads.forEach(lead => {
      results.push({
        id: lead.id,
        type: 'lead',
        title: `${lead.firstName} ${lead.lastName}`,
        subtitle: lead.company || lead.email || 'No company',
        description: `${lead.status} • Score: ${lead.leadScore}`,
        status: lead.status,
        assignedTo: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : undefined,
        createdAt: lead.createdAt,
        url: `/leads/${lead.id}`
      });
    });

    // Search Contacts
    const contacts = await prisma.contact.findMany({
      where: {
        organisationId,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { jobTitle: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        account: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } }
      },
      take: Math.ceil(limit * 0.25) // 25% of results for contacts
    });

    contacts.forEach(contact => {
      results.push({
        id: contact.id,
        type: 'contact',
        title: `${contact.firstName} ${contact.lastName}`,
        subtitle: contact.account?.name || contact.jobTitle || 'No account',
        description: contact.email || 'No email',
        assignedTo: contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : undefined,
        createdAt: contact.createdAt,
        url: `/contacts/${contact.id}`
      });
    });

    // Search Accounts
    const accounts = await prisma.account.findMany({
      where: {
        organisationId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } },
          { website: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { contacts: true, opportunities: true } }
      },
      take: Math.ceil(limit * 0.2) // 20% of results for accounts
    });

    accounts.forEach(account => {
      results.push({
        id: account.id,
        type: 'account',
        title: account.name,
        subtitle: account.industry || account.type || 'No industry',
        description: `${account._count.contacts} contacts • ${account._count.opportunities} opportunities`,
        value: account.annualRevenue || undefined,
        assignedTo: account.owner ? `${account.owner.firstName} ${account.owner.lastName}` : undefined,
        createdAt: account.createdAt,
        url: `/accounts/${account.id}`
      });
    });

    // Search Opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: {
        organisationId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { leadSource: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        account: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } }
      },
      take: Math.ceil(limit * 0.1) // 10% of results for opportunities
    });

    opportunities.forEach(opportunity => {
      results.push({
        id: opportunity.id,
        type: 'opportunity',
        title: opportunity.name,
        subtitle: opportunity.account.name,
        description: `${opportunity.stage} • ${opportunity.probability}% probability`,
        status: opportunity.stage,
        value: opportunity.amount,
        assignedTo: opportunity.owner ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}` : undefined,
        createdAt: opportunity.createdAt,
        url: `/opportunities/${opportunity.id}`
      });
    });

    // Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        organisationId,
        isDeleted: false,
        OR: [
          { subject: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        lead: { select: { firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true } },
        account: { select: { name: true } }
      },
      take: Math.ceil(limit * 0.05) // 5% of results for tasks
    });

    tasks.forEach(task => {
      let subtitle = 'Task';
      if (task.lead) subtitle = `Lead: ${task.lead.firstName} ${task.lead.lastName}`;
      else if (task.contact) subtitle = `Contact: ${task.contact.firstName} ${task.contact.lastName}`;
      else if (task.account) subtitle = `Account: ${task.account.name}`;

      results.push({
        id: task.id,
        type: 'task',
        title: task.subject,
        subtitle,
        description: `${task.status} • Priority: ${task.priority}`,
        status: task.status,
        assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : undefined,
        createdAt: task.createdAt,
        url: `/tasks/${task.id}`
      });
    });

    // Sort results by relevance (exact matches first, then by creation date)
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const bExactMatch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Limit final results
    const finalResults = results.slice(0, limit);

    logger.info(`Global search completed: ${finalResults.length} results`, 'SEARCH', userId, organisationId || undefined, { query: searchTerm });

    return ResponseHandler.success(res, {
      results: finalResults,
      total: finalResults.length,
      query: searchTerm,
      searchTime: Date.now()
    }, 'Search completed successfully');

  } catch (error: any) {
    logger.apiError('GET', '/api/search/global', error, userId, organisationId || undefined);
    return ResponseHandler.serverError(res, 'An error occurred while searching');
  }
};

// GET /api/search/suggestions
export const searchSuggestions = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.id;
  const organisationId = getOrgId(user);
  const query = req.query.q as string;

  try {
    if (!organisationId) {
      return ResponseHandler.forbidden(res, 'User not associated with an organisation');
    }

    if (!query || query.trim().length < 1) {
      return ResponseHandler.success(res, { suggestions: [] }, 'No suggestions');
    }

    const searchTerm = query.trim();
    const suggestions: string[] = [];

    // Get suggestions from different entities
    const [leadSuggestions, contactSuggestions, accountSuggestions] = await Promise.all([
      // Lead name suggestions
      prisma.lead.findMany({
        where: {
          organisationId,
          isDeleted: false,
          OR: [
            { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
            { lastName: { startsWith: searchTerm, mode: 'insensitive' } },
            { company: { startsWith: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { firstName: true, lastName: true, company: true },
        take: 5
      }),

      // Contact name suggestions
      prisma.contact.findMany({
        where: {
          organisationId,
          OR: [
            { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
            { lastName: { startsWith: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { firstName: true, lastName: true },
        take: 3
      }),

      // Account name suggestions
      prisma.account.findMany({
        where: {
          organisationId,
          name: { startsWith: searchTerm, mode: 'insensitive' }
        },
        select: { name: true },
        take: 3
      })
    ]);

    // Add lead suggestions
    leadSuggestions.forEach(lead => {
      const fullName = `${lead.firstName} ${lead.lastName}`;
      if (!suggestions.includes(fullName)) {
        suggestions.push(fullName);
      }
      if (lead.company && !suggestions.includes(lead.company)) {
        suggestions.push(lead.company);
      }
    });

    // Add contact suggestions
    contactSuggestions.forEach(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`;
      if (!suggestions.includes(fullName)) {
        suggestions.push(fullName);
      }
    });

    // Add account suggestions
    accountSuggestions.forEach(account => {
      if (!suggestions.includes(account.name)) {
        suggestions.push(account.name);
      }
    });

    return ResponseHandler.success(res, {
      suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
      query: searchTerm
    }, 'Suggestions retrieved successfully');

  } catch (error: any) {
    logger.apiError('GET', '/api/search/suggestions', error, userId, organisationId || undefined);
    return ResponseHandler.serverError(res, 'An error occurred while getting suggestions');
  }
};

// GET /api/search/recent
export const recentSearches = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.id;

  try {
    // This would typically come from a user search history table
    // For now, return empty array as we haven't implemented search history tracking
    return ResponseHandler.success(res, {
      recent: [],
      message: 'Search history tracking not yet implemented'
    }, 'Recent searches retrieved');

  } catch (error: any) {
    logger.apiError('GET', '/api/search/recent', error, userId);
    return ResponseHandler.serverError(res, 'An error occurred while getting recent searches');
  }
};