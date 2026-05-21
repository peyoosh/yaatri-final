const { z } = require('zod');

const destinationSchema = z.object({
  name: z.string().min(1, 'Destination name is required'),
  region: z.string().min(1, 'Region is required'),
  description: z.string().min(1, 'Description is required'),
  imageURL: z.string().url('Image URL must be a valid URL'),
  terrainType: z.enum(['Himalayan', 'Hill', 'Terai']).default('Hill'),
  popularityScore: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  altitude: z.number().optional(),
  environmentalTips: z.object({
    isViewPoint: z.boolean().optional(),
    isNaturalWaterBody: z.boolean().optional()
  }).optional(),
  experienceProtocols: z.object({
    adventure: z.string().optional(),
    tradition: z.string().optional(),
    landscape: z.string().optional(),
    tours: z.string().optional()
  }).optional(),
  assignedHotels: z.array(z.string()).optional(),
  assignedGuides: z.array(z.string()).optional()
});

const userRoleUpdateSchema = z.object({
  role: z.enum(['explorer', 'hotel_owner', 'guide', 'admin'], {
    errorMap: () => ({ message: "Invalid role" })
  }),
  pricePerNight: z.number().positive().optional(),
  dailyFee: z.number().positive().optional()
});

const countWords = (text) => (text.trim().match(/\S+/g) || []).length;

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string()
    .refine((val) => countWords(val) <= 250, { message: 'Caption cannot exceed 250 words' }),
  locationNode: z.string().max(100).optional(),
  images: z.preprocess((value) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  }, z.array(z.string()).optional())
});

module.exports = {
  destinationSchema,
  userRoleUpdateSchema,
  blogSchema
};