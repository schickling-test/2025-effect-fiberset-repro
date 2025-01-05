import { Schema } from "effect";

export class ExampleStream extends Schema.TaggedRequest<ExampleStream>()('ExampleStream', {
	payload: { },
	success: Schema.Number,
	failure: Schema.Never
}) {}