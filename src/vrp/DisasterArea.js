import { Node } from '../navigation/Node.js';
import { Utils } from '../common/Utils.js';
class DisasterArea extends Node {
  constructor(param) {
    super(param.id);
    this.name = param.name || '';
    this.total_demand = param.total_demand;
    this.threshold_time = new Date(param.threshold_time);
    this.limit_time = new Date(param.limit_time);
    this.reset();
  }

  reset() {
    this.current_demand = this.total_demand;
    this.delivery_time = null;
    this.SCI = 0;
  }

  _updateSCI() {
    let sti = Utils.getSTI(this.threshold_time, this.limit_time, this.delivery_time);
    let ssi = Utils.getSSI(this.current_demand, this.total_demand);
    let sci = sti * ssi;
    this.SCI += sci;
  }

  // 接收物资
  receive(amount, time) {
    if(time.getTime() > this.limit_time.getTime()){
      console.error('时间超出限制,调整策略');
      return;
    }

    if(this.current_demand < this.total_demand && this.current_demand > amount){
      console.error('第二次配送必须全部满足需求,调整策略');
      return;
    }

    this.delivery_time = time;
    // 先更新SCI
    this._updateSCI();
    // 在更新当前需求
    this.current_demand -= amount;
    if(this.current_demand < 0) {
      this.current_demand = 0;
    }
  }

  isCompleted() {
    return this.current_demand == 0;
  }
}

export { DisasterArea };
