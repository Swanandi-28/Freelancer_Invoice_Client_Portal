import { NextResponse } from "next/server";
import Client from "@/models/Client";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import connectDB from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  try {
    await connectDB();
    const linkedClients = user.role === "client"
      ? await Client.find({ email: user.email }).select("_id")
      : [];
    const ownership = user.role === "freelancer"
      ? { freelancer: user.id }
      : { client: { $in: linkedClients.map((client) => client._id) } };
    const [clients, projects, invoices, payments] = await Promise.all([
      user.role === "freelancer" ? Client.find(ownership).sort({ createdAt: -1 }) : Promise.resolve([]),
      Project.find(ownership).populate("client", "name company email").populate("freelancer", "name email").sort({ createdAt: -1 }),
      Invoice.find(ownership).populate("client", "name company email").populate("project", "name").populate("freelancer", "name email").sort({ createdAt: -1 }),
      Payment.find(ownership).populate("client", "name company email").populate("project", "name").populate("invoice", "invoiceNumber").populate("freelancer", "name email").sort({ createdAt: -1 }),
    ]);
    return NextResponse.json({ success: true, user, clients, projects, invoices, payments });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return NextResponse.json({ message: "Failed to fetch dashboard data." }, { status: 500 });
  }
}