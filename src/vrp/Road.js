import { Edge } from '../navigation/Edge.js';
import { DateType } from '../common/Const.js';
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
        let time = timeData[key] * 60 * 1000; // 转换为毫秒
        data.push(time)
      }
      this.travelTime.set(dateType, data);
    });
  }

  getTravelTime(time, type = DateType.workday) {
    let timeData = this.travelTime.get(type);
    return timeData[time];
  }
}

export { Road };
