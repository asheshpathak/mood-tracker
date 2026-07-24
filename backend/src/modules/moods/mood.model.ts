import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { EMOTIONS, FACTORS } from './mood.constants.js';

const moodSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    /** -1 (very unpleasant) … +1 (very pleasant) */
    pleasantness: { type: Number, required: true, min: -1, max: 1 },
    /** -1 (depleted) … +1 (highly energised) */
    energy: { type: Number, required: true, min: -1, max: 1 },
    /** 1–5 bucket derived from pleasantness; kept for fast grouping and colours. */
    moodScore: { type: Number, required: true, min: 1, max: 5, index: true },

    emotions: { type: [String], default: [], enum: EMOTIONS },
    factors: { type: [String], default: [], enum: FACTORS as unknown as string[] },
    note: { type: String, default: '', maxlength: 2000, trim: true },

    recordedAt: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    localDate: { type: String, required: true },
    localHour: { type: Number, required: true, min: 0, max: 23 },
    localWeekday: { type: Number, required: true, min: 0, max: 6 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  },
);

moodSchema.index({ user: 1, recordedAt: -1 });
moodSchema.index({ user: 1, localDate: 1 });
moodSchema.index({ user: 1, emotions: 1 });
moodSchema.index({ user: 1, factors: 1 });
moodSchema.index({ note: 'text' });

export type MoodAttrs = InferSchemaType<typeof moodSchema>;
export type MoodDocument = HydratedDocument<MoodAttrs>;

export const Mood = model('Mood', moodSchema);
