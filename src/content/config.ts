import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		techStack: z.array(z.string()),
		year: z.number(),
		link: z.string().url().optional(),
		image: z.string().optional(),
		featured: z.boolean().optional().default(false),
	}),
});

export const collections = {
	'projects': projectsCollection,
};
