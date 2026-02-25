import { z } from 'zod'

// ─── Auth Schemas ───
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    role: z.enum(['hotel_owner', 'guest']).default('guest'),
    hotelName: z.string().min(2).max(200).optional(),
})

// ─── Booking Schemas ───
export const bookingSchema = z.object({
    hotel_id: z.string().uuid(),
    room_id: z.string().uuid(),
    room_type_id: z.string().optional(), // maps to room_type string in DB
    check_in: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    check_out: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    guests: z.number().int().min(1).max(20).default(1),
    total_amount: z.number().positive(),
    special_requests: z.string().max(1000).optional(),
    promo_code: z.string().max(50).optional(),
}).refine(data => new Date(data.check_out) > new Date(data.check_in), {
    message: 'Check-out must be after check-in',
})

export const availabilitySchema = z.object({
    hotel_id: z.string().uuid(),
    check_in: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    check_out: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    room_type_id: z.string().optional(), // maps to room_type string in DB
})

// ─── Room Schemas ───
export const roomSchema = z.object({
    hotel_id: z.string().uuid(),
    room_type: z.string().min(1).max(50),
    room_number: z.string().min(1).max(20),
    floor: z.number().int().min(0).max(100).optional(),
    status: z.enum(['available', 'occupied', 'maintenance', 'cleaning']).default('available'),
})

export const roomTypeSchema = z.object({
    hotel_id: z.string().uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    base_price: z.number().positive(),
    max_occupancy: z.number().int().min(1).max(20),
    amenities: z.array(z.string()).optional(),
})

// ─── Hotel Schema ───
export const hotelSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    star_rating: z.number().int().min(1).max(5).optional(),
    check_in_time: z.string().max(10).default('15:00'),
    check_out_time: z.string().max(10).default('11:00'),
})

// ─── Review Schema ───
export const reviewSchema = z.object({
    hotel_id: z.string().uuid(),
    booking_id: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Review must be at least 10 characters').max(2000),
})

// ─── Promo Code Schema ───
export const promoCodeSchema = z.object({
    hotel_id: z.string().uuid(),
    code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().positive(),
    valid_from: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    valid_to: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
    max_uses: z.number().int().positive().optional(),
})

// ─── Sanitization Helper ───
export function sanitizeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
}

// ─── Validate Helper ───
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data)
    if (result.success) return { success: true, data: result.data }
    return {
        success: false,
        errors: result.error.issues.map((e) => `${e.path.map(String).join('.')}: ${e.message}`),
    }
}

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type RoomInput = z.infer<typeof roomSchema>
export type HotelInput = z.infer<typeof hotelSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
