import { Edge } from '../navigation/Edge.js';
import { dateType } from '../common/const.js';
class Road extends Edge {
  constructor(param) {
    super(param);
    this.initTravalTime(param.travelTime);
  }
  initTravalTime(travelTime){
    this.travelTime = new Map();
    travelTime.forEach(element => {
      let dateType = element.type;
      let timeData = element.time;
      let data= [];
      for (let key in timeData) {
        data.push(timeData[key])
      }
      this.travelTime.set(dateType, data);
    });
  }

  getTravelTime(time, type = dateType.workday) {
    let timeData = this.travelTime.get(key);
    return timeData[time];
  }
}

export { Road };
