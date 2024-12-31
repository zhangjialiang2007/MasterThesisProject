class TimeDependentDijkstra {
    constructor(graph) {
        this.graph = graph;
        this.cacheMap = new Map();
    }
    getNavigationData(startId, startTime) {
        let key = {
            startId: startId,
            startTime: startTime
        }
        let data = this.cacheMap.get(key)
        if (!data) {        
            let distances = {}  // 存储起始点到每个节点的最短时间  
            let prevNodes = {} // 存储到达每个节点的最短路径的前一个节点 
            let visited = {} // 标记节点是否已访问  
            const queue = [{ id: startId, time: startTime }]; // 优先队列，使用数组模拟  

            // 初始化距离、父节点和访问状态 
            let nodes = this.graph.getNodes();
            nodes.forEach(nodeId =>{
                if (nodeId !== startId) {
                    distances[nodeId] = Infinity;
                }
                prevNodes[nodeId] = null;
                visited[nodeId] = false;
            })
    
            // 起始点最短到达时间为0
            distances[startId] = 0;
    
            // 使用队列的方式，穷举出所有路径
            while (queue.length > 0) {
                // 取出当前队列中时间最小的节点  
                queue.sort((a, b) => a.time - b.time);
                const current = queue.shift();
                const currentId = current.id;
                const currentTime = current.time;
    
                // 标记当前节点为已访问  
                visited[currentId] = true;
    
                // 遍历当前节点的所有邻居  
                let edges = this.graph.getAdjacentEdges(currentId);
                edges.forEach(edge =>{
                    const neighborNode = edge.to;
                    const neighborNodeId = neighborNode.id;
    
                    // 计算从当前节点到邻居节点的行驶时间  
                    const travelTime = edge.travelTimeFunction(currentTime);
                    const arrivalTime = currentTime + travelTime;
    
                    // 如果通过当前节点可以得到更短的到达时间，则更新距离、父节点和队列  
                    if (!visited[neighborNodeId] || arrivalTime < distances[neighborNodeId]) {
                        distances[neighborNodeId] = arrivalTime;
                        prevNodes[neighborNodeId] = currentId; // 记录父节点  
                        queue.push({ id: neighborNodeId, time: arrivalTime });
                    }

                })
            }
            data = {distances, prevNodes}
            this.cacheMap.set(key, data) 
        }

        return data;
    }

    getShortestPath(startId, endId, startTime) {
        let path = [];

        let data = this.getNavigationData(startId, startTime)
        let id = endId;
        while (id) {
            path.unshift(id);
            let preNodeId = data.prevNodes[id];
            id = preNodeId;
            if (id == startId) {
                path.unshift(id);
                break;
            }
        }
        return path;
    }

    getShortestTime(startId, endId, startTime) {
        let data = this.getNavigationData(startId, startTime)
        let time = data.distances[endId] - data.distances[startId]
        return time;
    }
}

export { TimeDependentDijkstra }