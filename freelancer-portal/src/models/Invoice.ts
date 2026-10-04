import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoice extends Document {
  freelancer: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;

  invoiceNumber: string;
  amount: number;

  issueDate: Date;
  dueDate: Date;

  status:
    | "Draft"
    | "Pending"
    | "Paid"
    | "Overdue";

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    // Freelancer who created the invoice
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

    // Project this invoice belongs to
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Paid",
        "Overdue",
      ],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({
  freelancer: 1,
  client: 1,
});

// Invoice numbers are unique PER FREELANCER, so two different
// freelancers can both have an "INV-001".
InvoiceSchema.index(
  {
    freelancer: 1,
    invoiceNumber: 1,
  },
  {
    unique: true,
  }
);

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;