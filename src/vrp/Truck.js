class Truck {
  constructor(param) {
    this.manager = param.manager;
    this.capacity = param.capacity;
    this.startPos = param.startPos;
    this.startTime = param.startTime;
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
      this.remain -= area.current_demand;
      area.receive(area.current_demand, arrivalTime);
    }
    else {
      this.remain = 0;
      area.receive(this.remain, arrivalTime);
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
    }
  }

}

export { Truck };
