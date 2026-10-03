import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  freelancer: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;

  senderRole: "freelancer" | "client";
  senderId: mongoose.Types.ObjectId;

  message: string;
  read: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },

    senderRole: {
      type: String,
      enum: ["freelancer", "client"],
      required: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({
  freelancer: 1,
  client: 1,
  createdAt: -1,
});

const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;