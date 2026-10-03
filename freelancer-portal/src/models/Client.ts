import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClient extends Document {
  freelancer: mongoose.Types.ObjectId;

  // Links this client record to the client's login account
  user?: mongoose.Types.ObjectId;

  name: string;
  company: string;
  email: string;

  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
    },
  },
  {
    timestamps: true,
  }
);

const Client: Model<IClient> =
  mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);

export default Client;