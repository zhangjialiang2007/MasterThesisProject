class Node {
    constructor(id) {
        this.id = id;
    }
}

class Edge {
    constructor(from, to, travelTimeFunction) {
        this.from = from;
        this.to = to;
        this.travelTimeFunction = travelTimeFunction;
    }
}

class timeDependentDijkstra {
    constructor(graph, startNode) {
        this.graph = graph;
        this.startNode = startNode;
        this.distances = {}; // 存储起始点到每个节点的最短时间  
        this.prevNodes = {}; // 存储到达每个节点的最短路径的前一个节点 
        this.visited = {}; // 标记节点是否已访问  
        this.init();
    }
    init() {
        const queue = [{ node: this.startNode, time: 0 }]; // 优先队列，使用数组模拟  

        // 初始化距离、父节点和访问状态  
        for (const nodeId in this.graph) {
            if (nodeId !== this.startNode.id) {
                this.distances[nodeId] = Infinity;
            }
            this.prevNodes[nodeId] = null;
            this.visited[nodeId] = false;
        }

        // 起始点最短到达时间为0
        this.distances[this.startNode.id] = 0;

        // 使用队列的方式，穷举出所有路径
        while (queue.length > 0) {
            // 取出当前队列中时间最小的节点  
            queue.sort((a, b) => a.time - b.time);
            const current = queue.shift();
            const currentNode = current.node;
            const currentTime = current.time;

            // 标记当前节点为已访问  
            this.visited[currentNode.id] = true;

            // 遍历当前节点的所有邻居  
            for (const edgeId in this.graph[currentNode.id]) {
                const edge = this.graph[currentNode.id][edgeId];
                const neighborNode = edge.to;
                const neighborNodeId = neighborNode.id;

                // 计算从当前节点到邻居节点的行驶时间  
                const travelTime = edge.travelTimeFunction(currentTime);
                const arrivalTime = currentTime + travelTime;

                // 如果通过当前节点可以得到更短的到达时间，则更新距离、父节点和队列  
                if (!this.visited[neighborNodeId] || arrivalTime < this.distances[neighborNodeId]) {
                    this.distances[neighborNodeId] = arrivalTime;
                    this.prevNodes[neighborNodeId] = currentNode; // 记录父节点  
                    queue.push({ node: neighborNode, time: arrivalTime });
                }
            }
        }
        console.log('前导图,表示当前节点的前一个节点', this.prevNodes);
        console.log('距离图,表示各点到起始点的距离', this.distances);
    }

    getShortestPath(startId, endId) {
        const shortestPaths = {
            path: [],
            time: this.distances[endId] - this.distances[startId]
        };

        let id = endId;
        while (id) {
            shortestPaths.path.unshift(id);
            let preNode = this.prevNodes[id];
            id = preNode.id;
            if (id == startId) {
                shortestPaths.path.unshift(id);
                break;
            }
        }
        return shortestPaths;
    }
}

// 示例路网数据  
const graph = {
    A: {
        B: new Edge(new Node('A'), new Node('B'), (departureTime) => 10),
        C: new Edge(new Node('A'), new Node('C'), (departureTime) => 15),
    },
    B: {
        D: new Edge(new Node('B'), new Node('D'), (departureTime) => {
            if (departureTime < 10) {
                return 10;
            } else {
                return 15;
            }
        }),
    },
    C: {
        E: new Edge(new Node('C'), new Node('E'), (departureTime) => {
            if (departureTime < 20) {
                return 1; // 假设上午12点前需要10分钟  
            } else {
                return 15; // 假设12点后需要15分钟  
            }
        }),
    },
    D: {
        F: new Edge(new Node('D'), new Node('F'), (departureTime) => 5),
    },
    E: {
        F: new Edge(new Node('E'), new Node('F'), (departureTime) => 5),
    }
};

const startNode = new Node('A');
let a = new timeDependentDijkstra(graph, startNode);
console.log('A-F的最短路径',a.getShortestPath('A','F'))
console.log('A-E的最短路径',a.getShortestPath('A','E'))
