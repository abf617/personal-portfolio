/// <reference types="astro/client" />

/**
 * Fetches a content entry and throws an error if not found
 * Eliminates repetitive error checking across pages
 *
 * @param collection - The content collection name
 * @param id - The entry ID
 * @returns The content entry
 * @throws Error if entry not found
 */
export async function getRequiredEntry(
	collection: string,
	id: string
): Promise<any> {
	// Dynamic import to avoid TypeScript issues with virtual modules
	const { getEntry: astroGetEntry } = await import('astro:content');
	const entry = await astroGetEntry(collection as any, id);
	if (!entry) {
		throw new Error(`Content not found: ${collection}/${id}`);
	}
	return entry;
}
