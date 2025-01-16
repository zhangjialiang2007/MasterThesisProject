class Solution {
    constructor() {
       this.fitness = 0;
       this.deliveryQueue = new Map();
    }

    addDeliveryQueue(truckId, queue){
      this.deliveryQueue.set(truckId, queue);
    }

    getDeliveryQueue(truckId){
      return this.deliveryQueue.get(truckId);
    }

    getDeliveryQueue(){
      return this.deliveryQueue;
    }
}

export { Solution }