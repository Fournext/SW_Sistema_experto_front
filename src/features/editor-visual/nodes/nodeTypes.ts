import HechoNode from './HechoNode';
import VariableNode from './VariableNode';
import CondicionNode from './CondicionNode';
import ReglaNode from './ReglaNode';
import ConclusionNode from './ConclusionNode';

export const nodeTypes = {
  HECHO: HechoNode,
  VARIABLE: VariableNode,
  CONDICION: CondicionNode,
  REGLA: ReglaNode,
  CONCLUSION: ConclusionNode,
};

export default nodeTypes;
