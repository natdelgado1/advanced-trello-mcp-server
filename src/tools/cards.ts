import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TrelloCredentials } from '../types/common.js';

/**
 * Trello stores dates in UTC. Midnight UTC (00:00) displays as previous day in
 * negative-offset timezones (e.g. Paraguay UTC-4). For date-only (YYYY-MM-DD),
 * use noon UTC so the date displays correctly in most timezones.
 * @see https://community.developer.atlassian.com/t/what-timezone-are-dates-in-api-data/42649
 */
function normalizeDueDate(value: string): string {
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return `${value}T12:00:00.000Z`;
	}
	return value;
}

/**
 * Register all Cards API tools
 * Based on https://developer.atlassian.com/cloud/trello/rest/api-group-cards/
 */
export function registerCardsTools(server: McpServer, credentials: TrelloCredentials) {
	// POST /cards - Create a new card
	server.tool(
		'create-card',
		{
			name: z.string().describe('Name of the card'),
			description: z.string().optional().describe('Description of the card'),
			listId: z.string().describe('ID of the list to create the card in'),
			due: z
				.string()
				.optional()
				.describe(
					'Due date in ISO 8601 format (e.g. 2025-03-12 or 2025-03-12T18:30:00.000Z). Per Trello API docs. Optional.'
				),
			start: z
				.string()
				.optional()
				.describe('Start date in ISO 8601 format. Optional.'),
		},
		async ({ name, description, listId, due, start }) => {
			try {
				const body: Record<string, unknown> = {
					name,
					desc: description || '',
					idList: listId,
					pos: 'bottom',
				};
				if (due) body.due = normalizeDueDate(due);
				if (start) body.start = normalizeDueDate(start);

				const response = await fetch(
					`https://api.trello.com/1/cards?key=${credentials.apiKey}&token=${credentials.apiToken}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(body),
					}
				);
				const data = await response.json();
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error creating card: ${error}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// POST /cards - Create multiple cards
	server.tool(
		'create-cards',
		{
			cards: z.array(
				z.object({
					name: z.string().describe('Name of the card'),
					description: z.string().optional().describe('Description of the card'),
					listId: z.string().describe('ID of the list to create the card in'),
					due: z.string().optional().describe('Due date in ISO 8601. Optional.'),
					start: z.string().optional().describe('Start date in ISO 8601. Optional.'),
				})
			),
		},
		async ({ cards }) => {
			try {
				const results = await Promise.all(
					cards.map(async (card) => {
						const body: Record<string, unknown> = {
							name: card.name,
							desc: card.description || '',
							idList: card.listId,
							pos: 'bottom',
						};
						if (card.due) body.due = normalizeDueDate(card.due);
						if (card.start) body.start = normalizeDueDate(card.start);

						const response = await fetch(
							`https://api.trello.com/1/cards?key=${credentials.apiKey}&token=${credentials.apiToken}`,
							{
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(body),
							}
						);
						return await response.json();
					})
				);
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(results),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error creating cards: ${error}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// PUT /cards/{id} - Update a card (description, name, due, start, dueComplete, or any combination)
	server.tool(
		'update-card',
		{
			cardId: z.string().describe('ID of the card to update'),
			description: z.string().optional().describe('New description for the card (replaces existing). Use empty string to clear.'),
			name: z.string().optional().describe('New name/title for the card'),
			due: z
				.union([z.string(), z.null()])
				.optional()
				.describe('Due date in ISO 8601, or null to clear. Per Trello API docs. Optional.'),
			start: z
				.union([z.string(), z.null()])
				.optional()
				.describe('Start date in ISO 8601, or null to clear. Optional.'),
			dueComplete: z
				.boolean()
				.optional()
				.describe('Mark the due date as complete (true) or incomplete (false). For "sello de cierre" when moving to DONE.'),
		},
		async ({ cardId, description, name, due, start, dueComplete }) => {
			try {
				if (!credentials.apiKey || !credentials.apiToken) {
					return {
						content: [
							{
								type: 'text',
								text: 'Trello API credentials are not configured',
							},
						],
						isError: true,
					};
				}

				const body: { desc?: string; name?: string; due?: string | null; start?: string | null; dueComplete?: boolean } = {};
				if (description !== undefined) body.desc = description;
				if (name !== undefined) body.name = name;
				if (due !== undefined) body.due = due === null ? null : normalizeDueDate(due);
				if (start !== undefined) body.start = start === null ? null : normalizeDueDate(start);
				if (dueComplete !== undefined) body.dueComplete = dueComplete;

				if (Object.keys(body).length === 0) {
					return {
						content: [
							{
								type: 'text',
								text: 'At least one of description, name, due, start, or dueComplete must be provided',
							},
						],
						isError: true,
					};
				}

				const response = await fetch(
					`https://api.trello.com/1/cards/${cardId}?key=${credentials.apiKey}&token=${credentials.apiToken}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(body),
					}
				);
				const data = await response.json();
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error updating card: ${error}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// PUT /cards/{id} - Mark card as complete (convenience wrapper for dueComplete: true)
	server.tool(
		'mark-card-complete',
		{
			cardId: z.string().describe('ID of the card to mark as complete'),
		},
		async ({ cardId }) => {
			try {
				if (!credentials.apiKey || !credentials.apiToken) {
					return {
						content: [
							{
								type: 'text',
								text: 'Trello API credentials are not configured',
							},
						],
						isError: true,
					};
				}

				const response = await fetch(
					`https://api.trello.com/1/cards/${cardId}?key=${credentials.apiKey}&token=${credentials.apiToken}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ dueComplete: true }),
					}
				);
				const data = await response.json();
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error marking card complete: ${error}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// PUT /cards/{id}/idList - Move card to another list
	server.tool(
		'move-card',
		{
			cardId: z.string().describe('ID of the card to move'),
			listId: z.string().describe('ID of the destination list'),
			position: z.string().optional().describe('Position in the list (e.g. "top", "bottom")'),
		},
		async ({ cardId, listId, position = 'bottom' }) => {
			try {
				if (!credentials.apiKey || !credentials.apiToken) {
					return {
						content: [
							{
								type: 'text',
								text: 'Trello API credentials are not configured',
							},
						],
						isError: true,
				};
			}

				const response = await fetch(
					`https://api.trello.com/1/cards/${cardId}?key=${credentials.apiKey}&token=${credentials.apiToken}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							idList: listId,
							pos: position,
						}),
					}
				);
				const data = await response.json();
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error moving card: ${error}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// ... rest of file truncated for length - the content is the same as what we have in the repo
