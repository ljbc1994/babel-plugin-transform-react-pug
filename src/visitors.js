// @flow

import type Context from './context';
import t, {setCurrentLocation} from './lib/babel-types';
import visitors from './lib/visitors.js';
import {buildJSXFragment} from './utils/jsx';

const WRAP_NODE_TYPE = ['Each', 'Conditonal', 'While', 'Case'];

function requiresFragmentWrap(nodeType: string) {
  return WRAP_NODE_TYPE.some(type => nodeType === type);
}

export function visitExpressions(
  nodes: Object[],
  context: Context,
): Expression[] {
  const result = [];
  nodes.forEach((node, i) => {
    if (node.type === 'Block') {
      result.push(...visitExpressions(node.nodes, context));
    } else {
      result.push(visitExpression(node, context));
    }
  });
  return result;
}

export function visitExpression(
  node: Object,
  context: Context,
  rootNode?: boolean,
): Expression {
  const line = node.line + context.getBaseLine();
  setCurrentLocation({start: {line, column: 0}, end: {line, column: 0}});
  const v = visitors[node.type];
  if (!v) {
    throw new Error(node.type + ' is not yet supported');
  }
  const exp = v.expression(node, context);

  if (rootNode && requiresFragmentWrap(node.type)) {
    return buildJSXFragment([t.jSXExpressionContainer(exp)]);
  }

  return exp;
}

export function visitJsxExpressions(
  nodes: Object[],
  context: Context,
): JSXValue[] {
  const result = [];
  nodes.forEach((node, i) => {
    if (node.type === 'Block') {
      result.push(...visitJsxExpressions(node.nodes, context));
    } else {
      result.push(visitJsx(node, context));
    }
  });
  return result;
}
export function visitJsx(node: Object, context: Context): JSXValue {
  const line = node.line + context.getBaseLine();
  setCurrentLocation({start: {line, column: 0}, end: {line, column: 0}});
  const v = visitors[node.type];
  if (!v) {
    throw new Error(node.type + ' is not yet supported');
  }
  return v.jsx
    ? v.jsx(node, context)
    : t.jSXExpressionContainer(v.expression(node, context));
}
