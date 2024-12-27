import Utils from "../common/Utils.js";
import { DisasterArea } from "./DisasterArea.js";
import { Road } from "./Road.js";
import { Truck } from "./Truck.js";
import { TimeDependentDijkstra } from "../navigation/TimeDependentDijkstra.js";

const __ = {
  private: Symbol("private"),
};
function _initPrivateMembers(that, param) {
  that[__.private] = {};
  const _private = that[__.private];

  // 私有属性
  _private.disasterAreas = [];
  _private.trucks = [];
  _private.graph = [];
  _private.navTool = null;
  _private.startTime = 0;
 

  // 私有方法

  // 根据救援车辆所在受灾点位置和当前时间，计算出起抵达各个受灾点的行驶时间和抵达时间
  _private.getTravelData = (truck) => {
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
  // #region 初始化 
  // 初始化受灾点数据
  _private.initDisasterAreas = (data) =>{
    let result = [];
    for(let i = 0; i < data.data.length; i++){
      result.push(new DisasterArea(data.data[i]));
    }
    return result;
  }
  // 初始化道路数据
  _private.initRoads = (data) =>{
    let result = [];
    for(let i = 0; i < data.data.length; i++){
      result.push(new Road(data.data[i]));
    }
    return result;
  }
  // 初始化救援车辆数据
  _private.initTrucks = (data) =>{
    let result = [];
    for(let i = 0; i < data.count; i++){
      result.push(new Truck({capacity: data.capacity}));
    }
    return result;
  }
  // 初始化导航路网数据
  _private.initGraph = (param) =>{
    let result = [];

    return result;
  }
   _private.init = async (param) => {   
    // disaster
    let disasterData = await Utils.fetchJson(param.disasterPath);
    _private.disasterAreas = _private.initDisasterAreas(disasterData);
    // road
    let roadData = await Utils.fetchJson(param.roadPath);
    _private.roads = _private.initRoads(roadData);
    // truck
    let trucks = await Utils.fetchJson(param.truckPath);
    _private.trucks = _private.initTrucks(trucks);
    // graph
    _private.graph = _private.initGraph();
    // navTool
    _private.navTool = new TimeDependentDijkstra(_private.graph);

  };
   // #endregion
  _private.init(param);
}
class VRPManager {
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

export default VRPManager;
