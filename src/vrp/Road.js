import { Edge } from '../navigation/Edge.js';
class Road extends Edge {
  constructor(param) {
    super(param);

    this.travelTime = param.travelTime;

  }

  getTravelTime(time) {
    return this.travelTime[time];
  }
}

export { Road };
