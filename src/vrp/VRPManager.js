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

  _private.getSolution = () => {
    let solution = new Solution();
    // 将救援车辆配送队列添加到solution中
    _private.trucks.forEach((truck) => {
      let queue = Utils.deepCopy(truck.deliveryQueue);
      solution.addDeliveryQueue(truck.id, queue);
    });

    // 计算解决方案的适应度
    let total_sci = 0;
    _private.disasterAreas.values().forEach((area) => {
      total_sci += area.SCI;
    });
    solution.total_sci = total_sci;
    solution.fitness = 1 / total_sci;

    return solution;
  };

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
      travelData = travelData.filter((item) => {
        for (let i = 0; i < nearData.length; i++) {
          if (item[0].truckId === nearData[i].truckId) {
            return false;
          }
        }
        return true;
      });

      // 从travelData中贪婪随机选取M-m个紧急程度最高的数据
      let emergencyData = _private.selectEmergencyData(travelData, M - m);
      _private.updateData(emergencyData);

      areas = areas.filter((area) => !area.isCompleted());
    }

    return _private.getSolution();
  };
  _private.getTravelData = (areas) => {
    let travelData = [];
    let trucks = _private.trucks.values();
    for (let truck of trucks) {
      let truckData = [];
      for (let area of areas) {
        // 过滤掉已完成配送的受灾点
        if (area.isCompleted()) {
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
      let data = truckData.filter((item) => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });

      // 过滤掉已选择的受灾点
      data = data.filter((item) => !selected.includes(item.areaId));

      // 按行驶时间排序
      data.sort((a, b) => a.travelTime - b.travelTime);

      // 选取行驶时间最短的
      let nearData = data.slice(0, _private.config.countNear);

      // 将nearData添加到tableNear中
      tableNear.push(...nearData);

      // 将已选择的受灾点添加到selected中
      selected.push(...nearData.map((item) => item.areaId));
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
      let data = truckData.filter((item) => {
        let area = _private.disasterAreas.get(item.areaId);
        return !area.isCompleted();
      });

      // 过滤掉已选择的受灾点
      data = data.filter((item) => !selected.includes(item.areaId));

      // 按紧急程度排序
      data.sort((a, b) => b.emergency - a.emergency);

      // 选取紧急程度最高的
      let emergencyData = data.slice(0, _private.config.countEmergency);
      tableEmergency.push(...emergencyData);

      // 将已选择的受灾点添加到selected中
      selected.push(...emergencyData.map((item) => item.areaId));
    }

    // 对tableEmergency按紧急程度由高到低排序,选取count+y个最紧急的
    tableEmergency.sort((a, b) => b.emergency - a.emergency);
    let emergencyData = tableEmergency.slice(0, count + _private.config.y);

    // emergencyData中随机返回count个
    let result = Utils.randomSelect(emergencyData, count);
    return result;
  };
  _private.updateData = (data) => {
    data.forEach((item) => {
      let truck = _private.trucks.get(item.truckId);
      let area = _private.disasterAreas.get(item.areaId);
      truck.delivery(area, item.arrivalTime);
    });
  };
  // #endregion

  // #region 编解码
  _private.encodeDeliveryQueue = (queue) => {
    let queueCode = new Map();
    for (let { id, data } of _private.disasterAreas) {
      queueCode.set(id, []);
    }

    let round = 1; // 轮次
    let order = 1; // 轮次中的顺序
    queue.forEach((id) => {
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
    });
    return queueCode;
  };
  _private.encodeSolution = (solution) => {
    let solutionCode = [];
    let deliveryQueue = solution.getDeliveryQueue();
    deliveryQueue.values.forEach((queue) => {
      let queueCode = _private.encodeDeliveryQueue(queue);
      solutionCode.push(...queueCode);
    });
    return solutionCode;
  };
  _private.decodeDeliveryQueue = (queueCode) => {
    // 获取非空配送列表，并将配送列表按轮次排序
    let realQueueCode = [];
    for (let { id, data } of queueCode) {
      if (data.length > 0) {
        let item = {
          areaId: id,
          data: data.sort((a, b) => a.round - b.round),
        };
        realQueueCode.push(item);
      }
    }

    let queue = [];
    while (realQueueCode.length > 0) {
      // 当前轮配送数组
      let currentRoundQueue = [];
      realQueueCode.forEach((item) => {
        let data = item.data.shift();
        currentRoundQueue.push({
          areaId: item.areaId,
          order: data.order,
        });
      });
      // 当前轮次配送数组
      currentRoundQueue = currentRoundQueue.sort((a, b) => a.order - b.order);
      currentRoundQueue.forEach((item) => {
        queue.push(item.areaId);
      });
      queue.push(_private.rescueCenter.id);

      realQueueCode = realQueueCode.filter((item) => item.data.length > 0);
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
    solutionCode.forEach((queueCode) => {
      let queue = _private.decodeDeliveryQueue(queueCode);
      result.push(queue);
    });
    return result;
  };
  // #endregion

  // 交叉操作
  _private.crossover = (solution1, solution2) => {
    debugger
    let result = new Solution();

    // 在solution1中随机选择一个救援车辆
    let item = Utils.getRandomMapElement(solution1.deliveryQueue);
    item = Utils.deepCopy(item.value);

    // 将solution2中将救援车辆的配送队列中属于item 的受灾区域删除
    let tempQueueArray = [];
    solution2.deliveryQueue.forEach((value, key) => {
      let queue = Utils.deepCopy(value);
      let tempQueue = queue.filter(function (value) {
        if (value == 0) {
          return false;
        }
        for (let i = 0; i < item.length; i++) {
          if (item[i] === value) {
            return false;
          }
        }
        return true;
      });
      tempQueueArray.push(tempQueue);
    });

    // 将tempQueueArray数组中长度最短的两个元素进行合并
    if (tempQueueArray.length == _private.trucks.size) {
      tempQueueArray = Utils.mergeQueueArray(tempQueueArray);
    }

    // 将合并后的元素添加到result中
    result.addDeliveryQueue(0, item);
    for (let i = 0; i < tempQueueArray.length; i++) {
      let truckId = i + 1;
      result.addDeliveryQueue(truckId, tempQueueArray[i]);
    }

    return result;
  };
  // 变异操作
  _private.mutate = (solution) => {
    let result = new Solution();

    solution.deliveryQueue.forEach((value, key) => {
      let queue = Utils.deepCopy(value);
      let truckId = key;

      // 随机一个0或1，1进行逆转排序，0进行交换排序
      let reversed = Math.random() < 0.5 ? 1 : 0;
      if (reversed === 1) {
        // 逆转变异
        let reversedArr = queue
          .map((value, index) => ({ value, index }))
          .sort((a, b) => b.index - a.index)
          .map(({ value }) => value);
        result.addDeliveryQueue(truckId, reversedArr);
      } else {
        // 交换变异
        if(queue.length >= 2){
          let indexes = Utils.getRandomIndexes(queue, 2);
          let temp = queue[indexes[1]];
          queue[indexes[1]] = queue[indexes[2]];
          queue[indexes[2]] = temp;
        }

        result.addDeliveryQueue(truckId, queue);
      }
    });
    return result;
  };
  // 随机删除和插入
  _private.randomDeleteAndInsert = (solution) => {
    // 随机删除队列和位置
    const deleteKey = Math.floor(Math.random() * _private.trucks.size);
    const deleteQueue = solution.deliveryQueue.get(deleteKey)
    const deleteIndex = Math.floor(Math.random() * deleteQueue.length);
    const areaId = deleteQueue[deleteIndex]

    // 随机插入队列和位置
    const insertKey = Math.floor(Math.random() * _private.trucks.size);
    const insertQueue = solution.deliveryQueue.get(insertKey)
    const insertIndex = Math.floor(Math.random() * insertQueue.length);

    // 执行删除插入
    let result = new Solution()
    solution.deliveryQueue.forEach((value, key) => {
      let queue = Utils.deepCopy(value);
      if(key == deleteKey){
        queue.splice(deleteIndex, 1); 
      }
      if(key == insertKey){
        queue.splice(insertIndex, 0, areaId);
      }

      result.addDeliveryQueue(key, queue);
    });
    return result;
  }
  // 模拟配送，用于计算子代的适应度和SCI
  _private.simulate = (solution) => {
    _private.resetData();

    while (solution.deliveryQueue.size > 0) {
      for (const [truckID, queue] of solution.deliveryQueue) {
        // 获取救援车辆
        let truck = _private.trucks.get(truckID);
        // 获取受灾点
        let areaId = queue.shift();
        let area = _private.disasterAreas.get(areaId);
        if (!area || area.isCompleted()) {
          continue;
        }
        // 获取救援车辆到受灾点的行驶时间和到达时间
        let travelTime = _private.navTool.getShortestTime(
          truck.currentPos,
          area.id,
          truck.currentTime
        );
        let arrivalTime = Utils.addTime(truck.currentTime, travelTime);

        // 执行配送
        truck.delivery(area, arrivalTime);
      }

      // 检查救援车辆配送队列是否完成
      solution.deliveryQueue.forEach((queue, truckID) => {
        if (queue.length === 0) {
          solution.deliveryQueue.delete(truckID);
        }
      });
    }

    return _private.getSolution();
  };

  // 选择操作
  _private.select = (solutions, count) => {
    const populationSize = solutions.length;
    const selectedIndices = new Set();

    // 排序
    solutions.sort((a, b) => a.total_sci - b.total_sci);
    selectedIndices.add(0);

    // 计算适应度总和
    let totalFitness = 0;
    solutions.forEach(item => {
      totalFitness += item.fitness;
    })
 
    // 如果没有适应度或者要选择的数量超过种群大小，直接返回错误或调整
    if (totalFitness === 0) {
        throw new Error('适应度总和为零，无法进行轮盘赌选择');
    }
    if (count > populationSize) {
        console.warn(`警告：要选择的数量(${count})超过了种群大小(${populationSize})，将选择整个种群`);
        return solutions;
    }
 
    // 创建累积适应度数组
    const cumulativeFitnesses = [];
    let cumulativeFitness = 0;
    for (let i = 0; i < populationSize; i++) {
        cumulativeFitness += solutions[i].fitness;
        cumulativeFitnesses.push(cumulativeFitness);
    }
 
    // 进行轮盘赌选择
    while(selectedIndices.size < count) {
        // 生成一个0到totalFitness之间的随机数
        const randomPoint = Math.random() * totalFitness;
 
        // 默认设置为最后一个索引
        let selectedIndex = populationSize - 1; 
        for (let i = 0; i < populationSize; i++) {
            if (cumulativeFitnesses[i] >= randomPoint) {
                selectedIndex = i;
                break;
            }
        }
 
        // 将选中的索引添加到结果数组中
        selectedIndices.add(selectedIndex);
    }
 
     // 将Set转换为数组，并使用map方法获取对应的solutions元素
     return [...selectedIndices].map(index => solutions[index]);
  }

  // 模拟退火选择（Simulated Annealing Select）
  _private.SASelect = (solutions, count) => {
    // 初始化温度
    let temperature = 1000;
    // 初始化冷却因子
    let coolingFactor = 0.99;

    // 计算初始适应度总和
    let totalFitness = 0;
    solutions.forEach(item => {
      totalFitness += item.fitness;
    })

    // 计算初始概率
    let initialProbability = 1;

    // 初始化选择的索引集
    let selectedIndices = new Set();

    // 模拟退火选择
    while(selectedIndices.size < count) {
      // 生成一个0到totalFitness之间的随机数
      const randomPoint = Math.random() * totalFitness;

      // 默认设置为最后一个索引
      let selectedIndex = populationSize - 1; 
      for (let i = 0; i < populationSize; i++) {
          if (cumulativeFitnesses[i] >= randomPoint) {
              selectedIndex = i;
              break;
          }
      }

      // 计算接受概率
      let acceptanceProbability = Math.exp(-(selectedIndex - initialProbability) / temperature);

      // 如果接受概率大于随机数，则选择该索引
      if (acceptanceProbability > Math.random()) {
          selectedIndices.add(selectedIndex);
      }

      // 降低温度
      temperature *= coolingFactor;
    }

    // 将Set转换为数组，并使用map方法获取对应的solutions元素
    return [...selectedIndices].map(index => solutions[index]);
  }
  }

  // 重置数据
  _private.resetData = () => {
    _private.trucks.forEach((truck) => {
      truck.reset();
    });
    _private.disasterAreas.forEach((area) => {
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
    if (id === _private.rescueCenter.id) {
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
        travelTime: roadData.travelTime,
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
        startTime: data.startTime,
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
    _private.navTool = new TimeDependentDijkstra(graph);
  };
  // #endregion
}
class VRPManager {
  constructor(param) {
    _initPrivateMembers(this);
  }

  async init(param) {
    let _private = this[__.private];
    await _private.init(param);
  }

  getBestSolution() {
    let _private = this[__.private];
    let solutions = _private.generateBaseSolutions();

    let index = 0;
    while(index < _private.config.maxIter){
      let indexes = Utils.getRandomIndexes(solutions, 3);
      // 交叉
      let crossChild1 = _private.crossover(
        solutions[indexes[0]],
        solutions[indexes[1]]
      );
      let crossChild2 = _private.crossover(
        solutions[indexes[2]],
        solutions[indexes[1]]
      );
      let crossChild3 = _private.crossover(
        solutions[indexes[0]],
        solutions[indexes[2]]
      );
      // 变异
      let multeChild1 = _private.mutate(solutions[indexes[0]]);
      let multeChild2 = _private.mutate(solutions[indexes[1]]);
      let multeChild3 = _private.mutate(solutions[indexes[2]]);
  
      // 模拟配送
      let solution = _private.simulate(crossChild1);
      solutions.push(solution);
      solution = _private.simulate(crossChild2);
      solutions.push(solution);
      solution = _private.simulate(crossChild3);
      solutions.push(solution);
      solution = _private.simulate(multeChild1);
      solutions.push(solution);
      solution = _private.simulate(multeChild2);
      solutions.push(solution);
      solution = _private.simulate(multeChild3);
      solutions.push(solution);

      // 选择
      solutions = _private.select(solutions, 8);

      index++

      if(index % 2 == 0){
        solutions.sort((a, b) => a.total_sci - b.total_sci);
        console.log('times:',index,'solution:', solutions[0])
      }
    }

    // 对solutions按照每个元素的total_sci进行从小到大排序
    solutions.sort((a, b) => a.total_sci - b.total_sci);

    return solutions[0];
  }

  getBestSolutionByOther(){
    let _private = this[__.private];
    let solution = _private.generateBaseSolution();

    let index = 0;
    while(index < _private.config.maxIter){
      let children = [];
      for(let i = 0; i < 5; i++){
        let child = _private.randomDeleteAndInsert(solution)
        children.push(_private.simulate(child));
      }

      // 选最优的；随机插入，贪婪选择：相当于贪婪插入
      solution = _private.select(children, 1)[0];     
      console.log(solution.total_sci) 
      index++;
    }
    
    return solution
  }

  getNavTool() {
    let _private = this[__.private];
    return _private.navTool;
  }
  getRescueCenter() {
    let _private = this[__.private];
    return _private.rescueCenter;
  }
}

export default VRPManager;
