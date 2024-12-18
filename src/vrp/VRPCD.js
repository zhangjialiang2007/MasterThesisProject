import { DisasterArea } from "./DisasterArea.js";
import { Truck } from "./truck.js";
import { timeDependentDijkstra } from "../main.js";

const __ = {
  private: Symbol("private"),
};
function _initPrivateMembers(that, param) {
  that[__.private] = {};
  const _private = that[__.private];

  // 私有属性
  _private.disasterAreas = [];
  _private.trucks = [];
  _private.startTime = 0;

  // 私有方法

  // 根据救援车辆所在受灾点位置和当前时间，计算出起抵达各个受灾点的行驶时间和抵达时间
  _private.getTravelData() = (truck) => {
    let result = [];
    let count = _private.DisasterAreas.length;
    for(let i = 0; i < count; i++){

    }

    return result;
  }

  // 从travelData中贪婪随机选取m个行驶时间最短的数据
  _private.selectNearData = (travelData, m) =>{
    let result = [];

    // 对travelData按行驶时间由短到长排序

    // 从m+1个最短的数据中选择m个


    return result;
  }

  _private.calcEmergency = (area)=>{
    let result = 0
    //紧急程度 =（抵达时间-临界惩罚时间）/（极限忍耐时间-临界惩罚时间）

    return result;
  }

  // 从travelData中贪婪随机选取M-m个紧急程度最高的数据
  _private.selectEmergencyData = (travelData, m) =>{
    let result = [];

    // 根据抵达时间计算受灾点的紧急程度，基于紧急程度对受灾点进行从高到低的排序，
    


    // 从M-m+1个最紧急的数据中选择M-m个


    return result;
  }

  // 更新救援车辆和受灾点数据
  _private.updateData = (data, type)=>{
    
    //更新救援车辆的配送队列，将救援中心添加到剩余载重为0的救援车辆的配送队列；
    
    //更新配送后救援车辆的剩余载重
    
    // 更新救援车辆的出发时间

    // 记录受灾点的送达时间

    // 更新受灾点的剩余需求
    
    //从待配送队列中移除剩余需求未0的受灾点
  

  }

  _private.init = (param) => {   
    _private.disasterAreas = param.disasterAreas;       // 受灾的区域
    _private.trucks = params.trucks;            //救援车辆数据
    _private.startTime = params.startTime;      //开始救援时间

  };
  _private.init(param);
}
class VRPRDL {
  constructor(param) {
    _initPrivateMembers(this, param);
  }

  /**
	 * generateBaseSolutions
	 * @param {Number} s 初始解数量
	 * @param {Number} m 就近配送救援车辆数量
	 * @public
	 */
  generateBaseSolutions(s, m) {
    let result = [];
    var _private = this[__.private];
    if(m < 0 || m > _private.trucks.length){
      console.error('救济配送救援车辆数量不合理,需要保证在0到救援车辆数量之间');
      return result;
    }

    // 构造s个初始解
    for(let i = 0; i < s; i++){
      let solution = [];

      // 未配送受灾区域
      let unserved;
      while(unserved.length > 0){
        let travelData = _private.getTravelData();
      
        let nearData = _private.selectNearData(travelData, m);
        _private.updateData(nearData, 'near');
        //移除剩余需求为0的受灾区域
  
        let emergencyData = _private.selectEmergencyData(travelData, M-m);
        _private.updateData(emergencyData, 'emergency')
        // 移除剩余需求为0的受灾区域
      }

      result.push(solution)
    }
    return result;
  }

}

export { VRPRDL };
