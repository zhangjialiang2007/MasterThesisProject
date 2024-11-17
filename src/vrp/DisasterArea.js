class Customer {
  constructor(param) {
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
