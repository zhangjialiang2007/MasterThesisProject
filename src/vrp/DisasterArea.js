import { Node } from '../navigation/Node.js';
class Customer extends Node {
  constructor(param) {
    super(param.id);
    this.position = [];
    this.requirement = param.requirement;
    this.startTime = param.startTime;
    this.endTime = param.endTime;
  }
  inTimeWindow(t) {
    return t >= this.startTime && t <= this.endTime;
  }
}

export { Customer };
