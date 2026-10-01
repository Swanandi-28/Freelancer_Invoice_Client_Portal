import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  freelancer: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  name: string;
  description: string;
  budget: number;
  deadline: Date;
  status: "In Progress" | "Completed" | "Pending";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    budget: {
      type: Number,
      required: true,
      min: 0,
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed", "Pending"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);

export default Project;