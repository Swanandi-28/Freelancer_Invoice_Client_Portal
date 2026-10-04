import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  freelancer: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  invoice: mongoose.Types.ObjectId;

  amount: number;
  paymentDate: Date;

  paymentMethod:
    | "Bank Transfer"
    | "UPI"
    | "Cash"
    | "Card"
    | "Other";

  status: "Pending" | "Completed";

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    // Freelancer receiving the payment
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

    // Project being paid for
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // Invoice being paid
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Bank Transfer",
        "UPI",
        "Cash",
        "Card",
        "Other",
      ],
      default: "Other",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Completed",
      ],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({
  freelancer: 1,
  client: 1,
  invoice: 1,
});

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;