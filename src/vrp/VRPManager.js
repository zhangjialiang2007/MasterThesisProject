import Utils from "../common/Utils.js";
import { RescueCenter } from "./RescueCenter.js";
import { DisasterArea } from "./DisasterArea.js";
import { Road } from "./Road.js";
import { Truck } from "./Truck.js";
import { TimeDependentDijkstra } from "../navigation/TimeDependentDijkstra.js";
import { Graph } from "../navigation/Graph.js";
import { Solution } from "./Solution.js";

const __ = {
  private: Symbol("private"),
};
function _initPrivateMembers(that, param) {
  that[__.private] = {};
  const _private = that[__.private];

  // #region 私有属性
  _private.config = {};
  _private.rescueCenter = null;
  _private.disasterAreas = new Map();
  _private.roads = new Map();
  _private.trucks = new Map();
  _private.navTool = null;
  _private.startTime = 0;
  // #endregion

  // #region 基础解生成
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
    let solution = new Solution();
    // 重置数据
    _private.resetData();
    // 未配送受灾区域，需要深拷贝避免修改源数据
    let areas = _private.disasterAreas.values().slice();
    let M = _private.trucks.size;
    let m = _private.config.nearTruckCount;
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

    // 将救援车辆配送队列添加到solution中
    _private.trucks.forEach(truck => {
      let queue = Utils.deepCopy(truck.deliveryQueue);
      solution.addDeliveryQueue(truck.id, queue);
    });

    // 计算解决方案的适应度
    let total_sci = 0;
    _private.disasterAreas.values().forEach(area => {
      total_sci += area.SCI;
    });
    solution.fitness = 1 / total_sci;

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
  _private.selectNearData = (travelData, count) => {
    let tableNear = [];
    let countNear = 1;
    let x = 1;
    for (let truckData of travelData) {
      let data = truckData.filter(item => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });
      data.sort((a, b) => a.travelTime - b.travelTime);
      let nearData = data.slice(0, countNear);
      tableNear.push(...nearData);
    }
    // 对tableNear按行驶时间由短到长排序,选取m+x个最短的
    tableNear.sort((a, b) => a.travelTime - b.travelTime);
    let nearData = tableNear.slice(0, count + x);
    // nearData中随机返回m个
    let result = Utils.randomSelect(nearData, count);
    return result;
  };
  _private.selectEmergencyData = (travelData, count) => {
    let tableEmergency = [];
    let countEmergency = 1;
    let y = 1;
    for (let truckData of travelData) {
      let data = truckData.filter(item => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });
      data.sort((a, b) => b.emergency - a.emergency);
      let emergencyData = data.slice(0, countEmergency);
      tableEmergency.push(...emergencyData);
    }
    // 对tableEmergency按紧急程度由高到低排序,选取m+y个最紧急的
    tableEmergency.sort((a, b) => b.emergency - a.emergency);
    let emergencyData = tableEmergency.slice(0, count + y);
    // emergencyData中随机返回m个
    let result = Utils.randomSelect(emergencyData, count);
    return result;;
  };
  _private.updateData = (data) => {
    data.forEach(item => {
      let truck = _private.trucks.get(item.truckId);
      let area = _private.disasterAreas.get(item.areaId);
      truck.delivery(area, item.arrivalTime);
    });
  };
  // #endregion

  // #region 编解码
  _private.encodeDeliveryQueue = (queue) => {
    let queueCode = new Map();
    for(let {id, data } of _private.disasterAreas){
      queueCode.set(id, []);
    }

    let round = 1; // 轮次
    let order = 1; // 轮次中的顺序
    queue.forEach(id => {
      // 如果返回救援中心，则需要增加轮次
      if (id === _private.rescueCenter.id) {
        round++;
        order = 1;
        return;
      }

      // 如果该受灾点还没有被配送，则需要添加到队列中
      let data = queueCode.get(id);
      data.push({
        round: round,
        order: order,
      });
      order++;
    })
    return queueCode;
  };
  _private.encodeSolution = (solution) => {
    let solutionCode = [];
    let deliveryQueue = solution.getDeliveryQueue();
    deliveryQueue.values.forEach(queue => {
      let queueCode = _private.encodeDeliveryQueue(queue);
      solutionCode.push(...queueCode);
    });
    return solutionCode;
  };
  _private.decodeDeliveryQueue = (queueCode) => {
    // 获取非空配送列表，并将配送列表按轮次排序
    let realQueueCode = [];
    for(let {id, data} of queueCode){
      if(data.length > 0){
        let item = {
          areaId: id,
          data: data.sort((a, b) => a.round - b.round)
        }
        realQueueCode.push(item);
      }
    }

    let queue = [];
    while(realQueueCode.length > 0){
      // 当前轮配送数组
      let currentRoundQueue = [];
      realQueueCode.forEach(item => {
        let data = item.data.shift();
        currentRoundQueue.push({
          areaId: item.areaId,
          order: data.order,
        });
      });
      // 当前轮次配送数组
      currentRoundQueue = currentRoundQueue.sort((a, b) => a.order - b.order);
      currentRoundQueue.forEach(item => {
        queue.push(item.areaId);
      });
      queue.push(_private.rescueCenter.id);

      realQueueCode = realQueueCode.filter(item => item.data.length > 0);
    }

    return queue;
  };
  _private.decodeSolution = (solution) => {
    let solutionCode = solution.code;

    // 检查输入是否有效
    let truckCount = _private.trucks.size;
    if (solutionCode.length !== truckCount) {
      throw new Error("数组长度不符合要求");
    }

    // 初始化结果数组
    let solution = [];
    solutionCode.forEach(queueCode => {
      let queue = _private.decodeDeliveryQueue(queueCode);
      solution.push(queue);
    })
    return solution;
  };
  // #endregion

  // 交叉操作
  _private.crossover = (code1, code2) => {

    return decoded;
  };
  // 变异操作
  _private.mutate = (solution) => {
    let code = _private.encodeSolution(solution);
    let decoded = _private.decodeSolution(code);
    return decoded;
  };
  // 选择操作
  _private.select = (solution) => {
    let code = _private.encodeSolution(solution);
    let decoded = _private.decodeSolution(code);
    return decoded;
  };
  // 适应度计算
  _private.fitness = (solution) => {



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
  _private.initConfig = (data) => {
    _private.config.maxIter = data.maxIter;
    _private.config.baseSolutionCount = data.baseSolutionCount;
    _private.config.nearTruckCount = data.nearTruckCount;
  };
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
