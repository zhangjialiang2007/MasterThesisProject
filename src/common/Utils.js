
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
        if(count > array.length) {
            return array;
        }
        // 如果count小于等于0，则返回空数组
        if(count <= 0) {
            return [];
        }
        // 如果count等于array的长度，则返回array
        if(count === array.length) {
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

    static sign(number) {
        if(number > 0) {
            return 1;
        }
        return 0;
    }

    static getEmergency(threshold_time, limit_time, arrival_time) {
        let threshold_time_ms = threshold_time.getTime();
        let limit_time_ms = limit_time.getTime();
        let arrival_time_ms = arrival_time.getTime();
        if(arrival_time_ms > limit_time_ms) {
            return -1;
        }
        else if(arrival_time_ms < threshold_time_ms) {
            return 0;
        }
        else {
            let emergency = (arrival_time_ms - threshold_time_ms) / (limit_time_ms - threshold_time_ms);
            return emergency;
        }
    }

    static getSTI(threshold_time, limit_time, arrival_time){
        let emergency = this.getEmergency(threshold_time, limit_time, arrival_time);
        let sti = Math.exp(emergency) * this.sign(emergency) / Math.E
        return sti;
    }

    static getSSI(current_demand, total_demand){
        let shortage = current_demand / total_demand;
        let ssi = Math.log2(1 + shortage) * this.sign(shortage);
        return ssi;
    }

    static getRandomMapElement(map){
        // 将Map的键值对转换为一个数组
        const entries = Array.from(map.entries());
        // 生成一个随机索引
        const randomIndex = Math.floor(Math.random() * entries.length); 
        // 返回随机选择的键值对
        return entries[randomIndex];
    }
}

export {Utils};