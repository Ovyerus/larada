import type {
  Client,
  GuildTextableChannel,
  Message,
} from "@projectdysnomia/dysnomia";
import { z } from "zod";
import { Command } from "./command";
import { Context } from "./context";
import { parse, Promisable, PromiseInner } from "./util";

const isGuildMsg = (msg: Message): msg is Message<GuildTextableChannel> =>
  !!msg.guildID;

export type Commands = Map<string, Command<z.AnyZodTuple, z.AnyZodObject>>;
export type ErrorHandler = (msg: Message, error: unknown) => Promisable<void>;
export type GetCleanContent = (
  msg: Message
) => Promisable<string | false | void>;

export interface ErrorHandlers {
  argError: ErrorHandler;
  commandError: ErrorHandler;
}

const execute = async (
  commands: Commands,
  getCleanContent: GetCleanContent,
  errorHandlers: ErrorHandlers | undefined,
  msg: Message,
  client: Client
) => {
  if (msg.author.bot || !isGuildMsg(msg)) return;

  const cleanContent = await getCleanContent(msg);
  if (!cleanContent) return;

  const [name, ...rawArgs] = cleanContent.split(" ");
  const cmd = commands.get(name);

  if (!cmd) return;
  let parsed: PromiseInner<ReturnType<typeof parse>>;

  try {
    parsed = await parse(rawArgs.join(" "), cmd.args, cmd.flags);
  } catch (err) {
    await (errorHandlers?.argError ?? defaultErrorHandler)(msg, err);
    return;
  }

  const ctx = new Context(msg, rawArgs, parsed!.args, parsed!.flags, client);
  if (!((await cmd.preCheck?.(ctx)) ?? true)) return;

  try {
    await cmd.run(ctx);
  } catch (err) {
    await (errorHandlers?.commandError ?? defaultErrorHandler)(msg, err);
    return;
  }
};

const defaultErrorHandler: ErrorHandler = async (msg, err) => {
  if (err instanceof z.ZodError) {
    const flat = err.flatten();
    // lazy
    await msg.channel.createMessage(JSON.stringify(flat));
    return;
  }

  console.error(err);
  await msg.channel.createMessage("an error occured!");
};

export const createExecutor = (
  client: Client,
  getCleanContent: GetCleanContent,
  errorHandlers?: ErrorHandlers
) => {
  const commands: Commands = new Map();
  const _execute = (msg: Message) =>
    execute(commands, getCleanContent, errorHandlers, msg, client);

  return { commands, execute: _execute };
};
