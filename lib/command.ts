import { z } from "zod";
import type { Context } from "./context";
import { Promisable } from "./util";

export interface Command<A extends z.AnyZodTuple, F extends z.AnyZodObject> {
  name: string;
  args?: A;
  flags?: F;
  // other options here
  preCheck?(ctx: Context<z.infer<A>, z.infer<F>>): Promisable<boolean>;
  run(ctx: Context<z.infer<A>, z.infer<F>>): Promise<any>;
}

export const defineCommand = <
  A extends z.AnyZodTuple,
  F extends z.AnyZodObject
>(
  opts: Command<A, F>
) => opts;
