"use server";

import { authenticatedAction } from "@/lib/safe-action";
import { z } from "zod";
import { db } from "db";
import { eq, and } from "db/drizzle";
import { discordVerification } from "db/schema";
import { env } from "@/env";

export const confirmVerifyDiscord = authenticatedAction
	.schema(
		z.object({
			code: z.string().min(20).max(20),
		}),
	)
	.action(async ({ parsedInput: { code }, ctx: { userId } }) => {
		const verification = await db.query.discordVerification.findFirst({
			where: and(
				eq(discordVerification.code, code),
				eq(discordVerification.status, "pending"),
			),
		});
		if (!verification) {
			return {
				success: false,
			};
		}

		// TODO: set some kind of thing that will revert the verification if the bot api call fails

		await db
			.update(discordVerification)
			.set({ status: "accepted", clerkID: userId })
			.where(eq(discordVerification.code, code));

		const res = await fetch(
			env.BOT_API_URL +
				"/api/checkDiscordVerification?access=" +
				env.INTERNAL_AUTH_KEY,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code }),
			},
		);
		let resJson = await res.json();
		console.log(resJson);

		return {
			success: true,
		};
	});
