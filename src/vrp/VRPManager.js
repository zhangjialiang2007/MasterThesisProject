import { Utils } from "../common/Utils.js";
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
function _initPrivateMembers(that) {
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
  _private.generateBaseSolutions = () => {
    let solutions = [];
    let M = _private.trucks.size;
    let m = _private.config.nearTruckCount;
    if (m < 0 || m > M) {
      console.error("救济配送救援车辆数量不合理,需要保证在0到救援车辆数量之间");
      return solutions;
    }

    // 构造s个初始解
    let s = _private.config.baseSolutionCount;
    for (let i = 0; i < s; i++) {
      let solution = _private.generateBaseSolution();
      solutions.push(solution);
    }
    return solutions;
  };
  _private.generateBaseSolution = () => {
    let solution = new Solution();
    // 重置数据
    _private.resetData();
    // 未配送受灾区域，需要深拷贝避免修改源数据
    let values = _private.disasterAreas.values().toArray();
    let areas = values.slice();
    let M = _private.trucks.size;
    let m = _private.config.nearTruckCount;
    while (areas.length > 0) {
      // 获取救援车辆到各个受灾点的行驶时间和抵达时间
      let travelData = _private.getTravelData(areas);
      let nearData = _private.selectNearData(travelData, m);
      _private.updateData(nearData);

      // 更新travelData
      travelData = travelData.filter(item => {
        for(let i = 0; i < nearData.length; i++){
          if(item[0].truckId === nearData[i].truckId){
            return false;
          }
        }
        return true;
      });

      // 从travelData中贪婪随机选取M-m个紧急程度最高的数据
      let emergencyData = _private.selectEmergencyData(travelData, M - m);
      _private.updateData(emergencyData);

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
    solution.total_sci = total_sci;
    solution.fitness = 1 / total_sci;

    return solution;
  };
  _private.getTravelData = (areas) => {
    let travelData = [];
    let trucks = _private.trucks.values();
    for (let truck of trucks) {
      let truckData = [];
      for (let area of areas) {
        // 过滤掉已完成配送的受灾点
        if(area.isCompleted()){
          continue;
        }

        // 获取救援车辆到受灾点的行驶时间
        let travelTime = _private.navTool.getShortestTime(
          truck.currentPos,
          area.id,
          truck.currentTime
        );
        // 根据送达时间计算受灾点的紧急程度
        let arrivalTime = Utils.addTime(truck.currentTime, travelTime);
        let emergency = Utils.getEmergency(
          area.threshold_time,
          area.limit_time,
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
    let selected = [];
    for (let truckData of travelData) {
      // 过滤掉已完成配送的受灾点
      let data = truckData.filter(item => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });

      // 过滤掉已选择的受灾点
      data = data.filter(item => !selected.includes(item.areaId));

      // 按行驶时间排序
      data.sort((a, b) => a.travelTime - b.travelTime);

      // 选取行驶时间最短的
      let nearData = data.slice(0, _private.config.countNear);

      // 将nearData添加到tableNear中
      tableNear.push(...nearData);

      // 将已选择的受灾点添加到selected中
      selected.push(...nearData.map(item => item.areaId));
    }
    // 对tableNear按行驶时间由短到长排序,
    tableNear.sort((a, b) => a.travelTime - b.travelTime);

    // 选取m+x个travelTime最短的,要求truckId和areaId不重复
    let nearData = tableNear.slice(0, count + _private.config.x);
    
    // nearData中随机返回m个
    let result = Utils.randomSelect(nearData, count);

    return result;
  };
  _private.selectEmergencyData = (travelData, count) => {
    let tableEmergency = [];
    let selected = [];
    for (let truckData of travelData) {
      // 过滤掉已完成配送的受灾点
      let data = truckData.filter(item => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });

      // 过滤掉已选择的受灾点
      data = data.filter(item => !selected.includes(item.areaId));

      // 按紧急程度排序
      data.sort((a, b) => b.emergency - a.emergency);

      // 选取紧急程度最高的
      let emergencyData = data.slice(0, _private.config.countEmergency);
      tableEmergency.push(...emergencyData);

      // 将已选择的受灾点添加到selected中
      selected.push(...emergencyData.map(item => item.areaId));
    }

     // 对tableEmergency按紧急程度由高到低排序,选取count+y个最紧急的
    tableEmergency.sort((a, b) => b.emergency - a.emergency);
    let emergencyData = tableEmergency.slice(0, count + _private.config.y);

    // emergencyData中随机返回count个
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
    let result = [];
    solutionCode.forEach(queueCode => {
      let queue = _private.decodeDeliveryQueue(queueCode);
      result.push(queue);
    })
    return result;
  };
  // #endregion

  // 交叉操作
  _private.crossover = (solution1, solution2) => {
    let result = new Solution();

    

    return result;
  };
  // 变异操作
  _private.mutate = (solution) => {
    let result = new Solution();

    for(let {truckId, queue} of  solution.deliveryQueue) {
      let cloneQueue = Utils.deepCopy(queue);

      // 随机一个0或1
      let reversed = Math.random() < 0.5 ? 1 : 0;
      if(reversed === 1){
        let reversedArr = cloneQueue.map((value, index) => ({ value, index })).sort((a, b) => b.index - a.index).map(({ value }) => value);
        result.addDeliveryQueue(truckId, reversedArr);
      }else{
        result.addDeliveryQueue(truckId, cloneQueue);
      }
    };
    return result;
  };
  // 选择操作
  _private.select = (solutions) => {

  };
  // 适应度计算
  _private.fitness = (solution) => {
    _private.resetData();

    let mark = false
    let queque = Utils.deepCopy(solution.deliveryQueue);
    for(let {key, value} of queque){
      
      _private.updateData(data);
    }

    queque.forEach(queue => {
      _private.updateData(queue);
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
  _private.initConfig = (data) => {
    _private.config.maxIter = data.maxIter;
    _private.config.baseSolutionCount = data.baseSolutionCount;
    _private.config.nearTruckCount = data.nearTruckCount;
    _private.config.countNear = data.countNear;
    _private.config.countEmergency = data.countEmergency;
    _private.config.x = data.x;
    _private.config.y = data.y;
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
  _private.getPoint = (id) => {
    if(id === _private.rescueCenter.id){
      return _private.rescueCenter;
    }
    return _private.disasterAreas.get(id);
  };
  _private.initRoads = (data) => {
    for (let i = 0; i < data.data.length; i++) {
      let roadData = data.data[i];
      let from = _private.getPoint(roadData.from);
      let to = _private.getPoint(roadData.to);
      let road = new Road({
        id: roadData.id,
        from: from,
        to: to,
        travelTime: roadData.travelTime
      });
      _private.roads.set(road.id, road);
    }
  };
  _private.initTrucks = (data) => {
    for (let i = 0; i < data.count; i++) {
      let truck = new Truck({ 
        manager: that,
        id: i,
        capacity: data.capacity,
        startPos: data.startPos,
        startTime: data.startTime
      });
      _private.trucks.set(truck.id, truck);
    }
  };
  _private.init = async (param) => {
    // config 
    let configData = await Utils.fetchJson(param.configPath);
    _private.initConfig(configData);
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
    let edges = Array.from(_private.roads.values());
    let graph = new Graph({
      nodes,
      edges,
    });
    _private.navTool = new TimeDependentDijkstra( graph );
  };
  // #endregion
}
class VRPManager {
  constructor(param) {
    _initPrivateMembers(this);
  }

  async init(param){
    let _private = this[__.private];
    await _private.init(param);
  }

  getBestSolution(){
    let _private = this[__.private];
    let solutions = _private.generateBaseSolutions();

    // 遗传迭代


    let bestSolution = solutions[0];
    return bestSolution;
  }

  getNavTool(){
    let _private = this[__.private];
    return _private.navTool;
  }
  getRescueCenter(){
    let _private = this[__.private];
    return _private.rescueCenter;
  }
}

export default VRPManager;
