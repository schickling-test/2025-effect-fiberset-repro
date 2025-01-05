import { WorkerRunner } from "@effect/platform";
import { NodeWorkerRunner } from "@effect/platform-node";
import { Effect, Layer, LogLevel, Logger, Stream } from "effect";
import * as WorkerSchema from "./worker-schema";

let i = 0;

const worker = WorkerRunner.layerSerialized(WorkerSchema.ExampleStream, {
	ExampleStream: () =>
		Stream.tick(1000).pipe(
			Stream.map(() => i++),
			Stream.onDone(() => Effect.log("worker: stream done")),
		),
});

worker.pipe(
	Layer.provide(NodeWorkerRunner.layer),
	Layer.launch,
	Effect.tapErrorCause(Effect.logError),
	Logger.withMinimumLogLevel(LogLevel.Debug),
	Effect.runFork,
);
