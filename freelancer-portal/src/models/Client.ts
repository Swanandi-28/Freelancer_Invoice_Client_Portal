import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClient extends Document {
  freelancer: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;

  name: string;
  company: string;
  email: string;

  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    // Freelancer who owns this client relationship
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Client's login account
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A freelancer cannot have the same client email twice.
ClientSchema.index(
  {
    freelancer: 1,
    email: 1,
  },
  {
    unique: true,
  }
);

const Client: Model<IClient> =
  mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);

export default Client;