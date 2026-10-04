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
    // Freelancer responsible for the project
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Specific freelancer-client relationship
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
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
      enum: [
        "In Progress",
        "Completed",
        "Pending",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({
  freelancer: 1,
  client: 1,
});

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);

export default Project;