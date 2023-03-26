import getopts from "getopts";
import { parse as shellParse } from "shell-quote";
import { z } from "zod";

export type Promisable<T> = Promise<T> | T;
export type PromiseInner<T> = T extends Promise<infer P> ? P : never;

export const split = (input: string) =>
  shellParse(input).flatMap((v) => {
    if (typeof v === "string") return v;
    else if ("comment" in v) return ["#", v.comment];
    else if (v.op === "glob") return v.pattern;
    else return v.op;
  });

export const parse = async <A extends z.AnyZodTuple, F extends z.AnyZodObject>(
  input: string,
  argsValidator?: A,
  flagsValidator?: F
) => {
  // TODO: could possibly manipulate getopts' options by introspecting the args schema.
  const { _: args, ...flags } = getopts(split(input), { stopEarly: true });
  const result = { args: args as any[], flags };

  if (result.args.length < (argsValidator?._def.items.length ?? 0)) {
    const diff = argsValidator!._def.items.length - result.args.length;
    const filler = new Array(diff).fill(undefined);
    result.args = result.args.concat(filler);
  }

  if (argsValidator) result.args = await argsValidator.parseAsync(args);
  if (flagsValidator) result.flags = await flagsValidator.parseAsync(flags);

  return result;
};
