import type {
  Client,
  GuildTextableChannel,
  Message,
} from "@projectdysnomia/dysnomia";

export class Context<A = any[], F = Record<string, unknown>> {
  constructor(
    readonly msg: Message<GuildTextableChannel>,
    readonly rawArgs: string[],
    readonly args: A,
    readonly flags: F,
    readonly client: Client
  ) {}

  get channel() {
    return this.msg.channel;
  }

  get guild() {
    return this.channel.guild;
  }

  get send() {
    return this.channel.createMessage.bind(this.channel);
  }
}
