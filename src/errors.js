export class PipelineError extends Error {
  constructor(message, exitCode = 1, category = 'pipeline_error') {
    super(message); this.name = 'PipelineError'; this.exitCode = exitCode; this.category = category;
  }
}
