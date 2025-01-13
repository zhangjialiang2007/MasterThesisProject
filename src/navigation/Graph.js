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
        let result = [];
        for(let i = 0; i < this.edges.length; i++){
            let edge = this.edges[i];
            if(edge.from.id === nodeId){
                result.push(edge);
            }
        }
        return result;
    }
}

export { Graph }