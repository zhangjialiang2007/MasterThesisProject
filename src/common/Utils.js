class Utils {
  static async fetchJson(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
  }

  static deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
  }

  static randomSelect(array, count) {
    // 如果count大于array的长度，则返回array
    if (count > array.length) {
      return array;
    }
    // 如果count小于等于0，则返回空数组
    if (count <= 0) {
      return [];
    }
    // 如果count等于array的长度，则返回array
    if (count === array.length) {
      return array;
    }

    // 使用Fisher-Yates洗牌算法打乱数组，然后取前count个元素
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    let result = shuffled.slice(0, count);
    return result;
  }

  static addTime(time, minutes) {
    let durationInMilliseconds = minutes * 60 * 1000;
    let newTime = new Date(time.getTime() + durationInMilliseconds);
    return newTime;
  }

  // 获取两个时间的时间差，单位为分钟
  static getDeltaTime(time1, time2) {
    // 获取时间戳（毫秒）
    const timestamp1 = time1.getTime();
    const timestamp2 = time2.getTime();

    // 计算时间差（毫秒）
    const differenceInMilliseconds = Math.abs(timestamp2 - timestamp1);

    // 将毫秒转换为分钟
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

    return differenceInMinutes;
  }

  // 计算符号函数
  static sign(number) {
    if (number > 0) {
      return 1;
    }
    return 0;
  }

  // 计算紧迫程度
  static getEmergency(threshold_time, limit_time, arrival_time) {
    let threshold_time_ms = threshold_time.getTime();
    let limit_time_ms = limit_time.getTime();
    let arrival_time_ms = arrival_time.getTime();
    if (arrival_time_ms > limit_time_ms) {
      return -1;
    } else if (arrival_time_ms < threshold_time_ms) {
      return 0;
    } else {
      let emergency =
        (arrival_time_ms - threshold_time_ms) /
        (limit_time_ms - threshold_time_ms);
      return emergency;
    }
  }

  // 计算STI
  static getSTI(threshold_time, limit_time, arrival_time) {
    let emergency = this.getEmergency(threshold_time, limit_time, arrival_time);
    let sti = (Math.exp(emergency) * this.sign(emergency)) / Math.E;
    return sti;
  }

  // 计算SSI
  static getSSI(current_demand, total_demand) {
    let shortage = current_demand / total_demand;
    let ssi = Math.log2(1 + shortage) * this.sign(shortage);
    return ssi;
  }

  // 随机获取Map中的一个元素
  static getRandomMapElement(map) {
    // 将Map的键值对转换为一个数组
    const entries = Array.from(map.entries());
    // 生成一个随机索引
    const randomIndex = Math.floor(Math.random() * entries.length);
    // 返回随机选择的键值对
    let result = {
      key: entries[randomIndex][0],
      value: entries[randomIndex][1],
    };
    return result;
  }

  // 合并数组中长度两个最短的数组
  static mergeQueueArray(queueArray) {
    // 找出最短的两个数组的索引
    let minIndex1 = 0;
    let minIndex2 = 1;

    // 确保minIndex1指向最短的数组
    if (queueArray[minIndex1].length > queueArray[minIndex2].length) {
      [minIndex1, minIndex2] = [minIndex2, minIndex1];
    }

    // 遍历找出最短的两个数组
    for (let i = 2; i < queueArray.length; i++) {
      if (queueArray[i].length < queueArray[minIndex1].length) {
        minIndex2 = minIndex1;
        minIndex1 = i;
      } else if (queueArray[i].length < queueArray[minIndex2].length) {
        minIndex2 = i;
      }
    }

    // 合并两个最短的数组
    const mergedArray = [
      ...queueArray[minIndex1],
      ...queueArray[minIndex2],
    ];

    // 删除原有的两个数组（注意要先删除索引较大的，避免影响另一个索引）
    queueArray.splice(Math.max(minIndex1, minIndex2), 1);
    queueArray.splice(Math.min(minIndex1, minIndex2), 1);

    // 将合并后的数组添加到queueArray中
    queueArray.push(mergedArray);

    return queueArray;
  }

  // 获取数组中若干个随机索引
  static getRandomIndexes(arr, count) {
    // 检查数组长度是否至少为count
    if (arr.length < count) {
        throw new Error("数组长度小于count");
    }
 
    // 生成包含所有有效索引的数组
    const indexes = Array.from({ length: arr.length }, (_, i) => i);
 
    // 从索引数组中随机选择三个索引
    const randomIndexes = [];
    while (randomIndexes.length < count) {
        const randomIndex = Math.floor(Math.random() * indexes.length);
        // 如果索引不在结果数组中，则添加它
        if (!randomIndexes.includes(randomIndex)) {
            randomIndexes.push(randomIndex);
        }
    }
 
    return randomIndexes;
}
}

export { Utils };
