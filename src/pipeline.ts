import { z } from "zod";
import { RunnableLambda, type RunnableConfig } from "@langchain/core/runnables";

// Utility types
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type PipeStep<T, U, InitialState> = (input: T, initialState: InitialState) => Promise<U>;

export type ParallelArrayOutput<T extends Array<PipeStep<any, any, any>>, Input, InitialState> = {
  [K in keyof T]: T[K] extends (input: Input, initialState: InitialState) => Promise<infer R> ? R : never;
};

export type ParallelObjectOutput<T extends Record<string, PipeStep<any, any, any>>, Input, InitialState> = {
  [K in keyof T]: T[K] extends (input: Input, initialState: InitialState) => Promise<infer R> ? R : never;
};

export type ParallelPipeline<T, InitialState> = {
  <U extends Array<PipeStep<T, any, InitialState>>>(steps: U): PipeLine<ParallelArrayOutput<U, T, InitialState>, InitialState>;
  <U extends Record<string, PipeStep<T, any, InitialState>>>(steps: U): PipeLine<ParallelObjectOutput<U, T, InitialState>, InitialState>;
};

export class PipeLine<T, InitialState = T> {
  public steps: Array<{ name?: string; fn: (input: any, initialInput: InitialState, labels?: Record<string, number>) => Promise<any> }> = [];
  private labels: Record<string, number> = {};

  constructor(private validator?: z.ZodType<T>) {}

  static fromZod<T extends z.ZodTypeAny>(zod: T): PipeLine<T, T> {
    return new PipeLine<T, T>(zod);
  }

  then<U>(stepNameOrFn: string | PipeStep<T, U, InitialState>, fn?: PipeStep<T, U, InitialState>): PipeLine<U, InitialState> {
    const stepFn = typeof stepNameOrFn === 'string' ? fn! : stepNameOrFn;
    const stepName = typeof stepNameOrFn === 'string' ? stepNameOrFn : undefined;
    const index = this.steps.length;
    if (stepName) this.labels[stepName] = index;
    this.steps.push({ name: stepName, fn: async (input, initialInput) => await stepFn(input, initialInput) });
    return this as unknown as PipeLine<U, InitialState>;
  }

  parallel: ParallelPipeline<T, InitialState> = ((steps: any) => {
    const fn = async (input: T, initialInput: InitialState) => {
      if (Array.isArray(steps)) {
        return await Promise.all(steps.map((s: PipeStep<T, any, InitialState>) => s(input, initialInput)));
      } else {
        const entries = await Promise.all(
          Object.entries(steps).map(async ([key, stepFn]) => [key, await (stepFn as PipeStep<T, any, InitialState>)(input, initialInput)])
        );
        return Object.fromEntries(entries);
      }
    };
    this.steps.push({ fn });
    return this as any;
  }) as ParallelPipeline<T, InitialState>;

  doWhile<U>(cond: (input: U, initialState: InitialState) => Promise<boolean>, action: (input: U, initialState: InitialState) => Promise<U>): PipeLine<U, InitialState> {
    this.steps.push({ fn: async (input, initialInput) => {
      let current = input;
      while (await cond(current, initialInput)) {
        current = await action(current, initialInput);
      }
      return current;
    }});
    return this as unknown as PipeLine<U, InitialState>;
  }

  doUntil<U>(cond: (input: U, initialState: InitialState) => Promise<boolean>, action: (input: U, initialState: InitialState) => Promise<U>): PipeLine<U, InitialState> {
    this.steps.push({ fn: async (input, initialInput) => {
      let current = input;
      do {
        current = await action(current, initialInput);
      } while (!(await cond(current, initialInput)));
      return current;
    }});
    return this as unknown as PipeLine<U, InitialState>;
  }

  gotoIf<U>(fn: (input: T, initialState: InitialState) => Promise<boolean>, stepName: string, maxRetries: number): PipeLine<U, InitialState> {
    this.steps.push({ fn: async (input, initialInput, labels) => {
      let retries = 0;
      while (await fn(input, initialInput)) {
        if (++retries > maxRetries) break;
        const index = labels?.[stepName];
        if (index != null) {
          return { __goto__: index, input };
        }
      }
      return input;
    }});
    return this as unknown as PipeLine<U, InitialState>;
  }

  gotoStep<U>(fn: (input: U, initialState: InitialState) => Promise<string>): PipeLine<U, InitialState> {
    this.steps.push({ fn: async (input, initialInput, labels) => {
      const name = await fn(input, initialInput);
      const index = labels?.[name];
      if (index != null) {
        return { __goto__: index, input };
      }
      return input;
    }});
    return this as unknown as PipeLine<U, InitialState>;
  }

  branch<U, N extends [(input: T, initialState: InitialState) => Promise<boolean>, PipeLine<U, InitialState>][]>(branches: N): PipeLine<U, InitialState> {
    this.steps.push({ fn: async (input, initialInput) => {
      for (const [cond, pipe] of branches) {
        if (await cond(input, initialInput)) {
          return pipe.compile().invoke(input);
        }
      }
      throw new Error("No branch matched");
    }});
    return this as unknown as PipeLine<U, InitialState>;
  }

  forEach<TArr extends Array<any>, U>(
    this: PipeLine<TArr, InitialState>,
    fn: (input: TArr[number], initialState: InitialState) => Promise<U>
  ): PipeLine<Array<U>, InitialState> {
    this.steps.push({ fn: async (arr: TArr, initialInput) => {
      return Promise.all(arr.map((item) => fn(item, initialInput)));
    }});
    return this as unknown as PipeLine<Array<U>, InitialState>;
  }

  compile(): RunnableLambda<InitialState, T> {
    const executionLogic = async (inputState: InitialState, config?: RunnableConfig): Promise<T> => {
      const parsedInput = await this.validator?.parseAsync(inputState) || inputState;
      let state: any = parsedInput;
      const initialInput = parsedInput as InitialState;
      let pc = 0;
      const steps = this.steps;
      const labels = this.labels;
      while (pc < steps.length) {
        const step = steps[pc];
        const stepName = step.name || `Step ${pc}`;

        console.log(`[Pipeline] >>>> Executing: ${stepName}`);
        console.time(`[Pipeline] <<<< ${stepName} duration`);

        const result = await step.fn(state, initialInput, labels);

        console.timeEnd(`[Pipeline] <<<< ${stepName} duration`);

        if (typeof result === 'object' && result?.__goto__ != null) {
          console.log(`[Pipeline] Goto: ${result.__goto__}`);
          pc = result.__goto__;
          state = result.input;
        } else {
          state = result;
          pc++;
        }
      }
      return state as T;
    };

    return new RunnableLambda<InitialState, T>({
      func: executionLogic
    });
  }
}

export function pipeline<T extends z.ZodTypeAny>(schema: T): PipeLine<z.infer<T>, z.infer<T>> {
  return PipeLine.fromZod(schema);
}
