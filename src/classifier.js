const question = /^(como|por que|porque|qual|quais|o que|explique|compare|analise|resuma|mostre|me diga)\b/i;
const implementation = /\b(implementar|implemente|criar|crie|adicionar|adicione|alterar|altere|corrigir|corrija|remover|remova|refatorar|refatore|migrar|migre|integrar|integre|configure|configurar)\b/i;
const critical = /\b(auth|autentic|autentica[cç][aã]o|senha|password|secret|segredo|pagamento|billing|financeiro|permiss|privacidade|delete|deletar|excluir|destrut|migra[cç][aã]o de banco|produ[cç][aã]o|deploy)\b/i;
const complex = /\b(refator|arquitet|migra|integra|webhook|fila|background|concorr|multi[- ]?tenant|sincron|provedor|api|banco|database|infra)\b/i;
export function classify(prompt, forced) {
  if (forced) return { intent: 'implementation', level: forced.toUpperCase() };
  if (!prompt || (question.test(prompt) && !implementation.test(prompt))) return { intent: 'analysis', level: null };
  if (!implementation.test(prompt)) return { intent: 'analysis', level: null };
  if (critical.test(prompt)) return { intent: 'implementation', level: 'CRITICA' };
  if (complex.test(prompt)) return { intent: 'implementation', level: 'COMPLEXA' };
  return { intent: 'implementation', level: 'NORMAL' };
}
