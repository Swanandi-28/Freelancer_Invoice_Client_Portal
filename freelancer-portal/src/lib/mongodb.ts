import dns from "dns";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

/*
  The connection is cached on globalThis so that Next.js hot reloads and
  repeated API calls reuse one connection instead of opening a new one
  for every request.
*/
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  repaired: boolean;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalWithMongoose._mongooseCache ||
  (globalWithMongoose._mongooseCache = {
    conn: null,
    promise: null,
    repaired: false,
  });

/*
  One-time, non-destructive index repair for databases created by older
  versions of the schema. Invoice numbers used to be unique across ALL
  freelancers, which stopped two freelancers from both having "INV-001".
  They are now unique per freelancer. No documents are modified.
*/
async function repairIndexes(conn: typeof mongoose) {
  try {
    const collection = conn.connection.collection("invoices");
    const indexes = await collection.indexes();
    const legacy = indexes.find(
      (index) =>
        index.unique &&
        index.key &&
        Object.keys(index.key).length === 1 &&
        "invoiceNumber" in index.key
    );
    if (legacy?.name) {
      await collection.dropIndex(legacy.name);
    }
  } catch {
    // Collection may not exist yet on an empty database - nothing to repair.
  }
}

const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .catch(async (error) => {
        /*
          Known Windows/Node issue with MongoDB Atlas "mongodb+srv://" URIs:
          Node's own DNS resolver fails the SRV lookup (querySrv ECONNREFUSED
          / ETIMEOUT) even though nslookup works. Only in that exact case,
          retry once using public DNS servers for the lookup.
        */
        const text = String((error as Error)?.message || error);
        const isSrvLookupFailure =
          MONGODB_URI.startsWith("mongodb+srv://") &&
          /querySrv|queryTxt/.test(text);

        if (!isSrvLookupFailure) throw error;

        console.warn(
          "MongoDB SRV lookup failed with the system DNS. Retrying with public DNS servers..."
        );
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        await mongoose.disconnect().catch(() => undefined);
        return mongoose.connect(MONGODB_URI, { bufferCommands: false });
      })
      .then((conn) => {
        console.log("MongoDB connected successfully");
        return conn;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    console.error("MongoDB connection failed:", error);
    throw error;
  }

  if (!cache.repaired) {
    cache.repaired = true;
    await repairIndexes(cache.conn);
  }

  return cache.conn;
};

export default connectDB;
