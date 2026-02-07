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

const pagesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		subtitle: z.string().optional(),
		terminalCommand: z.string(),
		status: z.string().optional(),
	}),
});

const uiCollection = defineCollection({
	type: 'data',
	schema: z.object({
		category: z.string(),
		strings: z.record(z.string(), z.any()),
	}),
});

const experienceCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		company: z.string(),
		location: z.string(),
		period: z.string(),
		duration: z.string(),
		type: z.enum(['Full-time', 'Part-time', 'Freelance', 'Contract']),
		skills: z.array(z.string()),
		order: z.number(),
	}),
});

const educationCollection = defineCollection({
	type: 'data',
	schema: z.object({
		year: z.string(),
		title: z.string(),
		subtitle: z.string(),
		location: z.string(),
		type: z.literal('education'),
	}),
});

const certificationsCollection = defineCollection({
	type: 'data',
	schema: z.object({
		year: z.string(),
		title: z.string(),
		subtitle: z.string(),
		type: z.literal('certification'),
	}),
});

export const collections = {
	'projects': projectsCollection,
	'pages': pagesCollection,
	'ui': uiCollection,
	'experience': experienceCollection,
	'education': educationCollection,
	'certifications': certificationsCollection,
};
