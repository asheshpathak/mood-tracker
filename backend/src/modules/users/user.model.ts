import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const refreshSessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
    timezone: { type: String, default: 'UTC' },
    preferences: {
      weekStartsOn: { type: Number, enum: [0, 1], default: 1 },
      reminderTime: { type: String, default: null }, // "21:00" local, used by the client
      theme: { type: String, enum: ['light'], default: 'light' },
    },
    refreshSessions: { type: [refreshSessionSchema], default: [], select: false },
    lastActiveAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.refreshSessions;
        return ret;
      },
    },
  },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

export const User = model('User', userSchema);

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  preferences: {
    weekStartsOn: number;
    reminderTime: string | null;
    theme: string;
  };
  createdAt: string;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    timezone: user.timezone ?? 'UTC',
    preferences: {
      weekStartsOn: user.preferences?.weekStartsOn ?? 1,
      reminderTime: user.preferences?.reminderTime ?? null,
      theme: user.preferences?.theme ?? 'light',
    },
    createdAt: (user.get('createdAt') as Date | undefined)?.toISOString() ?? new Date().toISOString(),
  };
}
