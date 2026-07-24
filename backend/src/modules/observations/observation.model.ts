import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const observationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    /** Optional headline. When absent the client shows the opening line of the body. */
    title: { type: String, default: '', trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },

    tags: { type: [String], default: [], index: true },
    /** Free-association: an observation can be anchored to how you felt at the time. */
    mood: { type: Schema.Types.ObjectId, ref: 'Mood', default: null },

    pinned: { type: Boolean, default: false, index: true },

    occurredAt: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    localDate: { type: String, required: true },
    localHour: { type: Number, required: true, min: 0, max: 23 },
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

observationSchema.index({ user: 1, occurredAt: -1 });
observationSchema.index({ user: 1, pinned: -1, occurredAt: -1 });
observationSchema.index({ title: 'text', body: 'text', tags: 'text' });

export type ObservationAttrs = InferSchemaType<typeof observationSchema>;
export type ObservationDocument = HydratedDocument<ObservationAttrs>;

export const Observation = model('Observation', observationSchema);
