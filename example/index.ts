import { Client, Message } from "@projectdysnomia/dysnomia";
import { createExecutor, defineCommand } from "../lib";
import { z } from "zod";

if (!process.env.TOKEN) throw new Error("TOKEN not found in environment.");
if (!process.env.PREFIX) throw new Error("PREFIX not found in environment.");

const prefix = process.env.PREFIX.trim();
const bot = new Client(process.env.TOKEN, {
  gateway: { intents: ["allNonPrivileged", "messageContent"] },
});

const { commands, execute } = createExecutor(bot, (msg) => {
  if (msg.content.startsWith(prefix)) return msg.content.slice(prefix.length);
});

bot.once("ready", () => console.log("bot is online"));

bot.on("messageCreate", async (msg: Message) => {
  if (msg.author.bot) return;
  await execute(msg);
});

// Loading commands from files is an exercise left to the user.

commands.set(
  "ping",
  defineCommand({
    name: "ping",
    preCheck(ctx) {
      console.log("pre check!!!");
      return true;
    },
    async run(ctx) {
      await ctx.send("Pong!");
    },
  })
);

commands.set(
  "meow",
  defineCommand({
    name: "meow",
    args: z.tuple([z.enum(["nya", "meow"])]),
    async run(ctx) {
      await ctx.send(ctx.args[0]);
    },
  })
);

bot.connect();
