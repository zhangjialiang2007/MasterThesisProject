class Edge {
    constructor(param) {
        this.id = param.id;
        this.name = param.name;
        // 起始点
        this.from = param.from;
        // 终点
        this.to = param.to;
    }

    getTravelTime(time) {
        return 0;
    }
}

export { Edge }