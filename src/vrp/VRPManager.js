import Utils from "../common/Utils.js";
import { DisasterArea } from "./DisasterArea.js";
import { Road } from "./Road.js";
import { Truck } from "./Truck.js";
import { TimeDependentDijkstra } from "../navigation/TimeDependentDijkstra.js";
import { Graph } from "../navigation/Graph.js";

const __ = {
  private: Symbol("private"),
};
function _initPrivateMembers(that, param) {
  that[__.private] = {};
  const _private = that[__.private];

  // #region 私有属性
  _private.disasterAreas = new Map();
  _private.roads = new Map();
  _private.trucks = new Map();
  _private.navTool = null;
  _private.startTime = 0;
  // #endregion

  _private.generateBaseSolutions = (s, m) => {
    let solutions = [];
    if (m < 0 || m > _private.trucks.length) {
      console.error("救济配送救援车辆数量不合理,需要保证在0到救援车辆数量之间");
      return solutions;
    }

    // 构造s个初始解
    for (let i = 0; i < s; i++) {
      let solution = _private.generateBaseSolution(m);
      solutions.push(solution);
    }
    return solutions;
  };
  _private.generateBaseSolution = (m) => {
    let solution = [];
    // 重置数据
    _private.resetData();
    // 未配送受灾区域，需要深拷贝避免修改源数据
    let areas = Utils.deepCopy(
      _private.disasterAreas.values()
    );
    while (areas.length > 0) {
      // 获取救援车辆到各个受灾点的行驶时间和抵达时间
      let travelData = _private.getTravelData(unfinishedDisasterAreas);

      // 从travelData中贪婪随机选取m个行驶时间最短的数据
      let nearData = _private.selectNearData(travelData, m);
      _private.updateData(nearData, areas);

      // 从travelData中贪婪随机选取M-m个紧急程度最高的数据
      let emergencyData = _private.selectEmergencyData(travelData, M - m);
      _private.updateData(emergencyData, areas);

      areas = areas.filter(area => !area.isCompleted());
    }
    
    _private.trucks.forEach(truck => {
      solution.push(truck.deliveryQueue);
    });
    return solution;
  };

  _private.getTravelData = (areas) => {
    let travelData = [];
    let trucks = _private.trucks.values();
    for (let truck of trucks) {
      let truckData = [];
      for (let area of areas) {
        // 获取救援车辆到受灾点的行驶时间
        let travelTime = _private.navTool.getShortestTime(
          truck.currentPos,
          area.id,
          truck.currentTime
        );
        // 根据送达时间计算受灾点的紧急程度
        let arrivalTime = truck.currentTime + travelTime;
        let emergency = Utils.getEmergency(
          area.thresholdTime,
          area.limitTime,
          arrivalTime
        );
        // 将救援车辆到受灾点的行驶时间和紧急程度添加到结果中
        let item = {
          truckId: truck.id,
          areaId: area.id,
          travelTime: travelTime,
          arrivalTime: arrivalTime,
          emergency: emergency,
        };
        truckData.push(item);
      }
      travelData.push(truckData);
    }
    return travelData;
  };

  // 从travelData中贪婪随机选取m个行驶时间最短的数据
  _private.selectNearData = (travelData, m) => {
    let tableNear = [];
    let countNear = 1;
    let x = 1;
    for(let truckData of travelData) {
      truckData.sort((a, b) => a.travelTime - b.travelTime);
      let nearData = truckData.slice(0, countNear);
      tableNear.push(...nearData);
    }
    // 对tableNear按行驶时间由短到长排序,选取m+x个最短的
    tableNear.sort((a, b) => a.travelTime - b.travelTime);
    let nearData = tableNear.slice(0, m + x);
    // nearData中随机返回m个
    let result = Utils.randomSelect(nearData, m);
    return result;
  };

  _private.calcEmergency = (area) => {
    let result = 0;
    //紧急程度 =（抵达时间-临界惩罚时间）/（极限忍耐时间-临界惩罚时间）

    return result;
  };

  // 从travelData中贪婪随机选取M-m个紧急程度最高的数据
  _private.selectEmergencyData = (travelData, m) => {
    let result = [];

    // 根据抵达时间计算受灾点的紧急程度，基于紧急程度对受灾点进行从高到低的排序，

    // 从M-m+1个最紧急的数据中选择M-m个

    return result;
  };

  // 更新救援车辆和受灾点数据
  _private.updateData = (data) => {
    data.forEach(item => {
      let truck = _private.trucks.get(item.truckId);
      let area = _private.disasterAreas.get(item.areaId);
      truck.delivery(area, item.arrivalTime);
    }); 
  };

  // 重置数据
  _private.resetData = () => {
    _private.trucks.forEach(truck => {
      truck.reset();
    });
    _private.disasterAreas.forEach(area => {
      area.reset();
    });
  };

  // #region 初始化
  _private.initRescueCenter = (data) => {
    _private.rescueCenter = new RescueCenter(data);
  };
  _private.initDisasterAreas = (data) => {
    for (let i = 0; i < data.data.length; i++) {
      let area = new DisasterArea(data.data[i]);
      _private.disasterAreas.set(area.id, area);
    }
    _private.unfinishedDisasterAreas = new Map([..._private.disasterAreas]);
  };
  _private.initRoads = (data) => {
    for (let i = 0; i < data.data.length; i++) {
      let road = new Road(data.data[i]);
      _private.roads.set(road.id, road);
    }
  };
  _private.initTrucks = (data) => {
    for (let i = 0; i < data.count; i++) {
      let truck = new Truck({ capacity: data.capacity });
      _private.trucks.set(truck.id, truck);
    }
  };
  _private.init = async (param) => {
    // rescueCenter
    let rescueCenterData = await Utils.fetchJson(param.rescueCenterPath);
    _private.initRescueCenter(rescueCenterData);
    // disaster
    let disasterData = await Utils.fetchJson(param.disasterPath);
    _private.initDisasterAreas(disasterData);
    // road
    let roadData = await Utils.fetchJson(param.roadPath);
    _private.initRoads(roadData);
    // truck
    let truckData = await Utils.fetchJson(param.truckPath);
    _private.initTrucks(truckData);
    // navTool
    let nodes = [_private.rescueCenter, ..._private.disasterAreas.values()];
    let graph = new Graph({
      nodes,
      edges: _private.roads.values(),
    });
    _private.navTool = new TimeDependentDijkstra({ graph });
  };
  // #endregion
  _private.init(param);
}
class VRPManager {
  constructor(param) {
    _initPrivateMembers(this, param);
  }
}

export default VRPManager;
