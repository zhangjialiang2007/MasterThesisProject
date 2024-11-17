class Truck {
  constructor(param) {
    this.totalCapacity = param.totalCapacity;
    this.remainCapacity = param.remainCapacity || param.totalCapacity;
  }
}

export { Truck };
