import { Node } from '../navigation/Node.js';
class DisasterArea extends Node {
  constructor(param) {
    super(param.id);
    this.name = param.name || '';
    this.total_demand = param.total_demand;
    this.current_demand = this.total_demand;
    this.threshold_time = new Date(param.threshold_time);
    this.limit_time = new Date(param.limit_time);
    
    // 首次物资配送时间
    this.delivery_time1 = 0;
    // 二次物资配送时间
    this.delivery_time2 = 0;
    // 物资短缺综合指数
    this.SCI = 0;
  }
  inTimeWindow(t) {
    return t >= this.startTime && t <= this.endTime;
  }
}

export { DisasterArea };
