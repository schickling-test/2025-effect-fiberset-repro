import * as WT from "node:worker_threads";
import { Worker } from "@effect/platform";
import * as NodePlatform from "@effect/platform-node";
import { Console, Effect, FiberSet, Schema, Stream } from "effect";
import * as WorkerSchema from "./worker-schema";

const program = Effect.gen(function* () {
	const fiberSet = yield* FiberSet.make();

	yield* FiberSet.run(
		fiberSet,
		Effect.gen(function* () {
			yield* Effect.addFinalizer(() => Effect.log("shutdown first fiber"));
			yield* Effect.never;
		}),
	);

	const worker = yield* Worker.makePoolSerialized<
		typeof WorkerSchema.ExampleStream.Type
	>({
		size: 1,
		concurrency: 100,
	}).pipe(
		Effect.withSpan("setupWorker"),
		Effect.tapErrorCause(Effect.logError),
	);

	const stream = worker
		.execute(WorkerSchema.ExampleStream.make())
		.pipe(Stream.onEnd(Effect.log("stream done")));

	yield* FiberSet.run(
		fiberSet,
		stream.pipe(Stream.runDrain, Effect.interruptible),
	);

	yield* Effect.log("done");
}).pipe(
	Effect.scoped,
	Effect.provide(
		NodePlatform.NodeWorker.layer(
			() => new WT.Worker(new URL("./worker.js", import.meta.url), {}),
		),
	),
);

// Run the program
NodePlatform.NodeRuntime.runMain(program);
