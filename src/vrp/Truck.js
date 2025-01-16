import { Utils } from "../common/Utils.js";

class Truck {
  constructor(param) {
    this.manager = param.manager;
    this.id = param.id;
    this.capacity = param.capacity;
    this.startPos = param.startPos;
    this.startTime = new Date(param.startTime);
    this.reset();
  }

  reset() {
    this.remain = this.capacity;
    this.currentPos = this.startPos;
    this.currentTime = this.startTime;
    this.deliveryQueue = [];
  }

  // 执行配送任务
  delivery(area, arrivalTime) {
    // 更新救援车辆的剩余载重和受灾点的剩余需求
    if(this.remain >= area.current_demand) {
      area.receive(area.current_demand, arrivalTime);
      this.remain -= area.current_demand;
    }
    else {
      area.receive(this.remain, arrivalTime);
      this.remain = 0;
    }

    // 更新救援车辆的当前位置和当前时间
    this.currentPos = area.id;
    this.currentTime = arrivalTime;
    // 将受灾点添加到配送队列
    this.deliveryQueue.push(area.id);

    // 如果救援车辆剩余载重为0，则将救援中心添加到配送队列
    if(this.remain === 0) {
      let rescueCenter = this.manager.getRescueCenter();
      this.deliveryQueue.push(rescueCenter.id);
      let travelTime = this.manager.getNavTool().getShortestTime(
        this.currentPos,
        rescueCenter.id,
        this.currentTime
      );
      this.currentPos = rescueCenter.id;
      this.currentTime = Utils.addTime(this.currentTime, travelTime);
      this.remain = this.capacity;
    }
  }

}

export { Truck };
