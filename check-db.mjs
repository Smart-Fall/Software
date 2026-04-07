import { ConvexClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const users = await client.query(api.users.list, { skip: 0, take: 100 });
console.log("Users in database:", JSON.stringify(users, null, 2));
