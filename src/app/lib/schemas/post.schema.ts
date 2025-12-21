import { z } from 'zod';

export const PostTypeEnum = z.enum(['notice', 'free', 'event']);
export const EventTypeEnum = z.enum(['PRACTICE', 'GAME']);

// ==========================================
// Base Schemas
// ==========================================

const BasePostSchema = z.object({
    title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내여야 합니다'),
    content: z.string().min(1, '내용을 입력해주세요').max(5000, '내용은 5000자 이내여야 합니다'),
});

// ==========================================
// Create Schemas (Creation Time Rules)
// ==========================================

// 1. Free Post
export const CreateFreePostSchema = BasePostSchema.extend({
    type: z.literal('free'),
});

// 2. Notice Post (Admin only, but validated here)
export const CreateNoticePostSchema = BasePostSchema.extend({
    type: z.literal('notice'),
    pinned: z.boolean().optional(),
});

// 3. Event Post
export const CreateEventPostSchema = BasePostSchema.extend({
    type: z.literal('event'),
    eventType: EventTypeEnum,
    // Event-specific fields are strings in the form (date, time) before conversion usually,
    // but here we expect the form values. 
    // Let's assume we handle primitive inputs. 
    // Wait, RHF will adhere to this schema.
    // The Modal uses `startDate` (string) and `startTime` (string).
    startDate: z.string().min(1, '날짜를 선택해주세요'),
    startTime: z.string().min(1, '시간을 선택해주세요'),
    place: z.string().min(1, '장소를 입력해주세요'),
    opponent: z.string().optional(), // Only for GAME
}).refine((_data) => {
    // Additional logical checks if needed.
    // Currently individual field checks cover most requirements.
    return true;
}, {
    message: "이벤트 정보를 확인해주세요",
    path: ["root"],
});

// Discriminated Union for Create
export const CreatePostSchema = z.discriminatedUnion('type', [
    CreateFreePostSchema,
    CreateNoticePostSchema,
    CreateEventPostSchema,
]);

export type CreatePostInput = z.infer<typeof CreatePostSchema>;


// ==========================================
// Update Schemas (Partial Updates)
// ==========================================

// Update allows partial fields, but if a field is provided, it must strict valid.
export const UpdatePostSchema = BasePostSchema.partial().extend({
    // Additional updateable fields if any
    pinned: z.boolean().optional(),

    // Event fields (optional for update)
    eventType: EventTypeEnum.optional(),
    startAt: z.date().optional(), // Update might pass Date object directly or string? 
    // Usually UpdateModal might load existing Date object.
    // Let's keep it flexible or align with EditPostModal needs.
    // Edit logic usually sends existing data. 
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    place: z.string().optional(),
    opponent: z.string().optional(),
});

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
