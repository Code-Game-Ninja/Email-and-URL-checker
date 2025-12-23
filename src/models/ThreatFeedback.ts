import mongoose, { Schema, model, models } from 'mongoose';

export interface IThreatFeedback {
  content: string; // URL or message text
  contentType: 'url' | 'message';
  userFeedback: 'safe' | 'threat';
  aiPrediction: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  fraudProbability: number;
  signals: string[];
  extractedEmails?: string[]; // Email addresses found in the content
  emailRiskLevel?: 'safe' | 'suspicious' | 'high_risk'; // Risk level of the email sender
  createdAt: Date;
  updatedAt: Date;
}

const ThreatFeedbackSchema = new Schema<IThreatFeedback>(
  {
    content: {
      type: String,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['url', 'message'],
      required: true,
    },
    userFeedback: {
      type: String,
      enum: ['safe', 'threat'],
      required: true,
    },
    aiPrediction: {
      type: String,
      enum: ['SAFE', 'CAUTION', 'DANGEROUS'],
      required: true,
    },
    fraudProbability: {
      type: Number,
      required: true,
    },
    signals: {
      type: [String],
      default: [],
    },
    extractedEmails: {
      type: [String],
      default: [],
      index: true,
    },
    emailRiskLevel: {
      type: String,
      enum: ['safe', 'suspicious', 'high_risk'],
      default: 'safe',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster lookups
ThreatFeedbackSchema.index({ content: 1, contentType: 1 });

export const ThreatFeedback = models.ThreatFeedback || model<IThreatFeedback>('ThreatFeedback', ThreatFeedbackSchema);
