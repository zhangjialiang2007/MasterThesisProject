class Edge {
    constructor(param) {
        this.id = param.id;
        this.name = param.name;
        this.from = param.from;
        this.to = param.to;
    }

    getTravelTime(time) {
        return 0;
    }
}

export { Edge }