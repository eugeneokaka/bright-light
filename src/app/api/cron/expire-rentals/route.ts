import { expireRentals } from "@/server/rentals";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const expired = await expireRentals();

  return Response.json({ expired });
}
