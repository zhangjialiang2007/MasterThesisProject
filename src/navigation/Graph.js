class Graph {
    constructor(param) {
        this.nodes = param.nodes;
        this.edges = param.edges;
    }   
    getNodes(){
        return this.nodes;
    }
    getEdges(){
        return this.edges;
    }
    getAdjacentEdges(nodeId){
        return this.edges.filter(edge => edge.from.id === nodeId);
    }
}

export { Graph }