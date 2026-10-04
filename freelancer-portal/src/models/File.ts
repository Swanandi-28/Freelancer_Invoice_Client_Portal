import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFile extends Document {
  freelancer: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;

  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;

  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
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
      required: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    fileType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

FileSchema.index({
  freelancer: 1,
  client: 1,
  project: 1,
});

const File: Model<IFile> =
  mongoose.models.File ||
  mongoose.model<IFile>("File", FileSchema);

export default File;