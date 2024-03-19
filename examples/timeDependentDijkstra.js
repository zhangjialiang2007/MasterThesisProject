import { Node, Edge, timeDependentDijkstra } from "../src/main.js";
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
console.log('A-F的最短路径', a.getShortestPath('A', 'F'))
console.log('A-E的最短路径', a.getShortestPath('A', 'E'))