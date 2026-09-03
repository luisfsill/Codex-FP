export const schemas = {
  plan: { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, acceptanceCriteria: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } }, recommendedLevel: { enum: ['TRIVIAL', 'NORMAL', 'COMPLEXA', 'CRITICA'] }, escalationReason: { type: 'string' } }, required: ['summary', 'steps', 'acceptanceCriteria', 'risks', 'recommendedLevel', 'escalationReason'] },
  implementation: { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' }, changedFiles: { type: 'array', items: { type: 'string' } }, validations: { type: 'array', items: { type: 'string' } }, unresolvedIssues: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'changedFiles', 'validations', 'unresolvedIssues'] },
  review: { type: 'object', additionalProperties: false, properties: { verdict: { enum: ['APPROVED', 'CHANGES_REQUESTED'] }, findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { severity: { enum: ['low', 'medium', 'high', 'critical'] }, file: { type: 'string' }, line: { type: 'integer' }, message: { type: 'string' }, recommendation: { type: 'string' } }, required: ['severity', 'file', 'line', 'message', 'recommendation'] } }, residualRisks: { type: 'array', items: { type: 'string' } } }, required: ['verdict', 'findings', 'residualRisks'] }
};
export function assertStructuredOutput(kind, value) {
  if (!value || typeof value !== 'object') throw new Error(`${kind}: resposta não é um objeto.`);
  if (kind === 'review' && (!['APPROVED', 'CHANGES_REQUESTED'].includes(value.verdict) || !Array.isArray(value.findings))) throw new Error('review: resposta inválida.');
  if (kind === 'plan' && !Array.isArray(value.steps)) throw new Error('plan: steps inválido.');
  if (kind === 'implementation' && !Array.isArray(value.changedFiles)) throw new Error('implementation: changedFiles inválido.');
  return value;
}
