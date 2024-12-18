"use server";

// TODO: update team /api endpoints to be actions
import { authenticatedAction } from "@/lib/safe-action";
import { boolean, string, z } from "zod";
import { db } from "db";
import { userHackerData, teams, invites } from "db/schema";
import { eq } from "db/drizzle";
import { revalidatePath } from "next/cache";
import { getHacker } from "db/functions";
import { returnValidationErrors } from "next-safe-action";
import { getWebSocketDb } from "db/functions";

export const leaveTeam = authenticatedAction
	.outputSchema(
		z.object({
			success: z.boolean(),
			message: z.string(),
		}),
	)
	.action(async ({ ctx: { userId } }) => {
		const user = await getHacker(userId, false);
		if (!user)
			returnValidationErrors(z.null(), { _errors: ["User not found"] });

		if (!user.hackerData.teamID) {
			revalidatePath("/dash/team");
			return {
				success: false,
				message: "User is not on a team",
			};
		}
		let result: { success: boolean; message: string };

		try {
			const webSocketDb = getWebSocketDb();
			result = await webSocketDb.transaction(async (tx) => {
				await tx
					.update(userHackerData)
					.set({ teamID: null })
					.where(eq(userHackerData.clerkID, user.clerkID));
				const team = await tx.query.teams.findFirst({
					where: eq(teams.id, user.hackerData.teamID as string), // Converted to string since TS does not realise for some reason that we checked above.
					with: {
						members: {
							with: {
								commonData: true,
							},
						},
					},
				});

				if (!team) {
					revalidatePath("/dash/team");
					return {
						success: false,
						message: "Team not found.",
					};
				}

				if (team.members.length < 1) {
					await tx.delete(teams).where(eq(teams.id, team.id));
					await tx.delete(invites).where(eq(invites.teamID, team.id));
					revalidatePath("/dash/team");
					return {
						success: true,
						message:
							"Team has been left. Team has been deleted since it has no members.",
					};
				}

				if (team.ownerID == userId) {
					await tx
						.update(teams)
						.set({ ownerID: team.members[0].clerkID })
						.where(eq(teams.id, team.id));
					revalidatePath("/dash/team");
					return {
						success: true,
						message: `Team has been left. Ownership has been transferred to ${team.members[0].commonData.firstName} ${team.members[0].commonData.lastName}.`,
					};
				}
				revalidatePath("/dash/team");
				return {
					success: true,
					message: "Team has been left.",
				};
			});
		} catch (e) {
			console.error(e);
			return {
				success: false,
				message: "An error occurred with websocket",
			};
		}

		return result;
	});
