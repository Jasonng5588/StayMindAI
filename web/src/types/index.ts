// ============================================================
// StayMind AI – TypeScript Type Definitions
// ============================================================

// Enums matching database
export type UserRole = 'super_admin' | 'hotel_owner' | 'staff' | 'guest'
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentMethod = 'stripe' | 'cash' | 'bank_transfer'
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order'
export type HousekeepingStatus = 'pending' | 'in_progress' | 'completed' | 'verified'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MaintenanceStatus = 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'
export type NotificationType = 'booking' | 'payment' | 'checkin' | 'checkout' | 'housekeeping' | 'maintenance' | 'system' | 'marketing'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

// Base type with common fields
export interface BaseEntity {
    id: string
    created_at: string
    updated_at: string
    deleted_at?: string | null
}

// Profile
export interface Profile extends BaseEntity {
    email: string
    full_name: string | null
    phone: string | null
    avatar_url: string | null
    role: UserRole
    is_active: boolean
    metadata: Record<string, unknown>
}

// Hotel
export interface Hotel extends BaseEntity {
    owner_id: string
    name: string
    slug: string
    description: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    zip_code: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    email: string | null
    website: string | null
    star_rating: number | null
    logo_url: string | null
    cover_image_url: string | null
    images: string[]
    amenities: string[]
    policies: Record<string, unknown>
    check_in_time: string
    check_out_time: string
    timezone: string
    currency: string
    is_active: boolean
    is_suspended: boolean
    stripe_account_id: string | null
    subscription_plan: SubscriptionPlan
    settings: Record<string, unknown>
}

// Hotel Staff
export interface HotelStaff extends BaseEntity {
    hotel_id: string
    user_id: string
    position: string | null
    department: string | null
    is_active: boolean
    permissions: Record<string, unknown>
    profile?: Profile
}

// Room Type
export interface RoomType extends BaseEntity {
    hotel_id: string
    name: string
    description: string | null
    base_price: number
    max_occupancy: number
    amenities: string[]
    images: string[]
    bed_type: string | null
    room_size: number | null
    is_active: boolean
}

// Room
export interface Room extends BaseEntity {
    hotel_id: string
    name: string | null
    room_type: string
    room_number: string
    floor: number | null
    base_price: number
    status: RoomStatus
    notes: string | null
    is_active: boolean
}

// Room Inventory
export interface RoomInventory {
    id: string
    hotel_id: string
    room_type: string | null
    date: string
    total_rooms: number
    booked_rooms: number
    blocked_rooms: number
    price_override: number | null
    created_at: string
    updated_at: string
}

// Booking
export interface Booking extends BaseEntity {
    hotel_id: string
    user_id: string
    room_id: string | null
    booking_number: string
    check_in: string
    check_out: string
    guests: number
    status: BookingStatus
    total_amount: number
    special_requests: string | null
    cancellation_reason: string | null
    cancelled_at: string | null
    checked_in_at: string | null
    checked_out_at: string | null
    qr_code: string | null
    metadata: Record<string, unknown>
    user?: Profile
    room?: Room
    hotel?: Hotel
    payments?: Payment[]
}

// Booking Guest
export interface BookingGuest {
    id: string
    booking_id: string
    full_name: string
    email: string | null
    phone: string | null
    id_type: string | null
    id_number: string | null
    is_primary: boolean
    created_at: string
}

// Payment
export interface Payment {
    id: string
    booking_id: string
    amount: number
    currency: string
    status: PaymentStatus
    method: string
    stripe_payment_intent_id: string | null
    stripe_charge_id: string | null
    receipt_url: string | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

// Subscription
export interface Subscription {
    id: string
    hotel_id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    stripe_subscription_id: string | null
    stripe_customer_id: string | null
    current_period_start: string | null
    current_period_end: string | null
    trial_end: string | null
    cancel_at: string | null
    cancelled_at: string | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

// Invoice
export interface Invoice {
    id: string
    hotel_id: string
    booking_id: string | null
    subscription_id: string | null
    invoice_number: string
    amount: number
    tax_amount: number
    total_amount: number
    currency: string
    status: string
    due_date: string | null
    paid_at: string | null
    pdf_url: string | null
    line_items: Record<string, unknown>[]
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

// Service/Add-on
export interface ServiceAddon extends BaseEntity {
    hotel_id: string
    name: string
    description: string | null
    price: number
    category: string | null
    is_active: boolean
    image_url: string | null
}

// Housekeeping Task
export interface HousekeepingTask {
    id: string
    hotel_id: string
    room_id: string
    assigned_to: string | null
    status: HousekeepingStatus
    priority: MaintenancePriority
    notes: string | null
    scheduled_date: string | null
    started_at: string | null
    completed_at: string | null
    verified_by: string | null
    verified_at: string | null
    created_at: string
    updated_at: string
    room?: Room
    assignee?: Profile
}

// Maintenance Task
export interface MaintenanceTask {
    id: string
    hotel_id: string
    room_id: string | null
    reported_by: string | null
    assigned_to: string | null
    title: string
    description: string | null
    priority: MaintenancePriority
    status: MaintenanceStatus
    category: string | null
    cost: number | null
    images: string[]
    started_at: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
    room?: Room
    reporter?: Profile
    assignee?: Profile
}

// Review
export interface Review extends BaseEntity {
    hotel_id: string
    booking_id: string | null
    user_id: string
    rating: number
    title: string | null
    comment: string | null
    response: string | null
    responded_at: string | null
    sentiment_score: number | null
    sentiment_summary: string | null
    is_published: boolean
    user?: Profile
}

// Notification
export interface Notification {
    id: string
    user_id: string
    hotel_id: string | null
    type: NotificationType
    title: string
    message: string
    data: Record<string, unknown>
    is_read: boolean
    read_at: string | null
    created_at: string
}

// Chat Message
export interface ChatMessage {
    id: string
    hotel_id: string
    booking_id: string | null
    sender_id: string
    receiver_id: string | null
    message: string
    is_ai: boolean
    is_read: boolean
    read_at: string | null
    metadata: Record<string, unknown>
    created_at: string
    sender?: Profile
}

// AI Log
export interface AILog {
    id: string
    hotel_id: string | null
    user_id: string | null
    feature: string
    prompt: string | null
    response: string | null
    model: string
    tokens_used: number
    latency_ms: number | null
    status: string
    error: string | null
    metadata: Record<string, unknown>
    created_at: string
}

// Price Rule
export interface PriceRule {
    id: string
    hotel_id: string
    room_type_id: string | null
    name: string
    rule_type: string
    conditions: Record<string, unknown>
    adjustment_type: string
    adjustment_value: number
    priority: number
    is_active: boolean
    valid_from: string | null
    valid_to: string | null
    created_at: string
    updated_at: string
}

// Occupancy Forecast
export interface OccupancyForecast {
    id: string
    hotel_id: string
    forecast_date: string
    predicted_occupancy: number
    actual_occupancy: number | null
    confidence: number | null
    factors: Record<string, unknown>
    created_at: string
}

// Audit Log
export interface AuditLog {
    id: string
    hotel_id: string | null
    user_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

// Document
export interface Document extends BaseEntity {
    hotel_id: string
    uploaded_by: string | null
    name: string
    file_url: string
    file_type: string | null
    file_size: number | null
    category: string | null
    metadata: Record<string, unknown>
}

// Support Ticket
export interface SupportTicket {
    id: string
    hotel_id: string | null
    user_id: string
    assigned_to: string | null
    subject: string
    description: string
    status: TicketStatus
    priority: TicketPriority
    category: string | null
    resolution: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
}

// Promo Code
export interface PromoCode {
    id: string
    hotel_id: string
    code: string
    description: string | null
    discount_type: string
    discount_value: number
    min_booking_amount: number | null
    max_discount: number | null
    usage_limit: number | null
    used_count: number
    valid_from: string | null
    valid_to: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// Dashboard KPIs
export interface DashboardKPIs {
    totalRevenue: number
    totalBookings: number
    occupancyRate: number
    averageDailyRate: number
    revenueChange: number
    bookingsChange: number
    occupancyChange: number
    adrChange: number
}

// Chart Data
export interface ChartDataPoint {
    date: string
    value: number
    label?: string
}
