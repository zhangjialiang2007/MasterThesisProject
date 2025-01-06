import { Node } from '../navigation/Node.js';
class RescueCenter extends Node {
  constructor(param) {
    super(param.id);
    this.name = param.name || '';
  }
}

export { RescueCenter };
